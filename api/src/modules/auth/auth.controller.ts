import argon2 from 'argon2'
import {Request, Response} from 'express'
import {IUser, User} from '../../models/User'
import {signAccessToken, signRefreshToken, verifyRefreshToken} from '../../utils/jwt'
import {AppError} from '../../utils/AppError'

function buildTokenPayload(user: { _id: { toString(): string }, email: string, role: string }) {
    return {userId: user._id.toString(), email: user.email, role: user.role}
}

export async function login(req: Request, res: Response) {
    try {
        const {email, password} = req.body as { email: string; password: string }

        const user: IUser = await User.findOne({email}, {}, {lean: true}) as unknown as IUser
        if (!user || !(await argon2.verify(user.passwordHash, password))) {
            throw new AppError('Invalid email or password', 401)
        }

        const payload = buildTokenPayload(user)
        const accessToken = signAccessToken(payload)
        const refreshToken = signRefreshToken(payload)

        res.status(200).json({
            accessToken,
            refreshToken,
            user: {id: user._id.toString(), email: user.email, name: user.name, role: user.role},
        })
    } catch (e: any) {
        res.status(e.statusCode || 500).json({error: {message: e.message, name: e.name || "InternalError"}})
    }
}

export async function refresh(req: Request, res: Response) {
    try {
        const token = req.body?.refreshToken as string | undefined
        if (!token) throw new AppError('No refresh token', 401)

        let payload
        try {
            payload = verifyRefreshToken(token)
        } catch {
            throw new AppError('Invalid or expired refresh token', 401)
        }

        const user = await User.findById(payload.userId, {}, {lean: true}) as unknown as IUser
        if (!user) throw new AppError('User not found', 401)

        const newPayload = buildTokenPayload(user)
        const accessToken = signAccessToken(newPayload)
        const refreshToken = signRefreshToken(newPayload)

        res.status(200).json({
            accessToken,
            refreshToken,
            user: {id: user._id.toString(), email: user.email, name: user.name, role: user.role},
        })
    } catch (e: any) {
        res.status(e.statusCode || 500).json({error: {message: e.message, name: 'InternalError'}})
    }
}

export async function logout(_req: Request, res: Response) {
    res.status(200).json({success: true, message: 'Logged out'})
}
