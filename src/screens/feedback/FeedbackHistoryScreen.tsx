import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { feedbackService } from '../../services/feedbackService'
import type { FeedbackResponse } from '../../types/feedback'

const PERIOD_OPTIONS = [
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
  { label: '90 dias', days: 90 },
  { label: '6 meses', days: 180 },
  { label: '1 ano', days: 365 },
]

const METRICS: Array<{
  field: keyof Pick<FeedbackResponse, 'dietAdherence' | 'workoutAdherence' | 'aerobicAdherence' | 'energyLevel' | 'sleepQuality' | 'moodLevel' | 'stressLevel'>
  label: string
  invert?: boolean
}> = [
  { field: 'dietAdherence', label: 'Dieta' },
  { field: 'workoutAdherence', label: 'Treino' },
  { field: 'aerobicAdherence', label: 'Aeróbico' },
  { field: 'energyLevel', label: 'Energia' },
  { field: 'sleepQuality', label: 'Sono' },
  { field: 'moodLevel', label: 'Humor' },
  { field: 'stressLevel', label: 'Estresse', invert: true },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

function TrendIcon({ delta, invert }: { delta: number; invert?: boolean }) {
  const positive = invert ? delta < 0 : delta > 0
  const neutral = Math.abs(delta) < 0.3
  if (neutral) return <Minus className="w-3.5 h-3.5 text-text-muted" />
  if (positive) return <TrendingUp className="w-3.5 h-3.5 text-accent-lime" />
  return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
}

function sparkBar(value: number, max = 10) {
  const pct = (value / max) * 100
  const color = value >= 7 ? '#a3e635' : value >= 5 ? '#facc15' : '#f87171'
  return (
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

function MiniChart({ values, invert }: { values: number[]; invert?: boolean }) {
  if (values.length < 2) return null
  const w = 80
  const h = 28
  const pts = values.slice(-6).reverse()
  const min = 1
  const max = 10
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys = pts.map((v) => h - ((v - min) / (max - min)) * h)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const lastGood = invert ? pts[pts.length - 1] <= pts[0] : pts[pts.length - 1] >= pts[0]
  const stroke = lastGood ? '#a3e635' : '#f87171'
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" />
    </svg>
  )
}

export function FeedbackHistoryScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [responses, setResponses] = useState<FeedbackResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(90)

  useEffect(() => {
    if (!firebaseUser?.uid) return
    feedbackService.listResponsesForStudent(firebaseUser.uid, 24).then((data) => {
      setResponses(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [firebaseUser?.uid])

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - periodDays)
  const filtered = responses.filter((r) => new Date(r.submittedAt) >= cutoff)

  // Latest vs previous avg for trending
  const previous = filtered.slice(1)

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="px-4 pb-24 pt-2 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 text-text-muted hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase italic text-white">Evolução</h1>
            <p className="text-xs text-text-muted">Seus feedbacks no tempo</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setPeriodDays(opt.days)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                periodDays === opt.days
                  ? 'bg-ec-violet text-white'
                  : 'bg-white/5 text-text-muted hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-text-muted">Nenhum feedback neste período.</p>
            <p className="text-xs text-text-muted/60 mt-1">Responda seu próximo feedback para ver a evolução aqui.</p>
          </div>
        ) : (
          <>
            {/* Summary grid */}
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                Médias do período ({filtered.length} feedback{filtered.length > 1 ? 's' : ''})
              </h2>
              <div className="grid gap-2">
                {METRICS.map(({ field, label, invert }) => {
                  const vals = filtered.map((r) => r[field] as number)
                  const prevVals = previous.map((r) => r[field] as number)
                  const avgCurr = avg(vals)
                  const avgPrev = avg(prevVals)
                  const delta = prevVals.length ? avgCurr - avgPrev : 0
                  return (
                    <div key={field} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest w-20 shrink-0">{label}</span>
                      {sparkBar(avgCurr)}
                      <span className="text-sm font-black text-white w-8 text-right">{avgCurr}</span>
                      <TrendIcon delta={delta} invert={invert} />
                      <MiniChart values={vals} invert={invert} />
                    </div>
                  )
                })}
                {filtered.some((r) => r.weightKg) && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest w-20 shrink-0">Peso</span>
                    <span className="text-sm font-black text-white flex-1">
                      {filtered.filter((r) => r.weightKg).slice(-1)[0]?.weightKg ?? '—'} kg
                    </span>
                    <span className="text-[10px] text-text-muted">último registro</span>
                  </div>
                )}
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Histórico</h2>
              <div className="space-y-3">
                {filtered.map((r, i) => {
                  const prev = filtered[i + 1]
                  const adherenceAvg = avg([r.dietAdherence, r.workoutAdherence, r.aerobicAdherence])
                  const wellbeingAvg = avg([r.energyLevel, r.sleepQuality, r.moodLevel])
                  return (
                    <div key={r.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-black text-white">{formatDate(r.submittedAt)}</p>
                          <p className="text-[10px] text-text-muted">{r.weightKg ? `${r.weightKg} kg` : 'Sem peso'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted">Aderência: <span className="text-white font-bold">{adherenceAvg}</span></p>
                          <p className="text-xs text-text-muted">Bem-estar: <span className="text-white font-bold">{wellbeingAvg}</span></p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { v: r.dietAdherence, label: 'Dieta' },
                          { v: r.workoutAdherence, label: 'Treino' },
                          { v: r.energyLevel, label: 'Energia' },
                          { v: r.sleepQuality, label: 'Sono' },
                        ].map(({ v, label }) => {
                          const prevVal = prev?.[METRICS.find((m) => m.label === label)?.field ?? 'dietAdherence'] as number | undefined
                          const delta = prevVal !== undefined ? v - prevVal : null
                          return (
                            <div key={label} className="rounded-lg bg-black/30 p-2 text-center">
                              <p className="text-[9px] text-text-muted uppercase tracking-widest">{label}</p>
                              <p className={`text-base font-black italic ${v >= 7 ? 'text-accent-lime' : v >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{v}</p>
                              {delta !== null && <p className={`text-[9px] ${delta > 0 ? 'text-accent-lime' : delta < 0 ? 'text-red-400' : 'text-text-muted'}`}>{delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '='}</p>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
