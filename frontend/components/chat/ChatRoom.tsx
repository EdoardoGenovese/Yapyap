'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSocket } from '@/lib/socket/SocketProvider'
import { useAuthStore } from '@/lib/stores/authStore'
import { roomsApi } from '@/lib/api/rooms'
import { messagesApi } from '@/lib/api/messages'
import type { Message, TypingUser } from '@/types'
import { RoomHeader } from './RoomHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { MembersList } from './MembersList'

interface ChatRoomProps {
  roomId: string
}

export function ChatRoom({ roomId }: ChatRoomProps) {
  const { socket } = useSocket()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsApi.getById(roomId),
  })

  const { data: initialMessages } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => messagesApi.getMessages(roomId),
  })

  useEffect(() => {
    if (initialMessages?.messages) {
      setMessages(initialMessages.messages)
    }
  }, [initialMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!socket) return

    socket.emit('room:join', roomId)

    socket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socket.on('message:updated', (updated: Message) => {
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)))
    })

    socket.on('message:deleted', ({ id }: { id: string }) => {
      setMessages(prev => prev.filter(m => m.id !== id))
    })

    socket.on(
      'typing:update',
      ({ userId, username, isTyping }: { userId: string; username: string; isTyping: boolean }) => {
        if (userId === user?.id) return
        setTypingUsers(prev => {
          if (isTyping) {
            const exists = prev.some(u => u.userId === userId)
            return exists ? prev : [...prev, { userId, username }]
          }
          return prev.filter(u => u.userId !== userId)
        })
      }
    )

    return () => {
      socket.emit('room:leave', roomId)
      socket.off('message:new')
      socket.off('message:updated')
      socket.off('message:deleted')
      socket.off('typing:update')
    }
  }, [socket, roomId, user?.id])

  if (!room) return null

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 overflow-hidden">
        <RoomHeader room={room} onMembersToggle={() => setMembersOpen(v => !v)} />
        <MessageList
          messages={messages}
          currentUserId={user?.id ?? ''}
          typingUsers={typingUsers}
          onReply={setReplyTo}
          bottomRef={bottomRef}
        />
        <MessageInput
          roomId={roomId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onMessageSent={msg => setMessages(prev => [...prev, msg])}
        />
      </div>

      {membersOpen && (
  <>
    {/* Overlay mobile */}
    <div
      className="fixed inset-0 bg-black/60 z-20 lg:hidden"
      onClick={() => setMembersOpen(false)}
    />
    {/* Members panel */}
    <div className="
      fixed lg:relative inset-y-0 right-0
      z-30 lg:z-auto
      w-52
    ">
      <MembersList
        members={room.members ?? []}
        onClose={() => setMembersOpen(false)}
      />
    </div>
  </>
)}
    </div>
  )
}
