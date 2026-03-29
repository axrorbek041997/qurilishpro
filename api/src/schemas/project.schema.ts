import { z } from 'zod'

const projectBody = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
  description: z.string().optional(),
  budget: z.number().positive().optional(),
})

export const createProjectSchema = z.object({ body: projectBody })
export const updateProjectSchema = z.object({ body: projectBody.partial() })
