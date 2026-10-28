'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Panel } from '@/components/shared/page'
import { Field, fieldAria } from '@/components/shared/form'
import { DOCUMENT_TYPES, documentMeta } from '@/lib/item-meta'
import type { Translations } from '@/lib/i18n'
import { useT } from '@/lib/i18n'

/** Localised label for a document type, falling back to the meta label. */
export function documentTypeLabel(t: Translations, type: string): string {
  return t.documents.types[type as keyof Translations['documents']['types']] ?? documentMeta(type).label
}

export interface DocumentDetailsValues {
  title: string
  document_type: string
  description: string
  tags: string
  /** yyyy-mm-dd from the date input, or '' */
  expires_at: string
}

export function documentDetailsFrom(doc?: {
  title: string
  document_type: string
  description: string | null
  tags: string | null
  expires_at: string | null
}): DocumentDetailsValues {
  return {
    title: doc?.title ?? '',
    document_type: doc?.document_type ?? 'other',
    description: doc?.description ?? '',
    tags: doc?.tags ?? '',
    expires_at: doc?.expires_at ? doc.expires_at.slice(0, 10) : '',
  }
}

/** Title, type, description, tags and expiry — shared by upload and edit. */
export function DocumentDetailsPanel({
  values,
  onChange,
  titleError,
}: {
  values: DocumentDetailsValues
  onChange: (patch: Partial<DocumentDetailsValues>) => void
  titleError?: string
}) {
  const { t } = useT()
  return (
    <Panel title="Details" description="A clear title and type help you find it later.">
      <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
        <Field id="title" label="Title" required error={titleError}>
          <Input
            {...fieldAria('title', titleError)}
            autoComplete="off"
            placeholder="e.g. Paspor Sari…"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field id="document_type" label={t.documents.docType}>
          <Select value={values.document_type} onValueChange={(v) => onChange({ document_type: v })}>
            <SelectTrigger id="document_type" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_TYPES).map(([value, { icon: Icon }]) => (
                <SelectItem key={value} value={value}>
                  <Icon aria-hidden="true" />
                  {documentTypeLabel(t, value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="description" label="Description" className="sm:col-span-2">
          <Textarea
            id="description"
            rows={3}
            placeholder="Document number, where the original is kept, who to contact…"
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
        <Field id="tags" label="Tags" hint="Separate with commas.">
          <Input
            id="tags"
            autoComplete="off"
            placeholder="family, travel…"
            aria-describedby="tags-hint"
            value={values.tags}
            onChange={(e) => onChange({ tags: e.target.value })}
          />
        </Field>
        <Field id="expires_at" label="Expires on" hint="Leave empty if it never expires.">
          <Input
            id="expires_at"
            type="date"
            aria-describedby="expires_at-hint"
            value={values.expires_at}
            onChange={(e) => onChange({ expires_at: e.target.value })}
          />
        </Field>
      </div>
    </Panel>
  )
}
