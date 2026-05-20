import { Router } from 'express'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import type { AuthRequest } from '../types'


export const roomRouter = Router()
roomRouter.use(authenticate)

const createRoomSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
})

// GET /api/rooms — lista stanze pubbliche + quelle a cui appartieni
roomRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id

  const [publicRooms, myRooms] = await Promise.all([
    prisma.room.findMany({
      where: { type: 'PUBLIC' },
      include: {
        owner: { select: { id: true, username: true, color: true } },
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.room.findMany({
      where: {
        members: { some: { userId } },
        type: 'PRIVATE',
      },
      include: {
        owner: { select: { id: true, username: true, color: true } },
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  res.json({ public: publicRooms, private: myRooms })
})

// GET /api/rooms/:id
roomRouter.get('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const userId = req.user!.id

  const room = await prisma.room.findUnique({
    where: { id: id as string },
    include: {
      owner: { select: { id: true, username: true, color: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, color: true, avatar: true, isOnline: true, lastSeen: true } },
        },
      },
    },
  })

  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }

  // Verifica accesso per stanze private
  if (room.type === 'PRIVATE') {
    const isMember = room.members.some((m: { userId: string }) => m.userId === userId)
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' })
      return
    }
  }

  res.json(room)
})

// POST /api/rooms — crea stanza
roomRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, type } = createRoomSchema.parse(req.body)
    const userId = req.user!.id

    const room = await prisma.room.create({
      data: {
        name,
        description,
        type,
        ownerId: userId,
        inviteCode: type === 'PRIVATE' ? nanoid(10) : null,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: {
        owner: { select: { id: true, username: true, color: true } },
        _count: { select: { members: true } },
      },
    })

    res.status(201).json(room)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message })
      return
    }
    throw error
  }
})

// POST /api/rooms/join — entra in una stanza pubblica
roomRouter.post('/join', async (req: AuthRequest, res) => {
  const { roomId } = req.body
  const userId = req.user!.id

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.type !== 'PUBLIC') {
    res.status(403).json({ error: 'Use invite code for private rooms' })
    return
  }

  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId, role: 'MEMBER' },
    update: {},
  })

  res.json({ message: 'Joined room' })
})

// POST /api/rooms/join-private — entra con codice invito
roomRouter.post('/join-private', async (req: AuthRequest, res) => {
  const { inviteCode } = req.body
  const userId = req.user!.id

  const room = await prisma.room.findUnique({ where: { inviteCode } })
  if (!room) {
    res.status(404).json({ error: 'Invalid invite code' })
    return
  }

  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId, role: 'MEMBER' },
    update: {},
  })

  res.json({ room })
})

// DELETE /api/rooms/:id — elimina stanza (solo owner)
roomRouter.delete('/:id', async (req: AuthRequest, res) => {
  const id = String(req.params.id)
  const userId = req.user!.id

  const room = await prisma.room.findUnique({ where: { id } })
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.ownerId !== userId) {
    res.status(403).json({ error: 'Only the owner can delete this room' })
    return
  }

  await prisma.room.delete({ where: { id } })
  res.json({ message: 'Room deleted' })
})

// POST /api/rooms/:id/leave — lascia stanza
roomRouter.post('/:id/leave', async (req: AuthRequest, res) => {
  const id = String(req.params.id)
  const userId = req.user!.id

  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId } },
  })

  if (!membership) {
    res.status(404).json({ error: 'Not a member' })
    return
  }

  if (membership.role === 'OWNER') {
    res.status(400).json({ error: 'Owner cannot leave — delete the room instead' })
    return
  }

  await prisma.roomMember.delete({
    where: { roomId_userId: { roomId: id, userId } },
  })

  res.json({ message: 'Left room' })
})