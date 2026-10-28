import type { Lang } from '@/lib/i18n'

/**
 * Landing page copy in both languages.
 *
 * English: short, direct, no filler.
 * Bahasa Indonesia: everyday words that read naturally aloud — the way you
 * would explain it to your parents at the dinner table (see BRAND.md, the
 * "Uncle/Aunt test").
 */
const en = {
  skip: 'Skip to content',
  nav: {
    links: [
      { href: '#keep', label: 'What it keeps' },
      { href: '#share', label: 'Sharing' },
      { href: '#developers', label: 'Developers' },
      { href: '#pricing', label: 'Pricing' },
      { href: '#faq', label: 'FAQ' },
    ],
    signIn: 'Sign in',
    start: 'Start free',
    language: 'Language',
  },
  hero: {
    badge: 'The family vault, made in Indonesia',
    title: 'Everything worth keeping. One vault.',
    lead: 'Passwords, private notes and important documents — encrypted, organised, a tap away. For your family and your team.',
    primary: 'Create your vault',
    secondary: 'See what it keeps',
    proof: ['Free up to 100 credentials', 'No card needed', 'English & Bahasa Indonesia'],
  },
  vault: {
    name: 'Brankas keluarga Wulandari',
    meta: '18 items, encrypted',
    username: 'Username',
    password: 'Password',
    show: 'Show',
    hide: 'Hide',
    strong: 'Strong',
    docName: 'KTP — Sari',
    reminderName: 'Stripe live key',
    reminder: 'Expires in 9 days',
  },
  keep: {
    title: 'One vault. Everything that matters.',
    lead: 'A pusaka is an heirloom — kept with care, handed down. Your digital life deserves the same.',
    examplesLabel: 'Examples',
    items: [
      {
        title: 'Passwords and logins',
        body: 'Bank, email, shopping, Wi-Fi. Generate strong passwords, catch reused ones, copy with a clipboard that clears in 30 seconds.',
        examples: ['BCA KlikPay', 'Gmail', 'Tokopedia', 'Home Wi-Fi'],
      },
      {
        title: 'Secure notes',
        body: 'Policy numbers, recovery codes, SSH keys — anything that doesn’t fit a password field.',
        examples: ['Policy numbers', 'Recovery codes', 'SSH keys'],
      },
      {
        title: 'Important documents',
        body: 'KTP, passport, diplomas, insurance policies. Encrypted, searchable, with expiry reminders.',
        examples: ['KTP', 'Passport', 'Ijazah', 'Insurance policy'],
      },
    ],
  },
  share: {
    title: 'Share access. Not passwords in WhatsApp.',
    body: 'Create a shared vault, invite by email, assign a role. Revoke access in one click — nothing ever lands in a chat.',
    vault: 'Family accounts',
    members: '4 members',
    points: [
      'Four roles: owner, admin, member, viewer',
      'Email invites, accepted with one link',
      'Every view, edit and export logged',
    ],
    roles: [
      { name: 'Ibu Sari', role: 'Owner', note: 'Manages the vault and members' },
      { name: 'Pak Budi', role: 'Admin', note: 'Adds and removes items' },
      { name: 'Dimas', role: 'Member', note: 'Uses what’s shared' },
      { name: 'Family accountant', role: 'Viewer', note: 'View only' },
    ],
  },
  developers: {
    eyebrow: 'Built for developers too',
    title: 'Same vault. Your terminal. Your pipeline.',
    features: [
      { title: 'Environment labels', body: 'Tag secrets dev, staging, prod or global. Filter anywhere.' },
      { title: 'Expiry tracking', body: 'Dates on keys and certificates. Warned 14 days out.' },
      { title: 'Scoped API keys', body: 'Read or read-write keys for CI. Hash-only storage. Revoke anytime.' },
      { title: 'Pipe-friendly CLI', body: '`cm get` prints the bare value — drop it straight into scripts.' },
    ],
  },
  how: {
    title: 'Up and running in minutes.',
    step: 'Step',
    steps: [
      { title: 'Create your vault', body: 'Sign up. Pusaka generates your vault key and locks it with your password.' },
      { title: 'Add what matters', body: 'Logins, notes, documents. Tag them, star them, set expiry dates.' },
      { title: 'Share when ready', body: 'Invite family or teammates. Give each one a role.' },
    ],
  },
  security: {
    title: 'How your vault is protected.',
    lead: 'Plain facts. Judge for yourself.',
    items: [
      { term: 'One key per person', detail: 'Each account gets a random vault key, locked with a key derived from your password (PBKDF2-SHA256, 600,000 iterations).' },
      { term: 'Encrypted at rest', detail: 'Passwords, secret keys, notes and documents are encrypted with Fernet (AES) before they reach the database.' },
      { term: 'Sessions out of JavaScript’s reach', detail: 'Sign-in tokens live in httpOnly cookies. Account passwords are hashed with bcrypt.' },
      { term: 'Exports without secrets', detail: 'CSV exports carry labels and usernames — never passwords or secret keys.' },
    ],
  },
  pricing: {
    title: 'Start free. Upgrade when you need to.',
    lead: 'Encryption, CLI and activity log on every plan. Cancel anytime.',
    badge: 'Recommended',
    plans: [
      {
        name: 'Free', price: '$0', period: 'forever', description: 'For one person getting organised.',
        features: ['100 credentials', 'Notes and documents', 'CLI and API keys', '30-day activity log'],
        cta: 'Start free',
      },
      {
        name: 'Pro', price: '$6', period: 'per month', description: 'For when free isn’t enough.',
        features: ['Unlimited credentials', 'Full activity log', 'Reused-password detection', 'Priority support'],
        cta: 'Go Pro', highlight: true,
      },
      {
        name: 'Team', price: '$8', period: 'per user / month', description: 'For households and teams that share.',
        features: ['Everything in Pro', 'Up to 25 people', 'Shared vaults', 'Owner, admin, member and viewer roles'],
        cta: 'Start a team vault',
      },
    ],
  },
  faq: {
    title: 'Questions, answered.',
    items: [
      {
        q: 'Can Pusaka staff read my passwords?',
        a: 'Your items are encrypted with your personal vault key, locked by your password. The server unlocks it while you’re signed in, and keeps a recovery copy encrypted with its own secret so password reset works. So Pusaka is not zero-knowledge — and we don’t claim it is.',
      },
      {
        q: 'What if I forget my password?',
        a: 'Reset it by email. Your vault key is recovered and re-locked with the new password. Nothing is lost.',
      },
      {
        q: 'How do shared vaults work?',
        a: 'Adding an item stores a copy encrypted with that vault’s own key. Members read it according to their role. Remove someone and their access ends.',
      },
      {
        q: 'Can I self-host?',
        a: 'Yes. A FastAPI backend on PostgreSQL, configured with environment variables, and a Next.js front end over a REST API.',
      },
      {
        q: 'How do API keys work for CI/CD?',
        a: 'Create a read or read-write key in Settings → Security, store it as a CI secret, send it as a Bearer token. Only its SHA-256 hash is stored. Revoke instantly.',
      },
      {
        q: 'Are there rate limits?',
        a: 'Sign-in: 10 attempts per minute per IP. Registration: 5 per hour. Other authenticated requests: unthrottled.',
      },
    ],
  },
  cta: {
    title: 'Start keeping what matters.',
    lead: 'Free up to 100 credentials. Notes and documents included. No card.',
    button: 'Create your vault',
    waitlistTitle: 'Get feature updates',
    emailLabel: 'Email address',
    placeholder: 'you@example.com',
    notify: 'Notify me',
    joining: 'Joining…',
    joined: 'You’re on the list. We’ll write when there’s news.',
    errorFallback: 'Couldn’t join the list. Check the address and try again.',
  },
  footer: {
    tagline: 'Pusaka — made with pride in Indonesia.',
    links: { create: 'Create account', signIn: 'Sign in', pricing: 'Pricing', faq: 'FAQ' },
  },
}

