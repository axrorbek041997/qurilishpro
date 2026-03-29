import { Schema, model, Document, Types } from 'mongoose'

export interface IAttendance extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  workerId: Types.ObjectId
  projectId: Types.ObjectId
  date: string
  present: boolean
  overtimeHours?: number
  createdAt: Date
  updatedAt: Date
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    date: { type: String, required: true },
    present: { type: Boolean, default: false },
    overtimeHours: { type: Number },
  },
  { timestamps: true },
)

attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true })
attendanceSchema.index({ projectId: 1, date: 1 })

attendanceSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id
    ret.workerId = (ret.workerId as Types.ObjectId)?.toString()
    delete ret._id
    delete ret.__v
    delete ret.userId
    delete ret.projectId
    return ret
  },
})

export const Attendance = model<IAttendance>('Attendance', attendanceSchema)
