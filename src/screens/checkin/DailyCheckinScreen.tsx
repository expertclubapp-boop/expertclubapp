import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle as CheckIcon, 
  Dumbbell, 
  Utensils, 
  Droplets, 
  Moon, 
  Smile, 
  Zap, 
  Flame,
  ArrowLeft,
  Coffee
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { track } from '../../lib/analytics'
import { useAuth } from '../../contexts/AuthContext'
import { safeDateKey } from '../../lib/firebase/date'
import { checkinService } from '../../services/checkinService'
import { useDailyCheckin } from '../../hooks/useDailyCheckin'
import { useProgress } from '../../hooks/useProgress'
import type { DailyCheckin } from '../../types/domain'

type AdminFeedbackCheckin = {
  adminFeedback?: string
  reviewStatus?: 'reviewed' | 'changes_requested'
}

export function DailyCheckinScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const dateKey = safeDateKey()
  const { checkin: existingCheckin, isLoading } = useDailyCheckin(firebaseUser?.uid, dateKey)
  const { dailyHistory, isLoading: progressLoading } = useProgress(firebaseUser?.uid)

  const [trained, setTrained] = useState(false)
  const [followedDiet, setFollowedDiet] = useState(false)
  const [hitWaterGoal, setHitWaterGoal] = useState(false)
  const [sleep, setSleep] = useState(7)
  const [mood, setMood] = useState(8)
  const [energy, setEnergy] = useState('Moderada')
  const [hunger, setHunger] = useState(5)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const reviewMeta = existingCheckin as (DailyCheckin & AdminFeedbackCheckin) | null

  useEffect(() => {
    if (existingCheckin) {
      setTrained(existingCheckin.trained)
      setFollowedDiet(existingCheckin.followedDiet)
      setHitWaterGoal(existingCheckin.hitWaterGoal)
      setSleep(existingCheckin.sleep)
      setMood(existingCheckin.mood)
      setEnergy(existingCheckin.energy)
      setHunger(existingCheckin.hunger || 5)
      setNotes(existingCheckin.notes || '')
    }
  }, [existingCheckin])

  const streakCheckins = useMemo(() => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = safeDateKey(d)
      if (dailyHistory.some(h => h.dateKey === key)) streak++
      else if (i > 0) break // stop at first missed day (allow missing today)
    }
    return streak
  }, [dailyHistory])

  const handleSave = async () => {
    if (!firebaseUser) return
    setIsSaving(true)
    try {
      const checkinData: DailyCheckin = {
        uid: firebaseUser.uid,
        dateKey,
        trained,
        followedDiet,
        hitWaterGoal,
        sleep,
        mood,
        energy,
        hunger,
        soreness: existingCheckin?.soreness || 2, // Default
        notes,
        createdAt: existingCheckin?.createdAt,
        updatedAt: existingCheckin?.updatedAt
      }
      await checkinService.saveDailyCheckin(firebaseUser.uid, checkinData)
      track('daily_checkin_submitted', { date_key: checkinData.dateKey })
      setShowSuccess(true)
    } catch (error) {
      console.error("Error saving checkin:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-volt-600/30 border-t-volt-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-ink-900 min-h-screen text-white pb-32">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <div className="w-24 h-24 bg-accent-lime/20 text-accent-lime rounded-full flex items-center justify-center mb-6 ring-4 ring-accent-lime/10 mx-auto">
                <CheckIcon className="w-12 h-12" />
              </div>
            </motion.div>
            <h2 className="font-display text-4xl font-black italic uppercase text-white mb-4">Check-in Salvo!</h2>
            <p className="text-text-muted text-lg max-w-sm mb-12">Boa. Você manteve o registro de hoje. A constância é o que traz resultados verdadeiros.</p>
            <Button variant="primary" className="w-full max-w-sm py-5 text-lg" onClick={() => navigate('/app/today')}>Voltar para o Início</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="ec-glass mx-auto flex max-w-2xl items-center justify-between rounded-shell px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted hover:bg-white/[0.06] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-xl font-black italic text-accent-lime tracking-widest font-display">EXPERT CLUB</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <section className="mb-10 text-center">
          <h1 className="font-display text-4xl mb-3 uppercase italic font-black text-white">Check-in Diário</h1>
          <p className="text-text-muted text-sm max-w-sm mx-auto">Não precisa ser perfeito. O importante é registrar. <span className="text-accent-lime">Leva menos de 1 minuto.</span></p>
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

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleCard icon={<Dumbbell className="w-6 h-6 text-accent-lime" />} label="Treinou hoje?" checked={trained} onChange={setTrained} />
            <ToggleCard icon={<Utensils className="w-6 h-6 text-accent-lime" />} label="Seguiu a dieta?" checked={followedDiet} onChange={setFollowedDiet} />
            <ToggleCard icon={<Droplets className="w-6 h-6 text-accent-lime" />} label="Bateu água?" checked={hitWaterGoal} onChange={setHitWaterGoal} />
          </div>

          <div className="ec-card rounded-3xl overflow-hidden bg-black/40 border border-white/5">
            <SliderSection icon={<Moon className="w-5 h-5" />} title="Qualidade do Sono" value={sleep} min={1} max={10} onChange={setSleep} labels={['Péssimo', 'OK', 'Excelente']} />
            <SliderSection icon={<Smile className="w-5 h-5" />} title="Humor" value={mood} min={1} max={10} onChange={setMood} labels={['Péssimo', 'Neutro', 'Incrível']} />
            <SliderSection icon={<Coffee className="w-5 h-5" />} title="Nível de Fome" value={hunger} min={1} max={10} onChange={setHunger} labels={['Sem Fome', 'Normal', 'Muita Fome']} />
            
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-accent-lime" />
                <h3 className="font-display text-lg uppercase italic font-bold">Nível de Energia</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Baixa', 'Moderada', 'Alta', 'Elite'].map((level) => (
                  <button key={level} onClick={() => setEnergy(level)} className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${energy === level ? 'bg-accent-lime/10 border-accent-lime text-accent-lime' : 'bg-transparent border-subtle text-text-muted hover:border-accent-lime hover:text-white'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 ec-card p-6 rounded-3xl bg-black/40 border border-white/5">
            <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary">Observação Rápida</label>
            <textarea 
              value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent border border-white/10 rounded-xl focus:border-accent-lime focus:ring-0 text-white p-4 placeholder:text-text-muted/30 transition-all outline-none resize-none" 
              placeholder="Como você se sentiu hoje? Alguma dificuldade ou vitória?" 
              rows={3}
            />
          </div>

          <Button variant="primary" className="w-full py-5 text-lg" onClick={handleSave} isLoading={isSaving} icon={<CheckIcon className="w-6 h-6" />}>
            Salvar Check-in
          </Button>
        </div>

        <div className="mt-12">
          <div className="ec-card p-6 rounded-3xl relative overflow-hidden group border border-accent-lime/20 bg-accent-lime/5">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-text-secondary">Sua Constância</h4>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white italic font-display leading-none">{streakCheckins}</span>
                  <span className="text-accent-lime font-bold uppercase text-xs pb-1 tracking-widest">Dias</span>
                </div>
              </div>
              <Flame className="w-12 h-12 text-accent-lime opacity-50" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ToggleCard({ icon, label, checked, onChange }: { icon: React.ReactNode, label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className={`p-5 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 border text-center ${checked ? 'bg-accent-lime/10 border-accent-lime/30 ring-1 ring-accent-lime/20' : 'bg-black/40 border-white/5 hover:border-white/20'}`} onClick={() => onChange(!checked)}>
      {icon}
      <p className={`font-bold text-sm ${checked ? 'text-white' : 'text-text-muted'}`}>{label}</p>
      <div className={`w-12 h-6 rounded-full relative transition-colors mt-1 ${checked ? 'bg-accent-lime' : 'bg-black border border-white/10'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`} />
      </div>
    </div>
  )
}

function SliderSection({ icon, title, value, min, max, onChange, labels }: { icon: React.ReactNode, title: string, value: number, min: number, max: number, onChange: (v: number) => void, labels: string[] }) {
  return (
    <div className="p-6 border-b border-white/5">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-accent-lime">{icon}</div>
        <h3 className="font-display text-lg uppercase italic font-bold text-white">{title}</h3>
        <span className="ml-auto text-xs font-bold text-accent-lime bg-accent-lime/10 px-2 py-1 rounded">{value}/{max}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-accent-lime" />
      <div className="mt-3 flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
        <span>{labels[0]}</span>
        {labels[1] && <span>{labels[1]}</span>}
        <span>{labels[2] || labels[1]}</span>
      </div>
    </div>
  )
}
