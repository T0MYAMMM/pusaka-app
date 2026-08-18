import { redirect } from 'next/navigation'

export default function APIKeysRedirectPage() {
  redirect('/settings/security')
}
