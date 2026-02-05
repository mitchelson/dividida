import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password, orderedIds } = body

    if (!password) {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 })
    }

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds deve ser um array" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar senha da partida
    const { data: game } = await supabase
      .from("games")
      .select("password_hash")
      .eq("id", id)
      .single()

    if (!game) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(password, game.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    // Update sort_order for each participant
    const updates = orderedIds.map((participantId: string, index: number) =>
      supabase
        .from("participants")
        .update({ sort_order: index })
        .eq("id", participantId)
        .eq("game_id", id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
