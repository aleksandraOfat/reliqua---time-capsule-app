import { randomBytes } from 'node:crypto'
process.env.CAPSULE_ENCRYPTION_KEY = randomBytes(32).toString('hex')