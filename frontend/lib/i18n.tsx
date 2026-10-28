'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocalPreference } from '@/lib/local-store'

export type Lang = 'en' | 'id'

const translations = {
  en: {
    nav: {
      groupVault: 'Vault',
      groupShared: 'Shared',
      search: 'Search',
      newCredential: 'New credential',
      newNote: 'New secure note',
      newDocument: 'Upload document',
      dashboard: 'Dashboard',
      credentials: 'Credentials',
      notes: 'Secure notes',
      documents: 'Documents',
      activity: 'Activity log',
      vaults: 'Shared vaults',
      organizations: 'Organizations',
      settings: 'Settings',
    },
    common: {
      page: 'Page',
      new: 'New',
      copy: 'Copy',
      show: 'Show',
      hide: 'Hide',
      back: 'Back',
      all: 'All',
      signOut: 'Sign out',
      add: 'Add',
      save: 'Save changes',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      loading: 'Loading…',
      viewAll: 'View all',
      previous: 'Previous',
      next: 'Next',
      total: 'total',
      favorites: 'Favorites',
    },
    dashboard: {
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      health: 'Vault health',
      healthGood: 'Nothing needs your attention. Everything is well kept.',
      healthNeedsAttention: 'A few items need your attention.',
      expiringSoon: 'Expired or expiring soon',
      reusedPasswords: 'Reused passwords',
      reusedHint: 'used in more than one place',
      review: 'Review',
      favorites: 'Favorites',
      itemsKept: 'items kept safe',
      title: 'Dashboard',
      subtitle: 'Everything you keep, in one place.',
      totalCredentials: 'Total credentials',
      secureNotes: 'Secure notes',
      totalDocuments: 'Documents',
      recentCredentials: 'Recent credentials',
      recentNotes: 'Recent notes',
      recentActivity: 'Recent activity',
      noCredentials: 'No credentials yet.',
      noNotes: 'No notes yet.',
      noActivity: 'No activity yet.',
      credentialsByType: 'Credentials by category',
    },
    credentials: {
      title: 'Credentials',
      searchPlaceholder: 'Search credentials…',
      addFirst: 'Add your first credential',
      noFound: 'No credentials found.',
      allTypes: 'All types',
      allEnvs: 'All envs',
    },
    notes: {
      title: 'Secure notes',
      searchPlaceholder: 'Search notes…',
      addFirst: 'Add your first note',
      noFound: 'No notes found.',
    },
    documents: {
      title: 'Documents',
      searchPlaceholder: 'Search documents…',
      addFirst: 'Upload your first document',
      noFound: 'No documents found.',
      upload: 'Upload document',
      allTypes: 'All types',
      download: 'Download',
      uploadFile: 'Upload file',
      dragDrop: 'Drag & drop or click to browse',
      maxSize: 'Max 25 MB',
      docType: 'Document type',
      types: {
        identity: 'Identity',
        certificate: 'Certificate',
        financial: 'Financial',
        medical: 'Medical',
        legal: 'Legal',
        insurance: 'Insurance',
        travel: 'Travel',
        other: 'Other',
      },
    },
    settings: {
      title: 'Settings',
      general: 'General',
      account: 'Account',
      security: 'Security',
      privacy: 'Privacy',
      billing: 'Billing',
      organization: 'Organization',
      profileSubtitle: 'Your public profile information',
      displayName: 'Display name',
      accountSubtitle: 'Manage your password and account credentials',
      changePassword: 'Change password',
      securitySubtitle: 'API keys for CLI access and CI/CD',
      privacySubtitle: 'Your data and activity history',
      exportData: 'Export your data',
      exportDesc: 'Download all credentials as CSV (passwords excluded).',
      recentActivity: 'Recent activity',
    },
    shell: {
      searchTrigger: 'Search your vault…',
      commandPlaceholder: 'Search items or jump to a page…',
      goTo: 'Go to',
      create: 'Create',
      items: 'Items',
      preferences: 'Preferences',
      noResults: 'No matches. Try another word.',
      typeToSearch: 'Type two or more characters to search credentials and notes.',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      language: 'Language',
      collapse: 'Collapse sidebar',
      expand: 'Expand sidebar',
      openMenu: 'Open menu',
      unverified: "Your email address isn't verified yet.",
      resend: 'Resend verification email',
      sending: 'Sending…',
      dismiss: 'Dismiss',
    },
    brand: {
      name: 'Pusaka',
      tagline: 'Store with Peace. Guard with Pride.',
      brankas: 'Pusaka Brankas',
      waris: 'Pusaka Waris',
    },
  },
  id: {
    nav: {
      groupVault: 'Brankas',
      groupShared: 'Bersama',
      search: 'Cari',
      newCredential: 'Sandi baru',
      newNote: 'Catatan aman baru',
      newDocument: 'Unggah dokumen',
      dashboard: 'Dasbor',
      credentials: 'Brankas sandi',
      notes: 'Catatan aman',
      documents: 'Dokumen',
      activity: 'Riwayat aktivitas',
      vaults: 'Vault bersama',
      organizations: 'Organisasi',
      settings: 'Pengaturan',
    },
    common: {
      page: 'Halaman',
      new: 'Baru',
      copy: 'Salin',
      show: 'Tampilkan',
      hide: 'Sembunyikan',
      back: 'Kembali',
      all: 'Semua',
      signOut: 'Keluar',
      add: 'Tambah',
      save: 'Simpan perubahan',
      cancel: 'Batal',
      edit: 'Ubah',
      delete: 'Hapus',
      search: 'Cari',
      loading: 'Memuat…',
      viewAll: 'Lihat semua',
      previous: 'Sebelumnya',
      next: 'Berikutnya',
      total: 'total',
      favorites: 'Favorit',
    },
    dashboard: {
      greetingMorning: 'Selamat pagi',
      greetingAfternoon: 'Selamat siang',
      greetingEvening: 'Selamat malam',
      health: 'Kesehatan brankas',
      healthGood: 'Tidak ada yang perlu ditindaklanjuti. Semua tersimpan dengan baik.',
      healthNeedsAttention: 'Beberapa item perlu perhatian Anda.',
      expiringSoon: 'Kedaluwarsa atau segera berakhir',
      reusedPasswords: 'Sandi dipakai ulang',
      reusedHint: 'dipakai di lebih dari satu tempat',
      review: 'Tinjau',
      favorites: 'Favorit',
      itemsKept: 'item tersimpan aman',
      title: 'Dasbor',
      subtitle: 'Semua yang Anda simpan, dalam satu tempat.',
      totalCredentials: 'Total sandi',
      secureNotes: 'Catatan aman',
      totalDocuments: 'Dokumen',
      recentCredentials: 'Sandi terbaru',
      recentNotes: 'Catatan terbaru',
      recentActivity: 'Aktivitas terbaru',
      noCredentials: 'Belum ada sandi tersimpan.',
      noNotes: 'Belum ada catatan.',
      noActivity: 'Belum ada aktivitas.',
      credentialsByType: 'Sandi berdasarkan jenis',
    },
    credentials: {
      title: 'Brankas sandi',
      searchPlaceholder: 'Cari sandi…',
      addFirst: 'Simpan sandi pertama Anda',
      noFound: 'Sandi tidak ditemukan.',
      allTypes: 'Semua jenis',
      allEnvs: 'Semua env',
    },
    notes: {
      title: 'Catatan aman',
      searchPlaceholder: 'Cari catatan…',
      addFirst: 'Buat catatan pertama Anda',
      noFound: 'Catatan tidak ditemukan.',
    },
    documents: {
      title: 'Dokumen penting',
      searchPlaceholder: 'Cari dokumen…',
      addFirst: 'Unggah dokumen pertama Anda',
      noFound: 'Dokumen tidak ditemukan.',
      upload: 'Unggah dokumen',
      allTypes: 'Semua jenis',
      download: 'Unduh',
      uploadFile: 'Unggah berkas',
      dragDrop: 'Seret & lepas atau klik untuk memilih',
      maxSize: 'Maks 25 MB',
      docType: 'Jenis dokumen',
      types: {
        identity: 'Identitas',
        certificate: 'Sertifikat/Ijazah',
        financial: 'Keuangan',
        medical: 'Medis',
        legal: 'Legal/Hukum',
        insurance: 'Asuransi',
        travel: 'Perjalanan',
        other: 'Lainnya',
      },
    },
    settings: {
      title: 'Pengaturan',
      general: 'Umum',
      account: 'Akun',
      security: 'Keamanan',
      privacy: 'Privasi',
      billing: 'Langganan',
      organization: 'Organisasi',
      profileSubtitle: 'Informasi profil publik Anda',
      displayName: 'Nama tampilan',
      accountSubtitle: 'Kelola kata sandi dan kredensial akun Anda',
      changePassword: 'Ubah kata sandi',
      securitySubtitle: 'API key untuk akses CLI dan CI/CD',
      privacySubtitle: 'Data dan riwayat aktivitas Anda',
      exportData: 'Ekspor data Anda',
      exportDesc: 'Unduh semua sandi dalam format CSV (kata sandi tidak disertakan).',
      recentActivity: 'Aktivitas terkini',
    },
    shell: {
      searchTrigger: 'Cari di brankas…',
      commandPlaceholder: 'Cari item atau buka halaman…',
      goTo: 'Buka',
      create: 'Buat',
      items: 'Item',
      preferences: 'Preferensi',
      noResults: 'Tidak ada yang cocok. Coba kata lain.',
      typeToSearch: 'Ketik minimal dua huruf untuk mencari sandi dan catatan.',
      theme: 'Tema',
      light: 'Terang',
      dark: 'Gelap',
      system: 'Sistem',
      language: 'Bahasa',
      collapse: 'Ciutkan sidebar',
      expand: 'Bentangkan sidebar',
      openMenu: 'Buka menu',
      unverified: 'Alamat email Anda belum terverifikasi.',
      resend: 'Kirim ulang email verifikasi',
      sending: 'Mengirim…',
      dismiss: 'Tutup',
    },
    brand: {
      name: 'Pusaka',
      tagline: 'Simpan dengan Tenang. Jaga dengan Bangga.',
      brankas: 'Pusaka Brankas',
      waris: 'Pusaka Waris',
    },
  },
} as const

/**
 * `translations` is `as const`, so every leaf infers as a string literal —
 * making the English dictionary's type ("Dashboard") structurally incompatible
 * with the Indonesian one ("Dasbor"). Widening the leaves to `string` lets both
 * satisfy one shared shape while keeping the key structure checked.
 */
type Widen<T> = T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> }

export type Translations = Widen<typeof translations.en>

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

const isLang = (v: string): v is Lang => v === 'en' || v === 'id'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useLocalPreference<Lang>('pusaka-lang', 'en', isLang)

  // Keep <html lang> in sync for screen readers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useT = () => useContext(I18nContext)
