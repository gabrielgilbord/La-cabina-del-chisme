'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { ValoracionChisme } from '@/components/ValoracionChisme'

interface Chisme {
  id: string
  titulo: string
  contenido: string
  aprobado: boolean
  anonimo: boolean
  created_at: string
}

interface Notificacion {
  id: string
  tipo: 'comentario' | 'aprobado' | 'rechazado'
  chisme_id: string | null
  comentario_id: string | null
  leida: boolean
  created_at: string
  chismes?: {
    titulo: string
  }
}

export default function MisChismesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      // Cargar chismes primero, luego notificaciones (para poder usar los títulos de los chismes)
      const chismesCargados = await loadChismes(user.id)
      // Esperar un momento para que el estado se actualice
      setTimeout(async () => {
        await loadNotificaciones(user.id)
        marcarNotificacionesLeidas(user.id)
      }, 100)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      } else if (session) {
        setUser(session.user)
        // Cargar chismes primero, luego notificaciones
        loadChismes(session.user.id).then(() => {
          setTimeout(() => {
            loadNotificaciones(session.user.id)
            marcarNotificacionesLeidas(session.user.id)
          }, 100)
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Recargar notificaciones cuando los chismes cambien
  useEffect(() => {
    if (user && chismes.length > 0) {
      // Recargar notificaciones para asegurar que estén sincronizadas con los chismes
      loadNotificaciones(user.id)
    }
  }, [chismes.length, user?.id]) // Solo cuando cambie la cantidad de chismes o el usuario

  const loadChismes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chismes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading chismes:', error)
        return []
      } else {
        setChismes(data || [])
        return data || []
      }
    } catch (error) {
      console.error('Error:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const loadNotificaciones = async (userId: string) => {
    try {
      const { data: notificacionesData, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading notificaciones:', error)
        return
      }

      if (!notificacionesData || notificacionesData.length === 0) {
        setNotificaciones([])
        return
      }

      // Obtener los títulos de los chismes
      const chismeIds = notificacionesData
        .filter(n => n.chisme_id)
        .map(n => n.chisme_id)
        .filter((id, index, self) => self.indexOf(id) === index) // Eliminar duplicados

      let chismesMap: Record<string, { titulo: string }> = {}
      if (chismeIds.length > 0) {
        const { data: chismesData, error: chismesError } = await supabase
          .from('chismes')
          .select('id, titulo')
          .in('id', chismeIds)

        if (chismesError) {
          console.error('Error loading chismes for notificaciones:', chismesError)
        }

        if (chismesData) {
          chismesData.forEach(c => {
            chismesMap[c.id] = { titulo: c.titulo }
          })
        }
      }

      // Usar los chismes del estado actual (que deberían estar cargados ya)
      const chismesActuales = chismes.length > 0 ? chismes : []
      const chismesEnEstado = chismesActuales.reduce((acc, c) => {
        acc[c.id] = { titulo: c.titulo }
        return acc
      }, {} as Record<string, { titulo: string }>)

      // Combinar notificaciones con títulos de chismes (priorizar los de la BD, luego los del estado)
      const notificacionesConChismes = notificacionesData.map(n => {
        const chismeInfo = n.chisme_id 
          ? (chismesMap[n.chisme_id] || chismesEnEstado[n.chisme_id])
          : undefined
        return {
          ...n,
          chismes: chismeInfo
        }
      })

      console.log('Notificaciones cargadas:', notificacionesConChismes)
      console.log('Chismes en estado:', chismesEnEstado)
      console.log('Chismes de BD:', chismesMap)
      setNotificaciones(notificacionesConChismes)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const marcarNotificacionesLeidas = async (userId: string) => {
    try {
      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('user_id', userId)
        .eq('leida', false)
    } catch (error) {
      console.error('Error marcando notificaciones como leídas:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Cargando tus chismes...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const chismesAprobados = chismes.filter(c => c.aprobado)
  const chismesPendientes = chismes.filter(c => !c.aprobado)

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida)

  // Función helper para contar notificaciones de comentarios por chisme
  const contarNotificacionesPorChisme = (chismeId: string) => {
    const count = notificacionesNoLeidas.filter(
      n => n.chisme_id === chismeId && n.tipo === 'comentario'
    ).length
    if (count > 0) {
      console.log(`Chisme ${chismeId} tiene ${count} notificaciones`)
    }
    return count
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          📚 Mis Chismes
        </h1>
        <p className="text-white/80 text-lg">
          Aquí puedes ver todos tus chismes publicados y pendientes de aprobación
        </p>
      </div>

      {notificacionesNoLeidas.length > 0 && (
        <div className="mb-8 glass-dark rounded-3xl p-6 border border-pink-500/30 backdrop-blur-xl">
          <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <span>🔔</span>
            <span>Notificaciones ({notificacionesNoLeidas.length})</span>
          </h2>
          <div className="space-y-3">
            {notificacionesNoLeidas.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {notif.tipo === 'comentario' ? '💬' : notif.tipo === 'aprobado' ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {notif.tipo === 'comentario' && '💬 Nuevo comentario en tu chisme'}
                      {notif.tipo === 'aprobado' && '✅ Tu chisme ha sido aprobado'}
                      {notif.tipo === 'rechazado' && '❌ Tu chisme ha sido rechazado'}
                    </p>
                    {notif.chisme_id && (
                      <>
                        {notif.chismes?.titulo ? (
                          <p className="text-white/90 text-base mt-2 font-medium">
                            "{notif.chismes.titulo}"
                          </p>
                        ) : (
                          <p className="text-white/60 text-sm mt-2 italic">
                            Cargando título del chisme...
                          </p>
                        )}
                        <Link
                          href={`/chisme/${notif.chisme_id}`}
                          className="text-pink-300 hover:text-pink-200 text-sm mt-2 inline-block font-semibold underline"
                        >
                          Ver chisme completo →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chismes.length === 0 ? (
        <div className="text-center py-20 glass-dark rounded-3xl backdrop-blur-xl border border-white/10 p-12">
          <div className="text-8xl mb-6">📭</div>
          <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Aún no has publicado ningún chisme
          </h3>
          <p className="text-white text-lg mb-8 max-w-md mx-auto font-medium">
            ¡Comparte tu primer chisme y haz que todos hablen!
          </p>
          <Link
            href="/publicar"
            className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg hover:shadow-neon-pink transition-all duration-300 hover:scale-105 animate-gradient bg-[length:200%_auto]"
          >
            📤 Publicar mi primer chisme
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {chismesPendientes.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 flex items-center gap-3">
                <span>⏳</span>
                <span>Pendientes de Aprobación ({chismesPendientes.length})</span>
              </h2>
              <div className="space-y-6">
                {chismesPendientes.map((chisme) => (
                  <article
                    key={chisme.id}
                    className="glass-dark rounded-3xl p-6 md:p-8 border border-yellow-500/30 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl md:text-2xl font-display font-bold text-white flex-1">
                        {chisme.titulo}
                      </h3>
                      <span className="text-xs md:text-sm text-yellow-300 bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-500/30 ml-4 font-medium">
                        ⏳ Pendiente
                      </span>
                    </div>
                    <p className="text-white/90 text-lg leading-relaxed mb-4 whitespace-pre-wrap">
                      {chisme.contenido}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm text-white/70">
                        {format(new Date(chisme.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                      <span className="text-sm text-white/70">
                        {chisme.anonimo ? '🔒 Anónimo' : '👤 Público'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {chismesAprobados.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 flex items-center gap-3">
                <span>✅</span>
                <span>Publicados ({chismesAprobados.length})</span>
              </h2>
              <div className="space-y-6">
                {chismesAprobados.map((chisme) => {
                  const notificacionesCount = contarNotificacionesPorChisme(chisme.id)
                  
                  return (
                    <article
                      key={chisme.id}
                      className={`glass-dark rounded-3xl p-6 md:p-8 border backdrop-blur-xl hover-lift ${
                        notificacionesCount > 0 
                          ? 'border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]' 
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Link href={`/chisme/${chisme.id}`} className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl md:text-2xl font-display font-bold text-white hover:text-pink-300 transition-colors cursor-pointer">
                              {chisme.titulo}
                            </h3>
                            {notificacionesCount > 0 && (
                              <span className="bg-pink-500 text-white text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1.5 animate-pulse shadow-lg border-2 border-white">
                                <span>💬</span>
                                <span>{notificacionesCount}</span>
                                <span className="hidden sm:inline">nuevo{notificacionesCount > 1 ? 's' : ''}</span>
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 ml-4">
                          {notificacionesCount > 0 && (
                            <span className="text-xs md:text-sm text-pink-300 bg-pink-500/20 px-3 py-1.5 rounded-full border border-pink-500/30 font-medium animate-pulse">
                              💬 Nuevos comentarios
                            </span>
                          )}
                          <span className="text-xs md:text-sm text-green-300 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30 font-medium">
                            ✅ Publicado
                          </span>
                        </div>
                      </div>
                    <Link href={`/chisme/${chisme.id}`}>
                      <p className="text-white/90 text-lg leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3 hover:text-white transition-colors">
                        {chisme.contenido}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-white/70">
                          {format(new Date(chisme.created_at), "dd MMM yyyy 'a las' HH:mm")}
                        </span>
                        <span className="text-sm text-white/70">
                          {chisme.anonimo ? '🔒 Anónimo' : '👤 Público'}
                        </span>
                      </div>
                      <ValoracionChisme chismeId={chisme.id} user={user} />
                    </div>
                  </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

