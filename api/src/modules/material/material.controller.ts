import { Request, Response } from 'express'
import { Material } from '../../models/Material'
import { MaterialTransaction } from '../../models/MaterialTransaction'
import { AppError } from '../../utils/AppError'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/response'

export const getMaterials = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query as { projectId?: string }
  const filter: Record<string, unknown> = { userId: req.user!.userId }
  if (projectId) filter.projectId = projectId
  const materials = await Material.find(filter).sort({ createdAt: 1 })
  sendSuccess(res, materials)
})

export const createMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await Material.create({ ...req.body, userId: req.user!.userId })
  sendSuccess(res, material, 201)
})

export const updateMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await Material.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    req.body,
    { new: true, runValidators: true },
  )
  if (!material) throw new AppError('Material not found', 404)
  sendSuccess(res, material)
})

export const deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
  const material = await Material.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId })
  if (!material) throw new AppError('Material not found', 404)
  await MaterialTransaction.deleteMany({ materialId: req.params.id })
  sendSuccess(res, null, 200, 'Material deleted')
})

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, materialId, from, to } = req.query as {
    projectId?: string; materialId?: string; from?: string; to?: string
  }

  const filter: Record<string, unknown> = { userId: req.user!.userId }
  if (projectId) filter.projectId = projectId
  if (materialId) filter.materialId = materialId
  if (from || to) {
    filter.date = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    }
  }

  const transactions = await MaterialTransaction.find(filter).sort({ date: -1, createdAt: -1 })
  sendSuccess(res, transactions)
})

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const material = await Material.findOne({ _id: req.body.materialId, userId: req.user!.userId })
  if (!material) throw new AppError('Material not found', 404)

  const transaction = await MaterialTransaction.create({ ...req.body, userId: req.user!.userId })
  sendSuccess(res, transaction, 201)
})

export const getMaterialStock = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query as { projectId: string }
  const userId = req.user!.userId

  const materials = await Material.find({ projectId, userId })

  const stock = await Promise.all(
    materials.map(async (material) => {
      const transactions = await MaterialTransaction.find({ materialId: material._id })
      const inTotal = transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.quantity, 0)
      const outTotal = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.quantity, 0)
      const currentStock = inTotal - outTotal
      const isLow = material.minStock !== undefined && currentStock <= material.minStock
      return {
        material: material.toJSON(),
        stock: currentStock,
        inTotal,
        outTotal,
        isLow,
      }
    }),
  )

  sendSuccess(res, stock)
})
