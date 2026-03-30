import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Worker } from '../../models/Worker'
import { Attendance } from '../../models/Attendance'
import { AppError } from '../../utils/AppError'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/response'

export const getWorkers = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query as { projectId?: string }
  const filter: Record<string, unknown> = { userId: req.user!.userId }
  if (projectId) filter.projectId = projectId
  const workers = await Worker.find(filter).sort({ createdAt: 1 })
  sendSuccess(res, workers)
})

export const createWorker = asyncHandler(async (req: Request, res: Response) => {
  const worker = await Worker.create({ ...req.body, userId: req.user!.userId })
  sendSuccess(res, worker, 201)
})

export const updateWorker = asyncHandler(async (req: Request, res: Response) => {
  const worker = await Worker.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    req.body,
    { new: true, runValidators: true },
  )
  if (!worker) throw new AppError('Worker not found', 404)
  sendSuccess(res, worker)
})

export const deleteWorker = asyncHandler(async (req: Request, res: Response) => {
  const worker = await Worker.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId })
  if (!worker) throw new AppError('Worker not found', 404)
  await Attendance.deleteMany({ workerId: req.params.id })
  sendSuccess(res, null, 200, 'Worker deleted')
})

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { date, projectId, from, to } = req.query as { date?: string; projectId: string; from?: string; to?: string }
  const filter: Record<string, unknown> = { userId: req.user!.userId, projectId }

  if (date) {
    filter.date = date
  } else if (from || to) {
    filter.date = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    }
  }

  const records = await Attendance.find(filter)
  sendSuccess(res, records)
})

export const toggleAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { workerId, date } = req.body as { workerId: string; date: string }
  const userId = req.user!.userId

  // Find the worker to get the projectId
  const worker = await Worker.findOne({ _id: workerId, userId })
  if (!worker) throw new AppError('Worker not found', 404)

  const existing = await Attendance.findOne({ workerId, date, userId })
  if (existing) {
    existing.present = !existing.present
    await existing.save()
    sendSuccess(res, existing)
  } else {
    const record = await Attendance.create({
      workerId,
      date,
      userId,
      projectId: worker.projectId,
      present: true,
    })
    sendSuccess(res, record, 201)
  }
})

export const bulkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, date, present } = req.body as { projectId: string; date: string; present: boolean }
  const userId = req.user!.userId

  const workers = await Worker.find({ projectId, userId })
  const workerIds = workers.map((w) => w._id)

  // Upsert an attendance record for each worker
  const ops = workerIds.map((wId) => ({
    updateOne: {
      filter: { workerId: wId, date, userId: userId as unknown as Types.ObjectId },
      update: {
        $set: {
          present,
          projectId: projectId as unknown as Types.ObjectId,
          workerId: wId,
          date,
          userId: userId as unknown as Types.ObjectId,
        },
      },
      upsert: true,
    },
  }))

  if (ops.length > 0) await Attendance.bulkWrite(ops)

  const records = await Attendance.find({ projectId, date, userId })
  sendSuccess(res, records)
})
