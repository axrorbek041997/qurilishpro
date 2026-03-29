import { Schema, model, Document, Types } from 'mongoose'

export interface IMaterial extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  projectId: Types.ObjectId
  name: string
  unit: string
  minStock?: number
  createdAt: Date
  updatedAt: Date
}

const materialSchema = new Schema<IMaterial>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    minStock: { type: Number, min: 0 },
  },
  { timestamps: true },
)

materialSchema.set('toJSON', {
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

export const Material = model<IMaterial>('Material', materialSchema)
