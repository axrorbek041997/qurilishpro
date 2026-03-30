import { Worker } from 'bullmq'
import { redis } from '../../config/redis'
import { Expense } from '../../models/Expense'
import { Worker as WorkerModel } from '../../models/Worker'
import { Attendance } from '../../models/Attendance'
import { Material } from '../../models/Material'
import { MaterialTransaction } from '../../models/MaterialTransaction'

interface ExportJobData {
  userId: string
  projectId: string
  from: string
  to: string
}

interface ExportResult {
  expenses: object[]
  workers: object[]
  materials: object[]
  transactions: object[]
  generatedAt: string
}

export const reportWorker = new Worker<ExportJobData, ExportResult>(
  'reports',
  async (job) => {
    const { userId, projectId, from, to } = job.data

    const [expenses, workers, attendance, materials, transactions] = await Promise.all([
      Expense.find({ userId, projectId, date: { $gte: from, $lte: to } }).sort({ date: 1 }),
      WorkerModel.find({ userId, projectId }),
      Attendance.find({ userId, projectId, date: { $gte: from, $lte: to } }),
      Material.find({ userId, projectId }),
      MaterialTransaction.find({ userId, projectId, date: { $gte: from, $lte: to } }).sort({ date: 1 }),
    ])

    const workerWageMap = new Map(workers.map((w) => [w._id.toString(), w.dailyWage]))
    const workerNameMap = new Map(workers.map((w) => [w._id.toString(), w.name]))

    // Build attendance grid for report
    const allDates = [...new Set(attendance.map((a) => a.date))].sort()

    const workerRows = workers.map((w) => {
      const attended = attendance.filter((a) => a.workerId.toString() === w._id.toString() && a.present)
      const daysPresent = attended.length
      const earned = daysPresent * w.dailyWage
      const row: Record<string, unknown> = {
        name: w.name,
        role: w.role,
        dailyWage: w.dailyWage,
        daysPresent,
        earned,
      }
      for (const date of allDates) {
        const rec = attendance.find((a) => a.workerId.toString() === w._id.toString() && a.date === date)
        row[date] = rec?.present ? '✓' : ''
      }
      return row
    })

    const expenseRows = expenses.map((e) => ({
      date: e.date,
      category: e.category,
      amount: e.amount,
      note: e.note ?? '',
    }))

    const materialMap = new Map(materials.map((m) => [m._id.toString(), m]))

    const txRows = transactions.map((t) => {
      const mat = materialMap.get(t.materialId.toString())
      return {
        date: t.date,
        material: mat?.name ?? '',
        unit: mat?.unit ?? '',
        type: t.type,
        quantity: t.quantity,
        note: t.note ?? '',
      }
    })

    void workerWageMap
    void workerNameMap

    return {
      expenses: expenseRows,
      workers: workerRows,
      materials: materials.map((m) => ({ name: m.name, unit: m.unit, minStock: m.minStock })),
      transactions: txRows,
      generatedAt: new Date().toISOString(),
    }
  },
  {
    connection: redis,
    concurrency: 3,
  },
)

reportWorker.on('completed', (job) => {
  console.log(`✅  Report job ${job.id} completed`)
})

reportWorker.on('failed', (job, err) => {
  console.error(`❌  Report job ${job?.id} failed:`, err.message)
})
