import { useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  Dumbbell,
  Goal,
  HeartHandshake,
  Home,
  Scale,
  Target,
  UserRound,
  Weight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { track } from '../../lib/analytics'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { profileService } from '../../services/profileService'
import { dietPreferencePt, formatDaysPerWeek, goalPt, levelPt, sexPt, trainingLocationPt } from '../../utils/labels'
import type { StudentPreferences } from '../../types/domain'

type StepId = 'welcome' | 'physical' | 'goal' | 'routine' | 'diet' | 'water' | 'review'

type OnboardingForm = {
  sex: 'male' | 'female' | ''
  weightKg: string
  heightCm: string
  goal: 'hypertrophy' | 'fat_loss' | 'maintenance' | 'performance' | ''
  trainingFrequency: '3' | '4' | '5' | '6' | ''
  trainingLevel: 'beginner' | 'intermediate' | 'advanced' | ''
  trainingLocation: 'gym' | 'home' | 'mixed' | ''
  dietPreference: 'flexible' | 'economic' | 'low_carb' | 'vegetarian' | 'carnivore' | ''
  waterGoalMl: string
}

const STEPS: Array<{ id: StepId; title: string; description: string }> = [
  {
    id: 'welcome',
    title: 'Vamos encontrar os melhores planos para sua rotina.',
    description: 'Com base nas suas respostas, vamos preparar treinos e dietas que combinam com seu objetivo.',
  },
  {
    id: 'physical',
    title: 'Primeiro, seus dados físicos.',
    description: 'Isso nos ajuda a calibrar volume, esforço e sua meta diária de água.',
  },
  {
    id: 'goal',
    title: 'Qual é sua prioridade agora?',
    description: 'Seu objetivo principal ajuda a filtrar os protocolos mais alinhados com o momento.',
  },
  {
    id: 'routine',
    title: 'Como é sua rotina de treino?',
    description: 'Frequência, nível e local definem o que faz sentido no mundo real.',
  },
  {
    id: 'diet',
    title: 'Como você prefere comer?',
    description: 'A ideia é recomendar algo que você consiga seguir, não só algo bonito na teoria.',
  },
  {
    id: 'water',
    title: 'Vamos fechar sua meta diária.',
    description: 'A hidratação entra no seu dia a dia desde o começo.',
  },
  {
    id: 'review',
    title: 'Revise suas respostas.',
    description: 'Quando você confirmar, seguimos para a próxima etapa de recomendações.',
  },
]

const GOAL_OPTIONS: Array<{ id: OnboardingForm['goal']; title: string; description: string; icon: ReactNode }> = [
  { id: 'hypertrophy', title: 'Hipertrofia', description: 'Ganho de massa com progressão consistente.', icon: <Dumbbell className="h-5 w-5" /> },
  { id: 'fat_loss', title: 'Emagrecimento', description: 'Perda de gordura com estrutura de treino e rotina.', icon: <Weight className="h-5 w-5" /> },
  { id: 'maintenance', title: 'Manutenção', description: 'Seguir bem, sem complicar o processo.', icon: <Target className="h-5 w-5" /> },
  { id: 'performance', title: 'Performance', description: 'Melhorar capacidade, consistência e entrega.', icon: <Goal className="h-5 w-5" /> },
]

const DIET_OPTIONS: Array<{ id: OnboardingForm['dietPreference']; title: string }> = [
  { id: 'flexible', title: 'Flexível' },
  { id: 'economic', title: 'Econômica' },
  { id: 'low_carb', title: 'Low carb' },
  { id: 'vegetarian', title: 'Vegetariana' },
  { id: 'carnivore', title: 'Carnívora' },
]

function parsePositiveNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function StudentOnboardingScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const { profile } = useProfile()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<OnboardingForm>({
    sex: profile?.sex === 'female' ? 'female' : profile?.sex === 'male' ? 'male' : '',
    weightKg: profile?.weightKg ? String(profile.weightKg) : profile?.weight ? String(profile.weight) : '',
    heightCm: profile?.heightCm ? String(profile.heightCm) : profile?.height ? String(profile.height) : '',
    goal: profile?.goal === 'maintenance' || profile?.goal === 'performance' || profile?.goal === 'hypertrophy' || profile?.goal === 'fat_loss' ? profile.goal : '',
    trainingFrequency: profile?.trainingFrequency && [3, 4, 5, 6].includes(profile.trainingFrequency) ? String(profile.trainingFrequency) as OnboardingForm['trainingFrequency'] : '',
    trainingLevel: profile?.trainingLevel || profile?.experienceLevel || '',
    trainingLocation: profile?.trainingLocation === 'gym' || profile?.trainingLocation === 'home' || profile?.trainingLocation === 'mixed' ? profile.trainingLocation : '',
    dietPreference: profile?.dietPreference === 'flexible' || profile?.dietPreference === 'economic' || profile?.dietPreference === 'low_carb' || profile?.dietPreference === 'vegetarian' || profile?.dietPreference === 'carnivore' ? profile.dietPreference : '',
    waterGoalMl: profile?.waterGoalMl ? String(profile.waterGoalMl) : '',
  })

  const currentStep = STEPS[currentStepIndex]
  const progress = Math.round(((currentStepIndex + 1) / STEPS.length) * 100)

  const reviewRows = useMemo(
    () => [
      ['Sexo', sexPt(form.sex)],
      ['Peso', form.weightKg ? `${form.weightKg} kg` : '-'],
      ['Altura', form.heightCm ? `${form.heightCm} cm` : '-'],
      ['Objetivo', goalPt(form.goal)],
      ['Frequência', formatDaysPerWeek(Number(form.trainingFrequency || 0))],
      ['Nível', levelPt(form.trainingLevel)],
      ['Local', trainingLocationPt(form.trainingLocation)],
      ['Preferência alimentar', dietPreferencePt(form.dietPreference)],
      ['Meta de água', form.waterGoalMl ? `${(Number(form.waterGoalMl) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L` : '-'],
    ],
    [form]
  )

  function canAdvance(step: StepId) {
    switch (step) {
      case 'welcome':
        return true
      case 'physical':
        return Boolean(form.sex && parsePositiveNumber(form.weightKg) && parsePositiveNumber(form.heightCm))
      case 'goal':
        return Boolean(form.goal)
      case 'routine':
        return Boolean(form.trainingFrequency && form.trainingLevel && form.trainingLocation)
      case 'diet':
        return Boolean(form.dietPreference)
      case 'water':
        return Boolean(parsePositiveNumber(form.waterGoalMl))
      case 'review':
        return true
      default:
        return false
    }
  }

  function nextStep() {
    if (!canAdvance(currentStep.id)) {
      setError('Preencha esta etapa antes de continuar.')
      return
    }
    setError(null)
    track('onboarding_step_completed', { step: currentStep.id, step_index: currentStepIndex })
    setCurrentStepIndex((value) => Math.min(value + 1, STEPS.length - 1))
  }

  function previousStep() {
    setError(null)
    setCurrentStepIndex((value) => Math.max(value - 1, 0))
  }

  async function handleFinish() {
    if (!firebaseUser) return

    const weightKg = parsePositiveNumber(form.weightKg)
    const heightCm = parsePositiveNumber(form.heightCm)
    const waterGoalMl = parsePositiveNumber(form.waterGoalMl)

    if (!form.sex || !weightKg || !heightCm || !form.goal || !form.trainingFrequency || !form.trainingLevel || !form.trainingLocation || !form.dietPreference || !waterGoalMl) {
      setError('Revise suas respostas antes de concluir.')
      return
    }

    setIsSaving(true)
    setError(null)

    const preferences: StudentPreferences = {
      sex: form.sex,
      weightKg,
      heightCm,
      goal: form.goal,
      trainingFrequency: Number(form.trainingFrequency) as 3 | 4 | 5 | 6,
      trainingLevel: form.trainingLevel,
      trainingLocation: form.trainingLocation,
      dietPreference: form.dietPreference,
      waterGoalMl,
      onboardingCompleted: true,
      recommendationsNeedRefresh: false,
    }

    try {
      await profileService.completeOnboarding(firebaseUser.uid, preferences)
      track('onboarding_completed', { role: 'member' })
      navigate('/app/recommendations', { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível concluir seu onboarding agora.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="ec-app-bg min-h-screen px-5 py-8 text-text-primary">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ec-violet">Onboarding</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Etapa {currentStepIndex + 1} de {STEPS.length}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-ec-violet">{progress}%</span>
          </div>
          <ProgressBar value={progress} color="violet" />
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={currentStep.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-[28px] border border-white/10 bg-[#111a2c] p-6 shadow-2xl shadow-black/30"
          >
            <h1 className="font-display text-2xl font-black uppercase italic leading-tight text-white">
              {currentStep.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {currentStep.description}
            </p>

            <div className="mt-6">
              {currentStep.id === 'welcome' && (
                <div className="space-y-4">
                  <InfoCard
                    icon={<HeartHandshake className="h-5 w-5" />}
                    title="Menos atrito para começar"
                    description="Você responde uma vez, e o app já fica pronto para recomendar os próximos passos."
                  />
                  <InfoCard
                    icon={<Dumbbell className="h-5 w-5" />}
                    title="Treino e dieta na sua realidade"
                    description="Frequência, nível, local e preferência alimentar entram desde o início."
                  />
                </div>
              )}

              {currentStep.id === 'physical' && (
                <div className="space-y-4">
                  <OptionGrid
                    label="Sexo"
                    options={[
                      { id: 'male', label: 'Masculino', icon: <UserRound className="h-4 w-4" /> },
                      { id: 'female', label: 'Feminino', icon: <UserRound className="h-4 w-4" /> },
                    ]}
                    value={form.sex}
                    onChange={(value) => setForm((prev) => ({ ...prev, sex: value as OnboardingForm['sex'] }))}
                  />
                  <InputRow
                    label="Peso atual (kg)"
                    icon={<Scale className="h-4 w-4" />}
                    value={form.weightKg}
                    onChange={(value) => setForm((prev) => ({ ...prev, weightKg: value }))}
                    placeholder="Ex: 78"
                  />
                  <InputRow
                    label="Altura (cm)"
                    icon={<UserRound className="h-4 w-4" />}
                    value={form.heightCm}
                    onChange={(value) => setForm((prev) => ({ ...prev, heightCm: value }))}
                    placeholder="Ex: 175"
                  />
                </div>
              )}

              {currentStep.id === 'goal' && (
                <div className="space-y-3">
                  {GOAL_OPTIONS.map((option) => (
                    <ChoiceCard
                      key={option.id}
                      selected={form.goal === option.id}
                      title={option.title}
                      description={option.description}
                      icon={option.icon}
                      onClick={() => setForm((prev) => ({ ...prev, goal: option.id }))}
                    />
                  ))}
                </div>
              )}

              {currentStep.id === 'routine' && (
                <div className="space-y-5">
                  <OptionGrid
                    label="Quantas vezes por semana você pretende treinar?"
                    options={[
                      { id: '3', label: '3x/semana' },
                      { id: '4', label: '4x/semana' },
                      { id: '5', label: '5x/semana' },
                      { id: '6', label: '6x/semana' },
                    ]}
                    value={form.trainingFrequency}
                    onChange={(value) => setForm((prev) => ({ ...prev, trainingFrequency: value as OnboardingForm['trainingFrequency'] }))}
                  />
                  <OptionGrid
                    label="Qual seu nível de treino hoje?"
                    options={[
                      { id: 'beginner', label: 'Iniciante' },
                      { id: 'intermediate', label: 'Intermediário' },
                      { id: 'advanced', label: 'Avançado' },
                    ]}
                    value={form.trainingLevel}
                    onChange={(value) => setForm((prev) => ({ ...prev, trainingLevel: value as OnboardingForm['trainingLevel'] }))}
                  />
                  <OptionGrid
                    label="Onde você vai treinar?"
                    options={[
                      { id: 'gym', label: 'Academia', icon: <Dumbbell className="h-4 w-4" /> },
                      { id: 'home', label: 'Casa', icon: <Home className="h-4 w-4" /> },
                      { id: 'mixed', label: 'Misto', icon: <Target className="h-4 w-4" /> },
                    ]}
                    value={form.trainingLocation}
                    onChange={(value) => setForm((prev) => ({ ...prev, trainingLocation: value as OnboardingForm['trainingLocation'] }))}
                  />
                </div>
              )}

              {currentStep.id === 'diet' && (
                <OptionGrid
                  label="Qual estilo faz mais sentido para sua rotina?"
                  options={DIET_OPTIONS.map((option) => ({ id: option.id, label: option.title }))}
                  value={form.dietPreference}
                  onChange={(value) => setForm((prev) => ({ ...prev, dietPreference: value as OnboardingForm['dietPreference'] }))}
                />
              )}

              {currentStep.id === 'water' && (
                <div className="space-y-4">
                  <InputRow
                    label="Meta diária de água (ml)"
                    icon={<Droplets className="h-4 w-4" />}
                    value={form.waterGoalMl}
                    onChange={(value) => setForm((prev) => ({ ...prev, waterGoalMl: value }))}
                    placeholder="Ex: 3000"
                  />
                  <p className="text-xs text-text-muted">
                    Dica: se quiser, use algo entre 35 e 40 ml por kg como ponto de partida.
                  </p>
                </div>
              )}

              {currentStep.id === 'review' && (
                <div className="space-y-3">
                  {reviewRows.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
                      <p className="mt-1 text-sm font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={previousStep}
                disabled={currentStepIndex === 0 || isSaving}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Voltar
              </Button>
              {currentStep.id === 'review' ? (
                <Button
                  variant="primary"
                  className="flex-[1.2]"
                  onClick={handleFinish}
                  isLoading={isSaving}
                  icon={<Check className="h-4 w-4" />}
                >
                  Concluir
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="flex-[1.2]"
                  onClick={nextStep}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Continuar
                </Button>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ChoiceCard({
  selected,
  title,
  description,
  icon,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        selected ? 'border-ec-violet bg-ec-violet/10 text-white' : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${selected ? 'bg-ec-violet/20 text-ec-violet' : 'bg-white/5 text-text-muted'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  )
}

function OptionGrid({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ id: string; label: string; icon?: ReactNode }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-2xl border px-4 py-4 text-sm font-bold transition-all ${
                selected ? 'border-ec-violet bg-ec-violet/10 text-white' : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InputRow({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="text-text-muted">{icon}</span>
        <input
          className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-text-muted"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  )
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-ec-violet/10 p-2 text-ec-violet">{icon}</div>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p>
        </div>
      </div>
    </div>
  )
}
