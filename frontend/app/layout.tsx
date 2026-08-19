import type { Metadata } from 'next'
import { Inter, Playfair_Display, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Pusaka — Simpan dengan Tenang, Jaga dengan Bangga',
    template: '%s | Pusaka',
  },
  description: 'Pusaka adalah brankas digital berenkripsi tingkat tinggi untuk menyimpan kata sandi, catatan, dan dokumen penting Anda. Dibuat dengan bangga di Indonesia.',
  applicationName: 'Pusaka',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  keywords: ['password manager', 'digital vault', 'Indonesia', 'Pusaka', 'brankas digital', 'keamanan data'],
  openGraph: {
    siteName: 'Pusaka',
    title: 'Pusaka — Simpan dengan Tenang, Jaga dengan Bangga',
    description: 'Brankas digital berenkripsi untuk kata sandi, catatan, dan dokumen penting keluarga Anda.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
