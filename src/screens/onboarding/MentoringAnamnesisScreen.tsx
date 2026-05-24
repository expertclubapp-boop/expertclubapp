import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Check, Crown, ArrowRight, SkipForward, Camera, Loader2, X, ImageIcon } from 'lucide-react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useNavigate } from 'react-router-dom'
import { db, storage } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { useAuth } from '../../contexts/AuthContext'
import { track } from '../../lib/analytics'

// ─── Data model ────────────────────────────────────────────────────────────────

interface AnamnesisData {
  goal: string
  goalDeadline: string
  experienceLevel: string
  availableDays: string[]
  trainingLocation: string
  weightKg: string
  heightCm: string
  waistCm: string
  abdomenCm: string
  hipsCm: string
  armCm: string
  thighCm: string
  allergies: string
  foodLikes: string
  foodDislikes: string
  dietRestrictions: string[]
  injuries: string
  motivation: string
  photoFront: string
  photoSide: string
  photoBack: string
  photoExtra: string
}

const empty: AnamnesisData = {
  goal: '',
  goalDeadline: '',
  experienceLevel: '',
  availableDays: [],
  trainingLocation: '',
  weightKg: '',
  heightCm: '',
  waistCm: '',
  abdomenCm: '',
  hipsCm: '',
  armCm: '',
  thighCm: '',
  allergies: '',
  foodLikes: '',
  foodDislikes: '',
  dietRestrictions: [],
  injuries: '',
  motivation: '',
  photoFront: '',
  photoSide: '',
  photoBack: '',
  photoExtra: '',
}

// ─── Step definitions ───────────────────────────────────────────────────────────

type StepType = 'welcome' | 'single' | 'multi' | 'text' | 'textarea' | 'numbers' | 'photos' | 'done'

interface Step {
  id: string
  type: StepType
  question?: string
  description?: string
  field?: keyof AnamnesisData
  options?: { value: string; label: string; emoji?: string }[]
  optional?: boolean
  placeholder?: string
  unit?: string
  numberFields?: { field: keyof AnamnesisData; label: string; unit: string; placeholder: string }[]
}

