import { z } from 'zod'

const workerBody = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  dailyWage: z.number().min(0, 'Daily wage must be non-negative'),
  phone: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
})

export const createWorkerSchema = z.object({ body: workerBody })
export const updateWorkerSchema = z.object({ body: workerBody.partial() })

export const toggleAttendanceSchema = z.object({
  body: z.object({
    workerId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
})

export const bulkAttendanceSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    present: z.boolean(),
  }),
})

export const getAttendanceSchema = z.object({
  query: z.object({
    projectId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).refine((q) => q.date || q.from, { message: 'date or from is required' }),
})
