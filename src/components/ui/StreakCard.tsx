import { useEffect, useState } from 'react'
import { Flame, Trophy, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { STREAK_MILESTONES } from '../../services/streakService'

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string
}

function streakMessage(streak: number): string {
  if (streak === 0) return 'Faça um check-in ou treino hoje para iniciar seu streak!'
  if (streak < 3) return `${streak} dia${streak > 1 ? 's' : ''} — bom começo, continue!`
  if (streak < 7) return `${streak} dias seguidos — você está pegando o ritmo!`
  if (streak < 14) return `${streak} dias! Uma semana completa — incrível!`
  if (streak < 30) return `${streak} dias de consistência — hábito formado!`
  return `${streak} dias! Você é imparável!`
}

function nextMilestone(current: number): number | null {
  return STREAK_MILESTONES.find((m) => m > current) ?? null
}

export function StreakCard({ currentStreak, longestStreak, lastActivityDate }: StreakCardProps) {
  const [showMilestone, setShowMilestone] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const isActiveToday = lastActivityDate === today
  const next = nextMilestone(currentStreak)
  const isMilestone = STREAK_MILESTONES.includes(currentStreak) && currentStreak > 0

  useEffect(() => {
    if (isMilestone && isActiveToday) {
      setShowMilestone(true)
      const t = setTimeout(() => setShowMilestone(false), 4000)
      return () => clearTimeout(t)
    }
  }, [isMilestone, isActiveToday])

  const flameColor =
    currentStreak === 0
      ? 'text-text-muted'
      : currentStreak >= 30
        ? 'text-orange-400'
        : currentStreak >= 7
          ? 'text-ec-lime'
          : 'text-yellow-400'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0d1117] p-4">
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-ec-lime/10 backdrop-blur-sm"
          >
            <Trophy className="mb-2 h-8 w-8 text-ec-lime" />
            <p className="text-lg font-bold text-ec-lime">{currentStreak} dias!</p>
            <p className="text-sm text-text-secondary">Marco atingido 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${flameColor}`}>
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tabular-nums ${flameColor}`}>{currentStreak}</span>
              <span className="text-sm text-text-muted">dias seguidos</span>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">{streakMessage(currentStreak)}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {longestStreak > 0 && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Trophy className="h-3 w-3" />
              <span>{longestStreak} recorde</span>
            </div>
          )}
          {next && currentStreak > 0 && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Zap className="h-3 w-3 text-ec-lime/60" />
              <span>{next - currentStreak}d p/ próximo marco</span>
            </div>
          )}
          {!isActiveToday && currentStreak > 0 && (
            <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
              Não registrado hoje
            </span>
          )}
          {isActiveToday && currentStreak > 0 && (
            <span className="rounded-full bg-ec-lime/10 px-2 py-0.5 text-xs font-medium text-ec-lime">
              Hoje ✓
            </span>
          )}
        </div>
      </div>

      {next && currentStreak > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-text-muted">
            <span>Progresso para {next} dias</span>
            <span>{Math.round((currentStreak / next) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-ec-lime transition-all duration-500"
              style={{ width: `${Math.min((currentStreak / next) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
