import { ChismesFeed } from '@/components/ChismesFeed'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-12">
      <div className="text-center mb-12 animate-slide-down">
        <div className="inline-block mb-6 animate-float">
          <span className="text-8xl md:text-9xl">🎙️</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-6 leading-tight">
          <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] [text-shadow:_0_0_20px_rgba(236,72,153,0.8),_0_0_30px_rgba(168,85,247,0.6),_0_2px_4px_rgba(0,0,0,0.8)]">
            LA CABINA
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-pink-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] drop-shadow-[0_0_15px_rgba(168,85,247,0.9)] [text-shadow:_0_0_20px_rgba(168,85,247,0.8),_0_0_30px_rgba(236,72,153,0.6),_0_2px_4px_rgba(0,0,0,0.8)]">
            DEL CHISME
          </span>
        </h1>
        <p className="text-lg md:text-xl text-white max-w-3xl mx-auto leading-relaxed font-bold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.8),_0_0_10px_rgba(255,255,255,0.2)]">
          El lugar donde los chismes más <span className="text-pink-300 font-black [text-shadow:_0_0_10px_rgba(236,72,153,0.8),_0_2px_4px_rgba(0,0,0,0.8)]">jugosos</span> encuentran su voz.
          <br />
          Comparte, descubre y disfruta de los mejores chismes de forma <span className="text-purple-300 font-black [text-shadow:_0_0_10px_rgba(168,85,247,0.8),_0_2px_4px_rgba(0,0,0,0.8)]">anónima</span>.
        </p>
        <div className="mt-8 flex justify-center gap-4 mb-8">
          <div className="h-1 w-20 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-full animate-pulse"></div>
          <div className="h-1 w-20 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full animate-pulse delay-75"></div>
          <div className="h-1 w-20 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-full animate-pulse delay-150"></div>
        </div>
        
        {user && (
          <div className="mb-8">
            <Link
              href="/publicar"
              className="inline-block px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xl hover:shadow-neon-pink transition-all duration-300 hover:scale-110 animate-gradient bg-[length:200%_auto] relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-2xl group-hover:animate-shake">🎤</span>
                Compartir mi chisme
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        )}
      </div>

      <ChismesFeed user={user} />
    </div>
  )
}

