'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [notificacionesCount, setNotificacionesCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Si no hay sesión, es normal (usuario no logueado o después de logout)
        if (userError && userError.message !== 'Auth session missing!') {
          console.error('Error getting user:', userError)
        }

        setUser(user || null)

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

          if (profileError) {
            // Solo mostrar error si no es por recursión o si es un error real
            if (!profileError.message.includes('recursion')) {
              console.error('Error getting profile:', profileError)
            }
            setIsAdmin(false)
          } else {
            const adminStatus = profile?.is_admin === true
            setIsAdmin(adminStatus)
            if (adminStatus) {
              console.log('Usuario es admin')
              // Cargar chismes pendientes si es admin
              loadPendingChismes()
            }
          }
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        // Ignorar errores de sesión faltante
        setUser(null)
        setIsAdmin(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAdmin(false)
      } else {
        getUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const loadPendingChismes = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('chismes')
        .select('*', { count: 'exact', head: true })
        .eq('aprobado', false)

      if (!error && count !== null) {
        setPendingCount(count)
      }
    } catch (error) {
      console.error('Error loading pending chismes:', error)
    }
  }, [supabase])

  // Actualizar el contador periódicamente si es admin
  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0)
      return
    }

    // Cargar inmediatamente
    loadPendingChismes()

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadPendingChismes()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAdmin, loadPendingChismes])

  // Actualizar contador cuando se navega a /admin
  useEffect(() => {
    if (isAdmin && pathname === '/admin') {
      loadPendingChismes()
    }
  }, [pathname, isAdmin, loadPendingChismes])

  const loadNotificaciones = useCallback(async () => {
    if (!user) {
      setNotificacionesCount(0)
      return
    }

    try {
      const { count, error } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('leida', false)

      if (!error && count !== null) {
        setNotificacionesCount(count)
      }
    } catch (error) {
      console.error('Error loading notificaciones:', error)
    }
  }, [user, supabase])

  // Cargar notificaciones cuando hay usuario
  useEffect(() => {
    if (user) {
      loadNotificaciones()
      // Actualizar cada 30 segundos
      const interval = setInterval(() => {
        loadNotificaciones()
      }, 30000)
      return () => clearInterval(interval)
    } else {
      setNotificacionesCount(0)
    }
  }, [user, loadNotificaciones])

  // Actualizar notificaciones cuando se navega a mis-chismes
  useEffect(() => {
    if (user && pathname === '/mis-chismes') {
      loadNotificaciones()
    }
  }, [pathname, user, loadNotificaciones])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      // Limpiar estado local
      setUser(null)
      setIsAdmin(false)
      // Redirigir
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error during logout:', error)
      // Aún así, limpiar estado y redirigir
      setUser(null)
      setIsAdmin(false)
      router.push('/')
      router.refresh()
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-slate-900 md:bg-slate-900/95 md:glass-dark md:backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16 sm:h-20 min-h-[64px]">
          <Link href="/" className="flex items-center space-x-1 sm:space-x-3 group flex-shrink-0">
            <span className="text-xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">🎙️</span>
            <span className="text-[10px] xs:text-xs sm:text-xl md:text-2xl font-display font-bold text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)] whitespace-nowrap">
              La Cabina del Chisme
            </span>
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            <Link
              href="/"
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold text-xs sm:text-base ${
                isActive('/') 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-neon-pink' 
                  : 'text-white hover:text-pink-200 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
              }`}
            >
              Inicio
            </Link>

            {user ? (
              <>
                <Link
                  href="/publicar"
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold text-xs sm:text-base ${
                    isActive('/publicar')
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-neon-pink'
                      : 'text-white hover:text-pink-200 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  }`}
                >
                  <span className="hidden md:inline">📤 Publicar</span>
                  <span className="md:hidden">📤</span>
                </Link>

                <Link
                  href="/mis-chismes"
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold relative text-xs sm:text-base ${
                    isActive('/mis-chismes')
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-neon-pink'
                      : 'text-white hover:text-pink-200 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  }`}
                >
                  <span className="hidden md:inline">📚 Mis Chismes</span>
                  <span className="md:hidden">📚</span>
                  {notificacionesCount > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-pink-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse shadow-lg border border-white sm:border-2">
                      {notificacionesCount > 9 ? '9+' : notificacionesCount}
                    </span>
                  )}
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold relative text-xs sm:text-base ${
                      isActive('/admin')
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-neon-pink'
                        : 'text-white hover:text-pink-200 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                    }`}
                  >
                    <span className="hidden md:inline">🔐 Admin</span>
                    <span className="md:hidden">🔐</span>
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse shadow-lg border border-white sm:border-2">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center space-x-1 sm:space-x-3 ml-1 sm:ml-2 pl-1 sm:pl-3 border-l border-white/20">
                  <div className="hidden lg:block text-sm text-white font-semibold">
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/10 text-white rounded-lg sm:rounded-xl hover:bg-white/20 hover:text-pink-200 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all duration-300 font-semibold border border-white/20 text-xs sm:text-base"
                  >
                    Salir
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 sm:px-4 py-1.5 sm:py-2 text-white hover:text-pink-200 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] rounded-lg sm:rounded-xl transition-all duration-300 font-semibold text-xs sm:text-base"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="px-3 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl hover:shadow-neon-pink transition-all duration-300 font-bold hover:scale-105 text-xs sm:text-base"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
