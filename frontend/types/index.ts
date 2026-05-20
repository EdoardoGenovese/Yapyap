export interface User {
  id: string
  username: string
  email: string
  color: string
  avatar?: string
  isOnline?: boolean
  lastSeen?: string
}

export interface Room {
  id: string
  name: string
  description?: string
  type: 'PUBLIC' | 'PRIVATE'
  inviteCode?: string
  ownerId: string
  createdAt: string
  owner: Pick<User, 'id' | 'username' | 'color'>
  members?: RoomMember[]
  _count?: {
    members: number
    messages: number
  }
}

export interface RoomMember {
  id: string
  roomId: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: User
}

export interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  replyToId?: string
  editedAt?: string
  createdAt: string
  user: Pick<User, 'id' | 'username' | 'color' | 'avatar'>
  attachments: Attachment[]
  replyTo?: Message & {
    user: Pick<User, 'id' | 'username' | 'color'>
  }
}

export interface Attachment {
  id: string
  messageId: string
  url: string
  filename: string
  size: number
  mimeType: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface TypingUser {
  userId: string
  username: string
}