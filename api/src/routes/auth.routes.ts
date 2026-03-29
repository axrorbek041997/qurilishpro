import { Router } from 'express'
import { login, refresh, logout } from '../controllers/auth.controller'
import { validate } from '../middleware/validate.middleware'
import { loginSchema } from '../schemas/auth.schema'

const router = Router()

router.post('/login',   validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout',  logout)

export default router
