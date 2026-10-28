'use client'

import { useRef, useState } from 'react'
import { File as FileGeneric, FileImage, FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemTile } from '@/components/shared/item-tile'
import { cn, formatBytes } from '@/lib/utils'

function iconFor(file: File) {
  if (file.type.startsWith('image/')) return FileImage
  if (file.type === 'application/pdf' || file.type.startsWith('text/')) return FileText
  return FileGeneric
}

/**
 * File picker that is also a drop target. The real <input type="file"> stays
 * in the tab order (visually hidden), and the visible zone is its <label>, so
 * keyboard and screen-reader users get the native picker.
 */
export function DocumentDropZone({
  file,
  onFile,
  onClear,
  error,
  hint,
}: {
  file: File | null
  onFile: (file: File) => void
  onClear: () => void
  error?: string
  hint: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const describedBy = error ? 'file-error' : 'file-hint'

  const clear = () => {
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <div
      className="space-y-2"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
    >
      <input
        ref={inputRef}
        id="file"
        type="file"
        className="peer sr-only"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />

      {file ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border bg-card p-3 pr-2 transition-colors sm:gap-4 sm:p-4 sm:pr-3',
            dragOver && 'border-primary bg-accent',
            error && 'border-destructive',
          )}
        >
          <ItemTile icon={iconFor(file)} tone="indigo" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-medium" translate="no" title={file.name}>{file.name}</p>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground tabular">{formatBytes(file.size)}</p>
          </div>
          <label
            htmlFor="file"
            className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-primary transition-colors hover:bg-accent peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40"
          >
            Replace
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={clear}
            aria-label={`Remove ${file.name}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="file"
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors hover:border-primary/60 sm:py-12',
            'peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40',
            dragOver && 'border-primary bg-accent',
            error && !dragOver && 'border-destructive/60',
          )}
        >
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-semibold">
              {dragOver ? 'Drop to add this file' : <>Drop a file here, or <span className="text-primary">choose one</span></>}
            </span>
            <span className="block text-xs text-muted-foreground">PDF, photo or scan</span>
          </span>
        </label>
      )}

      {error ? (
        <p id="file-error" role="alert" className="text-xs font-medium text-destructive">{error}</p>
      ) : (
        <p id="file-hint" className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
