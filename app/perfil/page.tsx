import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfilePageClient } from "@/components/profile-page"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Compute real stats from database (same logic as /jogador/[id])
  const { data: userParticipants } = await supabase
    .from("participants")
    .select("id, game_id, team_index")
    .eq("user_id", user.id)
    .eq("status", "approved")

  const participantIds = userParticipants?.map((p) => p.id) || []

  // Count actual goals
  const { count: totalGoals } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .in("participant_id", participantIds.length > 0 ? participantIds : ["none"])

  // Count matches played
  let matchesPlayed = 0
  if (userParticipants && userParticipants.length > 0) {
    for (const p of userParticipants) {
      if (p.team_index == null) continue
      const teamName = `Time ${p.team_index + 1}`
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("game_id", p.game_id)
        .eq("status", "finished")
        .or(`team_a_name.eq.${teamName},team_b_name.eq.${teamName}`)
      matchesPlayed += count || 0
    }
  }

  // Count unique games participated in
  const uniqueGameIds = new Set(userParticipants?.map((p) => p.game_id) || [])
  const gamesPlayed = uniqueGameIds.size

  // Get recent goals with game info (for activity display)
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

  const enrichedProfile = {
    ...profile,
    goals: totalGoals ?? profile.goals,
    games_played: gamesPlayed || matchesPlayed || profile.games_played,
  }

  return (
    <ProfilePageClient
      initialProfile={enrichedProfile}
      userEmail={user.email || ""}
      matchesPlayed={matchesPlayed}
      recentGames={games || []}
    />
  )
}
