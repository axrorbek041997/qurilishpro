import { Schema, model, Document, Types } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  passwordHash: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
  createdAt: Date
  updatedAt: Date
  comparePassword(plain: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'manager', 'viewer'], default: 'manager' },
  },
  { timestamps: true },
)

userSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    delete ret.passwordHash
    return ret
  },
})

export const User = model<IUser>('User', userSchema)
