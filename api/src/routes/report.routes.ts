import { Router } from 'express'
import { getSummary, queueExport, getExportStatus } from '../controllers/report.controller'

const router = Router()

router.get('/summary',           getSummary)
router.post('/export',           queueExport)
router.get('/export/:jobId',     getExportStatus)

export default router
