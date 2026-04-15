import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '../../.env') })

// Dynamic import ensures redis.ts loads AFTER dotenv runs
import('./server')