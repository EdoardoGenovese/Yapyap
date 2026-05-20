import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { upload, uploadToCloudinary } from '../services/cloudinary'
import { io } from '../index'
import type { AuthRequest } from '../types'

export const messageRouter = Router()
messageRouter.use(authenticate)

const messageInclude = {
  user: { select: { id: true, username: true, color: true, avatar: true } },
  attachments: true,
  replyTo: {
    include: {
      user: { select: { id: true, username: true, color: true } },
    },
  },
}

// GET /api/messages/:roomId — messaggi paginati
messageRouter.get('/:roomId', async (req: AuthRequest, res) => {
  const { roomId } = req.params
  const cursor = req.query.cursor as string | undefined
  const limit = 50

  const messages = await prisma.message.findMany({
    where: { roomId },
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  })

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

  res.json({
    messages: messages.reverse(),
    nextCursor,
  })
})

// POST /api/messages/:roomId — invia messaggio
messageRouter.post('/:roomId', async (req: AuthRequest, res) => {
  const { roomId } = req.params
  const { content, replyToId } = req.body
  const userId = req.user!.id

  if (!content?.trim()) {
    res.status(400).json({ error: 'Content required' })
    return
  }

  const message = await prisma.message.create({
    data: {
      roomId,
      userId,
      content: content.trim(),
      replyToId: replyToId ?? null,
    },
    include: messageInclude,
  })

  // Emetti il messaggio a tutti nella stanza
  io.to(roomId).emit('message:new', message)

  res.status(201).json(message)
})

// POST /api/messages/:roomId/upload — upload file
messageRouter.post('/:roomId/upload', upload.single('file'), async (req: AuthRequest, res) => {
  const { roomId } = req.params
  const userId = req.user!.id

  if (!req.file) {
    res.status(400).json({ error: 'No file provided' })
    return
  }

  const { url } = await uploadToCloudinary(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  )

  const isImage = req.file.mimetype.startsWith('image/')

  const message = await prisma.message.create({
    data: {
      roomId,
      userId,
      content: req.file.originalname,
      type: isImage ? 'IMAGE' : 'FILE',
      attachments: {
        create: {
          url,
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      },
    },
    include: messageInclude,
  })

  io.to(roomId).emit('message:new', message)
  res.status(201).json(message)
})

// PATCH /api/messages/:id — modifica messaggio
messageRouter.patch('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user!.id

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  if (message.userId !== userId) {
    res.status(403).json({ error: 'Cannot edit others messages' })
    return
  }

  const updated = await prisma.message.update({
    where: { id },
    data: { content, editedAt: new Date() },
    include: messageInclude,
  })

  io.to(message.roomId).emit('message:updated', updated)
  res.json(updated)
})

// DELETE /api/messages/:id — elimina messaggio
messageRouter.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params
  const userId = req.user!.id

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  if (message.userId !== userId) {
    res.status(403).json({ error: 'Cannot delete others messages' })
    return
  }

  await prisma.message.delete({ where: { id } })
  io.to(message.roomId).emit('message:deleted', { id, roomId: message.roomId })
  res.json({ message: 'Deleted' })
})