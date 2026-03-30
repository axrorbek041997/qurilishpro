import { z } from 'zod'

export const createExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    category: z.enum(['materials', 'labor', 'equipment', 'transport', 'food', 'utilities', 'other']),
    note: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    projectId: z.string().min(1, 'Project ID is required'),
    imageUrl: z.string().url().optional(),
  }),
})

export const getExpensesSchema = z.object({
  query: z.object({
    projectId: z.string().min(1),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
})
