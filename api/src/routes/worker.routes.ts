import { Router } from 'express'
import {
  getWorkers, createWorker, updateWorker, deleteWorker,
  getAttendance, toggleAttendance, bulkAttendance,
} from '../controllers/worker.controller'
import { validate } from '../middleware/validate.middleware'
import {
  createWorkerSchema, updateWorkerSchema,
  toggleAttendanceSchema, bulkAttendanceSchema, getAttendanceSchema,
} from '../schemas/worker.schema'

const router = Router()

router.get('/',                               getWorkers)
router.post('/',    validate(createWorkerSchema), createWorker)
router.put('/:id',  validate(updateWorkerSchema), updateWorker)
router.delete('/:id',                         deleteWorker)

router.get('/attendance',  validate(getAttendanceSchema),    getAttendance)
router.post('/attendance/toggle', validate(toggleAttendanceSchema), toggleAttendance)
router.post('/attendance/bulk',   validate(bulkAttendanceSchema),   bulkAttendance)

export default router
