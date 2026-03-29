/**
 * Seed script — creates a default admin user.
 * Run with: npm run seed
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { env } from './config/env'
import { User } from './models/User'

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const email = 'admin@qurilishpro.uz'
  const existing = await User.findOne({ email })

  if (existing) {
    console.log(`User ${email} already exists — skipping`)
  } else {
    const passwordHash = await bcrypt.hash('admin123', 12)
    await User.create({ email, passwordHash, name: 'Admin', role: 'admin' })
    console.log(`✅  Created user:`)
    console.log(`    Email:    ${email}`)
    console.log(`    Password: admin123`)
    console.log(`    ⚠️  Change this password after first login!`)
  }

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
