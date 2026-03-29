import { Router } from 'express'
import {
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  getTransactions, createTransaction, getMaterialStock,
} from '../controllers/material.controller'
import { validate } from '../middleware/validate.middleware'
import { createMaterialSchema, updateMaterialSchema, createTransactionSchema } from '../schemas/material.schema'

const router = Router()

router.get('/',                    getMaterials)
router.post('/',   validate(createMaterialSchema), createMaterial)
router.put('/:id', validate(updateMaterialSchema), updateMaterial)
router.delete('/:id',              deleteMaterial)

router.get('/stock',               getMaterialStock)
router.get('/transactions',        getTransactions)
router.post('/transactions', validate(createTransactionSchema), createTransaction)

export default router
