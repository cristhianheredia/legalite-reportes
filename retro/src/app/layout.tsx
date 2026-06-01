import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legalité Retro',
  description: 'Sistema de retrospectivas operativas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6" data-print-hide>
          <Link href="/" className="font-bold text-gray-900 text-sm tracking-wide">
            LEGALITÉ <span className="text-red-600">RETRO</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Inicio</Link>
            <Link href="/planes" className="hover:text-gray-900 transition-colors">Planes</Link>
            <Link href="/cycle" className="hover:text-gray-900 transition-colors">Ciclo Estándar</Link>
            <Link href="/history" className="hover:text-gray-900 transition-colors">Historial</Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
