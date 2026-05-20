import { api } from './client'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await api.post<AuthResponse>('/api/auth/register', data)
    return res.data
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<AuthResponse>('/api/auth/login', data)
    return res.data
  },

  logout: async (refreshToken: string) => {
    await api.post('/api/auth/logout', { refreshToken })
  },

  me: async () => {
    const res = await api.get<User>('/api/auth/me')
    return res.data
  },

  refresh: async (refreshToken: string) => {
    const res = await api.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/refresh',
      { refreshToken }
    )
    return res.data
  },
}