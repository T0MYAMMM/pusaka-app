export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div>
          <span className="font-serif text-2xl font-bold tracking-wide text-sidebar-primary">
            Pusaka
          </span>
        </div>
        <blockquote className="space-y-2">
          <p className="text-lg leading-relaxed text-sidebar-foreground">
            &ldquo;Simpan dengan Tenang. Jaga dengan Bangga.&rdquo;
          </p>
          <footer className="text-sm text-sidebar-foreground/75">
            — Store with Peace. Guard with Pride.
          </footer>
        </blockquote>
        <p className="text-xs text-sidebar-foreground/75">
          Brankas Digital Keluarga Indonesia
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
