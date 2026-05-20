import { Router } from 'express'
import { prisma } from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { upload, uploadToCloudinary } from '../services/cloudinary'
import type { AuthRequest } from '../types'

export const userRouter = Router()
userRouter.use(authenticate)

// GET /api/users/:id
userRouter.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      username: true,
      color: true,
      avatar: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
    },
  })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json(user)
})

// PATCH /api/users/me — aggiorna profilo
userRouter.patch('/me', async (req: AuthRequest, res) => {
  const { username } = req.body
  const userId = req.user!.id

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
    })
    if (existing) {
      res.status(409).json({ error: 'Username already taken' })
      return
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(username && { username }) },
    select: { id: true, username: true, color: true, avatar: true },
  })

  res.json(user)
})

// POST /api/users/me/avatar — upload avatar
userRouter.post('/me/avatar', upload.single('avatar'), async (req: AuthRequest, res) => {
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

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: url },
    select: { id: true, username: true, color: true, avatar: true },
  })

  res.json(user)
})