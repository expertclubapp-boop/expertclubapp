import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Camera,
  ChevronRight,
  CreditCard,
  Droplets,
  Dumbbell,
  Edit3,
  Flame,
  LogOut,
  MessageSquare,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Utensils,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../../components/ui/Premium'
import { Button as UIButton } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { useAuth } from '../../contexts/AuthContext'
import { useDiet } from '../../hooks/useDiets'
import { useProfile } from '../../hooks/useProfile'
import { useSubscription } from '../../hooks/useSubscription'
import { useWorkout } from '../../hooks/useWorkouts'
import { profileService } from '../../services/profileService'
import { dietPreferencePt, formatDaysPerWeek, goalPt, levelPt, sexPt, trainingLocationPt } from '../../utils/labels'

type ProfileForm = {
  weightKg: string
  goal: string
  trainingFrequency: string
  trainingLevel: string
  trainingLocation: string
  dietPreference: string
  waterGoalMl: string
}

export function ProfileSettingsScreen() {
  const navigate = useNavigate()
  const { firebaseUser, logout } = useAuth()
  const { profile } = useProfile()
  const { subscription } = useSubscription()
  const { workout } = useWorkout(profile?.selectedWorkoutId)
  const { diet } = useDiet(profile?.selectedDietId)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [form, setForm] = useState<ProfileForm>({
    weightKg: profile?.weightKg ? String(profile.weightKg) : profile?.weight ? String(profile.weight) : '',
    goal: profile?.goal || 'hypertrophy',
    trainingFrequency: profile?.trainingFrequency ? String(profile.trainingFrequency) : '3',
    trainingLevel: profile?.trainingLevel || profile?.experienceLevel || 'beginner',
    trainingLocation: profile?.trainingLocation || 'gym',
    dietPreference: profile?.dietPreference || 'flexible',
    waterGoalMl: profile?.waterGoalMl ? String(profile.waterGoalMl) : '2500',
  })

  const onboardingSummary = useMemo(
    () => [
      { label: 'Sexo', value: sexPt(profile?.sex) },
      { label: 'Objetivo', value: goalPt(profile?.goal) },
      { label: 'Frequência', value: formatDaysPerWeek(profile?.trainingFrequency) },
      { label: 'Nível', value: levelPt(profile?.trainingLevel || profile?.experienceLevel) },
      { label: 'Local', value: trainingLocationPt(profile?.trainingLocation) },
      { label: 'Preferência alimentar', value: dietPreferencePt(profile?.dietPreference) },
      { label: 'Meta de água', value: profile?.waterGoalMl ? `${(profile.waterGoalMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L/dia` : '-' },
    ],
    [profile]
  )

  function openEditor() {
    setForm({
      weightKg: profile?.weightKg ? String(profile.weightKg) : profile?.weight ? String(profile.weight) : '',
      goal: profile?.goal || 'hypertrophy',
      trainingFrequency: profile?.trainingFrequency ? String(profile.trainingFrequency) : '3',
      trainingLevel: profile?.trainingLevel || profile?.experienceLevel || 'beginner',
      trainingLocation: profile?.trainingLocation || 'gym',
      dietPreference: profile?.dietPreference || 'flexible',
      waterGoalMl: profile?.waterGoalMl ? String(profile.waterGoalMl) : '2500',
    })
    setFeedback(null)
    setIsEditing(true)
  }

  async function handleSave() {
    if (!firebaseUser) return

    const weightKg = Number(form.weightKg.replace(',', '.'))
    const trainingFrequency = Number(form.trainingFrequency)
    const waterGoalMl = Number(form.waterGoalMl.replace(',', '.'))

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setFeedback({ type: 'error', message: 'Informe um peso válido.' })
      return
    }
    if (![3, 4, 5, 6].includes(trainingFrequency)) {
      setFeedback({ type: 'error', message: 'Escolha uma frequência de treino válida.' })
      return
    }
    if (!Number.isFinite(waterGoalMl) || waterGoalMl <= 0) {
      setFeedback({ type: 'error', message: 'Informe uma meta de água válida.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      await profileService.updateProfile(firebaseUser.uid, {
        weightKg,
        goal: form.goal as 'hypertrophy' | 'fat_loss' | 'maintenance' | 'performance',
        trainingFrequency,
        trainingLevel: form.trainingLevel as 'beginner' | 'intermediate' | 'advanced',
        trainingLocation: form.trainingLocation as 'gym' | 'home' | 'mixed',
        dietPreference: form.dietPreference as 'flexible' | 'economic' | 'low_carb' | 'vegetarian' | 'carnivore',
        waterGoalMl,
        recommendationsNeedRefresh: true,
      })
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Preferências atualizadas. Vamos usar isso nas próximas recomendações.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar suas preferências agora.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell className="!max-w-[560px] pb-32">
      <header className="mb-4">
        <p className="font-mono text-[10px] text-text-muted tracking-[0.18em] uppercase">Perfil</p>
      </header>

      {/* User hero row */}
      <div className="ec-card rounded-card mb-4 overflow-hidden p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-volt-600/30 bg-volt-600/10 text-volt-400">
            <UserRound className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-white truncate">
              {firebaseUser?.displayName || 'Aluno'}
            </h2>
            <p className="font-mono text-xs text-text-muted truncate">{firebaseUser?.email || '-'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(profile?.currentStreak ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#FF3D6E]/30 bg-[#FF3D6E]/10 text-[#FF3D6E]">
                  <Flame className="h-2.5 w-2.5" />
                  <span className="font-mono text-[9px] font-bold">{profile?.currentStreak}d</span>
                </div>
              )}
              <div className="px-2 py-0.5 rounded-full border border-volt-600/30 bg-volt-600/10">
                <span className="font-mono text-[9px] font-bold text-volt-400 uppercase">
                  {subscription?.planName || 'Ativo'}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={openEditor} className="rounded-xl border border-white/10 bg-white/5 p-2 text-text-muted hover:text-white transition-colors shrink-0">
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="ec-card rounded-2xl mb-6 p-5">
        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Planos atuais</p>
        <div className="mt-4 grid gap-3">
          <SummaryRow icon={<Dumbbell className="h-4 w-4" />} label="Treino selecionado" value={workout?.title || 'Ainda não escolhido'} />
          <SummaryRow icon={<Utensils className="h-4 w-4" />} label="Dieta selecionada" value={diet?.title || 'Ainda não escolhida'} />
          <SummaryRow icon={<CreditCard className="h-4 w-4" />} label="Assinatura" value={subscription?.status || 'active'} />
        </div>
      </div>

      <div className="ec-card rounded-2xl mb-6 p-5">
        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Base de preferências</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {onboardingSummary.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu list */}
      <div className="ec-card rounded-2xl mb-6 overflow-hidden">
        {profile?.recommendationsNeedRefresh && (
          <div className="border-b border-white/5 px-4 py-3 bg-volt-600/8">
            <p className="text-xs text-volt-400 font-bold">Preferências mudaram — novos planos disponíveis</p>
          </div>
        )}
        {[
          { icon: TrendingUp, label: 'Evolução', sub: `${profile?.currentStreak ?? 0}d de sequência`, to: '/app/evolution' },
          { icon: Trophy, label: 'Conquistas', sub: 'Badges e marcos', to: '/app/challenges' },
          { icon: MessageSquare, label: 'Chat com coach', sub: 'Mentoria 1:1', to: '/app/community' },
          { icon: Target, label: 'Recomendações', sub: 'Treinos e dietas sugeridos', to: '/app/recommendations' },
          { icon: Camera, label: 'Fotos de evolução', sub: 'Antes e depois', to: '/app/evolution/checkin' },
          { icon: CreditCard, label: 'Plano e pagamentos', sub: subscription?.planName || 'Ver assinatura', to: '/app/meu-plano' },
          { icon: Bell, label: 'Notificações', sub: 'Lembretes e alertas', to: '/app/profile' },
          { icon: Settings, label: 'Configurações', sub: 'Preferências gerais', to: '/app/profile', onClick: openEditor },
        ].map(({ icon: Icon, label, sub, to, onClick: menuClick }) => (
          <button
            key={label}
            type="button"
            onClick={menuClick ?? (() => navigate(to))}
            className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3.5 text-left last:border-b-0 hover:bg-white/[0.03] active:opacity-70 transition-all"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-text-muted">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="font-mono text-[10px] text-text-muted mt-0.5 truncate">{sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-accent-red/5 active:opacity-70 transition-all"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-red/10 text-accent-red">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-accent-red">Sair da conta</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            feedback.type === 'success'
              ? 'border-accent-lime/35 bg-accent-lime/10 text-accent-lime'
              : 'border-accent-red/35 bg-accent-red/10 text-accent-red'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ec-card w-full max-w-md rounded-3xl p-6"
          >
            <h2 className="font-display text-2xl font-black uppercase italic text-white">Atualizar preferências</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Se você mudar essas respostas, vamos marcar suas recomendações para atualização.
            </p>

            <div className="mt-6 space-y-4">
              <FormInput
                label="Peso atual (kg)"
                type="number"
                value={form.weightKg}
                onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))}
              />

              <SelectField label="Objetivo principal" value={form.goal} onChange={(value) => setForm((prev) => ({ ...prev, goal: value }))}>
                <option value="hypertrophy">Hipertrofia</option>
                <option value="fat_loss">Emagrecimento</option>
                <option value="maintenance">Manutenção</option>
                <option value="performance">Performance</option>
              </SelectField>

              <SelectField label="Frequência semanal" value={form.trainingFrequency} onChange={(value) => setForm((prev) => ({ ...prev, trainingFrequency: value }))}>
                <option value="3">3x/semana</option>
                <option value="4">4x/semana</option>
                <option value="5">5x/semana</option>
                <option value="6">6x/semana</option>
              </SelectField>

              <SelectField label="Nível de treino" value={form.trainingLevel} onChange={(value) => setForm((prev) => ({ ...prev, trainingLevel: value }))}>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </SelectField>

              <SelectField label="Local de treino" value={form.trainingLocation} onChange={(value) => setForm((prev) => ({ ...prev, trainingLocation: value }))}>
                <option value="gym">Academia</option>
                <option value="home">Casa</option>
                <option value="mixed">Misto</option>
              </SelectField>

              <SelectField label="Preferência alimentar" value={form.dietPreference} onChange={(value) => setForm((prev) => ({ ...prev, dietPreference: value }))}>
                <option value="flexible">Flexível</option>
                <option value="economic">Econômica</option>
                <option value="low_carb">Low carb</option>
                <option value="vegetarian">Vegetariana</option>
                <option value="carnivore">Carnívora</option>
              </SelectField>

              <FormInput
                label="Meta diária de água (ml)"
                type="number"
                value={form.waterGoalMl}
                onChange={(event) => setForm((prev) => ({ ...prev, waterGoalMl: event.target.value }))}
                icon={<Droplets className="h-4 w-4" />}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <UIButton variant="ghost" className="flex-1" onClick={() => setIsEditing(false)}>
                Cancelar
              </UIButton>
              <UIButton className="flex-1" onClick={handleSave} isLoading={isSaving}>
                Salvar
              </UIButton>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  )
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-ec-violet">{icon}</div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{label}</p>
        <p className="mt-1 text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-widest text-text-secondary">{label}</label>
      <select
        className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  )
}
