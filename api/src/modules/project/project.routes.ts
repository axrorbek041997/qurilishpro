import { Router } from 'express'
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  uploadSchema, uploadRar, deleteSchema, getSchemaFile,
} from './project.controller'
import { validate } from '../../middleware/validate.middleware'
import { createProjectSchema, updateProjectSchema } from './project.schema'
import {uploads} from "../../middleware/multer";

const router = Router()

router.get('/',                           getProjects)
router.post('/',    validate(createProjectSchema), createProject)
router.get('/:id',                        getProject)
router.put('/:id',  validate(updateProjectSchema), updateProject)
router.delete('/:id',                     deleteProject)

router.post('/:id/schemas',               uploads({ limits: { fileSize: 20 * 1024 * 1024 } }).single('file'), uploadSchema)
router.post('/:id/schemas/rar',           uploads({ limits: { fileSize: 100 * 1024 * 1024 } }).single('file'), uploadRar)
router.delete('/:id/schemas/:schemaId',   deleteSchema)
router.get('/:id/schemas/:schemaId/file', getSchemaFile)

export default router
