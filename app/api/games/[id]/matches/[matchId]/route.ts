import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params
  const body = await request.json()
  const { password, ...updateData } = body

  const supabase = await createClient()

  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida nao encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  const { data, error } = await supabase
    .from("matches")
    .update(updateData)
    .eq("id", matchId)
    .eq("game_id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params
  const body = await request.json()
  const { password } = body

  const supabase = await createClient()

  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida nao encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  await supabase.from("matches").delete().eq("id", matchId).eq("game_id", id)
  return NextResponse.json({ success: true })
}
