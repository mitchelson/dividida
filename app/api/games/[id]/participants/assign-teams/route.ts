import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { password, assignments } = body
  // assignments: Array<{ participant_id: string, team_index: number, sort_order: number }>

  if (!password) return NextResponse.json({ error: "Senha obrigatoria" }, { status: 400 })
  if (!Array.isArray(assignments)) return NextResponse.json({ error: "assignments invalido" }, { status: 400 })

  const supabase = await createClient()

  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida nao encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  const updates = assignments.map((a: { participant_id: string; team_index: number; sort_order: number }) =>
    supabase
      .from("participants")
      .update({ team_index: a.team_index, sort_order: a.sort_order })
      .eq("id", a.participant_id)
      .eq("game_id", id)
  )

  await Promise.all(updates)
  return NextResponse.json({ success: true })
}
