'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { roomsApi } from '@/lib/api/rooms'
import { Hash, Lock } from 'lucide-react'

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const room = await roomsApi.create({ name: name.trim(), description, type })
      await queryClient.invalidateQueries({ queryKey: ['rooms'] })
      onOpenChange(false)
      setName('')
      setDescription('')
      router.push(`/rooms/${room.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {(['PUBLIC', 'PRIVATE'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm ${
                  type === t
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {t === 'PUBLIC' ? <Hash className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {t === 'PUBLIC' ? 'Public' : 'Private'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-400 text-xs">Room name</Label>
            <Input
              placeholder="general"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="bg-zinc-800 border-zinc-700 text-white"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-400 text-xs">Description (optional)</Label>
            <Input
              placeholder="What's this room about?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? 'Creating...' : 'Create room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
