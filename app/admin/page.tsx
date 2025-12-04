'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { format } from 'date-fns'

interface Chisme {
  id: string
  titulo: string
  contenido: string
  aprobado: boolean
  created_at: string
  user_id: string
  profiles?: {
    username: string
    email: string
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [chismes, setChismes] = useState<Chisme[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      // Esperar un momento para que las cookies se sincronicen
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        setLoading(false)
        // No redirigir inmediatamente, mostrar error
        return
      }

      if (!user) {
        console.log('No hay usuario, redirigiendo a login...')
        router.push('/login')
        setLoading(false)
        return
      }

      setUser(user)

      // Intentar obtener el perfil con mejor manejo de errores
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error getting profile:', profileError)
        console.error('Profile error details:', JSON.stringify(profileError, null, 2))
        setLoading(false)
        // No redirigir, solo mostrar que hay un error
        alert('Error al verificar permisos. Si eres admin, asegúrate de haber ejecutado el script fix_all_rls.sql en Supabase.')
        return
      }

      const adminStatus = profile?.is_admin === true
      console.log('Admin status:', adminStatus, 'Profile:', profile)
      
      if (!adminStatus) {
        console.log('Usuario no es admin, redirigiendo...')
        router.push('/')
        setLoading(false)
        return
      }

      console.log('✅ Usuario es admin, cargando panel...')
      setIsAdmin(true)
      loadChismes()
    }

    checkAdmin()
  }, [router, supabase])

  const loadChismes = async () => {
    const { data: chismesData, error: chismesError } = await supabase
      .from('chismes')
      .select('*')
      .order('created_at', { ascending: false })

    if (chismesError) {
      console.error('Error loading chismes:', chismesError)
      setLoading(false)
      return
    }

    if (chismesData && chismesData.length > 0) {
      const userIds = [...new Set(chismesData.map(c => c.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', userIds)

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, p])
      )

      const chismesWithProfiles = chismesData.map(chisme => ({
        ...chisme,
        profiles: profilesMap.get(chisme.user_id)
      }))

      setChismes(chismesWithProfiles)
    } else {
      setChismes([])
    }
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('chismes')
      .update({ aprobado: true })
      .eq('id', id)

    if (!error) {
      loadChismes()
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres rechazar este chisme?')) {
      return
    }
    const { error } = await supabase
      .from('chismes')
      .delete()
      .eq('id', id)

    if (!error) {
      loadChismes()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
          <p className="text-gray-300 text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const pendingChismes = chismes.filter(c => !c.aprobado)
  const approvedChismes = chismes.filter(c => c.aprobado)

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-12 text-center animate-slide-down">
        <div className="text-7xl mb-4 animate-float">🔐</div>
        <h1 className="text-5xl md:text-6xl font-display font-black mb-4 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] [text-shadow:_0_0_20px_rgba(236,72,153,0.6)]">
          Panel de Administración
        </h1>
        <p className="text-white text-lg font-semibold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">Gestiona y modera los chismes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="glass-dark rounded-2xl backdrop-blur-xl border border-yellow-500/30 p-8 hover-lift shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-5xl font-display font-black text-yellow-400">{pendingChismes.length}</h3>
            <span className="text-4xl">⏳</span>
          </div>
          <p className="text-white text-lg font-semibold">Chismes pendientes</p>
        </div>
        <div className="glass-dark rounded-2xl backdrop-blur-xl border border-green-500/30 p-8 hover-lift shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-5xl font-display font-black text-green-400">{approvedChismes.length}</h3>
            <span className="text-4xl">✅</span>
          </div>
          <p className="text-white text-lg font-semibold">Chismes aprobados</p>
        </div>
      </div>

      <div className="space-y-8">
        {pendingChismes.length > 0 && (
          <div className="animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-display font-black mb-6 text-yellow-400 flex items-center gap-3">
              <span>⏳</span>
              Pendientes de Aprobar
            </h2>
            <div className="space-y-6">
              {pendingChismes.map((chisme, index) => (
                <div 
                  key={chisme.id} 
                  className="glass-dark rounded-2xl backdrop-blur-xl border-2 border-yellow-500/50 p-6 md:p-8 hover-lift shadow-2xl animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white flex-1">{chisme.titulo}</h3>
                    <span className="text-xs md:text-sm text-white/80 bg-black/40 px-3 py-1.5 rounded-full border border-white/20 ml-4 font-medium">
                      {format(new Date(chisme.created_at), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                  <p className="text-white text-lg leading-relaxed whitespace-pre-wrap mb-6 font-medium">{chisme.contenido}</p>
                  
                  <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
                    <p className="text-sm text-white mb-2">
                      <strong className="text-pink-300">Publicado por:</strong>{' '}
                      <span className="text-white font-semibold">{chisme.profiles?.username || 'Usuario'}</span>
                      {' '}({chisme.profiles?.email || 'N/A'})
                    </p>
                    <p className="text-xs text-white/60 font-mono">ID: {chisme.user_id}</p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(chisme.id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl hover:shadow-neon-pink transition-all duration-300 font-bold text-lg hover:scale-105"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(chisme.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 font-bold text-lg hover:scale-105"
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {approvedChismes.length > 0 && (
          <div className="animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-display font-black mb-6 text-green-400 flex items-center gap-3">
              <span>✅</span>
              Chismes Aprobados
            </h2>
            <div className="space-y-6">
              {approvedChismes.map((chisme, index) => (
                <div 
                  key={chisme.id} 
                  className="glass-dark rounded-2xl backdrop-blur-xl border-2 border-green-500/50 p-6 md:p-8 hover-lift shadow-2xl animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white flex-1">{chisme.titulo}</h3>
                    <span className="text-xs md:text-sm text-white/80 bg-black/40 px-3 py-1.5 rounded-full border border-white/20 ml-4 font-medium">
                      {format(new Date(chisme.created_at), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                  <p className="text-white text-lg leading-relaxed whitespace-pre-wrap mb-6 font-medium">{chisme.contenido}</p>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-white">
                      <strong className="text-pink-300">Publicado por:</strong>{' '}
                      <span className="text-white font-semibold">{chisme.profiles?.username || 'Usuario'}</span>
                      {' '}({chisme.profiles?.email || 'N/A'})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {chismes.length === 0 && (
          <div className="text-center py-20 glass-dark rounded-3xl backdrop-blur-xl border border-white/10">
            <div className="text-6xl mb-6">📭</div>
            <p className="text-white text-xl font-semibold">No hay chismes para moderar</p>
          </div>
        )}
      </div>
    </div>
  )
}
