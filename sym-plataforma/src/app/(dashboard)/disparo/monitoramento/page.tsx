import { Suspense } from 'react'
import MonitoramentoClient from './MonitoramentoClient'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function MonitoramentoPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MonitoramentoClient />
    </Suspense>
  )
}
