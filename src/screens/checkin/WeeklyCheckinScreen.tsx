import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  CheckCircle, 
  Camera, 
  Ruler, 
  TrendingDown, 
  Activity, 
  Brain,
  Plus
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { track } from '../../lib/analytics'
import { useAuth } from '../../contexts/AuthContext'
import { checkinService } from '../../services/checkinService'
import { useWeeklyCheckin } from '../../hooks/useWeeklyCheckin'
import type { WeeklyCheckin } from '../../types/domain'

type AdminFeedbackCheckin = {
  adminFeedback?: string
  reviewStatus?: 'reviewed' | 'changes_requested'
}

export function WeeklyCheckinScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  
  // Calculate current week key (e.g., 2026-W18)
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
  const weekKey = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`

  const { checkin: existingCheckin, isLoading } = useWeeklyCheckin(firebaseUser?.uid, weekKey)
  const reviewMeta = existingCheckin as (WeeklyCheckin & AdminFeedbackCheckin) | null

  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [abdomen, setAbdomen] = useState('')
  const [hip, setHip] = useState('')
  const [workoutsCount, setWorkoutsCount] = useState(3)
  const [dietDays, setDietDays] = useState(5)
  const [waterDays, setWaterDays] = useState(5)
  const [cardio, setCardio] = useState(true)
  const [sleep, setSleep] = useState(7)
  const [hunger, setHunger] = useState(5)
  const [difficulty, setDifficulty] = useState('Final de semana')
  const [weeklyWin, setWeeklyWin] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (existingCheckin) {
      setWeight(existingCheckin.weightKg.toString())
      setWaist(existingCheckin.waistCm.toString())
      setAbdomen(existingCheckin.abdomenCm.toString())
      setHip(existingCheckin.hipCm.toString())
      setWorkoutsCount(existingCheckin.completedWorkouts)
      setDietDays(existingCheckin.dietAdherenceDays)
      setWaterDays(existingCheckin.waterGoalDays)
      setCardio(existingCheckin.cardioSessions > 0)
      setSleep(existingCheckin.averageSleep)
      setHunger(existingCheckin.averageHunger)
      setDifficulty(existingCheckin.mainDifficulty)
      setWeeklyWin(existingCheckin.weeklyWin || '')
      setNotes(existingCheckin.notes || '')
    }
  }, [existingCheckin])

  const handleSave = async () => {
    if (!firebaseUser) return
    setIsSaving(true)
    try {
      const checkinData: WeeklyCheckin = {
        uid: firebaseUser.uid,
        weekKey,
        weightKg: Number(weight),
        waistCm: Number(waist),
        abdomenCm: Number(abdomen),
        hipCm: Number(hip),
        completedWorkouts: workoutsCount,
        dietAdherenceDays: dietDays,
        waterGoalDays: waterDays,
        cardioSessions: cardio ? 3 : 0, // Simplified
        averageSleep: sleep,
        averageHunger: hunger,
        mainDifficulty: difficulty,
        weeklyWin,
        notes,
        photoUrls: [],
        createdAt: existingCheckin?.createdAt,
        updatedAt: existingCheckin?.updatedAt
      }
      await checkinService.saveWeeklyCheckin(firebaseUser.uid, checkinData)
      track('weekly_checkin_submitted', { week_key: checkinData.weekKey })
      setShowSuccess(true)
      setTimeout(() => navigate('/app/evolution'), 3000)
    } catch (error) {
      console.error("Error saving weekly checkin:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="ec-student-standalone min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="ec-student-standalone ec-app-bg min-h-screen text-text-primary pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="ec-glass mx-auto flex max-w-lg items-center gap-4 rounded-shell px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <p className="mt-1 text-xs uppercase tracking-widest text-text-secondary">Semana {weekKey.split('-W')[1]} · {weekKey.split('-W')[0]}</p>
            <h1 className="font-display font-bold text-lg leading-none">Check-in Semanal</h1>
          </div>
          <div className="text-right w-10">
            {/* Empty space to balance */}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-8">
        {/* Intro */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-2">Como foi sua semana?</h2>
          <p className="text-sm text-text-muted leading-relaxed">Este registro é seu acompanhamento semanal. Seja honesto — é para você evoluir, não para parecer perfeito.</p>
          
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < 4 ? 'bg-accent-lime' : i === 4 ? 'bg-accent-lime shadow-[0_0_8px_rgba(183,255,60,0.5)]' : 'bg-white/10'}`} />
            ))}
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Semana 5 de 12 · 4 semanas completadas</p>
        </section>

        {reviewMeta?.adminFeedback && (
          <div className="mb-8 p-6 rounded-3xl border border-ec-violet/30 bg-ec-violet/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-ec-violet">Feedback do Administrador</span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${(reviewMeta?.reviewStatus === 'reviewed' ? 'bg-accent-lime/10 border-accent-lime/20 text-accent-lime' : 'bg-accent-red/10 border-accent-red/20 text-accent-red')}`}>
                {reviewMeta?.reviewStatus === 'reviewed' ? 'Revisado' : 'Ajuste Solicitado'}
              </span>
            </div>
            <p className="text-sm text-white italic">"{reviewMeta.adminFeedback}"</p>
          </div>
        )}

        {/* Medidas */}
        <div className="ec-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-accent-lime font-display text-xs font-bold uppercase tracking-widest">
            <Ruler className="w-4 h-4" /> Medidas corporais
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <MetricInput label="Peso" unit="kg" value={weight} onChange={setWeight} placeholder="82.0" />
            <MetricInput label="Cintura" unit="cm" value={waist} onChange={setWaist} placeholder="84" />
            <MetricInput label="Abdômen" unit="cm" value={abdomen} onChange={setAbdomen} placeholder="88" />
            <MetricInput label="Quadril" unit="cm" value={hip} onChange={setHip} placeholder="100" />
          </div>

          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-3">
             <TrendingDown className="w-4 h-4 text-green-500" />
             <p className="text-xs text-text-muted">Semana passada: <strong className="text-text-primary">82.8 kg</strong> — você está na direção certa.</p>
          </div>
        </div>

        {/* Fotos */}
        <div className="ec-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-accent-purple font-display text-xs font-bold uppercase tracking-widest">
            <Camera className="w-4 h-4" /> Fotos de evolução
          </div>
          <p className="text-xs text-text-muted leading-relaxed">Fotos de frente, costas e lateral. Mesma iluminação, mesmo horário.</p>
          <div className="flex gap-3 flex-wrap">
            <PhotoSlot label="Frente" />
            <PhotoSlot label="Costas" />
            <PhotoSlot label="Lateral" />
            <PhotoSlot label="Extra" isAdd />
          </div>
        </div>

        {/* Adesão */}
        <div className="ec-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-accent-sky font-display text-xs font-bold uppercase tracking-widest">
            <Activity className="w-4 h-4" /> Adesão da semana
          </div>
          
          <ScaleSelector label="Treinos concluídos" max={6} value={workoutsCount} onChange={setWorkoutsCount} />
          <ScaleSelector label="Dias seguindo a dieta" max={7} value={dietDays} onChange={setDietDays} />
          <ScaleSelector label="Dias batendo água" max={7} value={waterDays} onChange={setWaterDays} />
          
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Sessões de cardio</label>
            <div className="flex gap-2">
               <button 
                 onClick={() => setCardio(true)}
                 className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${cardio ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime' : 'bg-white/5 border-subtle text-text-muted'}`}
               >Sim</button>
               <button 
                 onClick={() => setCardio(false)}
                 className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${!cardio ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-subtle text-text-muted'}`}
               >Não</button>
            </div>
          </div>
        </div>

        {/* Sensações */}
        <div className="ec-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-accent-yellow font-display text-xs font-bold uppercase tracking-widest">
            <Brain className="w-4 h-4" /> Como você se sentiu
          </div>
          <SliderInput label="Sono médio" value={sleep} onChange={setSleep} color="lime" />
          <SliderInput label="Fome média" value={hunger} onChange={setHunger} color="sky" labels={['Sem fome', 'Fome intensa']} />
        </div>

        {/* Reflexão */}
        <div className="ec-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-accent-purple font-display text-xs font-bold uppercase tracking-widest">
            <Brain className="w-4 h-4" /> Reflexão da semana
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Principal dificuldade</label>
            <div className="flex flex-wrap gap-2">
              {['Final de semana', 'Fome noturna', 'Falta de tempo', 'Constância', 'Sono ruim', 'Estagnação', 'Viagem', 'Nenhuma'].map(d => (
                <button 
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${difficulty === d ? 'bg-accent-sky/10 border-accent-sky/30 text-accent-sky' : 'bg-white/5 border-subtle text-text-muted hover:border-accent-sky'}`}
                >{d}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Maior vitória da semana</label>
            <textarea 
              value={weeklyWin}
              onChange={(e) => setWeeklyWin(e.target.value)}
              className="w-full bg-bg-primary border border-subtle rounded-xl p-4 text-sm text-text-primary focus:border-accent-sky outline-none transition-all resize-none" 
              rows={2} 
              placeholder="Ex: Treinei 4x e não falhei na dieta..." 
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Observações livres</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-bg-primary border border-subtle rounded-xl p-4 text-sm text-text-primary focus:border-accent-sky outline-none transition-all resize-none" 
              rows={2} 
              placeholder="Qualquer coisa relevante..." 
            />
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button 
            variant="primary" 
            className="w-full py-5 text-lg font-black italic shadow-2xl" 
            onClick={handleSave}
            isLoading={isSaving}
            icon={<CheckCircle className="w-6 h-6" />}
          >
            Salvar Check-in Semanal
          </Button>
          <p className="text-center text-xs font-bold uppercase tracking-widest text-text-secondary">+20 XP · Missão semanal concluída</p>
        </div>

        {/* Success State Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg-primary/90 backdrop-blur-xl"
            >
              <div className="ec-glass-strong rounded-3xl p-10 text-center max-w-sm">
                <div className="w-16 h-16 bg-accent-lime/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-accent-lime" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Check-in registrado!</h3>
                <p className="text-sm text-text-muted leading-relaxed">Você completou mais uma etapa rumo ao topo. Sua evolução está sendo documentada. Continue imparável.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function MetricInput({ label, unit, value, onChange, placeholder }: { label: string; unit: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">{label} <span className="opacity-70 lowercase">{unit}</span></label>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-primary border border-subtle rounded-xl p-3 text-text-primary focus:border-accent-sky outline-none transition-all"
      />
    </div>
  )
}

function PhotoSlot({ label, isAdd }: { label: string; isAdd?: boolean }) {
  return (
    <div className={`w-20 h-20 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${isAdd ? 'border-dashed border-subtle bg-white/5 hover:border-accent-lime' : 'border-dashed border-subtle bg-white/5 hover:border-accent-lime'}`}>
      {isAdd ? <Plus className="w-6 h-6 text-text-muted" /> : <Camera className="w-6 h-6 text-text-muted" />}
      <span className="text-xs font-bold uppercase text-text-secondary">{label}</span>
    </div>
  )
}

function ScaleSelector({ label, max, value, onChange }: { label: string; max: number; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">{label}</label>
      <div className="flex gap-1.5">
        {Array.from({ length: max + 1 }).map((_, i) => (
          <button 
            key={i}
            onClick={() => onChange(i)}
            className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${value === i ? 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime' : 'bg-bg-primary border-subtle text-text-muted hover:border-accent-lime'}`}
          >{i}{i === max && label.includes('Treinos') ? '+' : ''}</button>
        ))}
      </div>
    </div>
  )
}

function SliderInput({
  label,
  value,
  onChange,
  color,
  labels = ['Péssimo', 'Ótimo'],
}: {
  label: string
  value: number
  onChange: (value: number) => void
  color: 'lime' | 'sky'
  labels?: [string, string]
}) {
  const accentColor = color === 'lime' ? 'accent-accent-lime' : 'accent-accent-sky'
  const textColor = color === 'lime' ? 'text-accent-lime' : 'text-accent-sky'
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">{label}</label>
        <span className={`font-display font-bold ${textColor}`}>{value}</span>
      </div>
      <input 
        type="range" 
        min="1" 
        max="10" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-bg-primary rounded-lg appearance-none cursor-pointer ${accentColor}`}
      />
      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  )
}
