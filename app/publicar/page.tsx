'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function PublicarPage() {
  const [user, setUser] = useState<User | null>(null)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [anonimo, setAnonimo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // Si hay error o no hay usuario, redirigir al login
      if (error || !user) {
        router.push('/login')
        return
      }
      
      setUser(user)
    }
    
    getUser()
    
    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!user) {
      setError('Debes estar autenticado para publicar')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('chismes')
      .insert({
        titulo,
        contenido,
        user_id: user.id,
        aprobado: false,
        anonimo: anonimo,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTitulo('')
      setContenido('')
      setTimeout(() => {
        setSuccess(false)
        router.push('/')
      }, 2000)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
          <p className="text-gray-300 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <div className="glass-dark rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl p-8 md:p-10 animate-slide-up hover-lift">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-float">🎤</div>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-2 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] [text-shadow:_0_0_20px_rgba(236,72,153,0.6)]">
            Comparte tu Chisme
          </h2>
          <p className="text-white font-semibold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">Cuéntanos todos los detalles jugosos</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-5 py-4 rounded-xl mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border-2 border-green-500 text-green-200 px-5 py-4 rounded-xl mb-6 backdrop-blur-sm animate-slide-down">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <span className="font-semibold">¡Chisme enviado! Los administradores lo revisarán pronto.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="titulo" className="block text-sm font-bold text-white mb-3">
              Título del Chisme
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              maxLength={200}
              className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 backdrop-blur-sm text-lg"
              placeholder="Ej: El chisme más jugoso del año..."
            />
            <p className="mt-2 text-xs text-white/70 font-medium">
              {titulo.length}/200 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="contenido" className="block text-sm font-bold text-white mb-3">
              Contenido del Chisme
            </label>
            <textarea
              id="contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              required
              rows={12}
              maxLength={2000}
              className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 backdrop-blur-sm resize-none text-lg"
              placeholder="Cuéntanos todos los detalles del chisme..."
            />
            <p className="mt-2 text-xs text-white/70 font-medium">
              {contenido.length}/2000 caracteres
            </p>
          </div>

          <div className="bg-white/10 border-2 border-white/20 rounded-xl p-5 backdrop-blur-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={anonimo}
                onChange={(e) => setAnonimo(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 text-pink-500 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer"
              />
              <div>
                <span className="text-white font-semibold block">Publicar como anónimo</span>
                <span className="text-white/70 text-sm">
                  {anonimo 
                    ? 'Tu nombre no se mostrará públicamente (los admins pueden verlo)' 
                    : 'Tu nombre de usuario se mostrará públicamente'}
                </span>
              </div>
            </label>
          </div>

          <div className="bg-purple-500/20 border-2 border-purple-500/50 rounded-xl p-5 backdrop-blur-sm">
            <p className="text-sm text-purple-200 flex items-start gap-2">
              <span className="text-lg">ℹ️</span>
              <span>
                <strong className="font-bold">Importante:</strong> Tu chisme será revisado por los administradores antes de ser publicado. 
                Aunque se publique de forma anónima, los administradores pueden ver quién lo publicó.
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white py-5 rounded-xl font-bold text-xl hover:shadow-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 animate-gradient bg-[length:200%_auto]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Enviando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>📤</span>
                Enviar Chisme
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
