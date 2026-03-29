import 'dotenv/config'
import { env } from './config/env'
import { connectDatabase } from './config/database'
import app from './app'
import { reportWorker } from './queues/report.worker'

async function bootstrap(): Promise<void> {
  await connectDatabase()

  const server = app.listen(env.PORT, () => {
    console.log(`🚀  Server running on http://localhost:${env.PORT}`)
    console.log(`📖  API: http://localhost:${env.PORT}/api/v1`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down...`)
    await reportWorker.close()
    server.close(() => {
      console.log('✅  Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
