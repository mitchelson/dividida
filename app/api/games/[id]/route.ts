import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("games")
      .select("*, participants(*)")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password, ...updateData } = body

    const supabase = await createClient()

    // Verificar senha
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

    const { data, error } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    const supabase = await createClient()

    // Verificar senha
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

    const { error } = await supabase.from("games").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
