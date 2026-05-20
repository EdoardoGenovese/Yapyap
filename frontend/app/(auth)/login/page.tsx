'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/authStore'

const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    try {
      setError(null)
      const res = await authApi.login(data)
      setAuth(res.user, res.accessToken, res.refreshToken)
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Welcome back</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-zinc-400 text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-zinc-400 text-xs">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-400 text-xs">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-violet-600 hover:bg-violet-700 text-white mt-2"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-zinc-500 text-sm text-center mt-6">
        No account?{' '}
        <Link href="/register" className="text-violet-400 hover:text-violet-300">
          Register
        </Link>
      </p>
    </div>
  )
}