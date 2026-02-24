"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Play,
  Pause,
  Square,
  Trash2,
  Timer,
  Loader2,
  Swords,
  Pencil,
  Check,
  X,
  BarChart3,
} from "lucide-react"
import type { Match, Goal, Participant } from "@/lib/types"

interface MatchManagerProps {
  gameId: string
  adminPassword: string
  isAdmin: boolean
  teamGroups: { label: string; participants: Participant[] }[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function MatchCard({
  match,
  goals,
  teamGroups,
  isAdmin,
  gameId,
  adminPassword,
  onUpdate,
  onDelete,
  onGoalsChange,
}: {
  match: Match
  goals: Goal[]
  teamGroups: { label: string; participants: Participant[] }[]
  isAdmin: boolean
  gameId: string
  adminPassword: string
  onUpdate: (m: Match) => void
  onDelete: (id: string) => void
  onGoalsChange: () => void
}) {
  const [elapsed, setElapsed] = useState(match.elapsed_seconds)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [goalTeam, setGoalTeam] = useState<"a" | "b">("a")
  const [selectedScorer, setSelectedScorer] = useState("")
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingTeamName, setEditingTeamName] = useState<"a" | "b" | null>(null)
  const [editTeamAName, setEditTeamAName] = useState(match.team_a_name)
  const [editTeamBName, setEditTeamBName] = useState(match.team_b_name)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Chronometer logic - baseado em started_at
  useEffect(() => {
    if (match.status !== 'playing') {
      setElapsed(match.elapsed_seconds || 0)
      return
    }

    if (!match.started_at) {
      setElapsed(match.elapsed_seconds || 0)
      return
    }

    const updateElapsed = () => {
      const startTime = new Date(match.started_at!).getTime()
      const now = new Date().getTime()
      const diffSeconds = Math.floor((now - startTime) / 1000)
      setElapsed(Math.max(0, diffSeconds))
    }

    // Atualizar imediatamente
    updateElapsed()

    // E depois a cada segundo
    intervalRef.current = setInterval(updateElapsed, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [match.status, match.started_at, match.elapsed_seconds])

  const updateMatch = useCallback(
    async (data: Partial<Match>) => {
      const res = await fetch(`/api/games/${gameId}/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, ...data }),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
      }
    },
    [gameId, match.id, adminPassword, onUpdate]
  )

  const handlePlay = async () => {
    const updateData: Record<string, unknown> = { status: "playing" }
    
    // Se for a primeira vez iniciando, salvar started_at
    if (!match.started_at) {
      updateData.started_at = new Date().toISOString()
      
      // Tentar criar evento de início (falhas são silenciosas)
      try {
        await fetch(`/api/games/${gameId}/matches/${match.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: adminPassword,
            event_type: "started",
            event_time: elapsed,
            description: `Iniciado em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          }),
        }).catch(() => {
          // Silently fail - events table may not exist yet
        })
      } catch (err) {
        // Silently fail
      }
    }
    
    await updateMatch(updateData)
  }

  const handlePause = async () => {
    // Tentar criar evento de pausa (falhas são silenciosas)
    try {
      await fetch(`/api/games/${gameId}/matches/${match.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          event_type: "paused",
          event_time: elapsed,
          description: `Pausado em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        }),
      }).catch(() => {})
    } catch (err) {
      // Silently fail
    }
    
    // Para a partida alterando o status
    await updateMatch({ status: "draft", elapsed_seconds: elapsed })
  }

  const handleFinish = async () => {
    // Tentar criar evento de encerramento (falhas são silenciosas)
    try {
      await fetch(`/api/games/${gameId}/matches/${match.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          event_type: "finished",
          event_time: elapsed,
          description: `Encerrado em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        }),
      }).catch(() => {})
    } catch (err) {
      // Silently fail
    }
    
    await updateMatch({ status: "completed", elapsed_seconds: elapsed })
  }

  const handleDelete = async () => {
    await fetch(`/api/games/${gameId}/matches/${match.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword }),
    })
    onDelete(match.id)
  }

  const openGoalDialog = (team: "a" | "b") => {
    setGoalTeam(team)
    setSelectedScorer("")
    setGoalDialogOpen(true)
  }

  const addGoal = async () => {
    if (!selectedScorer) return
    setIsAddingGoal(true)
    try {
      // Get participant name from teamGroups
      let participantName = 'Jogador'
      for (const group of teamGroups) {
        const participant = group.participants.find(p => p.id === selectedScorer)
        if (participant) {
          participantName = participant.name
          break
        }
      }
      
      const teamName = goalTeam === 'a' ? match.team_a_name : match.team_b_name
      
      await fetch(`/api/games/${gameId}/matches/${match.id}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          participant_id: selectedScorer,
          team: goalTeam,
          minute: elapsed,
        }),
      })

      // Create goal event (falhas são silenciosas)
      try {
        await fetch(`/api/games/${gameId}/matches/${match.id}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: adminPassword,
            event_type: "goal",
            event_time: elapsed,
            team: goalTeam,
            participant_id: selectedScorer,
            description: `⚽ Gol do ${teamName} - ${participantName}`,
          }),
        }).catch(() => {})
      } catch (err) {
        // Silently fail
      }

      // Update local score
      onUpdate({
        ...match,
        score_a: goalTeam === "a" ? match.score_a + 1 : match.score_a,
        score_b: goalTeam === "b" ? match.score_b + 1 : match.score_b,
      })
      onGoalsChange()
      setGoalDialogOpen(false)
    } finally {
      setIsAddingGoal(false)
    }
  }

  const removeGoal = async (goal: Goal) => {
    await fetch(`/api/games/${gameId}/matches/${match.id}/goals`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword, goal_id: goal.id, team: goal.team }),
    })
    onUpdate({
      ...match,
      score_a: goal.team === "a" ? Math.max(0, match.score_a - 1) : match.score_a,
      score_b: goal.team === "b" ? Math.max(0, match.score_b - 1) : match.score_b,
    })
    onGoalsChange()
  }

  const saveTeamName = async (team: "a" | "b") => {
    const newName = team === "a" ? editTeamAName : editTeamBName
    await updateMatch(
      team === "a" ? { team_a_name: newName } : { team_b_name: newName }
    )
    setEditingTeamName(null)
  }

  const teamAPlayers = teamGroups[0]?.participants || []
  const teamBPlayers = teamGroups[1]?.participants || []
  const goalTeamPlayers = goalTeam === "a" ? teamAPlayers : teamBPlayers

  const matchGoals = goals.filter((g) => g.match_id === match.id)
  const teamAGoals = matchGoals.filter((g) => g.team === "a")
  const teamBGoals = matchGoals.filter((g) => g.team === "b")

  const allParticipants = teamGroups.flatMap((g) => g.participants)
  const getPlayer = (id: string) => allParticipants.find((p) => p.id === id)
  const getPlayerName = (id: string) => getPlayer(id)?.name || "?"

  const isFinished = match.status === "completed"

  return (
    <Card className={`overflow-hidden ${isFinished ? "opacity-80" : ""}`}>
      <CardContent className="p-0">
        {/* Timer bar */}
        <div className={`flex items-center justify-center gap-2 py-1.5 text-xs font-mono ${
          match.status === 'playing' ? "bg-emerald-500 text-white" : isFinished ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        }`}>
          <Timer className="h-3 w-3" />
          {formatTime(elapsed)}
          {isFinished && <span className="font-sans ml-1">(Encerrada)</span>}
        </div>

        {/* Scoreboard */}
        <div className="flex items-center p-3 gap-2">
          {/* Team A */}
          <div className="flex-1 text-center">
            {editingTeamName === "a" ? (
              <div className="flex items-center gap-1 mb-1">
                <Input
                  value={editTeamAName}
                  onChange={(e) => setEditTeamAName(e.target.value)}
                  className="h-6 text-xs px-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveTeamName("a")}
                  className="p-0.5 hover:bg-primary/20 rounded"
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeamName(null)}
                  className="p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 group">
                <p className="text-xs font-medium text-muted-foreground truncate">{match.team_a_name}</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamName("a")
                      setEditTeamAName(match.team_a_name)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </button>
                )}
              </div>
            )}
            {isAdmin && !isFinished ? (
              <button
                type="button"
                onClick={() => openGoalDialog("a")}
                className="text-3xl font-bold text-foreground hover:text-primary transition-colors"
              >
                {match.score_a}
              </button>
            ) : (
              <p className="text-3xl font-bold text-foreground">{match.score_a}</p>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center px-2">
            <Swords className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground mt-0.5">VS</span>
          </div>

          {/* Team B */}
          <div className="flex-1 text-center">
            {editingTeamName === "b" ? (
              <div className="flex items-center gap-1 mb-1">
                <Input
                  value={editTeamBName}
                  onChange={(e) => setEditTeamBName(e.target.value)}
                  className="h-6 text-xs px-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveTeamName("b")}
                  className="p-0.5 hover:bg-primary/20 rounded"
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeamName(null)}
                  className="p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 group">
                <p className="text-xs font-medium text-muted-foreground truncate">{match.team_b_name}</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamName("b")
                      setEditTeamBName(match.team_b_name)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </button>
                )}
              </div>
            )}
            {isAdmin && !isFinished ? (
              <button
                type="button"
                onClick={() => openGoalDialog("b")}
                className="text-3xl font-bold text-foreground hover:text-primary transition-colors"
              >
                {match.score_b}
              </button>
            ) : (
              <p className="text-3xl font-bold text-foreground">{match.score_b}</p>
            )}
          </div>
        </div>

        {/* Goal scorers */}
        {matchGoals.length > 0 && (
          <div className="px-3 pb-2 flex gap-4 text-[10px]">
            <div className="flex-1 space-y-0.5">
              {teamAGoals.map((g) => {
                const player = getPlayer(g.participant_id)
                return (
                  <div key={g.id} className="flex items-center justify-between text-muted-foreground">
                    <span>
                      {player?.user_id ? (
                        <Link href={`/jogador/${player.user_id}`} className="hover:text-primary underline decoration-dotted underline-offset-2">{player.name}</Link>
                      ) : (
                        getPlayerName(g.participant_id)
                      )}
                      {g.minute != null ? ` ${formatTime(g.minute)}` : ""}
                    </span>
                    {isAdmin && !isFinished && (
                      <button type="button" onClick={() => removeGoal(g)} className="text-destructive hover:underline ml-1">x</button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex-1 space-y-0.5">
              {teamBGoals.map((g) => {
                const player = getPlayer(g.participant_id)
                return (
                  <div key={g.id} className="flex items-center justify-between text-muted-foreground">
                    <span>
                      {player?.user_id ? (
                        <Link href={`/jogador/${player.user_id}`} className="hover:text-primary underline decoration-dotted underline-offset-2">{player.name}</Link>
                      ) : (
                        getPlayerName(g.participant_id)
                      )}
                      {g.minute != null ? ` ${formatTime(g.minute)}` : ""}
                    </span>
                    {isAdmin && !isFinished && (
                      <button type="button" onClick={() => removeGoal(g)} className="text-destructive hover:underline ml-1">x</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex items-center gap-1 border-t border-border p-2">
            {!isFinished && (
              <>
                {match.status !== 'playing' ? (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handlePlay}>
                    <Play className="h-3 w-3 mr-1" />
                    {elapsed === 0 ? "Iniciar" : "Continuar"}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handlePause}>
                    <Pause className="h-3 w-3 mr-1" />
                    Pausar
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleFinish}>
                  <Square className="h-3 w-3 mr-1" />
                  Encerrar
                </Button>
                <Link href={`/jogo/${match.game_id}/placar?matchId=${match.id}`}>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Placar
                  </Button>
                </Link>
              </>
            )}
            <div className="flex-1" />
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Gol - {goalTeam === "a" ? match.team_a_name : match.team_b_name}
            </DialogTitle>
            <DialogDescription>
              Selecione o jogador que marcou o gol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedScorer} onValueChange={setSelectedScorer}>
              <SelectTrigger>
                <SelectValue placeholder="Quem fez o gol?" />
              </SelectTrigger>
              <SelectContent>
                {goalTeamPlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addGoal} disabled={!selectedScorer || isAddingGoal} className="w-full">
              {isAddingGoal ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Confirmar Gol
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export function MatchManager({ gameId, adminPassword, isAdmin, teamGroups }: MatchManagerProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [createTeamA, setCreateTeamA] = useState("")
  const [createTeamB, setCreateTeamB] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const [matchesRes, ...goalResponses] = await Promise.all([
      fetch(`/api/games/${gameId}/matches`),
    ])
    if (matchesRes.ok) {
      const matchesData = await matchesRes.json()
      setMatches(matchesData)

      // Fetch goals for all matches
      if (matchesData.length > 0) {
        const goalFetches = matchesData.map((m: Match) =>
          fetch(`/api/games/${gameId}/matches/${m.id}/goals`).then((r) => r.json())
        )
        const allGoals = (await Promise.all(goalFetches)).flat()
        setGoals(allGoals)
      }
    }
    setIsLoading(false)
  }, [gameId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createMatch = async () => {
    if (!createTeamA || !createTeamB) return
    setIsCreating(true)
    try {
      const res = await fetch(`/api/games/${gameId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          team_a_name: createTeamA,
          team_b_name: createTeamB,
          match_order: matches.length,
        }),
      })
      if (res.ok) {
        const newMatch = await res.json()
        setMatches((prev) => [...prev, newMatch])
        setCreateDialogOpen(false)
        setCreateTeamA("")
        setCreateTeamB("")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const updateMatch = (updated: Match) => {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
  }

  const deleteMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id))
    setGoals((prev) => prev.filter((g) => g.match_id !== id))
  }

  const teamLabels = teamGroups.map((g) => g.label)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Build team selection mapping for goal dialog: match.team_a_name -> teamGroups index
  const getTeamGroupsForMatch = (match: Match) => {
    const aIdx = teamGroups.findIndex((g) => g.label === match.team_a_name)
    const bIdx = teamGroups.findIndex((g) => g.label === match.team_b_name)
    return [
      teamGroups[aIdx] || teamGroups[0] || { label: match.team_a_name, participants: [] },
      teamGroups[bIdx] || teamGroups[1] || { label: match.team_b_name, participants: [] },
    ]
  }

  return (
    <div className="space-y-3">
      {matches.length === 0 && !isAdmin && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
          <Swords className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma partida criada ainda</p>
        </div>
      )}

      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          goals={goals}
          teamGroups={getTeamGroupsForMatch(match)}
          isAdmin={isAdmin}
          gameId={gameId}
          adminPassword={adminPassword}
          onUpdate={updateMatch}
          onDelete={deleteMatch}
          onGoalsChange={fetchData}
        />
      ))}

      {isAdmin && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs bg-transparent"
            onClick={() => {
              setCreateTeamA(teamLabels[0] || "Time 1")
              setCreateTeamB(teamLabels[1] || "Time 2")
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Nova Partida
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-sm rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-sm">Criar Partida</DialogTitle>
                <DialogDescription>
                  Selecione os jogadores para cada time
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Time A</label>
                  <Select value={createTeamA} onValueChange={setCreateTeamA}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamLabels.map((label) => (
                        <SelectItem key={label} value={label}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Time B</label>
                  <Select value={createTeamB} onValueChange={setCreateTeamB}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamLabels.map((label) => (
                        <SelectItem key={label} value={label}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createMatch} disabled={isCreating || createTeamA === createTeamB} className="w-full">
                  {isCreating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Swords className="h-4 w-4 mr-1" />}
                  Criar Partida
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
