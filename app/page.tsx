import { createClient } from "@/lib/supabase/server"
import { GamesListPage } from "@/components/games-list-page"
import type { Game, Participant } from "@/lib/types"

export const revalidate = 0

export default async function Home() {
  const supabase = await createClient()

  const { data: games } = await supabase
    .from("games")
    .select("*, participants(*)")
    .order("game_date", { ascending: true })

  const gamesWithParticipants = (games || []).map((game) => ({
    ...game,
    participants: game.participants || [],
  })) as (Game & { participants: Participant[] })[]

  return <GamesListPage initialGames={gamesWithParticipants} />
}
