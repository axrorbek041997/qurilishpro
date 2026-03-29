import { Request, Response } from 'express'
import { Expense } from '../models/Expense'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/response'

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, from, to } = req.query as { projectId: string; from?: string; to?: string }

  const filter: Record<string, unknown> = { userId: req.user!.userId, projectId }
  if (from || to) {
    filter.date = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    }
  }

  const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 })
  sendSuccess(res, expenses)
})

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.create({ ...req.body, userId: req.user!.userId })
  sendSuccess(res, expense, 201)
})

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId })
  if (!expense) throw new AppError('Expense not found', 404)
  sendSuccess(res, null, 200, 'Expense deleted')
})
