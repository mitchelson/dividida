'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { Match, Goal } from '@/lib/types'
import { Play, Pause, Plus, ArrowLeft } from 'lucide-react'
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
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [gameId, setGameId] = useState<string>('')

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
        setLoading(false)
      } catch (err) {
        console.error('Exception fetching match:', err)
        setLoading(false)
      }
    }

    if (realMatchId) {
      fetchMatch()
    }
  }, [realMatchId])

  useEffect(() => {
    if (!realMatchId) return

    const fetchGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('match_id', realMatchId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching goals:', error)
          return
        }

        setGoals(data as Goal[])
      } catch (err) {
        console.error('Exception fetching goals:', err)
      }
    }

    fetchGoals()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`goals_${realMatchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `match_id=eq.${realMatchId}`,
        },
        (payload) => {
          setGoals((prev) => {
            if (payload.new) {
              const newGoals = [payload.new as Goal, ...prev]
              return newGoals.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [realMatchId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Partida não encontrada</p>
        {gameId && (
          <Link href={`/jogo/${gameId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        )}
      </div>
    )
  }

  const minutes = Math.floor(match.elapsed_seconds / 60)
  const seconds = match.elapsed_seconds % 60

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
              {match.status === 'playing' ? '🔴 AO VIVO' : '⏸ PAUSADO'}
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
        <h2 className="font-semibold text-lg mb-4">Eventos Recentes</h2>
        <div className="flex-1 overflow-y-auto space-y-3">
          {goals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum evento ainda</p>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${goal.team === 'a' ? 'bg-blue-600' : 'bg-red-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{goal.team === 'a' ? match.team_a_name : match.team_b_name}</p>
                  {goal.minute !== null && (
                    <p className="text-xs text-muted-foreground">{goal.minute}' min</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" disabled className="h-14">
          <Plus className="h-5 w-5 mr-2" />
          Gol {match.team_a_name}
        </Button>
        <Button variant="outline" size="lg" disabled className="h-14">
          <Plus className="h-5 w-5 mr-2" />
          Gol {match.team_b_name}
        </Button>
      </div>
    </div>
  )
}
