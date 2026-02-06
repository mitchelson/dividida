"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronRight,
  ChevronDown,
  History,
  Lock,
  LockOpen,
  MapPin,
  User,
  LogIn,
} from "lucide-react"
import type { Game, Participant, SportCategory } from "@/lib/types"
import { SPORT_CATEGORIES } from "@/lib/types"

interface UserSummary {
  id: string
  display_name: string | null
  avatar_url: string | null
  overall: number
  position: string
}

interface GamesListPageProps {
  initialGames: (Game & { participants: Participant[] })[]
  user?: UserSummary | null
}

export function GamesListPage({ initialGames, user }: GamesListPageProps) {
  const [games, setGames] = useState(initialGames)
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showPastGames, setShowPastGames] = useState(false)
  const [newGame, setNewGame] = useState({
    name: "",
    game_date: "",
    game_time: "",
    court_value: "",
    location: "",
    password: "",
    category: "futebol" as SportCategory,
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { upcomingGames, pastGames } = useMemo(() => {
    const upcoming: (Game & { participants: Participant[] })[] = []
    const past: (Game & { participants: Participant[] })[] = []

    games.forEach((game) => {
      const gameDate = new Date(game.game_date + "T00:00:00")
      if (gameDate >= today) {
        upcoming.push(game)
      } else {
        past.push(game)
      }
    })

    upcoming.sort((a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime())
    past.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())

    return { upcomingGames: upcoming, pastGames: past }
  }, [games, today])

  const handleCreateGame = async () => {
    if (!newGame.name || !newGame.game_date || !newGame.game_time || !newGame.password) {
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGame.name,
          game_date: newGame.game_date,
          game_time: newGame.game_time,
          court_value: parseFloat(newGame.court_value) || 0,
          location: newGame.location || null,
          password: newGame.password,
          category: newGame.category,
        }),
      })

      if (response.ok) {
        const createdGame = await response.json()
        setGames([...games, { ...createdGame, participants: [] }])
        setNewGame({ name: "", game_date: "", game_time: "", court_value: "", location: "", password: "", category: "futebol" })
        setDialogOpen(false)
      }
    } catch (error) {
      console.error("Erro ao criar partida:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5)
  }

  const getApprovedCount = (participants: Participant[]) => {
    return participants.filter((p) => p.status === "approved").length
  }

  const getPendingCount = (participants: Participant[]) => {
    return participants.filter((p) => p.status === "pending").length
  }

  const getCategoryInfo = (category: SportCategory) => {
    return SPORT_CATEGORIES.find((c) => c.value === category) || SPORT_CATEGORIES[0]
  }

  const GameCard = ({ game, isPast = false }: { game: Game & { participants: Participant[] }; isPast?: boolean }) => {
    const categoryInfo = getCategoryInfo(game.category || "futebol")
    
    return (
      <Link href={`/jogo/${game.id}`}>
        <Card className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${isPast ? "opacity-70" : ""}`}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl flex-shrink-0">{categoryInfo.icon}</span>
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{game.name}</CardTitle>
                  <CardDescription className="text-xs capitalize truncate">
                    {formatDate(game.game_date)}
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className="text-xs">
                {categoryInfo.label}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(game.game_time)}
              </span>
              {game.list_closed ? (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  <Lock className="h-2.5 w-2.5 mr-0.5" />
                  Fechada
                </Badge>
              ) : (
                <Badge className="text-xs px-1.5 py-0 bg-emerald-600 text-white hover:bg-emerald-600">
                  <LockOpen className="h-2.5 w-2.5 mr-0.5" />
                  Aberta
                </Badge>
              )}
            </div>

            {game.location && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate underline decoration-dotted underline-offset-2">{game.location}</span>
              </a>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  {getApprovedCount(game.participants)}
                </span>
                {getPendingCount(game.participants) > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    +{getPendingCount(game.participants)}
                  </Badge>
                )}
              </div>
              <span className="font-bold text-primary text-sm">
                R$ {Number(game.court_value).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Mobile-First */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg">💸</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">DivididaPix</h1>
                <p className="text-xs text-muted-foreground">Divida a conta facilmente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link href="/perfil">
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                    <Avatar className="h-6 w-6 border border-primary/30">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                        {user.display_name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs font-medium truncate max-w-20">
                      {user.display_name || "Perfil"}
                    </span>
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                    Entrar
                  </Button>
                </Link>
              )}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Nova Partida</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Partida</DialogTitle>
                    <DialogDescription>
                      Preencha os dados da partida. A senha será usada para gerenciar os participantes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Partida</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Futebol de Sábado"
                        value={newGame.name}
                        onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={newGame.category}
                        onValueChange={(value: SportCategory) => setNewGame({ ...newGame, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
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
                        <Label htmlFor="date">Data</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newGame.game_date}
                          onChange={(e) => setNewGame({ ...newGame, game_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Horário</Label>
                        <Input
                          id="time"
                          type="time"
                          value={newGame.game_time}
                          onChange={(e) => setNewGame({ ...newGame, game_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Valor da Quadra (R$)</Label>
                      <Input
                        id="value"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 200.00"
                        value={newGame.court_value}
                        onChange={(e) => setNewGame({ ...newGame, court_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Local</Label>
                      <Input
                        id="location"
                        placeholder="Ex: Arena Soccer, Campo do Parque..."
                        value={newGame.location}
                        onChange={(e) => setNewGame({ ...newGame, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha de Administração</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Senha para gerenciar a partida"
                        value={newGame.password}
                        onChange={(e) => setNewGame({ ...newGame, password: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Guarde essa senha! Ela será necessária para aprovar participantes.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateGame} disabled={isCreating} className="flex-1">
                      {isCreating ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        {upcomingGames.length === 0 && pastGames.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <span className="text-5xl mb-4">🏆</span>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Nenhuma partida ainda</h2>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Crie sua primeira partida e convide os jogadores!
              </p>
              <Button onClick={() => setDialogOpen(true)} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Criar Primeira Partida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Próximas partidas */}
            {upcomingGames.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Próximas Partidas
                  </h2>
                  <Badge variant="secondary" className="text-xs">{upcomingGames.length}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            )}

            {/* Partidas passadas */}
            {pastGames.length > 0 && (
              <Collapsible open={showPastGames} onOpenChange={setShowPastGames}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between py-2 h-auto">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <History className="h-4 w-4" />
                      Partidas Anteriores
                      <Badge variant="outline" className="text-xs">{pastGames.length}</Badge>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPastGames ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pastGames.map((game) => (
                      <GameCard key={game.id} game={game} isPast />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="px-4 text-center text-xs text-muted-foreground">
          <p>DivididaPix - Divida a conta de forma simples e rápida</p>
        </div>
      </footer>
    </div>
  )
}
