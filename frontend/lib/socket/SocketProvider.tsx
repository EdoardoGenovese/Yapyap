'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket } from './client'
import { useAuthStore } from '../stores/authStore'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { accessToken } = useAuthStore()

  useEffect(() => {
  if (!accessToken) return // non connettere se non loggato

  const s = connectSocket(accessToken)
  setSocket(s)

  s.on('connect', () => {
    setIsConnected(true)
  })

  s.on('disconnect', () => {
    setIsConnected(false)
  })

  s.on('connect_error', (err) => {
    // Logga solo se non è un problema di token mancante
    if (err.message !== 'Invalid token' && err.message !== 'No token provided') {
      console.error('Socket error:', err.message)
    }
  })

  return () => {
    s.off('connect')
    s.off('disconnect')
    s.off('connect_error')
    disconnectSocket()
  }
}, [accessToken])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}