import { Request, Response } from 'express'
import { Expense } from '../../models/Expense'
import { Worker } from '../../models/Worker'
import { Attendance } from '../../models/Attendance'
import { MaterialTransaction } from '../../models/MaterialTransaction'
import { reportQueue } from './report.queue'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/response'

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, from, to } = req.query as { projectId: string; from: string; to: string }
  const userId = req.user!.userId

  const [expenses, workers, attendance, transactions] = await Promise.all([
    Expense.find({ userId, projectId, date: { $gte: from, $lte: to } }),
    Worker.find({ userId, projectId }),
    Attendance.find({ userId, projectId, date: { $gte: from, $lte: to } }),
    MaterialTransaction.find({ userId, projectId, date: { $gte: from, $lte: to } }),
  ])

  // Build a map of date → DailyReport
  const dateMap = new Map<string, { totalExpenses: number; presentWorkers: number; totalWages: number }>()

  for (const expense of expenses) {
    const entry = dateMap.get(expense.date) ?? { totalExpenses: 0, presentWorkers: 0, totalWages: 0 }
    entry.totalExpenses += expense.amount
    dateMap.set(expense.date, entry)
  }

  const workerWageMap = new Map(workers.map((w) => [w._id.toString(), w.dailyWage]))

  for (const record of attendance) {
    if (!record.present) continue
    const entry = dateMap.get(record.date) ?? { totalExpenses: 0, presentWorkers: 0, totalWages: 0 }
    entry.presentWorkers += 1
    entry.totalWages += workerWageMap.get(record.workerId.toString()) ?? 0
    dateMap.set(record.date, entry)
  }

  const dailyReports = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      totalExpenses: data.totalExpenses,
      presentWorkers: data.presentWorkers,
      totalWorkers: workers.length,
      totalWages: data.totalWages,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const totals = {
    totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
    workerDaysPresent: attendance.filter((a) => a.present).length,
    totalWages: attendance
      .filter((a) => a.present)
      .reduce((s, a) => s + (workerWageMap.get(a.workerId.toString()) ?? 0), 0),
    transactionCount: transactions.length,
  }

  sendSuccess(res, { dailyReports, totals, from, to })
})

export const queueExport = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, from, to } = req.body as { projectId: string; from: string; to: string }
  const userId = req.user!.userId

  const job = await reportQueue.add('generate-export', { userId, projectId, from, to })

  sendSuccess(res, { jobId: job.id }, 202, 'Export queued')
})

export const getExportStatus = asyncHandler(async (req: Request, res: Response) => {
  const job = await reportQueue.getJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' })
    return
  }

  const state = await job.getState()
  const result = state === 'completed' ? job.returnvalue : null

  sendSuccess(res, { jobId: job.id, state, result })
})
