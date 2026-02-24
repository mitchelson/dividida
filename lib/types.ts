export type SportCategory = 'futebol' | 'futsal' | 'volei' | 'beachtenis' | 'futvolei'

export type SortMode = 'payment' | 'teams' | 'arrival'

export type ParticipantBadge = 'MVP' | 'Bola Murcha' | 'Artilheiro' | 'Craque' | 'Paredão' | 'Garçom' | 'Cestinha' | 'Ace' | 'Pipoqueiro'

export const SPORT_CATEGORIES: { value: SportCategory; label: string; icon: string }[] = [
  { value: 'futebol', label: 'Futebol', icon: '⚽' },
  { value: 'futsal', label: 'Futsal', icon: '🥅' },
  { value: 'volei', label: 'Vôlei', icon: '🏐' },
  { value: 'beachtenis', label: 'Beach Tennis', icon: '🎾' },
  { value: 'futvolei', label: 'Futevôlei', icon: '🏖️' },
]

export const PARTICIPANT_BADGES: { value: ParticipantBadge; label: string; color: string }[] = [
  { value: 'MVP', label: 'MVP', color: 'bg-yellow-500' },
  { value: 'Artilheiro', label: 'Artilheiro', color: 'bg-red-500' },
  { value: 'Craque', label: 'Craque', color: 'bg-blue-500' },
  { value: 'Paredão', label: 'Paredão', color: 'bg-emerald-500' },
  { value: 'Garçom', label: 'Garçom', color: 'bg-purple-500' },
  { value: 'Cestinha', label: 'Cestinha', color: 'bg-orange-500' },
  { value: 'Ace', label: 'Ace', color: 'bg-cyan-500' },
  { value: 'Bola Murcha', label: 'Bola Murcha', color: 'bg-gray-500' },
  { value: 'Pipoqueiro', label: 'Pipoqueiro', color: 'bg-rose-400' },
]

export interface Game {
  id: string
  name: string
  game_date: string
  game_time: string
  court_value: number
  password_hash: string
  pix_key: string | null
  pix_receiver_name: string | null
  pix_city: string | null
  category: SportCategory
  list_closed: boolean
  location: string | null
  sort_mode: SortMode
  players_per_team: number
  champion_photo_url: string | null
  fixed_value_per_person: number | null
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  game_id: string
  name: string
  status: 'pending' | 'approved' | 'rejected'
  paid: boolean
  paid_at: string | null
  badges: ParticipantBadge[]
  sort_order: number
  team_index: number | null
  user_id: string | null
  player_number: number | null
  created_at: string
  updated_at: string
}

export interface GameWithParticipants extends Game {
  participants: Participant[]
}

export type MatchStatus = 'draft' | 'playing' | 'completed'

export interface Match {
  id: string
  game_id: string
  team_a_name: string
  team_b_name: string
  score_a: number
  score_b: number
  status: MatchStatus
  elapsed_seconds: number
  match_order: number
  enable_player_numbers: boolean
  started_at: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  match_id: string
  game_id: string
  participant_id: string
  team: 'a' | 'b'
  minute: number | null
  created_at: string
}

export interface MatchEvent {
  id: string
  match_id: string
  game_id: string
  event_type: 'started' | 'paused' | 'resumed' | 'finished' | 'goal'
  event_time: number
  participant_id: string | null
  team: 'a' | 'b' | null
  description: string | null
  created_at: string
}

export const POSITIONS = [
  'GOL', 'ZAG', 'LE', 'LD', 'VOL', 'MC', 'ME', 'MD', 'MEI', 'SA', 'PE', 'PD', 'ATA'
] as const

export type PlayerPosition = typeof POSITIONS[number]
