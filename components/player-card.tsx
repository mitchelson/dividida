"use client"

import { useMemo } from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PlayerProfile } from "@/lib/types"

interface PlayerCardProps {
  profile: PlayerProfile
  size?: "sm" | "lg"
}

function getOverallColor(overall: number): string {
  if (overall >= 80) return "#22c55e"
  if (overall >= 65) return "#84cc16"
  if (overall >= 50) return "#eab308"
  if (overall >= 35) return "#f97316"
  return "#ef4444"
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function PlayerCard({ profile, size = "lg" }: PlayerCardProps) {
  const chartData = useMemo(
    () => [
      { stat: "RIT", value: profile.stat_pace, fullMark: 99 },
      { stat: "FIN", value: profile.stat_shooting, fullMark: 99 },
      { stat: "PAS", value: profile.stat_passing, fullMark: 99 },
      { stat: "DRI", value: profile.stat_dribbling, fullMark: 99 },
      { stat: "DEF", value: profile.stat_defending, fullMark: 99 },
      { stat: "FIS", value: profile.stat_physical, fullMark: 99 },
    ],
    [profile]
  )

  const overallColor = getOverallColor(profile.overall)
  const isSmall = size === "sm"

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-primary/30 ${
        isSmall ? "p-3" : "p-5"
      }`}
      style={{
        background: `linear-gradient(135deg, hsl(145 40% 12%) 0%, hsl(145 30% 8%) 50%, hsl(145 20% 5%) 100%)`,
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)`,
        }}
      />

      <div className="relative z-10">
        {/* Top section: Overall + Position + Avatar + Name */}
        <div className="flex items-start gap-3">
          {/* Overall rating */}
          <div className="flex flex-col items-center">
            <span
              className={`font-bold leading-none ${isSmall ? "text-3xl" : "text-5xl"}`}
              style={{ color: overallColor }}
            >
              {profile.overall}
            </span>
            <span
              className={`font-semibold uppercase tracking-wider ${
                isSmall ? "text-[10px]" : "text-xs"
              }`}
              style={{ color: "hsl(145 60% 60%)" }}
            >
              {profile.position || "ATA"}
            </span>
          </div>

          {/* Avatar */}
          <Avatar className={`border-2 border-primary/40 ${isSmall ? "h-12 w-12" : "h-16 w-16"}`}>
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || "Jogador"} />
            <AvatarFallback
              className="text-sm font-bold"
              style={{ backgroundColor: "hsl(145 30% 18%)", color: "hsl(145 60% 60%)" }}
            >
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>

          {/* Name + Career stats */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-bold truncate ${isSmall ? "text-sm" : "text-lg"}`}
              style={{ color: "hsl(0 0% 95%)" }}
            >
              {profile.display_name || "Jogador"}
            </h3>
            <div className={`flex gap-3 mt-1 ${isSmall ? "text-[10px]" : "text-xs"}`}>
              <div style={{ color: "hsl(145 40% 55%)" }}>
                <span className="font-bold" style={{ color: "hsl(0 0% 90%)" }}>
                  {profile.games_played}
                </span>{" "}
                jogos
              </div>
              <div style={{ color: "hsl(145 40% 55%)" }}>
                <span className="font-bold" style={{ color: "hsl(0 0% 90%)" }}>
                  {profile.goals}
                </span>{" "}
                gols
              </div>
              <div style={{ color: "hsl(145 40% 55%)" }}>
                <span className="font-bold" style={{ color: "hsl(0 0% 90%)" }}>
                  {profile.assists}
                </span>{" "}
                assist.
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className={`mx-auto ${isSmall ? "-my-2" : "-my-1"}`} style={{ width: isSmall ? 180 : 240, height: isSmall ? 140 : 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius={isSmall ? "65%" : "70%"} data={chartData}>
              <PolarGrid stroke="hsl(145 20% 25%)" strokeWidth={0.5} />
              <PolarAngleAxis
                dataKey="stat"
                tick={{
                  fill: "hsl(145 40% 55%)",
                  fontSize: isSmall ? 9 : 11,
                  fontWeight: 600,
                }}
              />
              <Radar
                name="Stats"
                dataKey="value"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Stat bars */}
        <div className={`grid grid-cols-3 gap-x-4 gap-y-1.5 ${isSmall ? "text-[10px]" : "text-xs"}`}>
          {chartData.map((item) => (
            <div key={item.stat} className="flex items-center justify-between">
              <span style={{ color: "hsl(145 40% 55%)" }} className="font-medium">
                {item.stat}
              </span>
              <span className="font-bold tabular-nums" style={{ color: "hsl(0 0% 92%)" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
