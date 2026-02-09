"use client"

import React from "react"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UsersRound, GripVertical, Save, Shuffle, Loader2 } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Participant } from "@/lib/types"

interface ParticipantProfile {
  display_name: string | null
  avatar_url: string | null
  overall: number
  position: string
}

interface TeamManagerProps {
  participants: Participant[]
  playersPerTeam: number
  profiles: Record<string, ParticipantProfile>
  isAdmin: boolean
  gameId: string
  adminPassword: string
  onUpdate: (participants: Participant[]) => void
}

const TEAM_COLORS = [
  { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600", badge: "bg-blue-500" },
  { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-600", badge: "bg-red-500" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600", badge: "bg-emerald-500" },
  { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600", badge: "bg-amber-500" },
  { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-600", badge: "bg-purple-500" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-600", badge: "bg-cyan-500" },
]

function DraggablePlayerRow({
  participant,
  profile,
  index,
  isDraggable,
}: {
  participant: Participant
  profile?: ParticipantProfile | null
  index: number
  isDraggable: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: participant.id,
    disabled: !isDraggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm"
    >
      {isDraggable && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <span className="text-xs font-medium text-muted-foreground w-4 text-center">{index + 1}</span>
      {profile?.avatar_url ? (
        <Avatar className="h-6 w-6 border border-border">
          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="text-[9px]">{participant.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
          {participant.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="flex-1 truncate font-medium">{participant.name}</span>
      {profile && (
        <span className="inline-flex items-center justify-center h-5 min-w-[24px] px-1 rounded bg-primary/15 text-[10px] font-bold text-primary">
          {profile.overall}
        </span>
      )}
    </div>
  )
}

function PlayerOverlay({ participant, profile }: { participant: Participant; profile?: ParticipantProfile | null }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary bg-card p-2 text-sm shadow-lg">
      <GripVertical className="h-4 w-4 text-primary" />
      <span className="flex-1 truncate font-medium">{participant.name}</span>
      {profile && (
        <span className="inline-flex items-center justify-center h-5 min-w-[24px] px-1 rounded bg-primary/15 text-[10px] font-bold text-primary">
          {profile.overall}
        </span>
      )}
    </div>
  )
}

function DroppableTeam({
  teamIndex,
  label,
  children,
  color,
  count,
  perTeam,
  avgOverall,
}: {
  teamIndex: number
  label: string
  children: React.ReactNode
  color: typeof TEAM_COLORS[number]
  count: number
  perTeam: number
  avgOverall: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `team-${teamIndex}` })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 ${isOver ? "border-primary bg-primary/5" : color.border + " " + color.bg} p-3 transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge className={`${color.badge} text-white text-xs`}>
          <UsersRound className="h-3 w-3 mr-1" />
          {label}
        </Badge>
        <div className="flex items-center gap-2">
          {avgOverall > 0 && (
            <span className="text-[10px] text-muted-foreground">OVR {avgOverall.toFixed(0)}</span>
          )}
          <span className="text-xs text-muted-foreground">{count}/{perTeam}</span>
        </div>
      </div>
      <div className="space-y-1.5 min-h-[48px]">
        {children}
      </div>
    </div>
  )
}

export function TeamManager({
  participants,
  playersPerTeam,
  profiles,
  isAdmin,
  gameId,
  adminPassword,
  onUpdate,
}: TeamManagerProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localParticipants, setLocalParticipants] = useState<Participant[]>(participants)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Sync when external participants change (new joins, etc.)
  const participantIds = participants.map((p) => p.id).join(",")
  useMemo(() => {
    if (!hasChanges) {
      setLocalParticipants(participants)
    }
  }, [participantIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const numTeams = Math.max(2, Math.ceil(localParticipants.length / playersPerTeam))

  const teams = useMemo(() => {
    const teamMap: Record<number, Participant[]> = {}
    for (let i = 0; i < numTeams; i++) teamMap[i] = []

    localParticipants.forEach((p) => {
      const idx = p.team_index != null ? p.team_index : -1
      if (idx >= 0 && idx < numTeams) {
        teamMap[idx].push(p)
      }
    })

    // Unassigned players go to teams sequentially
    const unassigned = localParticipants.filter(
      (p) => p.team_index == null || p.team_index < 0 || p.team_index >= numTeams
    )
    unassigned.forEach((p, i) => {
      const targetTeam = i % numTeams
      teamMap[targetTeam].push({ ...p, team_index: targetTeam })
    })

    return teamMap
  }, [localParticipants, numTeams])

  const getTeamAvgOverall = (teamParticipants: Participant[]) => {
    const withProfiles = teamParticipants.filter((p) => p.user_id && profiles[p.user_id])
    if (withProfiles.length === 0) return 0
    return withProfiles.reduce((sum, p) => sum + (profiles[p.user_id!]?.overall || 0), 0) / withProfiles.length
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const playerId = active.id as string
    let targetTeamIndex: number | null = null

    // Check if dropped over a team droppable
    const overId = over.id as string
    if (overId.startsWith("team-")) {
      targetTeamIndex = parseInt(overId.replace("team-", ""))
    } else {
      // Dropped on another player - find that player's team
      const overPlayer = localParticipants.find((p) => p.id === overId)
      if (overPlayer) {
        for (const [teamIdx, teamPlayers] of Object.entries(teams)) {
          if (teamPlayers.some((p) => p.id === overId)) {
            targetTeamIndex = parseInt(teamIdx)
            break
          }
        }
      }
    }

    if (targetTeamIndex == null) return

    setLocalParticipants((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, team_index: targetTeamIndex } : p))
    )
    setHasChanges(true)
  }

  const shuffleTeams = () => {
    const shuffled = [...localParticipants].sort(() => Math.random() - 0.5)
    const updated = shuffled.map((p, i) => ({ ...p, team_index: i % numTeams }))
    setLocalParticipants(updated)
    setHasChanges(true)
  }

  const saveTeams = async () => {
    setIsSaving(true)
    try {
      // Build assignments from teams map
      const assignments: { participant_id: string; team_index: number; sort_order: number }[] = []
      for (const [teamIdx, teamPlayers] of Object.entries(teams)) {
        teamPlayers.forEach((p, i) => {
          assignments.push({
            participant_id: p.id,
            team_index: parseInt(teamIdx),
            sort_order: parseInt(teamIdx) * playersPerTeam + i,
          })
        })
      }

      await fetch(`/api/games/${gameId}/participants/assign-teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, assignments }),
      })

      // Update parent state
      const updatedParticipants = localParticipants.map((p) => {
        const assignment = assignments.find((a) => a.participant_id === p.id)
        return assignment ? { ...p, team_index: assignment.team_index, sort_order: assignment.sort_order } : p
      })
      onUpdate(updatedParticipants)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const activeParticipant = activeId ? localParticipants.find((p) => p.id === activeId) : null
  const allIds = localParticipants.map((p) => p.id)

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent" onClick={shuffleTeams}>
            <Shuffle className="h-3 w-3 mr-1" />
            Sortear
          </Button>
          {hasChanges && (
            <Button size="sm" className="h-7 text-xs" onClick={saveTeams} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Salvar Times
            </Button>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {Array.from({ length: numTeams }, (_, teamIdx) => {
              const teamPlayers = teams[teamIdx] || []
              const color = TEAM_COLORS[teamIdx % TEAM_COLORS.length]
              const avgOverall = getTeamAvgOverall(teamPlayers)

              return (
                <DroppableTeam
                  key={teamIdx}
                  teamIndex={teamIdx}
                  label={`Time ${teamIdx + 1}`}
                  color={color}
                  count={teamPlayers.length}
                  perTeam={playersPerTeam}
                  avgOverall={avgOverall}
                >
                  {teamPlayers.map((participant, index) => (
                    <DraggablePlayerRow
                      key={participant.id}
                      participant={participant}
                      profile={participant.user_id ? profiles[participant.user_id] : null}
                      index={index}
                      isDraggable={isAdmin}
                    />
                  ))}
                </DroppableTeam>
              )
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeParticipant ? (
            <PlayerOverlay
              participant={activeParticipant}
              profile={activeParticipant.user_id ? profiles[activeParticipant.user_id] : null}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
