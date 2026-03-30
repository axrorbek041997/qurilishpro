import { Router } from 'express'
import { getExpenses, createExpense, deleteExpense } from './expense.controller'
import { validate } from '../../middleware/validate.middleware'
import { createExpenseSchema, getExpensesSchema } from './expense.schema'

const router = Router()

router.get('/',    validate(getExpensesSchema), getExpenses)
router.post('/',   validate(createExpenseSchema), createExpense)
router.delete('/:id', deleteExpense)

export default router