const STEPS: Step[] = [
  { id: 'welcome', type: 'welcome' },
  {
    id: 'goal',
    type: 'single',
    question: 'Qual é o seu objetivo principal?',
    description: 'Isso orienta toda a prescrição do seu mentor.',
    field: 'goal',
    options: [
      { value: 'fat_loss', label: 'Perder gordura', emoji: '🔥' },
      { value: 'hypertrophy', label: 'Ganhar músculo', emoji: '💪' },
      { value: 'recomposition', label: 'Recomposição corporal', emoji: '⚡' },
      { value: 'performance', label: 'Melhorar performance', emoji: '🏆' },
      { value: 'health', label: 'Saúde e bem-estar', emoji: '🌱' },
    ],
  },
  {
    id: 'goalDeadline',
    type: 'text',
    question: 'Em quanto tempo quer atingir esse objetivo?',
    description: 'Ex: 3 meses, 6 meses, 1 ano. Seja realista.',
    field: 'goalDeadline',
    placeholder: 'Ex: 3 meses',
  },
  {
    id: 'experienceLevel',
    type: 'single',
    question: 'Qual é sua experiência com treinos?',
    field: 'experienceLevel',
    options: [
      { value: 'beginner', label: 'Iniciante — menos de 6 meses', emoji: '🌱' },
      { value: 'intermediate', label: 'Intermediário — 6 meses a 2 anos', emoji: '📈' },
      { value: 'advanced', label: 'Avançado — mais de 2 anos', emoji: '🏋️' },
    ],
  },
  {
    id: 'availableDays',
    type: 'multi',
    question: 'Quais dias você pode treinar?',
    description: 'Selecione todos os dias disponíveis.',
    field: 'availableDays',
    options: [
      { value: 'seg', label: 'Seg' },
      { value: 'ter', label: 'Ter' },
      { value: 'qua', label: 'Qua' },
      { value: 'qui', label: 'Qui' },
      { value: 'sex', label: 'Sex' },
      { value: 'sab', label: 'Sáb' },
      { value: 'dom', label: 'Dom' },
    ],
  },
  {
    id: 'trainingLocation',
    type: 'single',
    question: 'Onde você treina?',
    field: 'trainingLocation',
    options: [
      { value: 'gym', label: 'Academia equipada', emoji: '🏢' },
      { value: 'home', label: 'Em casa', emoji: '🏠' },
      { value: 'mixed', label: 'Misto (academia + casa)', emoji: '🔄' },
      { value: 'outdoor', label: 'Ao ar livre', emoji: '🌿' },
    ],
  },
  {
    id: 'body',
    type: 'numbers',
    question: 'Seu peso e altura atuais',
    description: 'Fundamental para calcular as metas nutricionais.',
    numberFields: [
      { field: 'weightKg', label: 'Peso', unit: 'kg', placeholder: '75' },
      { field: 'heightCm', label: 'Altura', unit: 'cm', placeholder: '175' },
    ],
  },
  {
    id: 'measurements',
    type: 'numbers',
    question: 'Medidas corporais',
    description: 'Opcional — preencha o que souber. Pode completar depois com o mentor.',
    optional: true,
    numberFields: [
      { field: 'waistCm', label: 'Cintura', unit: 'cm', placeholder: '80' },
      { field: 'abdomenCm', label: 'Abdômen', unit: 'cm', placeholder: '85' },
      { field: 'hipsCm', label: 'Quadril', unit: 'cm', placeholder: '95' },
      { field: 'armCm', label: 'Braço', unit: 'cm', placeholder: '35' },
      { field: 'thighCm', label: 'Coxa', unit: 'cm', placeholder: '55' },
    ],
  },
  {
    id: 'allergies',
    type: 'textarea',
    question: 'Tem alguma alergia ou intolerância alimentar?',
    description: 'Ex: lactose, glúten, amendoim. Escreva "nenhuma" se não tiver.',
    field: 'allergies',
    placeholder: 'Ex: intolerante à lactose, alergia a frutos do mar',
    optional: true,
  },
  {
    id: 'foodLikes',
    type: 'textarea',
    question: 'Quais alimentos você mais gosta?',
    description: 'Seu mentor vai priorizar esses na montagem da dieta.',
    field: 'foodLikes',
    placeholder: 'Ex: frango, arroz, batata doce, ovo, banana...',
  },
  {
    id: 'foodDislikes',
    type: 'textarea',
    question: 'Quais alimentos você não gosta ou evita?',
    description: 'Sem julgamentos — seu mentor vai respeitar suas preferências.',
    field: 'foodDislikes',
    placeholder: 'Ex: fígado, beterraba, leite de vaca...',
    optional: true,
  },
  {
    id: 'dietRestrictions',
    type: 'multi',
    question: 'Tem alguma restrição alimentar?',
    field: 'dietRestrictions',
    options: [
      { value: 'none', label: 'Nenhuma' },
      { value: 'vegetarian', label: 'Vegetariano' },
      { value: 'vegan', label: 'Vegano' },
      { value: 'gluten_free', label: 'Sem glúten' },
      { value: 'dairy_free', label: 'Sem laticínios' },
      { value: 'halal', label: 'Halal' },
    ],
  },
  {
    id: 'injuries',
    type: 'textarea',
    question: 'Tem alguma lesão, dor ou limitação física?',
    description: 'Seu mentor vai adaptar os exercícios conforme necessário.',
    field: 'injuries',
    placeholder: 'Ex: hérnia de disco L4-L5, dor no joelho direito, tendinite no ombro...',
    optional: true,
  },
  {
    id: 'motivation',
    type: 'textarea',
    question: 'Por que você quer essa mentoria?',
    description: 'Nos conte o que te motivou a buscar acompanhamento profissional.',
    field: 'motivation',
    placeholder: 'Conte um pouco sobre sua história e o que espera alcançar com a mentoria...',
  },
  { id: 'photos', type: 'photos' },
  { id: 'done', type: 'done' },
]

const TOTAL_FORM_STEPS = STEPS.length - 2 // exclude welcome & done

// ─── Photo upload ─────────────────────────────────────────────────────────────

type PhotoSlotKey = 'photoFront' | 'photoSide' | 'photoBack' | 'photoExtra'

