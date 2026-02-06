"use client"

import React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Settings,
  LogOut,
  Save,
  User,
  Trophy,
  Target,
  Handshake,
  Camera,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PlayerCard } from "@/components/player-card"
import type { PlayerProfile } from "@/lib/types"
import { POSITIONS } from "@/lib/types"

interface ProfilePageClientProps {
  initialProfile: PlayerProfile
  userEmail: string
}

export function ProfilePageClient({ initialProfile, userEmail }: ProfilePageClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile>(initialProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [editData, setEditData] = useState({
    display_name: profile.display_name || "",
    position: profile.position || "ATA",
    stat_pace: profile.stat_pace,
    stat_shooting: profile.stat_shooting,
    stat_passing: profile.stat_passing,
    stat_dribbling: profile.stat_dribbling,
    stat_defending: profile.stat_defending,
    stat_physical: profile.stat_physical,
    games_played: profile.games_played,
    goals: profile.goals,
    assists: profile.assists,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "avatars")
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()

      const saveRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      })
      if (saveRes.ok) {
        const updatedProfile = await saveRes.json()
        setProfile(updatedProfile)
      }
    } catch (error) {
      console.error("Erro ao enviar foto:", error)
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  const statFields = [
    { key: "stat_pace", label: "Ritmo (RIT)", description: "Velocidade e aceleracao" },
    { key: "stat_shooting", label: "Finalizacao (FIN)", description: "Chute a gol e precisao" },
    { key: "stat_passing", label: "Passe (PAS)", description: "Passes curtos e longos" },
    { key: "stat_dribbling", label: "Drible (DRI)", description: "Controle de bola e dribles" },
    { key: "stat_defending", label: "Defesa (DEF)", description: "Marcacao e desarmes" },
    { key: "stat_physical", label: "Fisico (FIS)", description: "Forca e resistencia" },
  ] as const

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold text-foreground">Meu Perfil</h1>
            </div>
            <div className="flex items-center gap-1">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                      Ajuste seus dados e atributos de jogador
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-2">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Dados Basicos
                      </h3>
                      <div className="space-y-2">
                        <Label>Nome de Jogador</Label>
                        <Input
                          value={editData.display_name}
                          onChange={(e) =>
                            setEditData({ ...editData, display_name: e.target.value })
                          }
                          placeholder="Seu nome ou apelido"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Posicao</Label>
                        <Select
                          value={editData.position}
                          onValueChange={(value) =>
                            setEditData({ ...editData, position: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POSITIONS.map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {pos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Career Stats */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        Carreira
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Jogos</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editData.games_played}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                games_played: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Gols</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editData.goals}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                goals: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Assistencias</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editData.assists}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                assists: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Attributes */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Atributos
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Avalie suas habilidades de 1 a 99. Seja honesto!
                      </p>
                      {statFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">{field.label}</Label>
                            <span className="text-sm font-bold tabular-nums text-primary">
                              {editData[field.key]}
                            </span>
                          </div>
                          <Slider
                            value={[editData[field.key]]}
                            onValueChange={([value]) =>
                              setEditData({ ...editData, [field.key]: value })
                            }
                            min={1}
                            max={99}
                            step={1}
                          />
                          <p className="text-[11px] text-muted-foreground">
                            {field.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Avatar Upload + Player Card */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative group"
            >
              <div className="h-20 w-20 rounded-full border-2 border-primary/30 overflow-hidden bg-muted">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url || "/placeholder.svg"}
                    alt={profile.display_name || "Avatar"}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <User className="h-8 w-8 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">Toque na foto para alterar</p>
        </div>
        <PlayerCard profile={profile} size="lg" />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile.games_played}</p>
              <p className="text-xs text-muted-foreground">Jogos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile.goals}</p>
              <p className="text-xs text-muted-foreground">Gols</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Handshake className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{profile.assists}</p>
              <p className="text-xs text-muted-foreground">Assist.</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-medium truncate ml-4">{userEmail}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Posicao</span>
                <span className="text-foreground font-medium">{profile.position || "ATA"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall</span>
                <span className="text-primary font-bold">{profile.overall}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Prompt */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Settings className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground text-balance text-center">
              Personalize seu cartao de jogador
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Ajuste seus atributos, posicao e estatisticas de carreira
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="mt-3"
            >
              <Settings className="mr-1 h-3 w-3" />
              Editar Perfil
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="px-4 text-center text-xs text-muted-foreground">
          <p>DivididaPix - Divida a conta de forma simples</p>
        </div>
      </footer>
    </div>
  )
}
