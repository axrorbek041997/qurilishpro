import { Schema, model, Document, Types } from 'mongoose'

export interface IProjectSchema {
  _id: Types.ObjectId
  name: string
  fileType: 'dxf' | 'pdf' | 'image' | 'svg'
  size: number
  filePath: string
  uploadedAt: Date
}

export interface IProject extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  name: string
  location: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'paused'
  description?: string
  budget?: number
  schemas: Types.DocumentArray<IProjectSchema>
  createdAt: Date
  updatedAt: Date
}

const projectSchemaSchema = new Schema<IProjectSchema>(
  {
    name: { type: String, required: true },
    fileType: { type: String, enum: ['dxf', 'pdf', 'image', 'svg'], required: true },
    size: { type: Number, required: true },
    filePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    description: { type: String },
    budget: { type: Number },
    schemas: { type: [projectSchemaSchema], default: [] },
  },
  { timestamps: true },
)

projectSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemas = ret.schemas as any[]
    if (Array.isArray(schemas)) {
      ret.schemas = schemas.map((s) => ({
        id: s._id ?? s.id,
        name: s.name,
        fileType: s.fileType,
        size: s.size,
        uploadedAt: s.uploadedAt,
      }))
    }
    return ret
  },
})

export const Project = model<IProject>('Project', projectSchema)
