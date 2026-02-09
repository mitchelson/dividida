import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params
  const body = await request.json()
  const { password, participant_id, team, minute } = body

  const supabase = await createClient()

  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida nao encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  // Insert goal
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({ match_id: matchId, game_id: id, participant_id, team, minute })
    .select()
    .single()

  if (goalError) return NextResponse.json({ error: goalError.message }, { status: 500 })

  // Update match score
  const scoreField = team === "a" ? "score_a" : "score_b"
  const { data: match } = await supabase.from("matches").select(scoreField).eq("id", matchId).single()
  if (match) {
    await supabase
      .from("matches")
      .update({ [scoreField]: (match[scoreField] as number) + 1 })
      .eq("id", matchId)
  }

  return NextResponse.json(goal)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params
  const body = await request.json()
  const { password, goal_id, team } = body

  const supabase = await createClient()

  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida nao encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  await supabase.from("goals").delete().eq("id", goal_id)

  // Decrease match score
  const scoreField = team === "a" ? "score_a" : "score_b"
  const { data: match } = await supabase.from("matches").select(scoreField).eq("id", matchId).single()
  if (match) {
    await supabase
      .from("matches")
      .update({ [scoreField]: Math.max(0, (match[scoreField] as number) - 1) })
      .eq("id", matchId)
  }

  return NextResponse.json({ success: true })
}
