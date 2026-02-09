"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Trophy,
  Target,
  Swords,
  Crown,
  Medal,
} from "lucide-react"
import type { Game, Participant, Match, Goal } from "@/lib/types"
import { SPORT_CATEGORIES } from "@/lib/types"

interface GameSummaryPageProps {
  game: Game
  participants: Participant[]
  matches: Match[]
  goals: Goal[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function GameSummaryPage({ game, participants, matches, goals }: GameSummaryPageProps) {
  const categoryInfo = SPORT_CATEGORIES.find((c) => c.value === game.category) || SPORT_CATEGORIES[0]

  // Calculate goal scorers ranking
  const scorerRanking = useMemo(() => {
    const scorers: Record<string, { name: string; goals: number; userId: string | null }> = {}
    goals.forEach((goal) => {
      const player = participants.find((p) => p.id === goal.participant_id)
      if (!player) return
      if (!scorers[goal.participant_id]) {
        scorers[goal.participant_id] = { name: player.name, goals: 0, userId: player.user_id }
      }
      scorers[goal.participant_id].goals++
    })
    return Object.entries(scorers)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.goals - a.goals)
  }, [goals, participants])

  // Calculate team wins
  const teamWins = useMemo(() => {
    const wins: Record<string, { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }> = {}
    const finishedMatches = matches.filter((m) => m.status === "finished")

    finishedMatches.forEach((match) => {
      if (!wins[match.team_a_name]) wins[match.team_a_name] = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
      if (!wins[match.team_b_name]) wins[match.team_b_name] = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }

      wins[match.team_a_name].goalsFor += match.score_a
      wins[match.team_a_name].goalsAgainst += match.score_b
      wins[match.team_b_name].goalsFor += match.score_b
      wins[match.team_b_name].goalsAgainst += match.score_a

      if (match.score_a > match.score_b) {
        wins[match.team_a_name].wins++
        wins[match.team_b_name].losses++
      } else if (match.score_b > match.score_a) {
        wins[match.team_b_name].wins++
        wins[match.team_a_name].losses++
      } else {
        wins[match.team_a_name].draws++
        wins[match.team_b_name].draws++
      }
    })

    return Object.entries(wins)
      .map(([team, data]) => ({
        team,
        ...data,
        points: data.wins * 3 + data.draws,
        goalDiff: data.goalsFor - data.goalsAgainst,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
        return b.goalsFor - a.goalsFor
      })
  }, [matches])

  const finishedMatches = matches.filter((m) => m.status === "finished")
  const totalGoals = goals.length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href={`/jogo/${game.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xl flex-shrink-0">{categoryInfo.icon}</span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">Resumo do Dia</h1>
              <p className="text-xs text-muted-foreground truncate">{game.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 text-center">
              <Swords className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{finishedMatches.length}</p>
              <p className="text-[10px] text-muted-foreground">Partidas</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 text-center">
              <Target className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{totalGoals}</p>
              <p className="text-[10px] text-muted-foreground">Gols</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 text-center">
              <Trophy className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{participants.length}</p>
              <p className="text-[10px] text-muted-foreground">Jogadores</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Standings */}
        {teamWins.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Classificacao dos Times
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-0">
                {/* Header */}
                <div className="grid grid-cols-[1fr_32px_32px_32px_32px_40px] gap-1 text-[10px] text-muted-foreground pb-1 border-b border-border px-2">
                  <span>Time</span>
                  <span className="text-center">V</span>
                  <span className="text-center">E</span>
                  <span className="text-center">D</span>
                  <span className="text-center">SG</span>
                  <span className="text-center font-semibold">Pts</span>
                </div>
                {teamWins.map((team, index) => (
                  <div
                    key={team.team}
                    className={`grid grid-cols-[1fr_32px_32px_32px_32px_40px] gap-1 text-xs items-center px-2 py-2 ${
                      index === 0 ? "bg-yellow-500/10 rounded-lg" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {index === 0 && <Crown className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />}
                      {index === 1 && <Medal className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                      {index === 2 && <Medal className="h-3.5 w-3.5 text-amber-700 flex-shrink-0" />}
                      <span className="font-medium truncate">{team.team}</span>
                    </div>
                    <span className="text-center text-emerald-600 font-medium">{team.wins}</span>
                    <span className="text-center text-muted-foreground">{team.draws}</span>
                    <span className="text-center text-destructive">{team.losses}</span>
                    <span className={`text-center font-medium ${team.goalDiff > 0 ? "text-emerald-600" : team.goalDiff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                    </span>
                    <span className="text-center font-bold text-primary">{team.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Scorers */}
        {scorerRanking.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                Artilharia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {scorerRanking.map((scorer, index) => (
                  <div
                    key={scorer.id}
                    className={`flex items-center justify-between rounded-lg p-2.5 ${
                      index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "border border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 text-center font-bold text-xs ${
                        index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>
                      {scorer.userId ? (
                        <Link
                          href={`/jogador/${scorer.userId}`}
                          className="font-medium text-sm underline decoration-dotted underline-offset-2 hover:decoration-solid hover:text-primary transition-colors"
                        >
                          {scorer.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-sm">{scorer.name}</span>
                      )}
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs tabular-nums">
                      {scorer.goals} {scorer.goals === 1 ? "gol" : "gols"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match Results */}
        {finishedMatches.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" />
                Resultados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {finishedMatches.map((match) => {
                  const matchGoals = goals.filter((g) => g.match_id === match.id)
                  const teamAGoals = matchGoals.filter((g) => g.team === "a")
                  const teamBGoals = matchGoals.filter((g) => g.team === "b")
                  const isDraw = match.score_a === match.score_b
                  const aWon = match.score_a > match.score_b

                  return (
                    <div key={match.id} className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center p-3">
                        <div className={`flex-1 text-right pr-3 ${aWon ? "font-bold" : ""}`}>
                          <p className="text-sm truncate">{match.team_a_name}</p>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <span className={`text-xl font-bold ${aWon ? "text-primary" : "text-foreground"}`}>
                            {match.score_a}
                          </span>
                          <span className="text-xs text-muted-foreground">x</span>
                          <span className={`text-xl font-bold ${!isDraw && !aWon ? "text-primary" : "text-foreground"}`}>
                            {match.score_b}
                          </span>
                        </div>
                        <div className={`flex-1 pl-3 ${!isDraw && !aWon ? "font-bold" : ""}`}>
                          <p className="text-sm truncate">{match.team_b_name}</p>
                        </div>
                      </div>
                      {matchGoals.length > 0 && (
                        <div className="border-t border-border px-3 py-2 flex gap-4 text-[10px] text-muted-foreground bg-muted/30">
                          <div className="flex-1 text-right space-y-0.5">
                            {teamAGoals.map((g) => {
                              const player = participants.find((p) => p.id === g.participant_id)
                              return (
                                <p key={g.id}>
                                  {player?.user_id ? (
                                    <Link href={`/jogador/${player.user_id}`} className="hover:text-primary underline decoration-dotted underline-offset-2">
                                      {player.name}
                                    </Link>
                                  ) : (
                                    player?.name || "?"
                                  )}
                                  {g.minute != null ? ` ${formatTime(g.minute)}` : ""}
                                </p>
                              )
                            })}
                          </div>
                          <div className="w-px bg-border" />
                          <div className="flex-1 space-y-0.5">
                            {teamBGoals.map((g) => {
                              const player = participants.find((p) => p.id === g.participant_id)
                              return (
                                <p key={g.id}>
                                  {player?.user_id ? (
                                    <Link href={`/jogador/${player.user_id}`} className="hover:text-primary underline decoration-dotted underline-offset-2">
                                      {player.name}
                                    </Link>
                                  ) : (
                                    player?.name || "?"
                                  )}
                                  {g.minute != null ? ` ${formatTime(g.minute)}` : ""}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      <div className="border-t border-border px-3 py-1 text-[10px] text-muted-foreground text-center bg-muted/20">
                        Duracao: {formatTime(match.elapsed_seconds)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {matches.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Swords className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma partida registrada</p>
              <p className="text-xs text-muted-foreground mt-1">Crie partidas na pagina do jogo para ver o resumo aqui</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
