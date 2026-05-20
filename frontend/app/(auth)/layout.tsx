export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Yap<span className="text-violet-400">Yap</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">say more, type less</p>
        </div>
        {children}
      </div>
    </div>
  )
}