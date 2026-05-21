import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import { roomRouter } from './routes/rooms'
import { messageRouter } from './routes/messages'
import { userRouter } from './routes/users'
import { initSocket } from './socket'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/messages', messageRouter)
app.use('/api/users', userRouter)

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

initSocket(io)

app.use(errorHandler)

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`🚀 YapYap server running on port ${PORT}`)
})
