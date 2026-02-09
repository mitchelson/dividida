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

  // Check if the match was NOT finished before and is now being finished
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("status, team_a_name, team_b_name")
    .eq("id", matchId)
    .single()

  const { data, error } = await supabase
    .from("matches")
    .update(updateData)
    .eq("id", matchId)
    .eq("game_id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If match just finished, update games_played for all participants in both teams
  if (updateData.status === "finished" && existingMatch?.status !== "finished") {
    const teamNames = [existingMatch?.team_a_name, existingMatch?.team_b_name].filter(Boolean)

    // Get all participants of this game
    const { data: allParticipants } = await supabase
      .from("participants")
      .select("id, user_id, team_index")
      .eq("game_id", id)
      .eq("status", "approved")

    if (allParticipants) {
      // Build team name to index mapping (Time 1 = index 0, Time 2 = index 1, etc.)
      const teamIndices: number[] = []
      teamNames.forEach((name) => {
        const match = name?.match(/Time (\d+)/)
        if (match) teamIndices.push(parseInt(match[1]) - 1)
      })

      // Find participants in those teams with a user_id
      const userIds = allParticipants
        .filter((p) => p.user_id && p.team_index != null && teamIndices.includes(p.team_index))
        .map((p) => p.user_id as string)

      // Get unique user IDs
      const uniqueUserIds = [...new Set(userIds)]

      // For each user, count total finished matches they played in
      for (const userId of uniqueUserIds) {
        // Get all participant IDs for this user
        const { data: userParticipants } = await supabase
          .from("participants")
          .select("id, game_id, team_index")
          .eq("user_id", userId)
          .eq("status", "approved")

        if (userParticipants) {
          let totalMatchesPlayed = 0

          // Group by game_id
          const byGame: Record<string, { ids: string[]; teamIndices: number[] }> = {}
          userParticipants.forEach((up) => {
            if (!byGame[up.game_id]) byGame[up.game_id] = { ids: [], teamIndices: [] }
            byGame[up.game_id].ids.push(up.id)
            if (up.team_index != null) byGame[up.game_id].teamIndices.push(up.team_index)
          })

          for (const [gameId, info] of Object.entries(byGame)) {
            // Get all finished matches for this game
            const { data: finishedMatches } = await supabase
              .from("matches")
              .select("team_a_name, team_b_name")
              .eq("game_id", gameId)
              .eq("status", "finished")

            if (finishedMatches) {
              finishedMatches.forEach((fm) => {
                const matchTeamA = fm.team_a_name.match(/Time (\d+)/)
                const matchTeamB = fm.team_b_name.match(/Time (\d+)/)
                const teamAIdx = matchTeamA ? parseInt(matchTeamA[1]) - 1 : -1
                const teamBIdx = matchTeamB ? parseInt(matchTeamB[1]) - 1 : -1

                if (info.teamIndices.includes(teamAIdx) || info.teamIndices.includes(teamBIdx)) {
                  totalMatchesPlayed++
                }
              })
            }
          }

          await supabase
            .from("profiles")
            .update({ games_played: totalMatchesPlayed })
            .eq("id", userId)
        }
      }
    }
  }

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
