"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
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
  const [isRunning, setIsRunning] = useState(match.status === "playing")
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [goalTeam, setGoalTeam] = useState<"a" | "b">("a")
  const [selectedScorer, setSelectedScorer] = useState("")
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Chronometer logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsed * 1000
      intervalRef.current = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsed(newElapsed)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

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
    setIsRunning(true)
    await updateMatch({ status: "playing", elapsed_seconds: elapsed })
  }

  const handlePause = async () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    await updateMatch({ status: "playing", elapsed_seconds: elapsed })
  }

  const handleFinish = async () => {
    setIsRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    await updateMatch({ status: "finished", elapsed_seconds: elapsed })
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

  const teamAPlayers = teamGroups[0]?.participants || []
  const teamBPlayers = teamGroups[1]?.participants || []
  const goalTeamPlayers = goalTeam === "a" ? teamAPlayers : teamBPlayers

  const matchGoals = goals.filter((g) => g.match_id === match.id)
  const teamAGoals = matchGoals.filter((g) => g.team === "a")
  const teamBGoals = matchGoals.filter((g) => g.team === "b")

  const allParticipants = teamGroups.flatMap((g) => g.participants)
  const getPlayerName = (id: string) => allParticipants.find((p) => p.id === id)?.name || "?"

  const isFinished = match.status === "finished"

  return (
    <Card className={`overflow-hidden ${isFinished ? "opacity-80" : ""}`}>
      <CardContent className="p-0">
        {/* Timer bar */}
        <div className={`flex items-center justify-center gap-2 py-1.5 text-xs font-mono ${
          isRunning ? "bg-emerald-500 text-white" : isFinished ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        }`}>
          <Timer className="h-3 w-3" />
          {formatTime(elapsed)}
          {isFinished && <span className="font-sans ml-1">(Encerrada)</span>}
        </div>

        {/* Scoreboard */}
        <div className="flex items-center p-3 gap-2">
          {/* Team A */}
          <div className="flex-1 text-center">
            <p className="text-xs font-medium text-muted-foreground truncate">{match.team_a_name}</p>
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
            <p className="text-xs font-medium text-muted-foreground truncate">{match.team_b_name}</p>
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
              {teamAGoals.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-muted-foreground">
                  <span>{getPlayerName(g.participant_id)} {g.minute != null ? `${formatTime(g.minute)}` : ""}</span>
                  {isAdmin && !isFinished && (
                    <button type="button" onClick={() => removeGoal(g)} className="text-destructive hover:underline ml-1">x</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-0.5">
              {teamBGoals.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-muted-foreground">
                  <span>{getPlayerName(g.participant_id)} {g.minute != null ? `${formatTime(g.minute)}` : ""}</span>
                  {isAdmin && !isFinished && (
                    <button type="button" onClick={() => removeGoal(g)} className="text-destructive hover:underline ml-1">x</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex items-center gap-1 border-t border-border p-2">
            {!isFinished && (
              <>
                {!isRunning ? (
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Gol - {goalTeam === "a" ? match.team_a_name : match.team_b_name}
            </DialogTitle>
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
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-sm">Criar Partida</DialogTitle>
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
