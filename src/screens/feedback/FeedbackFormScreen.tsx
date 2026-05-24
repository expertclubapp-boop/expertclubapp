import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Flame } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { feedbackService } from '../../services/feedbackService'
import { toastError } from '../../components/ui/Toast'
import type { FeedbackRequest, FeedbackResponse } from '../../types/feedback'

// ─── Slider color helpers ─────────────────────────────────────────────────────

function sliderColor(v: number) {
  if (v <= 3) return '#f87171'   // red
  if (v <= 5) return '#fb923c'   // orange
  if (v <= 7) return '#facc15'   // yellow
  return '#a3e635'               // lime
}

function sliderTextClass(v: number) {
  if (v <= 3) return 'text-red-400'
  if (v <= 5) return 'text-orange-400'
  if (v <= 7) return 'text-yellow-400'
  return 'text-accent-lime'
}

// For stress: higher = worse, so invert colors
function stressSliderColor(v: number) {
  if (v <= 3) return '#a3e635'
  if (v <= 5) return '#facc15'
  if (v <= 7) return '#fb923c'
  return '#f87171'
}

function stressTextClass(v: number) {
  if (v <= 3) return 'text-accent-lime'
  if (v <= 5) return 'text-yellow-400'
  if (v <= 7) return 'text-orange-400'
  return 'text-red-400'
}

// ─── Step definitions ─────────────────────────────────────────────────────────

interface SliderStep {
  id: string
  type: 'slider'
  label: string
  hint: string
  field: keyof Omit<FeedbackResponse, 'id' | 'uid' | 'requestId' | 'dueDate' | 'submittedAt' | 'weightKg'>
  lowLabel?: string
  highLabel?: string
  invertColors?: boolean
}

interface NumberStep {
  id: string
  type: 'number'
  label: string
  hint: string
  field: 'weightKg'
  unit: string
  optional: true
}

type Step =
  | { id: string; type: 'welcome' }
  | SliderStep
  | NumberStep
  | { id: string; type: 'done' }

const STEPS: Step[] = [
  { id: 'welcome', type: 'welcome' },
  { id: 'diet', type: 'slider', label: 'Dieta', hint: 'De 1 a 10, quanto você seguiu seu plano alimentar?', field: 'dietAdherence', lowLabel: 'Não segui', highLabel: 'Segui 100%' },
  { id: 'workout', type: 'slider', label: 'Treino', hint: 'De 1 a 10, quanto você seguiu seu protocolo de treino?', field: 'workoutAdherence', lowLabel: 'Não treinei', highLabel: 'Todo dia' },
  { id: 'aerobic', type: 'slider', label: 'Aeróbico', hint: 'De 1 a 10, quanto você cumpriu os aeróbicos programados?', field: 'aerobicAdherence', lowLabel: 'Zero', highLabel: 'Tudo feito' },
  { id: 'energy', type: 'slider', label: 'Energia', hint: 'Como foi seu nível de energia geral no período?', field: 'energyLevel', lowLabel: 'Sem energia', highLabel: 'Explosivo' },
  { id: 'sleep', type: 'slider', label: 'Sono', hint: 'Como foi a qualidade do seu sono?', field: 'sleepQuality', lowLabel: 'Péssimo', highLabel: 'Ótimo' },
  { id: 'mood', type: 'slider', label: 'Humor', hint: 'Como está sua motivação e estado de espírito?', field: 'moodLevel', lowLabel: 'Desmotivado', highLabel: 'Motivadíssimo' },
  { id: 'stress', type: 'slider', label: 'Estresse', hint: 'Qual seu nível de estresse fora dos treinos?', field: 'stressLevel', lowLabel: 'Tranquilo', highLabel: 'Muito estressado', invertColors: true },
  { id: 'weight', type: 'number', label: 'Peso atual', hint: 'Registre seu peso de hoje (opcional)', field: 'weightKg', unit: 'kg', optional: true },
  { id: 'done', type: 'done' },
]

