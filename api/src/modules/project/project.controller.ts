import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { createExtractorFromData } from 'node-unrar-js'
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

function detectFileType(filename: string): 'dxf' | 'pdf' | 'image' | 'svg' | 'dwg' | 'xls' | 'doc' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'dxf') return 'dxf'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'svg') return 'svg'
  if (ext === 'dwg') return 'dwg'
  if (ext === 'xls' || ext === 'xlsx') return 'xls'
  if (ext === 'doc' || ext === 'docx') return 'doc'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) return 'image'
  return 'other'
}

export const uploadRar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400)

  const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId })
  if (!project) throw new AppError('Project not found', 404)

  const rarBuffer = fs.readFileSync(req.file.path)
  // Remove the uploaded RAR file after reading
  fs.unlinkSync(req.file.path)

  // Ensure we pass a standalone ArrayBuffer (not a shared Buffer pool slice)
  const arrayBuffer = rarBuffer.buffer.slice(rarBuffer.byteOffset, rarBuffer.byteOffset + rarBuffer.byteLength)
  const extractor = await createExtractorFromData({ data: arrayBuffer as ArrayBuffer })
  const extracted = extractor.extract()

  const uploadDir = env.FILES_DIR
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  for (const file of extracted.files) {
    if (file.fileHeader.flags.directory) continue

    const origName = path.basename(file.fileHeader.name)
    const fileType = detectFileType(origName)
    const ext = origName.split('.').pop()?.toLowerCase() ?? 'bin'
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`
    const destPath = path.join(uploadDir, uniqueName)

    if (file.extraction) {
      fs.writeFileSync(destPath, Buffer.from(file.extraction))
    }

    project.schemas.push({
      name: origName,
      fileType,
      size: file.fileHeader.unpSize,
      filePath: uniqueName,
      uploadedAt: new Date(),
    } as Parameters<typeof project.schemas.push>[0])
  }

  await project.save()
  sendSuccess(res, project, 201)
})
