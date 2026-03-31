import { Schema, model, Document, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  passwordHash: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
  createdAt: Date
  updatedAt: Date
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

export const User = model<IUser>('User', userSchema)
