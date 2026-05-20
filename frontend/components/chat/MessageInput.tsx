'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { useSocket } from '@/lib/socket/SocketProvider'
import { messagesApi } from '@/lib/api/messages'
import type { Message } from '@/types'

interface MessageInputProps {
  roomId: string
  replyTo: Message | null
  onCancelReply: () => void
  onMessageSent: (message: Message) => void
}

export function MessageInput({
  roomId,
  replyTo,
  onCancelReply,
  onMessageSent,
}: MessageInputProps) {
  const { socket } = useSocket()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const emitTyping = useCallback(() => {
    socket?.emit('typing:start', { roomId })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing:stop', { roomId })
    }, 3000)
  }, [socket, roomId])

  async function handleSend() {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      const message = await messagesApi.sendMessage(roomId, {
        content: content.trim(),
        replyToId: replyTo?.id,
      })
      setContent('')
      onCancelReply()
      socket?.emit('typing:stop', { roomId })
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await messagesApi.uploadFile(roomId, file)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-zinc-800 rounded-lg border-l-2 border-violet-500">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-violet-400">
              Replying to {replyTo.user.username}
            </span>
            <span className="text-xs text-zinc-400 truncate">{replyTo.content}</span>
          </div>
          <button onClick={onCancelReply} className="text-zinc-500 hover:text-white ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.zip"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-white transition-colors shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input */}
        <input
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            emitTyping()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={uploading ? 'Uploading...' : 'Send a message...'}
          disabled={uploading}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="w-9 h-9 flex items-center justify-center bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}