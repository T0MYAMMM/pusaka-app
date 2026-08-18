'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  value: string
  label?: string
  clearAfter?: number // ms, default 30000
}

export function CopyButton({ value, label = 'Value', clearAfter = 30_000 }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success(`${label} copied — clipboard clears in ${clearAfter / 1000}s`)

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
    <Button variant="ghost" size="icon" onClick={handleCopy} title={`Copy ${label}`}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
