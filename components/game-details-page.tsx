"use client"

import React from "react"

import { useState, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  Check,
  X,
  Copy,
  ArrowLeft,
  Lock,
  LockOpen,
  Settings,
  UserCheck,
  Hourglass,
  Award,
  MoreVertical,
  CheckCircle2,
  Circle,
  GripVertical,
  CreditCard,
  UsersRound,
  ArrowDownUp,
  Share2,
  MapPin,
  User,
  ExternalLink,
  Camera,
  Loader2,
  ImageIcon,
  Trophy,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Game, Participant, SportCategory, ParticipantBadge, SortMode } from "@/lib/types"
import { SPORT_CATEGORIES, PARTICIPANT_BADGES } from "@/lib/types"

interface CurrentUser {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface ParticipantProfile {
  display_name: string | null
  avatar_url: string | null
  overall: number
  position: string
}

interface GameDetailsPageProps {
  initialGame: Game & { participants: Participant[] }
  currentUser?: CurrentUser | null
  participantProfiles?: Record<string, ParticipantProfile>
}

function SortableParticipantRow({
  participant,
  index,
  isAdmin,
  isDragMode,
  sortMode,
  teamIndex,
  profile,
  updateParticipantPaid,
  updateParticipantBadges,
  removeParticipant,
}: {
  participant: Participant
  index: number
  isAdmin: boolean
  isDragMode: boolean
  sortMode: SortMode
  teamIndex?: number
  profile?: ParticipantProfile | null
  updateParticipantPaid: (id: string, paid: boolean) => void
  updateParticipantBadges: (id: string, badges: ParticipantBadge[]) => void
  removeParticipant: (id: string) => void
}) {
  const hasProfile = !!participant.user_id
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: participant.id, disabled: !isDragMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
        participant.paid
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isDragMode && (
          <button
            className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {!isDragMode && isAdmin && (
          <Checkbox
            checked={participant.paid}
            onCheckedChange={(checked) => updateParticipantPaid(participant.id, !!checked)}
            className="flex-shrink-0"
          />
        )}
        {!isDragMode && !isAdmin && participant.paid && (
          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
        )}
        <span className="text-xs font-medium text-muted-foreground w-5 text-center flex-shrink-0">{index + 1}</span>
        {profile?.avatar_url ? (
          <Avatar className="h-7 w-7 flex-shrink-0 border border-border">
            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {participant.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground flex-shrink-0">
            {participant.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {!isAdmin && hasProfile ? (
              <Link
                href={`/jogador/${participant.user_id}`}
                className={`font-medium text-sm truncate underline decoration-dotted underline-offset-2 hover:decoration-solid ${participant.paid ? "text-primary" : "text-foreground"}`}
              >
                {participant.name}
              </Link>
            ) : (
              <span className={`font-medium text-sm truncate ${participant.paid ? "text-primary" : "text-foreground"}`}>
                {participant.name}
              </span>
            )}
            {profile && (
              <span className="inline-flex items-center justify-center h-5 min-w-[28px] px-1 rounded bg-primary/15 text-[10px] font-bold text-primary flex-shrink-0">
                {profile.overall}
              </span>
            )}
          </div>
          {(participant.badges?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {participant.badges?.map((badge) => {
                const badgeInfo = PARTICIPANT_BADGES.find((b) => b.value === badge)
                return badgeInfo ? (
                  <Badge
                    key={badge}
                    className={`text-[10px] px-1 py-0 leading-tight ${badgeInfo.color} text-white`}
                  >
                    {badgeInfo.label}
                  </Badge>
                ) : null
              })}
            </div>
          )}
        </div>
      </div>

      {isAdmin && !isDragMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {hasProfile && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/jogador/${participant.user_id}`} className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => updateParticipantPaid(participant.id, !participant.paid)}
            >
              {participant.paid ? (
                <>
                  <Circle className="h-4 w-4 mr-2" />
                  Marcar nao pago
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como pago
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              <Award className="h-3 w-3 inline mr-1" />
              Badges
            </div>
            {PARTICIPANT_BADGES.map((badge) => (
              <DropdownMenuCheckboxItem
                key={badge.value}
                checked={participant.badges?.includes(badge.value)}
                onCheckedChange={(checked) => {
                  const currentBadges = participant.badges || []
                  const newBadges = checked
                    ? [...currentBadges, badge.value]
                    : currentBadges.filter((b) => b !== badge.value)
                  updateParticipantBadges(participant.id, newBadges)
                }}
              >
                <span className={`w-2 h-2 rounded-full ${badge.color} mr-2`} />
                {badge.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => removeParticipant(participant.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export function GameDetailsPage({ initialGame, currentUser, participantProfiles = {} }: GameDetailsPageProps) {
  const router = useRouter()
  const [game, setGame] = useState(initialGame)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [newParticipantName, setNewParticipantName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isUploadingChampion, setIsUploadingChampion] = useState(false)
  const championInputRef = useRef<HTMLInputElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    name: game.name,
    game_date: game.game_date,
    game_time: game.game_time,
    court_value: String(game.court_value),
    pix_key: game.pix_key || "",
    pix_receiver_name: game.pix_receiver_name || "",
    pix_city: game.pix_city || "",
    location: game.location || "",
    category: (game.category || "futebol") as SportCategory,
    sort_mode: (game.sort_mode || "payment") as SortMode,
    players_per_team: String(game.players_per_team || 5),
    fixed_value_per_person: game.fixed_value_per_person != null ? String(game.fixed_value_per_person) : "",
  })

  const approvedParticipants = game.participants.filter((p) => p.status === "approved")
  const pendingParticipants = game.participants.filter((p) => p.status === "pending")

  const currentSortMode = (game.sort_mode || "payment") as SortMode

  const sortedApproved = useMemo(() => {
    const list = [...approvedParticipants]
    switch (currentSortMode) {
      case "payment":
        // Paid first (sorted by paid_at), then unpaid (sorted by created_at)
        return list.sort((a, b) => {
          if (a.paid && !b.paid) return -1
          if (!a.paid && b.paid) return 1
          if (a.paid && b.paid) {
            const aTime = a.paid_at ? new Date(a.paid_at).getTime() : 0
            const bTime = b.paid_at ? new Date(b.paid_at).getTime() : 0
            return aTime - bTime
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      case "teams":
        // Sort by sort_order for team assignment, fallback to created_at
        return list.sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      case "arrival":
        // Sort by sort_order for manual drag ordering
        return list.sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      default:
        return list
    }
  }, [approvedParticipants, currentSortMode])

  const teamGroups = useMemo(() => {
    if (currentSortMode !== "teams") return []
    const perTeam = game.players_per_team || 5
    const groups: { label: string; participants: Participant[] }[] = []
    for (let i = 0; i < sortedApproved.length; i += perTeam) {
      const teamNumber = Math.floor(i / perTeam) + 1
      groups.push({
        label: `Time ${teamNumber}`,
        participants: sortedApproved.slice(i, i + perTeam),
      })
    }
    return groups
  }, [sortedApproved, currentSortMode, game.players_per_team])

  const isValueFixed = game.fixed_value_per_person != null && Number(game.fixed_value_per_person) > 0

  const valuePerPerson = useMemo(() => {
    if (isValueFixed) return Number(game.fixed_value_per_person)
    if (approvedParticipants.length === 0 || Number(game.court_value) <= 0) return 0
    return Number(game.court_value) / approvedParticipants.length
  }, [approvedParticipants.length, game.court_value, game.fixed_value_per_person, isValueFixed])

  const categoryInfo = SPORT_CATEGORIES.find((c) => c.value === (game.category || "futebol")) || SPORT_CATEGORIES[0]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const verifyPassword = async () => {
    setPasswordError("")
    try {
      const response = await fetch(`/api/games/${game.id}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      })
      const data = await response.json()
      if (data.valid) {
        setIsAdmin(true)
        setPasswordDialogOpen(false)
      } else {
        setPasswordError("Senha incorreta")
      }
    } catch {
      setPasswordError("Erro ao verificar senha")
    }
  }

  // Check if current user already joined this game
  const userAlreadyJoined = currentUser
    ? game.participants.some((p) => p.user_id === currentUser.id)
    : false

  const addParticipant = async (nameOverride?: string) => {
    const name = nameOverride || newParticipantName.trim()
    if (!name) return
    setIsAdding(true)
    try {
      const response = await fetch(`/api/games/${game.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        const newParticipant = await response.json()
        setGame({ ...game, participants: [...game.participants, newParticipant] })
        setNewParticipantName("")
      }
    } catch (error) {
      console.error("Erro ao adicionar participante:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const updateParticipantStatus = async (participantId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, password: adminPassword }),
      })
      if (response.ok) {
        setGame({
          ...game,
          participants: game.participants.map((p) =>
            p.id === participantId ? { ...p, status } : p
          ),
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar participante:", error)
    }
  }

  const updateParticipantPaid = useCallback(async (participantId: string, paid: boolean) => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid, password: adminPassword }),
      })
      if (response.ok) {
        const updatedParticipant = await response.json()
        setGame((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participantId ? { ...p, paid: updatedParticipant.paid, paid_at: updatedParticipant.paid_at } : p
          ),
        }))
      }
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
    }
  }, [game.id, adminPassword])

  const updateParticipantBadges = useCallback(async (participantId: string, badges: ParticipantBadge[]) => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badges, password: adminPassword }),
      })
      if (response.ok) {
        setGame((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participantId ? { ...p, badges } : p
          ),
        }))
      }
    } catch (error) {
      console.error("Erro ao atualizar badges:", error)
    }
  }, [game.id, adminPassword])

  const removeParticipant = useCallback(async (participantId: string) => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      })
      if (response.ok) {
        setGame((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p.id !== participantId),
        }))
      }
    } catch (error) {
      console.error("Erro ao remover participante:", error)
    }
  }, [game.id, adminPassword])

  const updateGame = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          court_value: parseFloat(editData.court_value) || 0,
          players_per_team: parseInt(editData.players_per_team) || 5,
          fixed_value_per_person: editData.fixed_value_per_person ? parseFloat(editData.fixed_value_per_person) : null,
          password: adminPassword,
        }),
      })
      if (response.ok) {
        const updatedGame = await response.json()
        setGame((prev) => ({ ...prev, ...updatedGame }))
        setEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Erro ao atualizar partida:", error)
    }
  }

  const deleteGame = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      })
      if (response.ok) {
        router.push("/")
      }
    } catch (error) {
      console.error("Erro ao excluir partida:", error)
    }
  }

  const handleChampionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingChampion(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "champion-photos")
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()

      const saveRes = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion_photo_url: url, password: adminPassword }),
      })
      if (saveRes.ok) {
        setGame((prev) => ({ ...prev, champion_photo_url: url }))
      }
    } catch (error) {
      console.error("Erro ao enviar foto:", error)
    } finally {
      setIsUploadingChampion(false)
      if (championInputRef.current) championInputRef.current.value = ""
    }
  }

  const toggleListClosed = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_closed: !game.list_closed, password: adminPassword }),
      })
      if (response.ok) {
        setGame((prev) => ({ ...prev, list_closed: !prev.list_closed }))
      }
    } catch (error) {
      console.error("Erro ao alterar status da lista:", error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedApproved.findIndex((p) => p.id === active.id)
    const newIndex = sortedApproved.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(sortedApproved, oldIndex, newIndex)
    const orderedIds = reordered.map((p) => p.id)

    // Optimistically update the sort_order locally
    setGame((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => {
        const newOrder = orderedIds.indexOf(p.id)
        if (newOrder !== -1) return { ...p, sort_order: newOrder }
        return p
      }),
    }))

    // Persist to server
    try {
      await fetch(`/api/games/${game.id}/participants/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, orderedIds }),
      })
    } catch (error) {
      console.error("Erro ao reordenar:", error)
    }
  }

  const generatePixPayload = (value: number): string => {
    if (!game.pix_key || !game.pix_receiver_name || !game.pix_city) return ""
    const removeAccents = (str: string): string => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase()
    }
    const formatField = (id: string, fieldValue: string): string => {
      const length = fieldValue.length.toString().padStart(2, "0")
      return `${id}${length}${fieldValue}`
    }
    const calculateCRC16 = (str: string): string => {
      let crc = 0xffff
      const polynomial = 0x1021
      for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = ((crc << 1) ^ polynomial) & 0xffff
          } else {
            crc = (crc << 1) & 0xffff
          }
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, "0")
    }
    const payloadFormatIndicator = formatField("00", "01")
    const pointOfInitiation = formatField("01", "12")
    const gui = formatField("00", "br.gov.bcb.pix")
    const chave = formatField("01", game.pix_key)
    const merchantAccountInfo = formatField("26", gui + chave)
    const merchantCategoryCode = formatField("52", "0000")
    const transactionCurrency = formatField("53", "986")
    const transactionAmount = formatField("54", value.toFixed(2))
    const countryCode = formatField("58", "BR")
    const merchantName = formatField("59", removeAccents(game.pix_receiver_name).substring(0, 25))
    const merchantCity = formatField("60", removeAccents(game.pix_city).substring(0, 15))
    const txid = formatField("05", "***")
    const additionalDataField = formatField("62", txid)
    let payload =
      payloadFormatIndicator + pointOfInitiation + merchantAccountInfo + merchantCategoryCode +
      transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity + additionalDataField
    payload += "6304"
    const crc = calculateCRC16(payload)
    payload += crc
    return payload
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  const pixPayload = generatePixPayload(valuePerPerson)
  const isPixConfigured = game.pix_key && game.pix_receiver_name && game.pix_city

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
  }

  const shareOnWhatsApp = () => {
    const gameUrl = typeof window !== "undefined"
      ? `${window.location.origin}/jogo/${game.id}`
      : ""

    const dateStr = formatDate(game.game_date)
    const timeStr = game.game_time.slice(0, 5)

    let message = `*${categoryInfo.icon} ${game.name}*\n`
    message += `\u{1F4C5} ${dateStr} \u{23F0} ${timeStr}\n`
    if (game.location) {
      message += `\u{1F4CD} ${game.location}\n`
    }
    message += `\u{1F4B0} R$ ${Number(game.court_value).toFixed(0)}`
    if (approvedParticipants.length > 0) {
      message += ` (R$ ${valuePerPerson.toFixed(2)}/pessoa)`
    }
    message += "\n\n"

    if (approvedParticipants.length > 0) {
      message += `*\u{2705} Confirmados (${approvedParticipants.length}):*\n`
      sortedApproved.forEach((p, i) => {
        const paidMark = p.paid ? " \u{1F4B2}" : ""
        message += `${i + 1}. ${p.name}${paidMark}\n`
      })
      message += "\n"
    }

    if (pendingParticipants.length > 0) {
      message += `\u{23F3} _Aguardando (${pendingParticipants.length}):_\n`
      pendingParticipants.forEach((p) => {
        message += `- ${p.name}\n`
      })
      message += "\n"
    }

    message += `\u{1F449} Coloque seu nome na lista:\n${gameUrl}`

    const encoded = encodeURIComponent(message)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank")
  }

  const paidCount = approvedParticipants.filter((p) => p.paid).length
  const unpaidCount = approvedParticipants.length - paidCount

  const sortModeLabels: Record<SortMode, { label: string; icon: React.ReactNode; description: string }> = {
    payment: { label: "Pagamento", icon: <CreditCard className="h-4 w-4" />, description: "Pagantes primeiro" },
    teams: { label: "Times", icon: <UsersRound className="h-4 w-4" />, description: "Dividido por times" },
    arrival: { label: "Chegada", icon: <ArrowDownUp className="h-4 w-4" />, description: "Arraste para ordenar" },
  }

  const isDragMode = isAdmin && currentSortMode === "arrival"

  const renderParticipantsList = () => {
    if (sortedApproved.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
          <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhum confirmado ainda</p>
        </div>
      )
    }

    if (currentSortMode === "teams" && teamGroups.length > 0) {
      return (
        <div className="space-y-4">
          {teamGroups.map((group, groupIndex) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    groupIndex % 2 === 0
                      ? "border-primary/50 text-primary bg-primary/5"
                      : "border-accent/50 text-accent-foreground bg-accent/10"
                  }`}
                >
                  <UsersRound className="h-3 w-3 mr-1" />
                  {group.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {group.participants.length}/{game.players_per_team || 5}
                </span>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-border">
                {group.participants.map((participant, index) => (
                  <SortableParticipantRow
                    key={participant.id}
                    participant={participant}
                    index={groupIndex * (game.players_per_team || 5) + index}
                    isAdmin={isAdmin}
                    isDragMode={false}
                    sortMode={currentSortMode}
                    teamIndex={groupIndex}
                    profile={participant.user_id ? participantProfiles[participant.user_id] : null}
                    updateParticipantPaid={updateParticipantPaid}
                    updateParticipantBadges={updateParticipantBadges}
                    removeParticipant={removeParticipant}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Payment or Arrival mode
    const participantList = (
      <div className="space-y-2">
        {sortedApproved.map((participant, index) => (
          <SortableParticipantRow
            key={participant.id}
            participant={participant}
            index={index}
            isAdmin={isAdmin}
            isDragMode={isDragMode}
            sortMode={currentSortMode}
            profile={participant.user_id ? participantProfiles[participant.user_id] : null}
            updateParticipantPaid={updateParticipantPaid}
            updateParticipantBadges={updateParticipantBadges}
            removeParticipant={removeParticipant}
          />
        ))}
      </div>
    )

    if (isDragMode) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedApproved.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {participantList}
          </SortableContext>
        </DndContext>
      )
    }

    return participantList
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xl flex-shrink-0">{categoryInfo.icon}</span>
            <h1 className="text-lg font-bold text-foreground truncate">{game.name}</h1>
          </div>
          <div className="flex items-center justify-between mt-2 pl-10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(game.game_date)}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {game.game_time.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    <Lock className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Editar Partida</DialogTitle>
                        <DialogDescription>Altere os dados da partida e do PIX</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Nome da Partida</Label>
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select
                            value={editData.category}
                            onValueChange={(value: SportCategory) => setEditData({ ...editData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SPORT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  <span className="flex items-center gap-2">
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3 grid-cols-2">
                          <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                              type="date"
                              value={editData.game_date}
                              onChange={(e) => setEditData({ ...editData, game_date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Horario</Label>
                            <Input
                              type="time"
                              value={editData.game_time}
                              onChange={(e) => setEditData({ ...editData, game_time: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Valor da Quadra (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editData.court_value}
                            onChange={(e) => setEditData({ ...editData, court_value: e.target.value })}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Fixar valor por pessoa</Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                O valor nao muda ao adicionar jogadores
                              </p>
                            </div>
                            <Switch
                              checked={editData.fixed_value_per_person !== ""}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const currentPerPerson = approvedParticipants.length > 0
                                    ? (parseFloat(editData.court_value) || 0) / approvedParticipants.length
                                    : 0
                                  setEditData({ ...editData, fixed_value_per_person: currentPerPerson.toFixed(2) })
                                } else {
                                  setEditData({ ...editData, fixed_value_per_person: "" })
                                }
                              }}
                            />
                          </div>
                          {editData.fixed_value_per_person !== "" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Valor fixo (R$)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editData.fixed_value_per_person}
                                onChange={(e) => setEditData({ ...editData, fixed_value_per_person: e.target.value })}
                                className="h-9"
                              />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Local</Label>
                          <Input
                            placeholder="Ex: Arena Soccer, Campo do Parque..."
                            value={editData.location}
                            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                          />
                        </div>

                        <Separator />

                        {/* Sort Mode Settings */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm">Organizacao da Lista</h3>
                          <div className="space-y-2">
                            <Label>Modo de Ordenacao</Label>
                            <Select
                              value={editData.sort_mode}
                              onValueChange={(value: SortMode) => setEditData({ ...editData, sort_mode: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="payment">
                                  <span className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Ordem de Pagamento</span>
                                  </span>
                                </SelectItem>
                                <SelectItem value="teams">
                                  <span className="flex items-center gap-2">
                                    <UsersRound className="h-4 w-4" />
                                    <span>Dividir por Times</span>
                                  </span>
                                </SelectItem>
                                <SelectItem value="arrival">
                                  <span className="flex items-center gap-2">
                                    <ArrowDownUp className="h-4 w-4" />
                                    <span>Ordem de Chegada</span>
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {editData.sort_mode === "payment" && "Os jogadores pagos aparecem primeiro, na ordem que pagaram."}
                              {editData.sort_mode === "teams" && "Os jogadores serao divididos em times automaticamente."}
                              {editData.sort_mode === "arrival" && "Arraste e solte os jogadores para definir a ordem de chegada."}
                            </p>
                          </div>
                          {editData.sort_mode === "teams" && (
                            <div className="space-y-2">
                              <Label>Jogadores por Time</Label>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={editData.players_per_team}
                                onChange={(e) => setEditData({ ...editData, players_per_team: e.target.value })}
                              />
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm">Dados do PIX</h3>
                          <div className="space-y-2">
                            <Label>Chave PIX</Label>
                            <Input
                              placeholder="CPF, E-mail, Celular ou Aleatoria"
                              value={editData.pix_key}
                              onChange={(e) => setEditData({ ...editData, pix_key: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nome do Recebedor</Label>
                            <Input
                              placeholder="Nome completo"
                              value={editData.pix_receiver_name}
                              onChange={(e) => setEditData({ ...editData, pix_receiver_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input
                              placeholder="Ex: Sao Paulo"
                              value={editData.pix_city}
                              onChange={(e) => setEditData({ ...editData, pix_city: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setEditDialogOpen(false)
                            setDeleteDialogOpen(true)
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 sm:flex-none">
                            Cancelar
                          </Button>
                          <Button onClick={updateGame} className="flex-1 sm:flex-none">Salvar</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl">
                    <DialogHeader>
                      <DialogTitle>Acesso de Administrador</DialogTitle>
                      <DialogDescription>
                        Digite a senha para gerenciar participantes e editar a partida
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Senha</Label>
                        <Input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                        />
                        {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={verifyPassword} className="flex-1">Entrar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground leading-tight">Total</p>
                  <p className="text-sm font-bold text-foreground">R$ {Number(game.court_value).toFixed(0)}</p>
                </div>
                <div className="h-6 w-px bg-primary/20" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground leading-tight">Jogadores</p>
                  <p className="text-sm font-bold text-foreground">{approvedParticipants.length}</p>
                </div>
                <div className="h-6 w-px bg-primary/20" />
                <div className="bg-primary rounded-md px-2.5 py-0.5 text-center relative">
                  <p className="text-[10px] text-primary-foreground/80 leading-tight flex items-center justify-center gap-0.5">
                    {isValueFixed && <Lock className="h-2.5 w-2.5" />}
                    Por pessoa
                  </p>
                  <p className="text-sm font-bold text-primary-foreground">R$ {valuePerPerson.toFixed(2)}</p>
                </div>
              </div>
              <Button
                onClick={shareOnWhatsApp}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-[#25D366] hover:bg-[#1da851] text-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </Button>
            </div>
            {(game.location || (isAdmin && approvedParticipants.length > 0)) && (
              <div className="mt-2 pt-2 border-t border-primary/20 flex items-center justify-between text-xs">
                {game.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="underline decoration-dotted underline-offset-2 truncate">{game.location}</span>
                  </a>
                )}
                {isAdmin && approvedParticipants.length > 0 && (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                      {paidCount}
                    </span>
                    {unpaidCount > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Circle className="h-3 w-3" />
                        {unpaidCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Participants (Admin) */}
        {isAdmin && pendingParticipants.length > 0 && (
          <Card className="border-accent/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-accent" />
                  Aguardando Aprovacao
                </span>
                <Badge variant="outline" className="text-xs">{pendingParticipants.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {pendingParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3"
                  >
                    <span className="font-medium text-sm">{participant.name}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => updateParticipantStatus(participant.id, "rejected")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => updateParticipantStatus(participant.id, "approved")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        OK
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unified Participants Card -- list + join form */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Confirmados
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    variant={game.list_closed ? "default" : "outline"}
                    size="sm"
                    onClick={toggleListClosed}
                    className="h-6 text-xs px-2"
                  >
                    {game.list_closed ? (
                      <>
                        <LockOpen className="h-3 w-3 mr-1" />
                        Abrir
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Fechar
                      </>
                    )}
                  </Button>
                )}
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  {sortModeLabels[currentSortMode].icon}
                  {sortModeLabels[currentSortMode].label}
                </Badge>
                <Badge variant="secondary" className="text-xs">{approvedParticipants.length}</Badge>
              </div>
            </CardTitle>
            {isDragMode && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                Arraste os jogadores para definir a ordem de chegada
              </p>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {renderParticipantsList()}

            {/* Public pending view */}
            {!isAdmin && pendingParticipants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Hourglass className="h-3 w-3" />
                  Aguardando aprovacao ({pendingParticipants.length})
                </p>
                <div className="space-y-1">
                  {pendingParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 p-2"
                    >
                      <span className="text-sm text-muted-foreground">{participant.name}</span>
                      <Badge variant="outline" className="text-xs">Pendente</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join form -- integrated at the bottom */}
            <div className="mt-4 pt-4 border-t border-border">
              {game.list_closed ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-3 text-center justify-center">
                  <Lock className="h-4 w-4 text-destructive/60" />
                  <p className="text-sm text-muted-foreground">Inscricoes encerradas</p>
                </div>
              ) : (
                <>
                  {currentUser && !userAlreadyJoined ? (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <Avatar className="h-9 w-9 border border-primary/30">
                        <AvatarImage src={currentUser.avatar_url || undefined} />
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {currentUser.display_name?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {currentUser.display_name || "Jogador"}
                        </p>
                        <p className="text-xs text-muted-foreground">Perfil vinculado</p>
                      </div>
                      <Button
                        onClick={() => addParticipant(currentUser.display_name || "Jogador")}
                        disabled={isAdding}
                        size="sm"
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Participar
                      </Button>
                    </div>
                  ) : currentUser && userAlreadyJoined ? (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 justify-center">
                      <User className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-sm text-foreground">Voce ja esta nesta lista.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Seu nome"
                          value={newParticipantName}
                          onChange={(e) => setNewParticipantName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                          className="h-9"
                        />
                        <Button onClick={() => addParticipant()} disabled={isAdding} size="sm" className="shrink-0">
                          <Plus className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Participar</span>
                          <span className="sm:hidden">OK</span>
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Sujeito a aprovacao do organizador.</p>
                        <Link href="/auth/login" className="text-xs text-primary hover:underline whitespace-nowrap ml-2">
                          Fazer login
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PIX Copia e Cola */}
        {isPixConfigured && approvedParticipants.length > 0 && valuePerPerson > 0 && (
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  PIX
                </p>
                <p className="text-lg font-bold text-primary">R$ {valuePerPerson.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={pixPayload} className="bg-muted font-mono text-xs h-9" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(pixPayload, "pix")}
                  className="shrink-0 h-9 w-9"
                >
                  {copiedId === "pix" ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copiedId === "pix" && <p className="text-xs text-primary">Copiado!</p>}
              <div className="rounded-lg bg-muted p-2.5 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">{game.pix_receiver_name}</span>
                <span className="text-muted-foreground truncate ml-2 max-w-[50%] text-right">{game.pix_key}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!isPixConfigured && isAdmin && (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-foreground">PIX nao configurado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Configure para gerar o codigo de pagamento</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Settings className="mr-1 h-3 w-3" />
                Configurar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Champion Photo */}
        {game.champion_photo_url ? (
          <Card className="border-primary/20 overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Time Campeao
                </span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => championInputRef.current?.click()}
                    disabled={isUploadingChampion}
                  >
                    {isUploadingChampion ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-3 w-3 mr-1" />
                        Trocar
                      </>
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="rounded-lg overflow-hidden border border-border">
                <Image
                  src={game.champion_photo_url || "/placeholder.svg"}
                  alt="Time campeao"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </CardContent>
          </Card>
        ) : isAdmin ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Trophy className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">Foto do Time Campeao</p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                Poste a foto do time vencedor da partida
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => championInputRef.current?.click()}
                className="mt-3"
                disabled={isUploadingChampion}
              >
                {isUploadingChampion ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ImageIcon className="mr-1 h-3 w-3" />
                )}
                {isUploadingChampion ? "Enviando..." : "Enviar Foto"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <input
          ref={championInputRef}
          type="file"
          accept="image/*"
          onChange={handleChampionUpload}
          className="hidden"
        />
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir partida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Todos os participantes serao removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteGame}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="px-4 text-center text-xs text-muted-foreground">
          <p>DivididaPix - Divida a conta de forma simples</p>
        </div>
      </footer>
    </div>
  )
}
