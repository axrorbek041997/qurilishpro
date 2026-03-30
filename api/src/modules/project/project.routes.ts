import { Router } from 'express'
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  uploadSchema, deleteSchema, getSchemaFile,
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

// router.post('/:id/schemas',               uploads().single('file'), uploadSchema)
router.delete('/:id/schemas/:schemaId',   deleteSchema)
router.get('/:id/schemas/:schemaId/file', getSchemaFile)

export default router
