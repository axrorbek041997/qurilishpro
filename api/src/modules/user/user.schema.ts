import { z } from 'zod'

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'manager', 'viewer']).default('manager'),
  }),
})

export const adminUpdateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.enum(['admin', 'manager', 'viewer']).optional(),
  }),
})

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  }),
})
