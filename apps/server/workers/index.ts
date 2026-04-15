import type { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@timeflow/types'
import { minuteTickWorker } from './minuteTick'
import { streakEvalWorker } from './streakEval'
import { emailDispatchWorker } from './emailDispatch'
import { fileParserWorker } from './fileParser'
import { graceExpiryWorker } from './graceExpiry'
import { minuteTickScheduler } from './schedulers'

type TFServer = Server<ClientToServerEvents, ServerToClientEvents>

export function startWorkers(io: TFServer) {
  minuteTickWorker(io)
  streakEvalWorker(io)
  emailDispatchWorker()
  fileParserWorker()
  graceExpiryWorker()
  minuteTickScheduler()

  console.log('[Workers] All 5 BullMQ workers started')
}
