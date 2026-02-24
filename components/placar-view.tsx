'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { Match, Goal, MatchEvent } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export function PlacarView({ matchId }: { matchId: string }) {
  const searchParams = useSearchParams()
  const realMatchId = searchParams?.get('matchId') || matchId
  
  const [match, setMatch] = useState<Match | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [gameId, setGameId] = useState<string>('')
  const [elapsedTime, setElapsedTime] = useState(0)

  // Calcular tempo decorrido baseado em started_at
  useEffect(() => {
    if (!match?.started_at || match.status !== 'playing') {
      setElapsedTime(match?.elapsed_seconds || 0)
      return
    }

    const timer = setInterval(() => {
      const startTime = new Date(match.started_at!).getTime()
      const now = new Date().getTime()
      const diffSeconds = Math.floor((now - startTime) / 1000)
      setElapsedTime(diffSeconds)
    }, 1000)

    return () => clearInterval(timer)
  }, [match?.started_at, match?.status, match?.elapsed_seconds])

  // Fetch match data
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .eq('id', realMatchId)
          .single()

        if (error) {
          console.error('Error fetching match:', error)
          setLoading(false)
          return
        }

        setMatch(data as Match)
        setGameId(data.game_id)
        setElapsedTime(data.elapsed_seconds || 0)
        setLoading(false)
      } catch (err) {
        console.error('Exception fetching match:', err)
        setLoading(false)
      }
    }

    if (realMatchId) {
      fetchMatch()
      
      // Subscribe to match updates
      const subscription = supabase
        .channel(`matches_${realMatchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${realMatchId}`,
          },
          (payload) => {
            setMatch(payload.new as Match)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [realMatchId])

  // Fetch match events
  useEffect(() => {
    if (!realMatchId) return

    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('match_events')
          .select('*')
          .eq('match_id', realMatchId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setEvents(data as MatchEvent[])
        }
      } catch (err) {
        console.error('Exception fetching events:', err)
      }
    }

    fetchEvents()

    // Subscribe to new events
    const subscription = supabase
      .channel(`events_${realMatchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${realMatchId}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as MatchEvent, ...prev])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [realMatchId])

  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Partida não encontrada</p>
        <Link href={`/jogo/${gameId}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    )
  }

  // Filtrar eventos por tipo para exibição
  const startedEvents = events.filter(e => e.event_type === 'started')
  const goalEvents = events.filter(e => e.event_type === 'goal')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/jogo/${gameId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Placar ao Vivo</h1>
        <div className="w-10" />
      </div>

      {/* Score Display */}
      <Card className="p-8 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-2 truncate">{match.team_a_name}</p>
            <p className="text-6xl font-bold text-foreground">{match.score_a}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl font-bold text-primary font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">
              {match.status === 'playing' ? '🔴 AO VIVO' : match.status === 'draft' ? '⏲ AGENDADA' : '✓ ENCERRADA'}
            </div>
          </div>

          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-2 truncate">{match.team_b_name}</p>
            <p className="text-6xl font-bold text-foreground">{match.score_b}</p>
          </div>
        </div>
      </Card>

      {/* Events Timeline */}
      <Card className="flex-1 mb-6 p-4 flex flex-col">
        <h2 className="font-semibold text-lg mb-4">Timeline de Eventos</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
          ) : (
            events.map((event) => {
              const eventLabel = {
                'started': '▶️ Iniciado',
                'paused': '⏸ Pausado',
                'resumed': '▶️ Retomado',
                'finished': '✓ Encerrado',
                'goal': '⚽ Gol',
              }[event.event_type] || event.event_type

              return (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded text-sm">
                  <div className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{eventLabel}</span>
                      {event.event_type === 'goal' && event.team && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${event.team === 'a' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'}`}>
                          {event.team === 'a' ? match.team_a_name : match.team_b_name}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-secondary/50">
        <p className="text-xs text-muted-foreground text-center">
          {startedEvents.length > 0 && (
            <>
              Partida iniciada às {new Date(startedEvents[0]!.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} •{' '}
            </>
          )}
          {goalEvents.length} gol{goalEvents.length !== 1 ? 's' : ''} registrado{goalEvents.length !== 1 ? 's' : ''}
        </p>
      </Card>
    </div>
  )
}
