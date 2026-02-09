import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("game_id", id)
    .order("match_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { password, team_a_name, team_b_name, match_order } = body

  const supabase = await createClient()

  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida nao encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  const { data, error } = await supabase
    .from("matches")
    .insert({ game_id: id, team_a_name, team_b_name, match_order: match_order || 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
