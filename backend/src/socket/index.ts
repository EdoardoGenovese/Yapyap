import type { Server, Socket } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt'
import { prisma } from '../utils/prisma'
import {
  setUserOnline,
  setUserOffline,
  addUserToRoom,
  removeUserFromRoom,
  getRoomOnlineUsers,
  setTyping,
  clearTyping,
} from '../utils/redis'
import type { SocketUser } from '../types'

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser
  }
}

export function initSocket(io: Server) {

  // Middleware autenticazione Socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      next(new Error('No token provided'))
      return
    }

    try {
      const payload = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, username: true, color: true },
      })

      if (!user) {
        next(new Error('User not found'))
        return
      }

      socket.user = {
        userId: user.id,
        username: user.username,
        color: user.color,
        rooms: [],
      }

      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket: Socket) => {
    const user = socket.user!
    console.log(`✅ ${user.username} connected (${socket.id})`)

    // Marca utente online
    await setUserOnline(user.userId, socket.id)
    await prisma.user.update({
      where: { id: user.userId },
      data: { isOnline: true },
    })

    // Entra automaticamente nelle stanze di cui è membro
    const memberships = await prisma.roomMember.findMany({
      where: { userId: user.userId },
      select: { roomId: true },
    })

    for (const { roomId } of memberships) {
      socket.join(roomId)
      user.rooms.push(roomId)
      await addUserToRoom(roomId, user.userId)
    }

    // Notifica tutti che l'utente è online
    socket.broadcast.emit('user:online', {
      userId: user.userId,
      username: user.username,
    })

    // ─── Join room ──────────────────────────────────────────
    socket.on('room:join', async (roomId: string) => {
      socket.join(roomId)
      if (!user.rooms.includes(roomId)) {
        user.rooms.push(roomId)
      }
      await addUserToRoom(roomId, user.userId)

      const onlineUserIds = await getRoomOnlineUsers(roomId)
      socket.emit('room:online_users', { roomId, userIds: onlineUserIds })

      socket.to(roomId).emit('room:user_joined', {
        roomId,
        userId: user.userId,
        username: user.username,
      })
    })

    // ─── Leave room ─────────────────────────────────────────
    socket.on('room:leave', async (roomId: string) => {
      socket.leave(roomId)
      user.rooms = user.rooms.filter((r) => r !== roomId)
      await removeUserFromRoom(roomId, user.userId)

      socket.to(roomId).emit('room:user_left', {
        roomId,
        userId: user.userId,
        username: user.username,
      })
    })

    // ─── Typing ─────────────────────────────────────────────
    socket.on('typing:start', async ({ roomId }: { roomId: string }) => {
      await setTyping(roomId, user.userId)
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId: user.userId,
        username: user.username,
        isTyping: true,
      })
    })

    socket.on('typing:stop', async ({ roomId }: { roomId: string }) => {
      await clearTyping(roomId, user.userId)
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId: user.userId,
        username: user.username,
        isTyping: false,
      })
    })

    // ─── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`)

      await setUserOffline(user.userId)
      await prisma.user.update({
        where: { id: user.userId },
        data: { isOnline: false, lastSeen: new Date() },
      })

      for (const roomId of user.rooms) {
        await removeUserFromRoom(roomId, user.userId)
        socket.to(roomId).emit('room:user_left', {
          roomId,
          userId: user.userId,
          username: user.username,
        })
      }

      socket.broadcast.emit('user:offline', {
        userId: user.userId,
        username: user.username,
      })
    })
  })
}