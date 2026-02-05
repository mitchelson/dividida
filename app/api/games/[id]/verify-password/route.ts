import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: game } = await supabase
      .from("games")
      .select("password_hash")
      .eq("id", id)
      .single()

    if (!game) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(password, game.password_hash)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
