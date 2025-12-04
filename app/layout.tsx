import type { Metadata } from 'next'
import { Poppins, Righteous } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
})

const righteous = Righteous({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-righteous',
  display: 'swap',
  preload: true,
  fallback: ['Impact', 'Arial Black', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'La Cabina del Chisme',
  description: 'Comparte tus chismes de forma anónima',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${righteous.variable} font-body`}>
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 bg-pattern -z-10" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.05),transparent_50%)] -z-10" />
        <div className="fixed inset-0 bg-slate-950/40 -z-10" />
        <Navbar />
        <main className="min-h-screen relative">
          {children}
        </main>
      </body>
    </html>
  )
}

