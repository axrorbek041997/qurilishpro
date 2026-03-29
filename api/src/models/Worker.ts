import { Schema, model, Document, Types } from 'mongoose'

export interface IWorker extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  projectId: Types.ObjectId
  name: string
  role: string
  dailyWage: number
  phone?: string
  createdAt: Date
  updatedAt: Date
}

const workerSchema = new Schema<IWorker>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    dailyWage: { type: Number, required: true, min: 0 },
    phone: { type: String },
  },
  { timestamps: true },
)

workerSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id
    ret.projectId = (ret.projectId as Types.ObjectId)?.toString()
    delete ret._id
    delete ret.__v
    delete ret.userId
    return ret
  },
})

export const Worker = model<IWorker>('Worker', workerSchema)
