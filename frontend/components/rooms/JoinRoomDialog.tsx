'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { roomsApi } from '@/lib/api/rooms'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface JoinRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoinPrivate() {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { room } = await roomsApi.joinPrivate(inviteCode.trim())
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
      onOpenChange(false)
      setInviteCode('')
      router.push(`/rooms/${room.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid invite code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="private" className="mt-2">
          <TabsList className="bg-zinc-800 w-full">
            <TabsTrigger value="private" className="flex-1">Private invite</TabsTrigger>
          </TabsList>

          <TabsContent value="private" className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-zinc-400 text-xs">Invite code</Label>
              <Input
                placeholder="abc123xyz"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinPrivate()}
                className="bg-zinc-800 border-zinc-700 text-white font-mono"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              onClick={handleJoinPrivate}
              disabled={loading || !inviteCode.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? 'Joining...' : 'Join room'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}