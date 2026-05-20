'use client'

import type { RoomMember } from '@/types'
import { Crown, Shield } from 'lucide-react'

interface MembersListProps {
  members: RoomMember[]
}

function MemberItem({ member }: { member: RoomMember }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: member.user.color }}
        >
          {member.user.username[0].toUpperCase()}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${
            member.user.isOnline ? 'bg-green-500' : 'bg-zinc-600'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{member.user.username}</p>
      </div>

      {member.role === 'OWNER' && <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
      {member.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
    </div>
  )
}

export function MembersList({ members }: MembersListProps) {
  const online = members.filter((m) => m.user.isOnline)
  const offline = members.filter((m) => !m.user.isOnline)

  return (
    <div className="w-52 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shrink-0">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Members — {members.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2">
        {online.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-1">
              Online — {online.length}
            </p>
            {online.map((m) => <MemberItem key={m.id} member={m} />)}
          </div>
        )}

        {offline.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-1">
              Offline — {offline.length}
            </p>
            {offline.map((m) => <MemberItem key={m.id} member={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}