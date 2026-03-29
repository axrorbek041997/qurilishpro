import { Queue } from 'bullmq'
import { redis } from '../config/redis'

export const reportQueue = new Queue('reports', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
  },
})