const FORM_STEPS = STEPS.filter((s) => s.type !== 'welcome' && s.type !== 'done')
const TOTAL_SLIDER = FORM_STEPS.length

// ─── Sub-components ───────────────────────────────────────────────────────────

function WelcomeCard({ daysAgo, onStart }: { daysAgo: number; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-ec-violet/20 border border-ec-violet/30 flex items-center justify-center mb-6">
        <Flame className="w-8 h-8 text-ec-violet" />
      </div>
      <h1 className="text-3xl font-black uppercase italic text-white mb-3">
        Feedback dos últimos {daysAgo} dias
      </h1>
      <p className="text-text-muted text-sm max-w-xs leading-relaxed mb-8">
        Responda rápido — só arraste os sliders. Leva menos de 2 minutos e ajuda a ajustar sua programação.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-4 rounded-2xl bg-ec-violet text-white font-black uppercase italic tracking-widest text-lg hover:bg-ec-violet/90 transition-all active:scale-95"
      >
        Começar →
      </button>
    </div>
  )
}

function SliderCard({
  step,
  value,
  onChange,
  stepIndex,
  total,
}: {
  step: SliderStep
  value: number
  onChange: (v: number) => void
  stepIndex: number
  total: number
}) {
  const color = step.invertColors ? stressSliderColor(value) : sliderColor(value)
  const textClass = step.invertColors ? stressTextClass(value) : sliderTextClass(value)
  const progress = ((value - 1) / 9) * 100

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-ec-violet transition-all duration-300"
          style={{ width: `${(stepIndex / total) * 100}%` }}
        />
      </div>

      <div className="w-full max-w-sm text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6">
          {stepIndex} / {total}
        </p>
        <h2 className="text-3xl font-black uppercase italic text-white mb-2">{step.label}</h2>
        <p className="text-sm text-text-muted mb-10 leading-relaxed">{step.hint}</p>

        {/* Big number */}
        <div className={`text-[120px] font-black italic leading-none mb-8 transition-all duration-150 ${textClass}`}>
          {value}
        </div>

        {/* Range slider */}
        <div className="px-2">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-3 rounded-full cursor-pointer outline-none"
            style={{
              accentColor: color,
              background: `linear-gradient(to right, ${color} 0%, ${color} ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <div className="flex justify-between mt-3 text-[10px] text-text-muted font-bold uppercase tracking-widest">
            <span>{step.lowLabel ?? 'Péssimo'}</span>
            <span>{step.highLabel ?? 'Perfeito'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NumberCard({
  step,
  value,
  onChange,
  stepIndex,
  total,
}: {
  step: NumberStep
  value: number | undefined
  onChange: (v: number | undefined) => void
  stepIndex: number
  total: number
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-ec-violet transition-all duration-300"
          style={{ width: `${(stepIndex / total) * 100}%` }}
        />
      </div>

      <div className="w-full max-w-sm text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6">
          {stepIndex} / {total}
        </p>
        <h2 className="text-3xl font-black uppercase italic text-white mb-2">{step.label}</h2>
        <p className="text-sm text-text-muted mb-10 leading-relaxed">{step.hint}</p>

        <div className="flex items-baseline justify-center gap-3 mb-4">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={value ?? ''}
            onChange={(e) => {
              const n = parseFloat(e.target.value.replace(',', '.'))
              onChange(Number.isFinite(n) ? n : undefined)
            }}
            placeholder="--"
            className="w-36 text-center bg-transparent border-b-4 border-white/20 focus:border-ec-violet text-[72px] font-black italic text-white outline-none transition-colors placeholder:text-white/20"
          />
          <span className="text-2xl text-text-muted font-bold">{step.unit}</span>
        </div>
        <p className="text-xs text-text-muted/60">Campo opcional — pode pular</p>
      </div>
    </div>
  )
}

function DoneCard({
  prevResponse,
  current,
  onViewHistory,
}: {
  prevResponse: Partial<FeedbackResponse> | null
  current: Partial<FeedbackFormData>
  onViewHistory: () => void
}) {
  const metrics: Array<{ label: string; field: keyof FeedbackFormData; invert?: boolean }> = [
    { label: 'Dieta', field: 'dietAdherence' },
    { label: 'Treino', field: 'workoutAdherence' },
    { label: 'Aeróbico', field: 'aerobicAdherence' },
    { label: 'Energia', field: 'energyLevel' },
    { label: 'Sono', field: 'sleepQuality' },
    { label: 'Humor', field: 'moodLevel' },
    { label: 'Estresse', field: 'stressLevel', invert: true },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-16 h-16 rounded-full bg-accent-lime/20 border border-accent-lime/30 flex items-center justify-center mb-6">
        <Check className="w-8 h-8 text-accent-lime" />
      </div>
      <h1 className="text-3xl font-black uppercase italic text-white mb-2 text-center">
        Feedback enviado!
      </h1>
      <p className="text-text-muted text-sm mb-8 text-center max-w-xs">
        Seus dados foram registrados. Aqui está sua comparação com o período anterior.
      </p>

      <div className="w-full max-w-sm space-y-2 mb-8">
        {metrics.map(({ label, field, invert }) => {
          const curr = current[field] as number | undefined
          const prev = prevResponse?.[field as keyof FeedbackResponse] as number | undefined
          if (curr === undefined) return null
          const delta = prev !== undefined ? curr - (prev as number) : null
          const better = invert ? (delta !== null ? delta < 0 : false) : (delta !== null ? delta > 0 : false)
          return (
            <div key={field} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white">{curr}/10</span>
                {delta !== null && delta !== 0 && (
                  <span className={`text-[10px] font-black ${better ? 'text-accent-lime' : 'text-red-400'}`}>
                    {better ? '▲' : '▼'} {Math.abs(delta)}
                  </span>
                )}
                {delta === 0 && <span className="text-[10px] text-text-muted">= igual</span>}
              </div>
            </div>
          )
        })}
        {current.weightKg && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Peso</span>
            <span className="text-sm font-black text-white">{current.weightKg} kg</span>
          </div>
        )}
      </div>

      <button
        onClick={onViewHistory}
        className="text-xs font-black uppercase tracking-widest text-ec-violet hover:underline"
      >
        Ver histórico completo →
      </button>
    </div>
  )
}

// ─── Form data type ───────────────────────────────────────────────────────────

type FeedbackFormData = {
  dietAdherence: number
  workoutAdherence: number
  aerobicAdherence: number
  energyLevel: number
  sleepQuality: number
  moodLevel: number
  stressLevel: number
  weightKg?: number
}

const DEFAULT_DATA: FeedbackFormData = {
  dietAdherence: 5,
  workoutAdherence: 5,
  aerobicAdherence: 5,
  energyLevel: 5,
  sleepQuality: 5,
  moodLevel: 5,
  stressLevel: 5,
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function FeedbackFormScreen() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()

  const [request, setRequest] = useState<FeedbackRequest | null>(null)
  const [prevResponse, setPrevResponse] = useState<FeedbackResponse | null>(null)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [data, setData] = useState<FeedbackFormData>({ ...DEFAULT_DATA })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser?.uid || !requestId) return
    const uid = firebaseUser.uid
    Promise.all([
      feedbackService.listRequestsForStudent(uid),
      feedbackService.listResponsesForStudent(uid, 2),
    ]).then(([requests, responses]) => {
      const req = requests.find((r) => r.id === requestId) ?? null
      setRequest(req)
      setPrevResponse(responses.find((r) => r.requestId !== requestId) ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [firebaseUser?.uid, requestId])

  const currentStep = STEPS[step]

  function goNext() {
    if (step < STEPS.length - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  function setValue(field: keyof FeedbackFormData, value: number | undefined) {
    setData((d) => ({ ...d, [field]: value }))
  }

  async function handleSubmit() {
    if (!firebaseUser?.uid || !request) return
    setSubmitting(true)
    try {
      await feedbackService.submitFeedback(
        firebaseUser.uid,
        request.id,
        request.scheduleId,
        request.dueDate,
        {
          dietAdherence: data.dietAdherence,
          workoutAdherence: data.workoutAdherence,
          aerobicAdherence: data.aerobicAdherence,
          energyLevel: data.energyLevel,
          sleepQuality: data.sleepQuality,
          moodLevel: data.moodLevel,
          stressLevel: data.stressLevel,
          ...(data.weightKg ? { weightKg: data.weightKg } : {}),
        }
      )
      setSubmitted(true)
      setDirection(1)
      setStep(STEPS.findIndex((s) => s.type === 'done'))
    } catch {
      toastError('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLastFormStep = currentStep?.type !== 'welcome' && currentStep?.type !== 'done' &&
    step === STEPS.findIndex((s) => s.type === 'done') - 1

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" />
      </div>
    )
  }

  if (!request && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-6 text-center">
        <div>
          <h1 className="text-2xl font-black uppercase italic text-white mb-2">Feedback não encontrado</h1>
          <p className="text-text-muted text-sm mb-6">Este feedback pode já ter sido respondido ou não existe mais.</p>
          <button onClick={() => navigate('/app/today')} className="text-ec-violet font-bold">Voltar ao início</button>
        </div>
      </div>
    )
  }

  const daysAgo = request
    ? Math.max(1, Math.round((Date.now() - new Date(request.dueDate).getTime()) / 86400000) + 15)
    : 15

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Back button — hidden on welcome and done */}
      {currentStep?.type !== 'welcome' && currentStep?.type !== 'done' && step > 1 && (
        <button
          onClick={goBack}
          className="fixed top-4 left-4 z-10 p-2 rounded-xl bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ x: direction * 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -60, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          {currentStep?.type === 'welcome' && (
            <WelcomeCard daysAgo={daysAgo} onStart={goNext} />
          )}

          {currentStep?.type === 'slider' && (
            <SliderCard
              step={currentStep as SliderStep}
              value={(data[currentStep.field] as number) ?? 5}
              onChange={(v) => setValue(currentStep.field as keyof FeedbackFormData, v)}
              stepIndex={step}
              total={TOTAL_SLIDER}
            />
          )}

          {currentStep?.type === 'number' && (
            <NumberCard
              step={currentStep as NumberStep}
              value={data.weightKg}
              onChange={(v) => setValue('weightKg', v)}
              stepIndex={step}
              total={TOTAL_SLIDER}
            />
          )}

          {currentStep?.type === 'done' && (
            <DoneCard
              prevResponse={submitted ? prevResponse : null}
              current={data}
              onViewHistory={() => navigate('/app/feedback/history')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom CTA — shown for slider/number steps */}
      {(currentStep?.type === 'slider' || currentStep?.type === 'number') && (
        <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 bg-gradient-to-t from-bg-primary/95 to-transparent pt-8">
          {currentStep?.type === 'number' && (
            <button
              onClick={goNext}
              className="flex-1 py-4 rounded-2xl border border-white/10 text-text-muted font-bold text-sm hover:text-white transition-all"
            >
              Pular
            </button>
          )}
          <button
            onClick={isLastFormStep ? handleSubmit : goNext}
            disabled={submitting}
            className="flex-1 py-4 rounded-2xl bg-ec-violet text-white font-black uppercase italic tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-ec-violet/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isLastFormStep ? (
              <>Enviar <Check className="w-4 h-4" /></>
            ) : (
              <>Próximo <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {currentStep?.type === 'done' && !submitted && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center">
          <button
            onClick={() => navigate('/app/today')}
            className="px-8 py-4 rounded-2xl bg-ec-violet text-white font-black uppercase italic tracking-widest"
          >
            Voltar ao início
          </button>
        </div>
      )}
    </div>
  )
}
