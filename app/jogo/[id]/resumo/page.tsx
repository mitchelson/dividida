import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GameSummaryPage } from "@/components/game-summary-page"
import type { Participant, Match, Goal } from "@/lib/types"

export default async function ResumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: game } = await supabase
    .from("games")
    .select("*, participants(*)")
    .eq("id", id)
    .single()

  if (!game) notFound()

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("game_id", id)
    .order("match_order", { ascending: true })

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("game_id", id)
    .order("created_at", { ascending: true })

  const participants = (game.participants || []) as Participant[]
  const approvedParticipants = participants.filter((p) => p.status === "approved")

  return (
    <GameSummaryPage
      game={game}
      participants={approvedParticipants}
      matches={(matches || []) as Match[]}
      goals={(goals || []) as Goal[]}
    />
  )
}
