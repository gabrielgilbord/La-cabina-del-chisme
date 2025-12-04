'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-dark rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl p-10 text-center animate-slide-up">
          <div className="text-8xl mb-6 animate-bounce-slow">✅</div>
          <h2 className="text-3xl font-display font-black mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            ¡Cuenta Creada!
          </h2>
          <p className="text-white text-lg font-semibold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">Redirigiendo al login...</p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-dark rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl p-8 md:p-10 animate-slide-up hover-lift">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float">🎉</div>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-2 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] [text-shadow:_0_0_20px_rgba(236,72,153,0.6)]">
            Crear Cuenta
          </h2>
          <p className="text-white font-semibold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">Únete y comparte los mejores chismes</p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-bold text-white mb-2">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-5 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 backdrop-blur-sm"
              placeholder="tu_usuario"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 backdrop-blur-sm"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-white mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-5 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 backdrop-blur-sm"
              placeholder="••••••••"
            />
            <p className="mt-2 text-xs text-white/70">Mínimo 6 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 animate-gradient bg-[length:200%_auto]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Creando cuenta...
              </span>
            ) : (
              '🚀 Crear Cuenta'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white font-semibold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-pink-200 hover:text-pink-100 font-bold underline decoration-2 underline-offset-2 transition-colors [text-shadow:_0_0_8px_rgba(236,72,153,0.6)] hover:[text-shadow:_0_0_12px_rgba(236,72,153,0.8)]">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
