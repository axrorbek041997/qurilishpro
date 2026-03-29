import { Schema, model, Document, Types } from 'mongoose'

export type ExpenseCategory = 'materials' | 'labor' | 'equipment' | 'transport' | 'food' | 'utilities' | 'other'

export interface IExpense extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  projectId: Types.ObjectId
  amount: number
  category: ExpenseCategory
  note?: string
  date: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

const expenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['materials', 'labor', 'equipment', 'transport', 'food', 'utilities', 'other'],
      required: true,
    },
    note: { type: String },
    date: { type: String, required: true, index: true },
    imageUrl: { type: String },
  },
  { timestamps: true },
)

expenseSchema.index({ projectId: 1, date: 1 })

expenseSchema.set('toJSON', {
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

export const Expense = model<IExpense>('Expense', expenseSchema)
