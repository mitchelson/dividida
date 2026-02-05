import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params
    const body = await request.json()
    const { status, paid, badges, password } = body

    if (!password) {
      return NextResponse.json(
        { error: "Senha obrigatória" },
        { status: 400 }
      )
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

    // Montar objeto de atualização apenas com campos fornecidos
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (paid !== undefined) {
      updateData.paid = paid
      updateData.paid_at = paid ? new Date().toISOString() : null
    }
    if (badges !== undefined) updateData.badges = badges
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

    const { data, error } = await supabase
      .from("participants")
      .update(updateData)
      .eq("id", participantId)
      .eq("game_id", id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 })
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

    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("id", participantId)
      .eq("game_id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
