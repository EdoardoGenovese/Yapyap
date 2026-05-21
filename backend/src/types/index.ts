import type { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    email: string
  }
}

export interface SocketUser {
  userId: string
  username: string
  color: string
  rooms: string[]
}

export interface JwtPayload {
  id: string
  username: string
  email: string
}
