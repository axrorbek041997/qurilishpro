import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { env } from '../config/env'
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  uploadSchema, deleteSchema, getSchemaFile,
} from '../controllers/project.controller'
import { validate } from '../middleware/validate.middleware'
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema'

// Ensure uploads directory exists
const uploadsDir = path.resolve(env.UPLOADS_DIR)
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.dxf', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.svg']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

const router = Router()

router.get('/',                           getProjects)
router.post('/',    validate(createProjectSchema), createProject)
router.get('/:id',                        getProject)
router.put('/:id',  validate(updateProjectSchema), updateProject)
router.delete('/:id',                     deleteProject)

router.post('/:id/schemas',               upload.single('file'), uploadSchema)
router.delete('/:id/schemas/:schemaId',   deleteSchema)
router.get('/:id/schemas/:schemaId/file', getSchemaFile)

export default router
