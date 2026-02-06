import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GameDetailsPage } from "@/components/game-details-page"
import type { Game, Participant } from "@/lib/types"

export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: game, error } = await supabase
    .from("games")
    .select("*, participants(*)")
    .eq("id", id)
    .single()

  if (error || !game) {
    notFound()
  }

  // Get current user and profile if logged in
  const { data: { user } } = await supabase.auth.getUser()

  let currentUser: { id: string; display_name: string | null; avatar_url: string | null } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .single()
    if (profile) {
      currentUser = profile
    }
  }

  // Fetch profiles for participants that have a user_id
  const participants = (game.participants || []) as Participant[]
  const userIds = participants.map((p) => p.user_id).filter(Boolean) as string[]
  let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null; overall: number; position: string }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, overall, position")
      .in("id", userIds)
    if (profiles) {
      profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    }
  }

  const gameWithParticipants = {
    ...game,
    participants,
  } as Game & { participants: Participant[] }

  return <GameDetailsPage initialGame={gameWithParticipants} currentUser={currentUser} participantProfiles={profilesMap} />
}