const PHOTO_SLOTS: { key: PhotoSlotKey; label: string; hint: string; required: boolean }[] = [
  { key: 'photoFront', label: 'Frente', hint: 'De frente, braços ao lado', required: true },
  { key: 'photoSide', label: 'Lado', hint: 'De perfil, braços ao lado', required: true },
  { key: 'photoBack', label: 'Costas', hint: 'De costas, braços ao lado', required: true },
  { key: 'photoExtra', label: 'Foto livre', hint: 'Opcional — mostre algum ponto que te incomoda', required: false },
]

interface PhotoSlotProps {
  slotKey: PhotoSlotKey
  label: string
  hint: string
  required: boolean
  url: string
  uploading: boolean
  error: string
  uid: string
  onUpload: (key: PhotoSlotKey, url: string) => void
  onError: (key: PhotoSlotKey, msg: string) => void
  onUploading: (key: PhotoSlotKey, loading: boolean) => void
}

function PhotoSlot({ slotKey, label, hint, required, url, uploading, error, uid, onUpload, onError, onUploading }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUploading(slotKey, true)
    onError(slotKey, '')
    try {
      const path = `users/${uid}/anamnesis/photos/${slotKey}-${Date.now()}.jpg`
      const sRef = storageRef(storage, path)
      await uploadBytes(sRef, file, { contentType: file.type || 'image/jpeg' })
      const downloadUrl = await getDownloadURL(sRef)
      onUpload(slotKey, downloadUrl)
    } catch (err) {
      onError(slotKey, 'Falha no upload. Tente novamente.')
    } finally {
      onUploading(slotKey, false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const isEmpty = !url && !uploading

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-black uppercase tracking-widest text-white">{label}</span>
        {required ? (
          <span className="text-[9px] text-accent-red font-bold">*</span>
        ) : (
          <span className="text-[9px] text-text-muted font-bold uppercase">(opcional)</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`
          relative aspect-[3/4] w-full rounded-2xl border-2 overflow-hidden
          flex flex-col items-center justify-center gap-2
          transition-all active:scale-[0.98]
          ${url
            ? 'border-accent-lime/40 bg-transparent'
            : error
              ? 'border-accent-red/40 bg-accent-red/5 hover:border-accent-red/60'
              : 'border-white/10 bg-white/[0.03] hover:border-ec-violet/40 hover:bg-ec-violet/5 border-dashed'
          }
        `}
      >
        {/* Preview */}
        {url && (
          <img
            src={url}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay on hover when has photo */}
        {url && (
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <Camera className="w-6 h-6 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Trocar</span>
          </div>
        )}

        {/* Done badge */}
        {url && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent-lime flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-black" />
          </div>
        )}

        {/* Empty state */}
        {isEmpty && !error && (
          <>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-text-muted" />
            </div>
            <span className="text-[10px] font-bold text-text-muted text-center px-2 leading-tight">{hint}</span>
          </>
        )}

        {/* Error state */}
        {isEmpty && error && (
          <>
            <div className="w-10 h-10 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center">
              <X className="w-5 h-5 text-accent-red" />
            </div>
            <span className="text-[10px] font-bold text-accent-red text-center px-2 leading-tight">{error}</span>
          </>
        )}

        {/* Uploading */}
        {uploading && (
          <div className="absolute inset-0 bg-bg-primary/80 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-ec-violet animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-ec-violet">Enviando...</span>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ─── Other inputs ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-ec-violet rounded-full"
        animate={{ width: `${Math.round((current / total) * 100)}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

function SingleChoice({ step, value, onChange }: { step: Step; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
      {step.options!.map(opt => (
        <motion.button
          key={opt.value}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-4 w-full rounded-2xl border p-4 text-left transition-all ${
            value === opt.value
              ? 'border-ec-violet bg-ec-violet/15 shadow-[0_0_20px_rgba(91,75,255,0.2)]'
              : 'border-white/10 bg-white/[0.03] hover:border-ec-violet/40 hover:bg-white/[0.06]'
          }`}
        >
          {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
          <span className="font-bold text-sm text-white flex-1">{opt.label}</span>
          {value === opt.value && (
            <div className="w-5 h-5 rounded-full bg-ec-violet flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

function MultiChoice({ step, value, onChange }: { step: Step; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(v: string) {
    if (v === 'none') { onChange(['none']); return }
    const filtered = value.filter(x => x !== 'none')
    onChange(filtered.includes(v) ? filtered.filter(x => x !== v) : [...filtered, v])
  }
  return (
    <div className="flex flex-wrap gap-3 justify-center max-w-sm mx-auto">
      {step.options!.map(opt => {
        const active = value.includes(opt.value)
        return (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(opt.value)}
            className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
              active
                ? 'border-ec-violet bg-ec-violet/20 text-white shadow-[0_0_12px_rgba(91,75,255,0.25)]'
                : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:text-white'
            }`}
          >
            {opt.label}
          </motion.button>
        )
      })}
    </div>
  )
}

function TextInput({ step, value, onChange, onEnter }: { step: Step; value: string; onChange: (v: string) => void; onEnter: () => void }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onEnter() }}
        placeholder={step.placeholder}
        className="w-full bg-transparent border-b-2 border-white/20 focus:border-ec-violet text-white text-xl font-bold py-3 outline-none placeholder:text-white/20 transition-colors text-center"
      />
      <p className="text-center text-xs text-text-muted mt-3">Pressione Enter para avançar</p>
    </div>
  )
}

function TextAreaInput({ step, value, onChange }: { step: Step; value: string; onChange: (v: string) => void }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <textarea
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={step.placeholder}
        rows={4}
        className="w-full bg-white/[0.04] border border-white/10 focus:border-ec-violet rounded-2xl p-4 text-white text-sm font-medium outline-none placeholder:text-white/20 resize-none transition-colors"
      />
    </div>
  )
}

function NumberFields({ step, data, onChange }: { step: Step; data: AnamnesisData; onChange: (field: keyof AnamnesisData, v: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-sm mx-auto">
      {step.numberFields!.map(f => (
        <div key={f.field} className="flex flex-col items-center gap-2 min-w-[90px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">{f.label}</label>
          <div className="relative">
            <input
              type="number"
              value={data[f.field] as string}
              onChange={e => onChange(f.field, e.target.value)}
              placeholder={f.placeholder}
              className="w-24 bg-white/5 border border-white/10 focus:border-ec-violet rounded-xl py-3 px-3 text-white text-lg font-black text-center outline-none transition-colors"
            />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-text-muted font-bold">{f.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function MentoringAnamnesisScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [stepIdx, setStepIdx] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [data, setData] = useState<AnamnesisData>(empty)
  const [isSaving, setIsSaving] = useState(false)
  // photo upload state
  const [photoUploading, setPhotoUploading] = useState<Partial<Record<PhotoSlotKey, boolean>>>({})
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<PhotoSlotKey, string>>>({})

  const step = STEPS[stepIdx]
  const isFirst = stepIdx === 0
  const formStepNumber = Math.max(0, stepIdx - 1)

  function set(field: keyof AnamnesisData, value: string | string[]) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const advance = useCallback(() => {
    if (stepIdx >= STEPS.length - 1) return
    setDirection(1)
    setStepIdx(s => s + 1)
    track('onboarding_step_completed', { step: stepIdx, stepId: STEPS[stepIdx].id, role: 'member' })
  }, [stepIdx])

  function back() {
    if (stepIdx <= 0) return
    setDirection(-1)
    setStepIdx(s => s - 1)
  }

  function canAdvance(): boolean {
    if (step.optional) return true
    if (step.type === 'welcome' || step.type === 'done') return true
    if (step.type === 'single') return Boolean(step.field && data[step.field])
    if (step.type === 'multi') return Boolean(step.field && (data[step.field] as string[]).length > 0)
    if (step.type === 'text') return Boolean(step.field && String(data[step.field]).trim())
    if (step.type === 'textarea') return Boolean(step.field && String(data[step.field]).trim())
    if (step.type === 'numbers') {
      const required = step.optional ? [] : (step.numberFields ?? []).slice(0, 2)
      return required.every(f => String(data[f.field]).trim() !== '')
    }
    if (step.type === 'photos') {
      const anyUploading = Object.values(photoUploading).some(Boolean)
      return !anyUploading && Boolean(data.photoFront) && Boolean(data.photoSide) && Boolean(data.photoBack)
    }
    return true
  }

  async function handleDone() {
    if (!firebaseUser || isSaving) return
    setIsSaving(true)
    try {
      const profileRef = doc(db, COLLECTIONS.PROFILES, firebaseUser.uid)
      await setDoc(profileRef, {
        uid: firebaseUser.uid,
        mentoringAnamnesisCompleted: true,
        mentoringAnamnesis: {
          goal: data.goal,
          goalDeadline: data.goalDeadline,
          experienceLevel: data.experienceLevel,
          availableDays: data.availableDays,
          trainingLocation: data.trainingLocation,
          weightKg: data.weightKg ? Number(data.weightKg) : 0,
          heightCm: data.heightCm ? Number(data.heightCm) : 0,
          measurements: {
            waistCm: data.waistCm ? Number(data.waistCm) : undefined,
            abdomenCm: data.abdomenCm ? Number(data.abdomenCm) : undefined,
            hipsCm: data.hipsCm ? Number(data.hipsCm) : undefined,
            armCm: data.armCm ? Number(data.armCm) : undefined,
            thighCm: data.thighCm ? Number(data.thighCm) : undefined,
          },
          allergies: data.allergies,
          foodLikes: data.foodLikes,
          foodDislikes: data.foodDislikes,
          dietRestrictions: data.dietRestrictions,
          injuries: data.injuries,
          motivation: data.motivation,
          photoUrls: {
            front: data.photoFront || null,
            side: data.photoSide || null,
            back: data.photoBack || null,
            extra: data.photoExtra || null,
          },
          completedAt: new Date().toISOString(),
        },
        weightKg: data.weightKg ? Number(data.weightKg) : undefined,
        heightCm: data.heightCm ? Number(data.heightCm) : undefined,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      track('onboarding_completed', { role: 'member', type: 'mentoring_anamnesis' })
      navigate('/app/today', { replace: true })
    } catch (err) {
      console.error(err)
      setIsSaving(false)
    }
  }

  function handleSingleSelect(value: string) {
    if (!step.field) return
    set(step.field, value)
    setTimeout(() => advance(), 300)
  }

  const isAnyPhotoUploading = Object.values(photoUploading).some(Boolean)

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-10 px-4 pt-safe">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 py-4">
            {!isFirst && step.type !== 'done' && (
              <button
                onClick={back}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              {!isFirst && step.type !== 'done' && (
                <ProgressBar current={formStepNumber} total={TOTAL_FORM_STEPS} />
              )}
            </div>
            {!isFirst && step.type !== 'done' && (
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted whitespace-nowrap flex-shrink-0">
                {formStepNumber} / {TOTAL_FORM_STEPS}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 px-6 pt-20 pb-32 ${step.type === 'photos' ? 'overflow-y-auto' : 'flex items-center justify-center'}`}>
        <div className="w-full max-w-lg mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={{
                enter: (dir: 1 | -1) => ({ x: dir * 60, opacity: 0 }),
                center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
                exit: (dir: 1 | -1) => ({ x: dir * -60, opacity: 0, transition: { duration: 0.2 } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              className={`flex flex-col items-center gap-8 text-center ${step.type !== 'photos' ? '' : 'items-stretch'}`}
            >
              {/* Welcome */}
              {step.type === 'welcome' && (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-ec-violet to-accent-purple flex items-center justify-center shadow-[0_8px_40px_rgba(91,75,255,0.4)]">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ec-violet">Mentoria 1:1</p>
                    <h1 className="text-3xl font-black italic uppercase text-white leading-tight">Anamnese</h1>
                    <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
                      Responda com calma — essas informações permitem que seu mentor crie uma prescrição 100% personalizada para você.
                    </p>
                    <p className="text-text-muted text-xs">Leva menos de 5 minutos · {TOTAL_FORM_STEPS} perguntas</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={advance}
                    className="flex items-center gap-2 bg-ec-violet text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgba(91,75,255,0.35)] hover:bg-ec-violet/90 transition-colors"
                  >
                    Começar
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </>
              )}

              {/* Done */}
              {step.type === 'done' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-accent-lime/20 border-2 border-accent-lime flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-accent-lime" />
                  </motion.div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-black italic uppercase text-white">Tudo certo!</h1>
                    <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
                      Seu mentor vai analisar suas respostas e preparar a prescrição perfeita para você.
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDone}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-accent-lime text-black font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-accent-lime/90 transition-colors disabled:opacity-60"
                  >
                    {isSaving ? 'Salvando...' : 'Acessar o app'}
                    {!isSaving && <ArrowRight className="w-4 h-4" />}
                  </motion.button>
                </>
              )}

              {/* Photos */}
              {step.type === 'photos' && (
                <div className="w-full text-center space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black italic text-white leading-tight">Fotos de avaliação</h2>
                    <p className="text-sm text-text-secondary">
                      Essenciais para o mentor avaliar sua composição corporal e acompanhar sua evolução.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                        <span className="text-accent-red font-bold text-xs">*</span>
                        <span>obrigatório</span>
                      </div>
                      <span className="text-white/20">·</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                        <ImageIcon className="w-3 h-3" />
                        <span>Use roupas justas (biquíni, sunga, shorts)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {PHOTO_SLOTS.map(slot => (
                      <PhotoSlot
                        key={slot.key}
                        slotKey={slot.key}
                        label={slot.label}
                        hint={slot.hint}
                        required={slot.required}
                        url={data[slot.key]}
                        uploading={photoUploading[slot.key] ?? false}
                        error={photoErrors[slot.key] ?? ''}
                        uid={firebaseUser?.uid ?? ''}
                        onUpload={(key, url) => set(key, url)}
                        onError={(key, msg) => setPhotoErrors(p => ({ ...p, [key]: msg }))}
                        onUploading={(key, loading) => setPhotoUploading(p => ({ ...p, [key]: loading }))}
                      />
                    ))}
                  </div>

                  {/* Required reminder */}
                  {(!data.photoFront || !data.photoSide || !data.photoBack) && !isAnyPhotoUploading && (
                    <p className="text-xs text-text-muted">
                      Frente, lado e costas são obrigatórios para avançar.
                    </p>
                  )}
                </div>
              )}

              {/* Form questions */}
              {step.type !== 'welcome' && step.type !== 'done' && step.type !== 'photos' && (
                <>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black italic text-white leading-tight">{step.question}</h2>
                    {step.description && <p className="text-sm text-text-secondary">{step.description}</p>}
                  </div>

                  {step.type === 'single' && (
                    <SingleChoice
                      step={step}
                      value={step.field ? String(data[step.field]) : ''}
                      onChange={handleSingleSelect}
                    />
                  )}
                  {step.type === 'multi' && (
                    <MultiChoice
                      step={step}
                      value={step.field ? (data[step.field] as string[]) : []}
                      onChange={v => step.field && set(step.field, v)}
                    />
                  )}
                  {step.type === 'text' && (
                    <TextInput
                      step={step}
                      value={step.field ? String(data[step.field]) : ''}
                      onChange={v => step.field && set(step.field, v)}
                      onEnter={() => canAdvance() && advance()}
                    />
                  )}
                  {step.type === 'textarea' && (
                    <TextAreaInput
                      step={step}
                      value={step.field ? String(data[step.field]) : ''}
                      onChange={v => step.field && set(step.field, v)}
                    />
                  )}
                  {step.type === 'numbers' && (
                    <NumberFields step={step} data={data} onChange={(field, v) => set(field, v)} />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action bar — hidden for welcome, done, and single (auto-advances) */}
      {step.type !== 'welcome' && step.type !== 'done' && step.type !== 'single' && (
        <div className="fixed bottom-0 inset-x-0 pb-safe bg-gradient-to-t from-bg-primary via-bg-primary/95 to-transparent pt-6">
          <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
            {step.optional ? (
              <button
                onClick={advance}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors font-bold uppercase tracking-widest"
              >
                <SkipForward className="w-4 h-4" />
                Pular
              </button>
            ) : (
              <div />
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={advance}
              disabled={!canAdvance() || isAnyPhotoUploading}
              className="flex items-center gap-2 bg-ec-violet text-white font-black text-sm uppercase tracking-widest px-7 py-3.5 rounded-2xl shadow-[0_6px_20px_rgba(91,75,255,0.3)] hover:bg-ec-violet/90 transition-all disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isAnyPhotoUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <>Próximo <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
