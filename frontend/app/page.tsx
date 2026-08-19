import type { Metadata } from 'next'
import { LandingPage } from '@/components/marketing/landing-page'

export const metadata: Metadata = {
  title: 'Pusaka — Simpan dengan Tenang, Jaga dengan Bangga',
  description:
    'Brankas digital keluarga Indonesia. Simpan sandi, catatan aman, dan dokumen penting dengan enkripsi end-to-end.',
  openGraph: {
    title: 'Pusaka — Brankas Digital Keluarga Indonesia',
    description: 'Store passwords, secure notes, and important documents with end-to-end encryption. Built for Indonesian families.',
    type: 'website',
  },
}

export default function RootPage() {
  return <LandingPage />
}
