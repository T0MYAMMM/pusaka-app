'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'id'

const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      credentials: 'Credentials',
      notes: 'Secure Notes',
      documents: 'Documents',
      activity: 'Activity Log',
      vaults: 'Shared Vaults',
      organizations: 'Organizations',
      settings: 'Settings',
    },
    common: {
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
      title: 'Dashboard',
      subtitle: 'Your secure vault at a glance',
      totalCredentials: 'Total Credentials',
      secureNotes: 'Secure Notes',
      totalDocuments: 'Documents',
      recentCredentials: 'Recent Credentials',
      recentNotes: 'Recent Notes',
      recentActivity: 'Recent Activity',
      noCredentials: 'No credentials yet.',
      noNotes: 'No notes yet.',
      noActivity: 'No activity yet.',
      credentialsByType: 'Credentials by Type',
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
      title: 'Secure Notes',
      searchPlaceholder: 'Search notes…',
      addFirst: 'Add your first note',
      noFound: 'No notes found.',
    },
    documents: {
      title: 'Documents',
      searchPlaceholder: 'Search documents…',
      addFirst: 'Upload your first document',
      noFound: 'No documents found.',
      upload: 'Upload Document',
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
    brand: {
      tagline: 'Store with Peace. Guard with Pride.',
      brankas: 'PUSAKA Brankas',
      waris: 'PUSAKA Waris',
    },
  },
  id: {
    nav: {
      dashboard: 'Dasbor',
      credentials: 'Brankas Sandi',
      notes: 'Catatan Aman',
      documents: 'Dokumen',
      activity: 'Riwayat Aktivitas',
      vaults: 'Vault Bersama',
      organizations: 'Organisasi',
      settings: 'Pengaturan',
    },
    common: {
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
      title: 'Dasbor',
      subtitle: 'Brankas digital Anda dalam satu tampilan',
      totalCredentials: 'Total Sandi',
      secureNotes: 'Catatan Aman',
      totalDocuments: 'Dokumen',
      recentCredentials: 'Sandi Terbaru',
      recentNotes: 'Catatan Terbaru',
      recentActivity: 'Aktivitas Terbaru',
      noCredentials: 'Belum ada sandi tersimpan.',
      noNotes: 'Belum ada catatan.',
      noActivity: 'Belum ada aktivitas.',
      credentialsByType: 'Sandi Berdasarkan Jenis',
    },
    credentials: {
      title: 'Brankas Sandi',
      searchPlaceholder: 'Cari sandi…',
      addFirst: 'Simpan sandi pertama Anda',
      noFound: 'Sandi tidak ditemukan.',
      allTypes: 'Semua jenis',
      allEnvs: 'Semua env',
    },
    notes: {
      title: 'Catatan Aman',
      searchPlaceholder: 'Cari catatan…',
      addFirst: 'Buat catatan pertama Anda',
      noFound: 'Catatan tidak ditemukan.',
    },
    documents: {
      title: 'Dokumen Penting',
      searchPlaceholder: 'Cari dokumen…',
      addFirst: 'Unggah dokumen pertama Anda',
      noFound: 'Dokumen tidak ditemukan.',
      upload: 'Unggah Dokumen',
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
    brand: {
      tagline: 'Simpan dengan Tenang. Jaga dengan Bangga.',
      brankas: 'PUSAKA Brankas',
      waris: 'PUSAKA Waris',
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem('pusaka-lang') as Lang) ?? 'en'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('pusaka-lang', l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useT = () => useContext(I18nContext)
