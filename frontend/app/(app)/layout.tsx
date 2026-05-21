'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
  }, [])

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden relative">

      {/* Overlay mobile — dietro sidebar, davanti alla chat */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — su mobile slide da sinistra con z alto */}
      <div className={`
        fixed lg:relative inset-y-0 left-0
        z-30 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onRoomSelect={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1 mr-4"
          >
            <span className="w-5 h-0.5 bg-zinc-400" />
            <span className="w-5 h-0.5 bg-zinc-400" />
            <span className="w-5 h-0.5 bg-zinc-400" />
          </button>
          <span className="text-white font-bold">
            Yap<span className="text-violet-400">Yap</span>
          </span>
        </div>

        {children}
      </main>
    </div>
  )
}