import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, game_date, game_time, court_value, password, category, location } = body

    if (!name || !game_date || !game_time || !password) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      )
    }

    const password_hash = await bcrypt.hash(password, 10)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("games")
      .insert({
        name,
        game_date,
        game_time,
        court_value: court_value || 0,
        password_hash,
        category: category || "futebol",
        location: location || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar partida:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("games")
      .select("*, participants(*)")
      .order("game_date", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
