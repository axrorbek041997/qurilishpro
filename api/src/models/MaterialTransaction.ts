import { Schema, model, Document, Types } from 'mongoose'

export interface IMaterialTransaction extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  projectId: Types.ObjectId
  materialId: Types.ObjectId
  type: 'in' | 'out'
  quantity: number
  note?: string
  date: string
  createdAt: Date
  updatedAt: Date
}

const materialTransactionSchema = new Schema<IMaterialTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    type: { type: String, enum: ['in', 'out'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    note: { type: String },
    date: { type: String, required: true },
  },
  { timestamps: true },
)

materialTransactionSchema.index({ projectId: 1, date: 1 })
materialTransactionSchema.index({ materialId: 1, date: 1 })

materialTransactionSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id
    ret.projectId = (ret.projectId as Types.ObjectId)?.toString()
    ret.materialId = (ret.materialId as Types.ObjectId)?.toString()
    delete ret._id
    delete ret.__v
    delete ret.userId
    return ret
  },
})

export const MaterialTransaction = model<IMaterialTransaction>('MaterialTransaction', materialTransactionSchema)
