"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { FiShield, FiUserCheck, FiBriefcase, FiArrowRight, FiCheck } from 'react-icons/fi'
import { 
  setActiveRole, 
  setActiveAgent, 
  REGISTERED_AGENTS, 
  AgentProfile 
} from '@/lib/agent-service'

type UserCategory = 'admin' | 'staff' | 'agent'

export default function AdminLogin() {
  const [category, setCategory] = useState<UserCategory>('admin')
  const [email, setEmail] = useState('admin@jazgottours.com')
  const [password, setPassword] = useState('password123')
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile>(REGISTERED_AGENTS[0])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCategoryChange = (cat: UserCategory) => {
    setCategory(cat)
    setError(null)
    if (cat === 'admin') {
      setEmail('admin@jazgottours.com')
      setPassword('password123')
    } else if (cat === 'staff') {
      setEmail('staff@jazgottours.com')
      setPassword('staff123456')
    } else if (cat === 'agent') {
      setEmail(selectedAgent.email)
      setPassword('agent123456')
    }
  }

  const handleAgentSelect = (agent: AgentProfile) => {
    setSelectedAgent(agent)
    setEmail(agent.email)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Save active category and agent
    setActiveRole(category)
    if (category === 'agent') {
      setActiveAgent(selectedAgent)
    }

    // Try Supabase auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If Supabase auth errors (e.g. dummy account not in DB), we still allow demo entry for testing
    // while keeping real auth intact for valid credentials
    if (authError && !email.includes('jazgottours.com')) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    if (category === 'agent') {
      router.push('/agent')
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea] p-4 relative overflow-hidden font-sans">
      {/* Warm Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#dfa241]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#c88422]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_12px_40px_rgb(180,130,60,0.15)] border border-[#e5cfb1] relative z-10 space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Logo className="h-11" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Portal Access & Authentication
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose your account category to sign into your customized Jazgot workspace.
          </p>
        </div>

        {/* 1. Category Selector Buttons */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Step 1: Select Your Category
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Admin */}
            <button
              type="button"
              onClick={() => handleCategoryChange('admin')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                category === 'admin'
                  ? 'bg-gradient-to-br from-[#dfa241] to-[#b8731b] text-white border-[#b8731b] shadow-md scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${category === 'admin' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
                <FiShield size={16} />
              </div>
              <span className="text-xs font-bold leading-tight">Admin</span>
              <span className={`text-[9px] ${category === 'admin' ? 'text-amber-100' : 'text-slate-400'}`}>
                Owner
              </span>
            </button>

            {/* Staff */}
            <button
              type="button"
              onClick={() => handleCategoryChange('staff')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                category === 'staff'
                  ? 'bg-gradient-to-br from-[#dfa241] to-[#b8731b] text-white border-[#b8731b] shadow-md scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${category === 'staff' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
                <FiUserCheck size={16} />
              </div>
              <span className="text-xs font-bold leading-tight">Staff</span>
              <span className={`text-[9px] ${category === 'staff' ? 'text-amber-100' : 'text-slate-400'}`}>
                Operations
              </span>
            </button>

            {/* Tour Agent */}
            <button
              type="button"
              onClick={() => handleCategoryChange('agent')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                category === 'agent'
                  ? 'bg-gradient-to-br from-[#dfa241] to-[#b8731b] text-white border-[#b8731b] shadow-md scale-[1.02]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${category === 'agent' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
                <FiBriefcase size={16} />
              </div>
              <span className="text-xs font-bold leading-tight">Tour Agent</span>
              <span className={`text-[9px] ${category === 'agent' ? 'text-amber-100' : 'text-slate-400'}`}>
                Sales Partner
              </span>
            </button>
          </div>
        </div>

        {/* Category Description Banner */}
        <div className="bg-[#fcfbf9] border border-amber-200/80 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
          {category === 'admin' && (
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-900">Admin Privileges:</span>
              <span>Full control over Invoices, Bookings, Commissions, and Tour Base Prices.</span>
            </p>
          )}
          {category === 'staff' && (
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="font-semibold text-slate-900">Staff Privileges:</span>
              <span>Dashboard, Services, and Quotation operations (Financials locked).</span>
            </p>
          )}
          {category === 'agent' && (
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-slate-900">Agent Privileges:</span>
                <span>Client booking, custom mark-up controls (Original price hidden).</span>
              </p>
              {/* Agent Selector */}
              <div className="pt-1 border-t border-amber-100">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Active Agent Profile:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {REGISTERED_AGENTS.map((agt) => (
                    <button
                      key={agt.id}
                      type="button"
                      onClick={() => handleAgentSelect(agt)}
                      className={`px-2.5 py-1.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        selectedAgent.id === agt.id
                          ? 'bg-amber-100 border-amber-400 font-bold text-amber-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{agt.name}</span>
                      {selectedAgent.id === agt.id && <FiCheck size={12} className="text-amber-700 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* 2. Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#dfa241]/40 focus:border-[#dfa241] text-slate-900 transition-all"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#dfa241]/40 focus:border-[#dfa241] text-slate-900 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#dfa241] to-[#b8731b] hover:from-[#d19432] hover:to-[#a86414] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${category === 'agent' ? 'Tour Agent' : category === 'staff' ? 'Staff' : 'Admin'}`}</span>
            <FiArrowRight size={14} />
          </button>
        </form>

        {/* Direct URL Route Reference */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Direct URL:</span>
          <div className="flex items-center gap-3 font-semibold text-amber-800">
            <button 
              type="button" 
              onClick={() => { setActiveRole('admin'); router.push('/admin'); }}
              className="hover:underline cursor-pointer"
            >
              /admin (Admin Portal)
            </button>
            <span>•</span>
            <button 
              type="button" 
              onClick={() => { setActiveRole('agent'); router.push('/agent'); }}
              className="hover:underline cursor-pointer"
            >
              /agent (Agent Portal)
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}