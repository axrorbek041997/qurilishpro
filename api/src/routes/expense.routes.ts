import { Router } from 'express'
import { getExpenses, createExpense, deleteExpense } from '../controllers/expense.controller'
import { validate } from '../middleware/validate.middleware'
import { createExpenseSchema, getExpensesSchema } from '../schemas/expense.schema'

const router = Router()

router.get('/',    validate(getExpensesSchema), getExpenses)
router.post('/',   validate(createExpenseSchema), createExpense)
router.delete('/:id', deleteExpense)

export default router
