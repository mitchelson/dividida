import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Target, Swords, Trophy, CalendarDays } from "lucide-react"
import { PlayerCard } from "@/components/player-card"

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

  // Get all participant entries for this user
  const { data: userParticipants } = await supabase
    .from("participants")
    .select("id, game_id, name, team_index")
    .eq("user_id", id)
    .eq("status", "approved")

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

  const gameMap = Object.fromEntries((games || []).map((g) => [g.id, g]))

  // Count matches played (finished matches where user's team participated)
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

  // Goals per game for display
  const goalsPerGame: Record<string, number> = {}
  recentGoals?.forEach((g) => {
    goalsPerGame[g.game_id] = (goalsPerGame[g.game_id] || 0) + 1
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-4 py-3 flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-foreground truncate">
            {profile.display_name || "Jogador"}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        <PlayerCard profile={{ ...profile, goals: totalGoals || profile.goals, games_played: matchesPlayed || profile.games_played }} size="lg" />

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Swords className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{matchesPlayed || profile.games_played}</p>
              <p className="text-[10px] text-muted-foreground">Partidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Target className="h-4 w-4 mx-auto text-red-500 mb-1" />
              <p className="text-xl font-bold text-foreground">{totalGoals || profile.goals}</p>
              <p className="text-[10px] text-muted-foreground">Gols</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Trophy className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
              <p className="text-xl font-bold text-foreground">
                {matchesPlayed > 0 ? ((totalGoals || 0) / matchesPlayed).toFixed(1) : "0.0"}
              </p>
              <p className="text-[10px] text-muted-foreground">Gols/Partida</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Games */}
        {games && games.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Jogos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {games.slice(0, 5).map((g) => (
                  <Link key={g.id} href={`/jogo/${g.id}`} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 hover:bg-muted/50 -mx-1 px-1 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(g.game_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    {goalsPerGame[g.id] != null && (
                      <div className="flex items-center gap-1 text-xs">
                        <Target className="h-3 w-3 text-red-500" />
                        <span className="font-bold text-foreground">{goalsPerGame[g.id]}</span>
                        <span className="text-muted-foreground">gols</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="px-4 text-center text-xs text-muted-foreground">
          <p>DivididaPix - Divida a conta de forma simples</p>
        </div>
      </footer>
    </div>
  )
}
