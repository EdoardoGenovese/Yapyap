'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { Hash, Lock, Plus, LogOut, Settings } from 'lucide-react'
import { roomsApi } from '@/lib/api/rooms'
import { useAuthStore } from '@/lib/stores/authStore'
import { authApi } from '@/lib/api/auth'
import type { Room } from '@/types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateRoomDialog } from '../rooms/CreateRoomDialog'
import { JoinRoomDialog } from '../rooms/JoinRoomDialog'

interface SidebarProps {
  onRoomSelect?: () => void
}

function UserAvatar({ username, color }: { username: string; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
      style={{ background: color }}
    >
      {username[0].toUpperCase()}
    </div>
  )
}

function RoomItem({ room, isActive, onSelect }: { 
  room: Room
  isActive: boolean
  onSelect?: () => void 
}) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        router.push(`/rooms/${room.id}`)
        onSelect?.()
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-zinc-700 text-white'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
      }`}
    >
      {room.type === 'PUBLIC' ? (
        <Hash className="w-4 h-4 shrink-0" />
      ) : (
        <Lock className="w-4 h-4 shrink-0" />
      )}
      <span className="text-sm truncate">{room.name}</span>
      {room._count && (
        <span className="ml-auto text-xs text-zinc-600">{room._count.members}</span>
      )}
    </button>
  )
}

export function Sidebar({ onRoomSelect }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, refreshToken } = useAuthStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
    enabled: !!user,
  })

  async function handleLogout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } finally {
      logout()
      router.push('/login')
    }
  }

  const activeRoomId = pathname.split('/rooms/')[1]

  return (
    <TooltipProvider>
      <div className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h1 className="text-white font-bold">
            Yap<span className="text-violet-400">Yap</span>
          </h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create room
        </button>
        <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
          {' '}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Public
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {rooms?.public.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  isActive={activeRoomId === room.id}
                  onSelect={onRoomSelect}
                />
              ))}
            </div>
          </div>
          {(rooms?.private.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Private
                </span>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setJoinOpen(true)}
                        className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Join room</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                {rooms?.private.map(room => (
                  <RoomItem key={room.id} room={room} isActive={activeRoomId === room.id} />
                ))}
              </div>
            </div>
          )}
          {' '}
        </div>
        {' '}
        <div className="px-3 py-3 border-t border-zinc-800 flex items-center gap-2">
          {user && <UserAvatar username={user.username} color={user.color} />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Logout</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </TooltipProvider>
  )
}
