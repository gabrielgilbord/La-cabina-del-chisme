'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

interface Comentario {
  id: string
  contenido: string
  created_at: string
  user_id: string
  profiles?: {
    email: string
    username?: string
  }
}

export default function ChismePage() {
  const params = useParams()
  const router = useRouter()
  const chismeId = params.id as string
  const [chisme, setChisme] = useState<Chisme | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      // Cargar usuario
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Cargar chisme
      const { data: chismeData, error: chismeError } = await supabase
        .from('chismes')
        .select('*')
        .eq('id', chismeId)
        .eq('aprobado', true)
        .single()

      if (chismeError || !chismeData) {
        router.push('/')
        return
      }

      // Si no es anónimo, cargar el perfil del usuario
      if (!chismeData.anonimo) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', chismeData.user_id)
          .single()

        setChisme({
          ...chismeData,
          profiles: profileData || undefined
        })
      } else {
        setChisme(chismeData)
      }
      loadComentarios()
      setLoading(false)
    }

    loadData()
  }, [chismeId, router, supabase])

  const loadComentarios = async () => {
    const { data: comentariosData } = await supabase
      .from('comentarios')
      .select('*')
      .eq('chisme_id', chismeId)
      .order('created_at', { ascending: false })

    if (comentariosData) {
      // Obtener los perfiles de los usuarios que comentaron
      const userIds = [...new Set(comentariosData.map(c => c.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, username')
        .in('id', userIds)

      // Combinar comentarios con perfiles
      const comentariosConPerfiles = comentariosData.map(comentario => ({
        ...comentario,
        profiles: profilesData?.find(p => p.id === comentario.user_id)
      }))

      setComentarios(comentariosConPerfiles)
    }
  }

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !nuevoComentario.trim()) return

    setEnviando(true)
    const { error } = await supabase
      .from('comentarios')
      .insert({
        chisme_id: chismeId,
        user_id: user.id,
        contenido: nuevoComentario.trim(),
        aprobado: true, // Se publica directamente
      })

    if (!error) {
      setNuevoComentario('')
      // Recargar comentarios para mostrar el nuevo
      await loadComentarios()
    } else {
      console.error('Error enviando comentario:', error)
    }
    setEnviando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
          <p className="text-white text-lg">Cargando chisme...</p>
        </div>
      </div>
    )
  }

  if (!chisme) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-white hover:text-pink-300 mb-6 transition-colors"
      >
        <span>←</span>
        <span>Volver al inicio</span>
      </Link>

      <article className="glass-dark rounded-3xl p-8 md:p-10 border border-white/10 backdrop-blur-xl mb-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex-1">
            {chisme.titulo}
          </h1>
          <span className="text-xs md:text-sm text-white/80 bg-black/40 px-3 py-1.5 rounded-full border border-white/20 ml-4 font-medium">
            {format(new Date(chisme.created_at), "dd MMM yyyy 'a las' HH:mm")}
          </span>
        </div>

        <div className="mb-6">
          <p className="text-white text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
            {chisme.contenido}
          </p>
        </div>

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

      {/* Sección de comentarios */}
      <div className="glass-dark rounded-3xl p-8 md:p-10 border border-white/10 backdrop-blur-xl">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6">
          💬 Comentarios ({comentarios.length})
        </h2>

        {user ? (
          <form onSubmit={handleEnviarComentario} className="mb-8">
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe tu comentario..."
              rows={4}
              className="w-full px-5 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 backdrop-blur-sm resize-none text-lg mb-4"
              required
            />
            <button
              type="submit"
              disabled={enviando}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              {enviando ? 'Enviando...' : '💬 Enviar comentario'}
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-white/10 rounded-xl border border-white/20">
            <p className="text-white mb-4">
              <Link href="/login" className="text-pink-300 hover:text-pink-200 font-bold underline">
                Inicia sesión
              </Link>
              {' '}para comentar
            </p>
          </div>
        )}

        <div className="space-y-4">
          {comentarios.length === 0 ? (
            <p className="text-white/70 text-center py-8">
              Aún no hay comentarios. ¡Sé el primero en comentar!
            </p>
          ) : (
            comentarios.map((comentario) => {
              // Obtener el nombre del usuario (username o email)
              const nombreUsuario = comentario.profiles?.username || 
                                   comentario.profiles?.email?.split('@')[0] || 
                                   'Usuario'
              
              return (
                <div
                  key={comentario.id}
                  className="bg-white/5 rounded-xl p-5 border border-white/10"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-semibold">{nombreUsuario}</span>
                        <span className="text-xs text-white/50">
                          {format(new Date(comentario.created_at), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                      <p className="text-white/90 leading-relaxed">{comentario.contenido}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

