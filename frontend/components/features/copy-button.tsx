'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  label?: string
  clearAfter?: number // ms, default 30000
  className?: string
  size?: 'icon' | 'icon-sm'
}

export function CopyButton({ value, label = 'Value', clearAfter = 30_000, className, size = 'icon-sm' }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      toast.error('Copying is blocked by your browser. Select the text and copy it manually.')
      return
    }
    setCopied(true)
    toast.success(`${label} copied`, { description: `Clipboard clears in ${clearAfter / 1000}s.` })

    // Auto-clear clipboard after timeout
    setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText()
        if (current === value) await navigator.clipboard.writeText('')
      } catch { /* clipboard read may be denied */ }
    }, clearAfter)

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      aria-label={`Copy ${label.toLowerCase()}`}
      title={`Copy ${label.toLowerCase()}`}
      className={cn('text-muted-foreground hover:text-foreground', className)}
    >
      {copied ? <Check className="text-success" aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </Button>
  )
}
