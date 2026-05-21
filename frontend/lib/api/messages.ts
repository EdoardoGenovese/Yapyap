import { api } from './client'
import type { Message } from '@/types'

export const messagesApi = {
  getMessages: async (roomId: string, cursor?: string) => {
    const res = await api.get<{ messages: Message[]; nextCursor: string | null }>(
      `/api/messages/${roomId}`,
      { params: { cursor } }
    )
    return res.data
  },

  sendMessage: async (roomId: string, data: { content: string; replyToId?: string }) => {
    const res = await api.post<Message>(`/api/messages/${roomId}`, data)
    return res.data
  },

  uploadFile: async (roomId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<Message>(`/api/messages/${roomId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  editMessage: async (messageId: string, content: string) => {
    const res = await api.patch<Message>(`/api/messages/${messageId}`, { content })
    return res.data
  },

  deleteMessage: async (messageId: string) => {
    await api.delete(`/api/messages/${messageId}`)
  },
}
