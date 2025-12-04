'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface ValoracionChismeProps {
  chismeId: string
  user: User | null
}

interface Valoraciones {
  me_gusta: number
  mierdachisme: number
  userValoracion: 'me_gusta' | 'mierdachisme' | null
}

export function ValoracionChisme({ chismeId, user }: ValoracionChismeProps) {
  const [valoraciones, setValoraciones] = useState<Valoraciones>({
    me_gusta: 0,
    mierdachisme: 0,
    userValoracion: null,
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadValoraciones()
  }, [chismeId, user])

  const loadValoraciones = async () => {
    // Cargar todas las valoraciones del chisme
    const { data: allValoraciones } = await supabase
      .from('valoraciones')
      .select('tipo, user_id')
      .eq('chisme_id', chismeId)

    if (allValoraciones) {
      const meGusta = allValoraciones.filter(v => v.tipo === 'me_gusta').length
      const mierdachisme = allValoraciones.filter(v => v.tipo === 'mierdachisme').length
      const userVal = user 
        ? (allValoraciones.find(v => v.user_id === user.id)?.tipo as 'me_gusta' | 'mierdachisme' | null) || null
        : null

      setValoraciones({
        me_gusta: meGusta,
        mierdachisme: mierdachisme,
        userValoracion: userVal,
      })
    }
  }

  const handleValoracion = async (tipo: 'me_gusta' | 'mierdachisme') => {
    if (!user) {
      return
    }

    setLoading(true)

    // Si ya tiene la misma valoración, eliminarla
    if (valoraciones.userValoracion === tipo) {
      const { error } = await supabase
        .from('valoraciones')
        .delete()
        .eq('chisme_id', chismeId)
        .eq('user_id', user.id)

      if (!error) {
        await loadValoraciones()
      }
    } else {
      // Si tiene otra valoración, actualizarla
      if (valoraciones.userValoracion) {
        const { error } = await supabase
          .from('valoraciones')
          .update({ tipo })
          .eq('chisme_id', chismeId)
          .eq('user_id', user.id)

        if (!error) {
          await loadValoraciones()
        }
      } else {
        // Crear nueva valoración
        const { error } = await supabase
          .from('valoraciones')
          .insert({
            chisme_id: chismeId,
            user_id: user.id,
            tipo,
          })

        if (!error) {
          await loadValoraciones()
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleValoracion('me_gusta')}
        disabled={loading || !user}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
          valoraciones.userValoracion === 'me_gusta'
            ? 'bg-green-500/30 border-2 border-green-500 text-green-300'
            : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
        } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        <span className="text-xl">👍</span>
        <span>{valoraciones.me_gusta}</span>
      </button>

      <button
        onClick={() => handleValoracion('mierdachisme')}
        disabled={loading || !user}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
          valoraciones.userValoracion === 'mierdachisme'
            ? 'bg-red-500/30 border-2 border-red-500 text-red-300'
            : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
        } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        <span className="text-xl">💩</span>
        <span>{valoraciones.mierdachisme}</span>
      </button>
    </div>
  )
}

