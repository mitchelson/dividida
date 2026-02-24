'use client'

import { PlacarView } from '@/components/placar-view'
import { useSearchParams } from 'next/navigation'

export default function PlacarPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const matchId = searchParams?.get('matchId')

  if (!matchId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Partida não encontrada</p>
      </div>
    )
  }

  return <PlacarView matchId={matchId} />
}
