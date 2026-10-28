'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'

export function Pagination({
  page,
  pages,
  onPageChange,
}: {
  page: number
  pages: number
  onPageChange: (page: number) => void
}) {
  const { t } = useT()
  if (pages <= 1) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground tabular">
        {t.common.page} {page} / {pages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft aria-hidden="true" />
          {t.common.previous}
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          {t.common.next}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
