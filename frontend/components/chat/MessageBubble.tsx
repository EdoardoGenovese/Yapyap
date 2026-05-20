'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Reply, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { messagesApi } from '@/lib/api/messages'
import type { Message } from '@/types'
import Image from 'next/image'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onReply: (message: Message) => void
}

function UserAvatar({ username, color }: { username: string; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
      style={{ background: color }}
    >
      {username[0].toUpperCase()}
    </div>
  )
}

export function MessageBubble({ message, isOwn, onReply }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  async function handleEdit() {
    if (!editContent.trim() || editContent === message.content) {
      setEditing(false)
      return
    }
    await messagesApi.editMessage(message.id, editContent)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this message?')) return
    await messagesApi.deleteMessage(message.id)
  }

  const isImage = message.type === 'IMAGE'
  const isFile = message.type === 'FILE'

  return (
    <div
      className="group flex items-start gap-3 px-4 py-1 hover:bg-zinc-800/30 relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <UserAvatar username={message.user.username} color={message.user.color} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: message.user.color }}
          >
            {message.user.username}
          </span>
          <span className="text-xs text-zinc-600">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {message.editedAt && (
            <span className="text-xs text-zinc-600">(edited)</span>
          )}
        </div>

        {/* Reply preview */}
        {message.replyTo && (
          <div className="flex items-start gap-2 mb-1 pl-2 border-l-2 border-zinc-600">
            <span
              className="text-xs font-medium"
              style={{ color: message.replyTo.user.color }}
            >
              {message.replyTo.user.username}
            </span>
            <span className="text-xs text-zinc-500 truncate">{message.replyTo.content}</span>
          </div>
        )}

        {/* Content */}
        {editing ? (
          <div className="flex gap-2">
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="flex-1 bg-zinc-700 text-white text-sm px-3 py-1.5 rounded-lg border border-zinc-600 focus:outline-none focus:border-violet-500"
              autoFocus
            />
            <button onClick={handleEdit} className="text-xs text-violet-400 hover:text-violet-300">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-zinc-500">
              Cancel
            </button>
          </div>
        ) : isImage && message.attachments[0] ? (
          <div className="relative w-64 h-48 rounded-xl overflow-hidden mt-1">
            <Image
              src={message.attachments[0].url}
              alt={message.attachments[0].filename}
              fill
              className="object-cover"
            />
          </div>
        ) : isFile && message.attachments[0] ? (
          <a
            href={message.attachments[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors mt-1"
          >
            📎 {message.attachments[0].filename}
            <span className="text-xs text-zinc-500">
              {(message.attachments[0].size / 1024).toFixed(0)}KB
            </span>
          </a>
        ) : (
          <p className="text-sm text-zinc-200 break-words">{message.content}</p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute right-4 top-0 -translate-y-1/2 flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-0.5 shadow-lg">
          <button
            onClick={() => onReply(message)}
            className="p-1.5 text-zinc-400 hover:text-white rounded transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-zinc-400 hover:text-white rounded transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-zinc-400 hover:text-red-400 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}