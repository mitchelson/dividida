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

  // Compute real stats from database
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
  if (userParticipants) {
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

  const enrichedProfile = {
    ...profile,
    goals: totalGoals ?? profile.goals,
    games_played: matchesPlayed || profile.games_played,
  }

  return <ProfilePageClient initialProfile={enrichedProfile} userEmail={user.email || ""} />
}
