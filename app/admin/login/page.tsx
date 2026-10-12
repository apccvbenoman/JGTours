"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'

type Role = 'admin' | 'staff' | 'agent'

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'admin',  label: 'Admin',  description: 'Full system access' },
  { value: 'staff',  label: 'Staff',  description: 'Bookings & clients' },
  { value: 'agent',  label: 'Agent',  description: 'View & quotations' },
]

export default function AdminLogin() {
  const [role, setRole] = useState<Role>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !data.session) {
      setError(signInError?.message ?? 'Sign in failed. Please check your credentials.')
      setLoading(false)
      return
    }

    // Persist the selected role into user_metadata so the rest of the app can read it
    await supabase.auth.updateUser({ data: { role } })

    router.push('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4f1ea] via-[#ede5d5] to-[#e3cfac] p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-amber-200/50 space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-2 pb-2 border-b border-amber-100">
          <Logo className="h-10" />
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-800 mt-1">Staff Portal</p>
        </div>

        {/* Role Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sign in as</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  role === r.value
                    ? 'border-[#dfa241] bg-amber-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <span className={`text-sm font-bold ${role === r.value ? 'text-amber-800' : 'text-slate-700'}`}>
                  {r.label}
                </span>
                <span className={`text-[10px] ${role === r.value ? 'text-amber-600' : 'text-slate-400'}`}>
                  {r.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`Enter your ${role} email`}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#dfa241] to-[#c47f1e] hover:from-[#c47f1e] hover:to-[#a86a10] text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-amber-200/50 uppercase tracking-wider text-xs mt-2 cursor-pointer"
          >
            {loading ? 'Signing in…' : `Sign In as ${ROLES.find(r => r.value === role)?.label}`}
          </button>
        </form>
      </div>
    </div>
  )
}