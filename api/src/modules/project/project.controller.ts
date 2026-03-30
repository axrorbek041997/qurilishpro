import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { Project } from '../../models/Project'
import { Worker } from '../../models/Worker'
import { Attendance } from '../../models/Attendance'
import { Expense } from '../../models/Expense'
import { Material } from '../../models/Material'
import { MaterialTransaction } from '../../models/MaterialTransaction'
import { AppError } from '../../utils/AppError'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/response'
import { env } from '../../config/env'

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await Project.find({ userId: req.user!.userId }).sort({ createdAt: -1 })
  sendSuccess(res, projects)
})

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId })
  if (!project) throw new AppError('Project not found', 404)
  sendSuccess(res, project)
})

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.create({ ...req.body, userId: req.user!.userId })
  sendSuccess(res, project, 201)
})

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    req.body,
    { new: true, runValidators: true },
  )
  if (!project) throw new AppError('Project not found', 404)
  sendSuccess(res, project)
})

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId })
  if (!project) throw new AppError('Project not found', 404)

  // Remove uploaded schema files
  for (const schema of project.schemas) {
    const filePath = path.join(env.FILES_DIR, schema.filePath)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  // Cascade delete related records
  await Promise.all([
    Worker.deleteMany({ projectId: req.params.id }),
    Attendance.deleteMany({ projectId: req.params.id }),
    Expense.deleteMany({ projectId: req.params.id }),
    Material.deleteMany({ projectId: req.params.id }),
    MaterialTransaction.deleteMany({ projectId: req.params.id }),
  ])

  sendSuccess(res, null, 200, 'Project deleted')
})

export const uploadSchema = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400)

  const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId })
  if (!project) throw new AppError('Project not found', 404)

  const fileType = detectFileType(req.file.originalname)
  const relativePath = req.file.filename  // stored by multer

  project.schemas.push({
    name: req.file.originalname,
    fileType,
    size: req.file.size,
    filePath: relativePath,
    uploadedAt: new Date(),
  } as Parameters<typeof project.schemas.push>[0])

  await project.save()
  sendSuccess(res, project, 201)
})

export const deleteSchema = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId })
  if (!project) throw new AppError('Project not found', 404)

  const schema = project.schemas.find((s) => s._id.toString() === req.params.schemaId)
  if (!schema) throw new AppError('Schema not found', 404)

  const filePath = path.join(env.FILES_DIR, schema.filePath)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  project.schemas.pull({ _id: req.params.schemaId })
  await project.save()
  sendSuccess(res, project)
})

export const getSchemaFile = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId })
  if (!project) throw new AppError('Project not found', 404)

  const schema = project.schemas.find((s) => s._id.toString() === req.params.schemaId)
  if (!schema) throw new AppError('Schema not found', 404)

  const filePath = path.resolve(env.FILES_DIR, schema.filePath)
  if (!fs.existsSync(filePath)) throw new AppError('File not found on disk', 404)

  res.sendFile(filePath)
})

function detectFileType(filename: string): 'dxf' | 'pdf' | 'image' | 'svg' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'dxf') return 'dxf'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'svg') return 'svg'
  return 'image'
}
