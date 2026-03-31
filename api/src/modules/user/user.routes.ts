import { Router } from 'express'
import { validate } from '../../middleware/validate.middleware'
import { requireRole } from '../../middleware/requireRole.middleware'
import { createUserSchema, adminUpdateUserSchema, updateProfileSchema } from './user.schema'
import { getMe, updateMe, getUsers, getUser, createUser, updateUser, deleteUser } from './user.controller'

const router = Router()

// Own profile — any authenticated user
router.get('/me',      getMe)
router.put('/me',      validate(updateProfileSchema), updateMe)

// Admin-only CRUD
router.get('/',        requireRole('admin'), getUsers)
router.post('/',       requireRole('admin'), validate(createUserSchema), createUser)
router.get('/:id',     requireRole('admin'), getUser)
router.put('/:id',     requireRole('admin'), validate(adminUpdateUserSchema), updateUser)
router.delete('/:id',  requireRole('admin'), deleteUser)

export default router
