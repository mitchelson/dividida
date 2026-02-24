import { PlacarView } from '@/components/placar-view'

export default function PlacarPage({ params }: { params: { id: string } }) {
  return <PlacarView matchId={params.id} />
}
