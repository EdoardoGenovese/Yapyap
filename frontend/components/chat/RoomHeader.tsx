'use client'

import { Hash, Lock, Users, Trash2, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { roomsApi } from '@/lib/api/rooms'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Room } from '@/types'

interface RoomHeaderProps {
  room: Room
  onMembersToggle: () => void
}

export function RoomHeader({ room, onMembersToggle }: RoomHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isOwner = room.ownerId === user?.id

  async function handleDelete() {
    if (!confirm(`Delete "${room.name}"?`)) return
    await roomsApi.delete(room.id)
    await queryClient.invalidateQueries({ queryKey: ['rooms'] })
    router.push('/')
  }

  function copyInviteCode() {
    if (room.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          {room.type === 'PUBLIC' ? (
            <Hash className="w-4 h-4 text-zinc-400" />
          ) : (
            <Lock className="w-4 h-4 text-zinc-400" />
          )}
          <h2 className="font-semibold text-white">{room.name}</h2>
          {room.description && (
            <>
              <span className="text-zinc-700">·</span>
              <p className="text-sm text-zinc-500 truncate max-w-xs">{room.description}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {room.type === 'PRIVATE' && room.inviteCode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {room.inviteCode}
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy invite code</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onMembersToggle}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Members</TooltipContent>
          </Tooltip>

          {isOwner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDelete}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete room</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
