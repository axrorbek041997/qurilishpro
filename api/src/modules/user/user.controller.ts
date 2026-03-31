import argon2 from 'argon2'
import { Request, Response } from 'express'
import { User } from '../../models/User'
import { AppError } from '../../utils/AppError'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/response'

// ── Own profile ───────────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId, '-passwordHash')
  if (!user) throw new AppError('User not found', 404)
  sendSuccess(res, user)
})

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, password } = req.body as { name?: string; password?: string }

  const user = await User.findById(req.user!.userId)
  if (!user) throw new AppError('User not found', 404)

  if (name) user.name = name
  if (password) user.passwordHash = await argon2.hash(password)

  await user.save()

  const { passwordHash: _, ...safe } = user.toObject()
  sendSuccess(res, safe)
})

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 })
  sendSuccess(res, users)
})

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id, '-passwordHash')
  if (!user) throw new AppError('User not found', 404)
  sendSuccess(res, user)
})

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body as {
    email: string; name: string; password: string; role: string
  }

  const exists = await User.findOne({ email })
  if (exists) throw new AppError('Email already in use', 409)

  const passwordHash = await argon2.hash(password)
  const user = await User.create({ email, name, passwordHash, role })

  const { passwordHash: _, ...safe } = user.toObject()
  sendSuccess(res, safe, 201)
})

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body as {
    email?: string; name?: string; password?: string; role?: string
  }

  const user = await User.findById(req.params.id)
  if (!user) throw new AppError('User not found', 404)

  if (email) user.email = email
  if (name) user.name = name
  if (role) user.role = role as 'admin' | 'manager' | 'viewer'
  if (password) user.passwordHash = await argon2.hash(password)

  await user.save()

  const { passwordHash: _, ...safe } = user.toObject()
  sendSuccess(res, safe)
})

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user!.userId) {
    throw new AppError('Cannot delete your own account', 400)
  }

  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) throw new AppError('User not found', 404)

  sendSuccess(res, null, 200, 'User deleted')
})
