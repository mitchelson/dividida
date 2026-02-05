"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
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
  QrCode,
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
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import type { Game, Participant, SportCategory, ParticipantBadge } from "@/lib/types"
import { SPORT_CATEGORIES, PARTICIPANT_BADGES } from "@/lib/types"

interface GameDetailsPageProps {
  initialGame: Game & { participants: Participant[] }
}

export function GameDetailsPage({ initialGame }: GameDetailsPageProps) {
  const router = useRouter()
  const [game, setGame] = useState(initialGame)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [newParticipantName, setNewParticipantName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
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
    category: game.category || "futebol",
  })

  const approvedParticipants = game.participants.filter((p) => p.status === "approved")
  const pendingParticipants = game.participants.filter((p) => p.status === "pending")

  const valuePerPerson = useMemo(() => {
    if (approvedParticipants.length === 0 || Number(game.court_value) <= 0) return 0
    return Number(game.court_value) / approvedParticipants.length
  }, [approvedParticipants.length, game.court_value])

  const categoryInfo = SPORT_CATEGORIES.find((c) => c.value === (game.category || "futebol")) || SPORT_CATEGORIES[0]

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

  const addParticipant = async () => {
    if (!newParticipantName.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch(`/api/games/${game.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newParticipantName.trim() }),
      })

      if (response.ok) {
        const newParticipant = await response.json()
        setGame({
          ...game,
          participants: [...game.participants, newParticipant],
        })
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

  const updateParticipantPaid = async (participantId: string, paid: boolean) => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid, password: adminPassword }),
      })

      if (response.ok) {
        setGame({
          ...game,
          participants: game.participants.map((p) =>
            p.id === participantId ? { ...p, paid } : p
          ),
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
    }
  }

  const updateParticipantBadges = async (participantId: string, badges: ParticipantBadge[]) => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badges, password: adminPassword }),
      })

      if (response.ok) {
        setGame({
          ...game,
          participants: game.participants.map((p) =>
            p.id === participantId ? { ...p, badges } : p
          ),
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar badges:", error)
    }
  }

  const removeParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/games/${game.id}/participants/${participantId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      })

      if (response.ok) {
        setGame({
          ...game,
          participants: game.participants.filter((p) => p.id !== participantId),
        })
      }
    } catch (error) {
      console.error("Erro ao remover participante:", error)
    }
  }

  const updateGame = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          court_value: parseFloat(editData.court_value) || 0,
          password: adminPassword,
        }),
      })

      if (response.ok) {
        const updatedGame = await response.json()
        setGame({ ...game, ...updatedGame })
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

  const toggleListClosed = async () => {
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list_closed: !game.list_closed,
          password: adminPassword,
        }),
      })

      if (response.ok) {
        setGame({ ...game, list_closed: !game.list_closed })
      }
    } catch (error) {
      console.error("Erro ao alterar status da lista:", error)
    }
  }

  const generatePixPayload = (value: number): string => {
    if (!game.pix_key || !game.pix_receiver_name || !game.pix_city) return ""

    const removeAccents = (str: string): string => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .toUpperCase()
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
      payloadFormatIndicator +
      pointOfInitiation +
      merchantAccountInfo +
      merchantCategoryCode +
      transactionCurrency +
      transactionAmount +
      countryCode +
      merchantName +
      merchantCity +
      additionalDataField

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
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const paidCount = approvedParticipants.filter((p) => p.paid).length
  const unpaidCount = approvedParticipants.length - paidCount

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Mobile-First */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-4 py-3">
          {/* Linha 1: Voltar + Nome + Icone */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xl flex-shrink-0">{categoryInfo.icon}</span>
            <h1 className="text-lg font-bold text-foreground truncate">{game.name}</h1>
          </div>
          
          {/* Linha 2: Data + Badge Admin + Botão Editar */}
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
                            <Label>Horário</Label>
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

                        <Separator />

                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm">Dados do PIX</h3>
                          <div className="space-y-2">
                            <Label>Chave PIX</Label>
                            <Input
                              placeholder="CPF, E-mail, Celular ou Aleatória"
                              value={editData.pix_key}
                              onChange={(e) => setEditData({ ...editData, pix_key: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nome do Recebedor</Label>
                            <Input
                              placeholder="Nome completo"
                              value={editData.pix_receiver_name}
                              onChange={(e) =>
                                setEditData({ ...editData, pix_receiver_name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade</Label>
                            <Input
                              placeholder="Ex: São Paulo"
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
        {/* Resumo Compacto */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-foreground">
                  R$ {Number(game.court_value).toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pessoas</p>
                <p className="text-lg font-bold text-foreground">{approvedParticipants.length}</p>
              </div>
              <div className="bg-primary rounded-lg py-1">
                <p className="text-xs text-primary-foreground/80">Por pessoa</p>
                <p className="text-lg font-bold text-primary-foreground">
                  R$ {valuePerPerson.toFixed(2)}
                </p>
              </div>
            </div>
            
            {isAdmin && approvedParticipants.length > 0 && (
              <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  {paidCount} pagos
                </span>
                {unpaidCount > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Circle className="h-3 w-3" />
                    {unpaidCount} pendentes
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adicionar Participante */}
        <Card className={game.list_closed ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                {game.list_closed ? (
                  <Lock className="h-4 w-4 text-destructive" />
                ) : (
                  <Users className="h-4 w-4 text-primary" />
                )}
                {game.list_closed ? "Lista Fechada" : "Participar da Partida"}
              </span>
              {isAdmin && (
                <Button
                  variant={game.list_closed ? "default" : "outline"}
                  size="sm"
                  onClick={toggleListClosed}
                  className="h-7 text-xs"
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
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {game.list_closed ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/30 p-6 text-center">
                <Lock className="mb-2 h-8 w-8 text-destructive/50" />
                <p className="text-sm text-muted-foreground">
                  As inscricoes estao encerradas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O valor por pessoa foi fixado em R$ {valuePerPerson.toFixed(2)}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Seu nome"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                    className="h-10"
                  />
                  <Button onClick={addParticipant} disabled={isAdding} className="shrink-0 h-10">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Participar</span>
                    <span className="sm:hidden">OK</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O organizador precisara aprovar sua participacao.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Participantes Pendentes (Admin) */}
        {isAdmin && pendingParticipants.length > 0 && (
          <Card className="border-accent/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-accent" />
                  Aguardando Aprovação
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

        {/* Lista de Participantes Confirmados */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Confirmados
              </span>
              <Badge variant="secondary" className="text-xs">{approvedParticipants.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {approvedParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhum confirmado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {approvedParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                      participant.paid 
                        ? "border-primary/30 bg-primary/5" 
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isAdmin && (
                        <Checkbox
                          checked={participant.paid}
                          onCheckedChange={(checked) => updateParticipantPaid(participant.id, !!checked)}
                          className="flex-shrink-0"
                        />
                      )}
                      {!isAdmin && participant.paid && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`font-medium text-sm truncate block ${participant.paid ? "text-primary" : "text-foreground"}`}>
                          {participant.name}
                        </span>
                        {(participant.badges?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {participant.badges?.map((badge) => {
                              const badgeInfo = PARTICIPANT_BADGES.find((b) => b.value === badge)
                              return badgeInfo ? (
                                <Badge
                                  key={badge}
                                  className={`text-xs px-1.5 py-0 ${badgeInfo.color} text-white`}
                                >
                                  {badgeInfo.label}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => updateParticipantPaid(participant.id, !participant.paid)}
                          >
                            {participant.paid ? (
                              <>
                                <Circle className="h-4 w-4 mr-2" />
                                Marcar não pago
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
                ))}
              </div>
            )}

            {/* Participantes Pendentes (Visualização pública) */}
            {!isAdmin && pendingParticipants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Hourglass className="h-3 w-3" />
                  Aguardando aprovação ({pendingParticipants.length})
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
          </CardContent>
        </Card>

        {/* QR Code PIX */}
        {isPixConfigured && approvedParticipants.length > 0 && valuePerPerson > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                PIX para Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl bg-card p-3 shadow-lg border">
                  <QRCodeSVG value={pixPayload} size={160} level="M" includeMargin className="rounded-lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Valor a pagar</p>
                  <p className="text-2xl font-bold text-primary">R$ {valuePerPerson.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Código PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input readOnly value={pixPayload} className="bg-muted font-mono text-xs h-10" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(pixPayload, "pix")}
                    className="shrink-0 h-10 w-10"
                  >
                    {copiedId === "pix" ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copiedId === "pix" && <p className="text-xs text-primary">Copiado!</p>}
              </div>

              <div className="rounded-lg bg-muted p-3 text-xs">
                <p className="font-medium text-foreground mb-1">Recebedor:</p>
                <p className="text-muted-foreground">{game.pix_receiver_name}</p>
                <p className="text-muted-foreground truncate">{game.pix_key}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isPixConfigured && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <QrCode className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">PIX não configurado</p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {isAdmin ? "Configure os dados do PIX para gerar o QR Code" : "O organizador ainda não configurou os dados do PIX"}
              </p>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="mt-3">
                  <Settings className="mr-1 h-3 w-3" />
                  Configurar
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir partida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os participantes serão removidos.
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
