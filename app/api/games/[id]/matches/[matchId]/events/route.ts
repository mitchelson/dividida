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
    .from("match_events")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await params
  const body = await request.json()
  const { password, event_type, event_time, participant_id, team, description } = body

  const supabase = await createClient()

  // Verify admin password
  const { data: game } = await supabase.from("games").select("password_hash").eq("id", id).single()
  if (!game) return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })

  const isValid = await bcrypt.compare(password, game.password_hash)
  if (!isValid) return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })

  // Insert event
  const { data: event, error: eventError } = await supabase
    .from("match_events")
    .insert({
      match_id: matchId,
      game_id: id,
      event_type,
      event_time: event_time || 0,
      participant_id: participant_id || null,
      team: team || null,
      description: description || null,
    })
    .select()
    .single()

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })

  return NextResponse.json(event)
}
