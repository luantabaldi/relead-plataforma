import { Suspense } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import LeadsClient from './LeadsClient'

export default function LeadsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LeadsClient />
    </Suspense>
  )
}