export type LandingCopy = typeof en

const id: LandingCopy = {
  skip: 'Langsung ke isi',
  nav: {
    links: [
      { href: '#keep', label: 'Isi brankas' },
      { href: '#share', label: 'Berbagi' },
      { href: '#developers', label: 'Untuk developer' },
      { href: '#pricing', label: 'Harga' },
      { href: '#faq', label: 'Tanya jawab' },
    ],
    signIn: 'Masuk',
    start: 'Daftar gratis',
    language: 'Bahasa',
  },
  hero: {
    badge: 'Brankas digital keluarga Indonesia',
    title: 'Simpan dengan tenang. Jaga dengan bangga.',
    lead: 'Kata sandi, catatan penting, dan dokumen keluarga — semuanya aman di satu tempat. Gampang dicari, gampang dibagi ke keluarga.',
    primary: 'Buat brankas gratis',
    secondary: 'Lihat isinya',
    proof: ['Gratis sampai 100 kata sandi', 'Tanpa kartu kredit', 'Bisa Bahasa Indonesia & Inggris'],
  },
  vault: {
    name: 'Brankas keluarga Wulandari',
    meta: '18 item tersimpan aman',
    username: 'Nama pengguna',
    password: 'Kata sandi',
    show: 'Lihat',
    hide: 'Tutup',
    strong: 'Kuat',
    docName: 'KTP — Sari',
    reminderName: 'Kunci Stripe',
    reminder: 'Habis 9 hari lagi',
  },
  keep: {
    title: 'Satu brankas untuk semua yang penting.',
    lead: 'Pusaka itu warisan — dijaga baik-baik, lalu diturunkan. Data keluarga Anda juga layak dijaga seperti itu.',
    examplesLabel: 'Contoh',
    items: [
      {
        title: 'Kata sandi dan akun',
        body: 'Akun bank, email, belanja online, sampai Wi-Fi rumah. Pusaka bisa buatkan kata sandi yang kuat, kasih tahu kalau ada yang dipakai berulang, dan menghapus salinan dari clipboard setelah 30 detik.',
        examples: ['BCA KlikPay', 'Gmail', 'Tokopedia', 'Wi-Fi rumah'],
      },
      {
        title: 'Catatan rahasia',
        body: 'Nomor polis, kode pemulihan akun, sampai resep rendang Nenek — hal penting yang tidak muat di kolom kata sandi.',
        examples: ['Nomor polis', 'Kode pemulihan', 'Resep keluarga'],
      },
      {
        title: 'Dokumen penting',
        body: 'Simpan foto KTP, paspor, ijazah, dan polis asuransi. Aman, mudah dicari, dan Anda diingatkan sebelum masa berlakunya habis.',
        examples: ['KTP', 'Paspor', 'Ijazah', 'Polis asuransi'],
      },
    ],
  },
  share: {
    title: 'Bagikan akses, bukan kirim sandi lewat WhatsApp.',
    body: 'Buat brankas bersama, undang keluarga lewat email, lalu atur siapa boleh apa. Kalau sudah tidak perlu, cabut saja aksesnya — tidak ada sandi yang tercecer di chat.',
    vault: 'Rekening keluarga',
    members: '4 anggota',
    points: [
      'Empat peran: pemilik, admin, anggota, dan pembaca',
      'Undangan lewat email, cukup klik satu tautan',
      'Semua tercatat: siapa yang melihat, mengubah, atau mengunduh',
    ],
    roles: [
      { name: 'Ibu Sari', role: 'Pemilik', note: 'Mengatur brankas dan anggotanya' },
      { name: 'Pak Budi', role: 'Admin', note: 'Menambah dan menghapus isi' },
      { name: 'Dimas', role: 'Anggota', note: 'Memakai yang dibagikan' },
      { name: 'Akuntan keluarga', role: 'Pembaca', note: 'Hanya bisa melihat' },
    ],
  },
  developers: {
    eyebrow: 'Juga untuk developer',
    title: 'Brankas yang sama, langsung dari terminal dan pipeline Anda.',
    features: [
      { title: 'Label lingkungan', body: 'Tandai rahasia untuk dev, staging, prod, atau global, lalu saring sesuai kebutuhan.' },
      { title: 'Pengingat kedaluwarsa', body: 'Pasang tanggal di API key dan sertifikat. Pusaka mengingatkan 14 hari sebelumnya.' },
      { title: 'API key dengan batas akses', body: 'Kunci baca saja atau baca-tulis untuk CI. Yang disimpan hanya hash-nya, dan bisa dicabut kapan saja.' },
      { title: 'CLI yang praktis', body: '`cm get` hanya mengeluarkan nilainya, jadi bisa langsung dipakai di script.' },
    ],
  },
  how: {
    title: 'Siap dipakai dalam hitungan menit.',
    step: 'Langkah',
    steps: [
      { title: 'Buat brankas', body: 'Daftar dengan kata sandi yang kuat. Pusaka membuatkan kunci brankas khusus untuk Anda, lalu menguncinya dengan kata sandi itu.' },
      { title: 'Simpan yang penting', body: 'Masukkan akun, catatan, dan dokumen. Beri label, tandai favorit, dan atur tanggal kedaluwarsa.' },
      { title: 'Bagikan kalau sudah siap', body: 'Undang keluarga atau rekan kerja ke brankas bersama, lalu atur perannya masing-masing.' },
    ],
  },
  security: {
    title: 'Begini cara Pusaka menjaga brankas Anda.',
    lead: 'Kami jelaskan apa adanya, supaya Anda bisa menilai sendiri.',
    items: [
      { term: 'Satu kunci untuk tiap orang', detail: 'Setiap akun punya kunci brankas sendiri yang dibuat acak. Kunci itu dikunci lagi dengan kata sandi Anda (PBKDF2-SHA256, 600.000 putaran).' },
      { term: 'Diacak sebelum disimpan', detail: 'Kata sandi, kunci rahasia, catatan, dan dokumen dienkripsi dulu (Fernet/AES) sebelum masuk ke database.' },
      { term: 'Sesi login lebih aman', detail: 'Token login disimpan di cookie httpOnly yang tidak bisa dibaca script, dan kata sandi akun disimpan dalam bentuk hash bcrypt.' },
      { term: 'Ekspor tanpa rahasia', detail: 'File CSV hasil ekspor hanya berisi nama dan username — tidak pernah kata sandi atau kunci rahasia.' },
    ],
  },
  pricing: {
    title: 'Mulai gratis. Upgrade kalau perlu.',
    lead: 'Semua paket sudah termasuk enkripsi, CLI, dan riwayat aktivitas. Bisa berhenti kapan saja.',
    badge: 'Disarankan',
    plans: [
      {
        name: 'Gratis', price: '$0', period: 'selamanya', description: 'Untuk Anda yang mau mulai rapi.',
        features: ['100 kata sandi', 'Catatan dan dokumen', 'CLI dan API key', 'Riwayat aktivitas 30 hari'],
        cta: 'Mulai gratis',
      },
      {
        name: 'Pro', price: '$6', period: 'per bulan', description: 'Kalau paket gratis sudah tidak cukup.',
        features: ['Kata sandi tanpa batas', 'Riwayat aktivitas lengkap', 'Cek sandi yang dipakai ulang', 'Bantuan prioritas'],
        cta: 'Pilih Pro', highlight: true,
      },
      {
        name: 'Tim', price: '$8', period: 'per orang / bulan', description: 'Untuk keluarga dan tim yang saling berbagi.',
        features: ['Semua fitur Pro', 'Sampai 25 orang', 'Brankas bersama', 'Peran pemilik, admin, anggota, dan pembaca'],
        cta: 'Buat brankas tim',
      },
    ],
  },
  faq: {
    title: 'Yang sering ditanyakan.',
    items: [
      {
        q: 'Apakah petugas Pusaka bisa melihat kata sandi saya?',
        a: 'Isi brankas Anda dienkripsi dengan kunci pribadi yang dikunci oleh kata sandi Anda. Selama Anda masuk, server membuka kunci itu supaya isinya bisa ditampilkan. Supaya fitur lupa kata sandi tetap bisa dipakai, server juga menyimpan cadangan kunci yang dikunci dengan rahasia server. Jadi, terus terang saja, Pusaka bukan sistem zero-knowledge.',
      },
      {
        q: 'Kalau saya lupa kata sandi, bagaimana?',
        a: 'Atur ulang lewat email. Kunci brankas dipulihkan lalu dikunci lagi dengan kata sandi baru, jadi isi brankas Anda tidak hilang.',
      },
      {
        q: 'Brankas bersama itu cara kerjanya bagaimana?',
        a: 'Saat Anda menambahkan isi ke brankas bersama, Pusaka menyimpan salinannya dengan kunci khusus brankas itu. Anggota bisa membukanya sesuai peran masing-masing. Kalau seseorang dikeluarkan, aksesnya langsung berhenti.',
      },
      {
        q: 'Bisa dipasang di server sendiri?',
        a: 'Bisa. Backend-nya aplikasi FastAPI dengan database PostgreSQL yang diatur lewat environment variable, dan tampilannya aplikasi Next.js yang terhubung lewat REST API.',
      },
      {
        q: 'Bagaimana memakai API key untuk CI/CD?',
        a: 'Buat kunci baca saja atau baca-tulis di Pengaturan → Keamanan, simpan sebagai secret di CI, lalu kirim sebagai Bearer token. Yang disimpan hanya hash SHA-256-nya, dan kunci bisa dicabut kapan saja.',
      },
      {
        q: 'Apakah ada batas percobaan login?',
        a: 'Ada. Login dibatasi 10 kali per menit untuk tiap IP, dan pendaftaran 5 kali per jam. Permintaan lain setelah login tidak dibatasi.',
      },
    ],
  },
  cta: {
    title: 'Yuk, mulai jaga yang berharga.',
    lead: 'Gratis sampai 100 kata sandi, sudah termasuk catatan dan dokumen. Tidak perlu kartu kredit.',
    button: 'Buat brankas gratis',
    waitlistTitle: 'Dapat kabar fitur baru',
    emailLabel: 'Alamat email',
    placeholder: 'nama@email.com',
    notify: 'Kabari saya',
    joining: 'Mendaftar…',
    joined: 'Sip, Anda sudah terdaftar. Kami kabari kalau ada yang baru.',
    errorFallback: 'Belum berhasil mendaftar. Cek lagi alamat emailnya, lalu coba sekali lagi.',
  },
  footer: {
    tagline: 'Pusaka — dibuat dengan bangga di Indonesia.',
    links: { create: 'Buat akun', signIn: 'Masuk', pricing: 'Harga', faq: 'Tanya jawab' },
  },
}

export const LANDING_COPY: Record<Lang, LandingCopy> = { en, id }
