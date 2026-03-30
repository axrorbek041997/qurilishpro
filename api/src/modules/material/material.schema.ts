import { z } from 'zod'

export const createMaterialSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    unit: z.string().min(1, 'Unit is required'),
    minStock: z.number().min(0).optional(),
    projectId: z.string().min(1, 'Project ID is required'),
  }),
})

export const updateMaterialSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    minStock: z.number().min(0).optional(),
  }),
})

export const createTransactionSchema = z.object({
  body: z.object({
    materialId: z.string().min(1, 'Material ID is required'),
    projectId: z.string().min(1, 'Project ID is required'),
    type: z.enum(['in', 'out']),
    quantity: z.number().positive('Quantity must be positive'),
    note: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  }),
})
