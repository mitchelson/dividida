import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar se a partida existe e se a lista está aberta
    const { data: game } = await supabase
      .from("games")
      .select("id, list_closed")
      .eq("id", id)
      .single()

    if (!game) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    if (game.list_closed) {
      return NextResponse.json(
        { error: "A lista de participantes está fechada" },
        { status: 403 }
      )
    }

    // Verificar se já existe participante com mesmo nome
    const { data: existing } = await supabase
      .from("participants")
      .select("id")
      .eq("game_id", id)
      .ilike("name", name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um participante com esse nome" },
        { status: 400 }
      )
    }

    // Check if the user is authenticated to link profile
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check if this user already joined this game
      const { data: existingByUser } = await supabase
        .from("participants")
        .select("id")
        .eq("game_id", id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingByUser) {
        return NextResponse.json(
          { error: "Voce ja esta inscrito nesta partida" },
          { status: 400 }
        )
      }
    }

    const insertData: Record<string, unknown> = {
      game_id: id,
      name,
      status: "pending",
    }

    if (user) {
      insertData.user_id = user.id
    }

    const { data, error } = await supabase
      .from("participants")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("game_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
