import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

// Plus Jakarta Sans was drawn by Tokotype for the city of Jakarta — a
// typeface with Indonesian roots for an Indonesian vault. JetBrains Mono
// is reserved for secrets, keys and code, where every glyph must be
// unambiguous (l/1, O/0).
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
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
  icons: { icon: '/icon.svg' },
  openGraph: {
    siteName: 'Pusaka',
    title: 'Pusaka — Simpan dengan Tenang, Jaga dengan Bangga',
    description: 'Brankas digital berenkripsi untuk kata sandi, catatan, dan dokumen penting keluarga Anda.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F5FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1022' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${jetbrains.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
