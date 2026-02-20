export type SportCategory = 'futebol' | 'futsal' | 'volei' | 'beachtenis' | 'futvolei'

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
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  game_id: string
  name: string
  status: 'pending' | 'approved' | 'rejected'
  paid: boolean
  badges: ParticipantBadge[]
  created_at: string
  updated_at: string
}

export interface GameWithParticipants extends Game {
  participants: Participant[]
}
