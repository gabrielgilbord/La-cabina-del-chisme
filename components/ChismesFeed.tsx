'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ValoracionChisme } from '@/components/ValoracionChisme'

interface Chisme {
  id: string
  titulo: string
  contenido: string
  created_at: string
  anonimo: boolean
  user_id: string
  profiles?: {
    username?: string
    email?: string
  }
}

export function ChismesFeed({ user: initialUser }: { user: User | null }) {
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(initialUser)
  const supabase = createClient()

  useEffect(() => {
    // Verificar el usuario en el cliente también
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    }
    checkUser()
    loadChismes()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadChismes = async () => {
    try {
      const { data: chismesData, error } = await supabase
        .from('chismes')
        .select('*')
        .eq('aprobado', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading chismes:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        // Intentar sin filtro de aprobado para debug
        const { data: allData, error: allError } = await supabase
          .from('chismes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (!allError && allData) {
          console.log('Todos los chismes (sin filtro):', allData)
          const approved = allData.filter(c => c.aprobado === true)
          console.log('Chismes aprobados:', approved)
          await loadProfiles(approved)
        }
      } else if (chismesData) {
        console.log('Chismes cargados:', chismesData?.length || 0)
        console.log('Datos:', chismesData)
        await loadProfiles(chismesData)
      }
    } catch (err) {
      console.error('Exception loading chismes:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async (chismesData: Chisme[]) => {
    // Obtener IDs de usuarios que no son anónimos
    const userIds = [...new Set(
      chismesData
        .filter(c => !c.anonimo)
        .map(c => c.user_id)
    )]

    if (userIds.length === 0) {
      setChismes(chismesData)
      return
    }

    // Cargar perfiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', userIds)

    // Combinar chismes con perfiles
    const chismesConPerfiles = chismesData.map(chisme => ({
      ...chisme,
      profiles: chisme.anonimo ? undefined : profilesData?.find(p => p.id === chisme.user_id)
    }))

    setChismes(chismesConPerfiles)
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
        <p className="text-white text-lg font-medium">Cargando chismes jugosos...</p>
      </div>
    )
  }

  if (chismes.length === 0) {
    return (
      <div className="text-center py-20 glass-dark rounded-3xl backdrop-blur-xl border border-white/10 p-12 max-w-2xl mx-auto hover-lift">
        <div className="text-8xl mb-6 animate-bounce-slow">📭</div>
        <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
          Aún no hay chismes
        </h3>
        {user ? (
          <>
            <p className="text-white text-lg mb-8 max-w-md mx-auto font-medium">
              Sé el primero en compartir un chisme jugoso y haz que todos hablen
            </p>
            <Link
              href="/publicar"
              className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:shadow-neon-pink transition-all duration-300 hover:scale-105 animate-gradient bg-[length:200%_auto]"
            >
              📤 Publicar mi primer chisme
            </Link>
          </>
        ) : (
          <>
            <p className="text-white text-lg mb-6 max-w-md mx-auto font-medium">
              Crea una cuenta o inicia sesión para compartir tus chismes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:shadow-neon-pink transition-all duration-300 hover:scale-105 animate-gradient bg-[length:200%_auto]"
              >
                🚀 Crear cuenta
              </Link>
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-white/10 border-2 border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
              >
                🔐 Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {chismes.map((chisme, index) => (
        <article
          key={chisme.id}
          className="glass-dark rounded-3xl p-8 md:p-10 hover-lift border border-white/10 backdrop-blur-xl group animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-6">
            <Link href={`/chisme/${chisme.id}`} className="flex-1">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white group-hover:text-pink-300 transition-colors cursor-pointer hover:underline">
                {chisme.titulo}
              </h2>
            </Link>
            <div className="ml-4 flex items-center gap-2">
              <span className="text-xs md:text-sm text-white/80 bg-black/40 px-3 py-1.5 rounded-full border border-white/20 font-medium">
                {format(new Date(chisme.created_at), "dd MMM yyyy 'a las' HH:mm")}
              </span>
            </div>
          </div>
          
          <Link href={`/chisme/${chisme.id}`} className="block">
            <div className="relative">
              <p className="text-white text-lg md:text-xl leading-relaxed whitespace-pre-wrap mb-6 font-medium line-clamp-3">
                {chisme.contenido}
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
            </div>
          </Link>
          
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-neon-pink">
                👤
              </div>
              <span className="text-white font-semibold">
                {chisme.anonimo 
                  ? 'Anónimo' 
                  : (chisme.profiles?.username || chisme.profiles?.email?.split('@')[0] || 'Usuario')}
              </span>
            </div>
            <ValoracionChisme chismeId={chisme.id} user={user} />
          </div>
        </article>
      ))}
    </div>
  )
}
