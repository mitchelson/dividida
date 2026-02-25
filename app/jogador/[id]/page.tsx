import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { JogadorPageClient } from "@/components/jogador-page"

export default async function JogadorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (!profile) {
    notFound()
  }

  // Get current user for checking if this is their own profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === id

  // Get all participant entries for this user
  const { data: userParticipants } = await supabase
    .from("participants")
    .select("id, game_id, name, team_index")
    .eq("user_id", id)
    .eq("status", "approved")

  console.log("[v0] User participants:", userParticipants)
  const participantIds = userParticipants?.map((p) => p.id) || []

  // Count goals from goals table
  const { count: totalGoals } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .in("participant_id", participantIds.length > 0 ? participantIds : ["none"])

  // Get recent goals with match info
  const { data: recentGoals } = await supabase
    .from("goals")
    .select("id, match_id, minute, created_at, game_id")
    .in("participant_id", participantIds.length > 0 ? participantIds : ["none"])
    .order("created_at", { ascending: false })
    .limit(10)

  // Get game names for recent activity
  const gameIds = [...new Set([...(userParticipants?.map((p) => p.game_id) || []), ...(recentGoals?.map((g) => g.game_id) || [])])]
  const { data: games } = await supabase
    .from("games")
    .select("id, name, game_date")
    .in("id", gameIds.length > 0 ? gameIds : ["none"])
    .order("game_date", { ascending: false })

  // Count matches played (finished matches where user's team participated)
  let matchesPlayed = 0
  if (userParticipants && userParticipants.length > 0) {
    for (const p of userParticipants) {
      if (p.team_index == null) continue
      const teamName = `Time ${p.team_index + 1}`
      console.log("[v0] Searching for matches - Game:", p.game_id, "Team:", teamName)
      
      // Search for matches where this team name appears in either team_a_name or team_b_name
      const { count: countA } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("game_id", p.game_id)
        .eq("status", "finished")
        .eq("team_a_name", teamName)
      
      const { count: countB } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("game_id", p.game_id)
        .eq("status", "finished")
        .eq("team_b_name", teamName)
      
      const gameMatches = (countA || 0) + (countB || 0)
      console.log("[v0] Found team_a:", countA, "team_b:", countB, "total:", gameMatches)
      matchesPlayed += gameMatches
    }
  }
  console.log("[v0] Total matchesPlayed:", matchesPlayed)

  const enrichedProfile = {
    ...profile,
    goals: totalGoals ?? profile.goals,
    games_played: matchesPlayed || profile.games_played,
  }

  return (
    <JogadorPageClient
      initialProfile={enrichedProfile}
      userEmail={user?.email || ""}
      matchesPlayed={matchesPlayed}
      recentGames={games || []}
      isOwnProfile={isOwnProfile}
    />
  )
}
