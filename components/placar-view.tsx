'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { Match, Goal } from '@/lib/types'
import { Play, Pause, Plus, Minus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function PlacarView({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (error) {
        console.error('Error fetching match:', error)
        setLoading(false)
        return
      }

      setMatch(data as Match)
      setElapsedSeconds(data.elapsed_seconds || 0)
      setLoading(false)
    }

    fetchMatch()

    // Subscribe to real-time updates
    const subscription = supabase
      .from('matches')
      .on('*', (payload) => {
        if (payload.new.id === matchId) {
          setMatch(payload.new as Match)
          setElapsedSeconds(payload.new.elapsed_seconds || 0)
        }
      })
      .subscribe()

    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [matchId])

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching goals:', error)
        return
      }

      setGoals(data as Goal[])
    }

    fetchGoals()

    const subscription = supabase
      .from('goals')
      .on('*', (payload) => {
        if (payload.new?.match_id === matchId) {
          setGoals((prev) => {
            const newGoals = [payload.new as Goal, ...prev]
            return newGoals.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [matchId])

  const addGoal = async (team: 'a' | 'b') => {
    if (!match) return

    const { error } = await supabase.from('goals').insert({
      match_id: matchId,
      game_id: match.game_id,
      participant_id: '',
      team,
      minute: Math.floor(elapsedSeconds / 60),
    })

    if (error) console.error('Error adding goal:', error)

    // Update match score
    const newScoreA = team === 'a' ? match.score_a + 1 : match.score_a
    const newScoreB = team === 'b' ? match.score_b + 1 : match.score_b

    const { error: updateError } = await supabase
      .from('matches')
      .update({
        score_a: newScoreA,
        score_b: newScoreB,
      })
      .eq('id', matchId)

    if (updateError) console.error('Error updating score:', updateError)
  }

  const toggleMatchStatus = async () => {
    if (!match) return

    const newStatus = match.status === 'playing' ? 'draft' : 'playing'

    const { error } = await supabase
      .from('matches')
      .update({
        match_status: newStatus,
        status: newStatus,
      })
      .eq('id', matchId)

    if (error) console.error('Error updating status:', error)
  }

  const completeMatch = async () => {
    if (!match) return

    const { error } = await supabase
      .from('matches')
      .update({
        match_status: 'completed',
        status: 'completed',
      })
      .eq('id', matchId)

    if (error) console.error('Error completing match:', error)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  if (!match) {
    return <div className="flex items-center justify-center h-screen">Partida não encontrada</div>
  }

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/jogo/${match.game_id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-center flex-1">Placar</h1>
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
            <div className="text-3xl font-bold text-primary">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground">
              {match.status === 'playing' ? '▶ AO VIVO' : 'PAUSADO'}
            </div>
          </div>

          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-2 truncate">{match.team_b_name}</p>
            <p className="text-6xl font-bold text-foreground">{match.score_b}</p>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Button
          onClick={toggleMatchStatus}
          className="col-span-1"
          variant={match.status === 'playing' ? 'destructive' : 'default'}
        >
          {match.status === 'playing' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {match.status === 'playing' ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button onClick={completeMatch} variant="secondary" className="col-span-1">
          Encerrar
        </Button>
        <Button variant="outline" className="col-span-1">
          Menu
        </Button>
      </div>

      {/* Goal Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => addGoal('a')}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white h-16 text-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          Gol {match.team_a_name}
        </Button>
        <Button
          onClick={() => addGoal('b')}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white h-16 text-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          Gol {match.team_b_name}
        </Button>
      </div>

      {/* Events Timeline */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-4">Eventos Recentes</h2>
        {goals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum evento ainda</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <Card key={goal.id} className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${goal.team === 'a' ? 'bg-blue-600' : 'bg-red-600'}`} />
                  <div className="flex-1">
                    <p className="font-semibold">{goal.team === 'a' ? match.team_a_name : match.team_b_name}</p>
                    {goal.minute !== null && (
                      <p className="text-sm text-muted-foreground">{goal.minute}' min</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
