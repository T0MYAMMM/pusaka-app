'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CredentialForm, type CredentialFormValues } from '@/components/features/credential-form'
import { PageContainer, PageHeader } from '@/components/shared/page'
import { credentialsApi } from '@/lib/api'
import { useT } from '@/lib/i18n'

export default function NewCredentialPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useT()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: CredentialFormValues) => credentialsApi.create(data),
    onSuccess: (cred) => {
      qc.invalidateQueries({ queryKey: ['credentials'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`“${cred.label}” saved to your vault`)
      router.push(`/credentials/${cred.id}`)
    },
    onError: (e) => {
      if (e instanceof Error && e.message.toLowerCase().includes('limit')) {
        router.push('/credentials?upgrade=1')
      } else {
        toast.error(e instanceof Error ? e.message : 'Could not save. Check the fields and try again.')
      }
    },
  })

  return (
    <PageContainer size="narrow">
      <PageHeader
        back={{ href: '/credentials', label: t.nav.credentials }}
        title={t.nav.newCredential}
        description="Everything below is encrypted with your personal vault key before it is stored."
      />
      <CredentialForm
        submitLabel="Save credential"
        cancelHref="/credentials"
        isSubmitting={isPending}
        onSubmit={async (d) => { await mutateAsync(d) }}
      />
    </PageContainer>
  )
}
