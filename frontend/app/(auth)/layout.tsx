export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden flex-col justify-between p-10 text-white lg:flex" style={{ background: '#2C1E1A' }}>
        <div>
          <span className="font-serif text-2xl font-bold tracking-wide" style={{ color: '#D4AF37', fontFamily: 'Georgia, serif' }}>
            PUSAKA
          </span>
        </div>
        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed" style={{ color: '#F9F7F2CC' }}>
            "Simpan dengan Tenang. Jaga dengan Bangga."
          </p>
          <footer className="text-sm" style={{ color: '#D4AF3799' }}>
            — Store with Peace. Guard with Pride.
          </footer>
        </blockquote>
        <p className="text-xs" style={{ color: '#D4AF3766' }}>
          Brankas Digital Keluarga Indonesia
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
