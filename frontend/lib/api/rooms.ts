import { api } from './client'
import type { Room, Message } from '@/types'

export const roomsApi = {
  getAll: async () => {
    const res = await api.get<{ public: Room[]; private: Room[] }>('/api/rooms')
    return res.data
  },

  getById: async (id: string) => {
    const res = await api.get<Room>(`/api/rooms/${id}`)
    return res.data
  },

  create: async (data: { name: string; description?: string; type: 'PUBLIC' | 'PRIVATE' }) => {
    const res = await api.post<Room>('/api/rooms', data)
    return res.data
  },

  join: async (roomId: string) => {
    const res = await api.post('/api/rooms/join', { roomId })
    return res.data
  },

  joinPrivate: async (inviteCode: string) => {
    const res = await api.post<{ room: Room }>('/api/rooms/join-private', { inviteCode })
    return res.data
  },

  leave: async (roomId: string) => {
    const res = await api.post(`/api/rooms/${roomId}/leave`)
    return res.data
  },

  delete: async (roomId: string) => {
    const res = await api.delete(`/api/rooms/${roomId}`)
    return res.data
  },
}