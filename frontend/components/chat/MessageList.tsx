'use client'

import { format, isToday, isYesterday } from 'date-fns'
import type { Message, TypingUser } from '@/types'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  typingUsers: TypingUser[]
  onReply: (message: Message) => void
  bottomRef: React.RefObject<HTMLDivElement | null>
}

function DateDivider({ date }: { date: string }) {
  const d = new Date(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

function TypingIndicator({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return null

  const text =
    users.length === 1
      ? `${users[0].username} is typing...`
      : users.length === 2
        ? `${users[0].username} and ${users[1].username} are typing...`
        : 'Several people are typing...'

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-zinc-500">{text}</span>
    </div>
  )
}

export function MessageList({
  messages,
  currentUserId,
  typingUsers,
  onReply,
  bottomRef,
}: MessageListProps) {
  let lastDate = ''

  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col">
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-600 text-sm">No messages yet. Say something! 👋</p>
        </div>
      )}

      {messages.map(message => {
        const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd')
        const showDivider = messageDate !== lastDate
        lastDate = messageDate

        return (
          <div key={message.id}>
            {showDivider && <DateDivider date={message.createdAt} />}
            <MessageBubble
              message={message}
              isOwn={message.userId === currentUserId}
              onReply={onReply}
            />
          </div>
        )
      })}

      <TypingIndicator users={typingUsers} />
      <div ref={bottomRef} />
    </div>
  )
}
