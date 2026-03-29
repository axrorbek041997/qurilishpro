import { Request, Response } from 'express'
import { User } from '../models/User'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { AppError } from '../utils/AppError'
import { asyncHandler } from '../utils/asyncHandler'
import { env } from '../config/env'

const REFRESH_COOKIE = 'refreshToken'
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

function buildTokenPayload(user: { _id: { toString(): string }, email: string, role: string }) {
  return { userId: user._id.toString(), email: user.email, role: user.role }
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string }

  const user = await User.findOne({ email })
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }

  const payload = buildTokenPayload(user)
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS)
  res.status(200).json({
    accessToken,
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
  })
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) throw new AppError('No refresh token', 401)

  let payload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const user = await User.findById(payload.userId)
  if (!user) throw new AppError('User not found', 401)

  const newPayload = buildTokenPayload(user)
  const accessToken = signAccessToken(newPayload)
  const refreshToken = signRefreshToken(newPayload)

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS)
  res.status(200).json({
    accessToken,
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
  })
})

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict' })
  res.status(200).json({ success: true, message: 'Logged out' })
})
