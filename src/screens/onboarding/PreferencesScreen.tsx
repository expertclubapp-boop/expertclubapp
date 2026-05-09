import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, AlertCircle, Building2, Home, Trees } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { toastError } from '../../components/ui/Toast'
import { FormInput } from '../../components/ui/FormInput'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'
import type {
  DietPreference,
  ExperienceLevel,
  Sex,
  TrainingLocation,
  UserGoal,
  UserProfile,
} from '../../types/domain'

const locations: { id: TrainingLocation; label: string; icon: React.ReactNode }[] = [
  { id: 'gym', label: 'Academia', icon: <Building2 className="w-5 h-5" /> },
  { id: 'home', label: 'Casa', icon: <Home className="w-5 h-5" /> },
  { id: 'outdoor', label: 'Ar Livre', icon: <Trees className="w-5 h-5" /> },
]

const dietPrefs: { id: DietPreference; label: string }[] = [
  { id: 'everything', label: 'Tudo' },
  { id: 'vegetarian', label: 'Vegetariana' },
  { id: 'vegan', label: 'Vegana' },
  { id: 'low_carb', label: 'Low Carb' },
]

export function PreferencesScreen() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user: authUser } = useAuth()
  const onboardingState = (state || {}) as Partial<{
    goal: UserGoal
    sex: Sex
    height: number
    weight: number
    birthDate: string
    experienceLevel: ExperienceLevel
  }>
  
  const [city, setCity] = useState('')
  const [frequency, setFrequency] = useState('3')
  const [location, setLocation] = useState<TrainingLocation>('gym')
  const [diet, setDiet] = useState<DietPreference>('everything')
  const [difficulty, setDifficulty] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (
      !onboardingState.goal ||
      !onboardingState.sex ||
      !onboardingState.height ||
      !onboardingState.weight ||
      !onboardingState.birthDate ||
      !onboardingState.experienceLevel
    ) {
      navigate('/onboarding/goal', { replace: true })
    }
  }, [
    navigate,
    onboardingState.birthDate,
    onboardingState.experienceLevel,
    onboardingState.goal,
    onboardingState.height,
    onboardingState.sex,
    onboardingState.weight,
  ])

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authUser) return
    if (
      !onboardingState.goal ||
      !onboardingState.sex ||
      !onboardingState.height ||
      !onboardingState.weight ||
      !onboardingState.birthDate ||
      !onboardingState.experienceLevel
    ) {
      navigate('/onboarding/goal', { replace: true })
      return
    }

    setIsLoading(true)
    
    try {
      const weightNum = onboardingState.weight || 70
      const waterGoalMl = Math.round(weightNum * 35)
      const selectedWorkoutId = onboardingState.goal === 'hypertrophy'
        ? 'hipertrofia-abc'
        : 'iniciante-full-body'
      const selectedDietId = onboardingState.goal === 'hypertrophy'
        ? 'hipertrofia-2700'
        : 'emagrecimento-1600'
      
      const profile: UserProfile = {
        uid: authUser.uid,
        sex: onboardingState.sex,
        age: 25, 
        height: onboardingState.height,
        weight: weightNum,
        birthDate: onboardingState.birthDate,
        experienceLevel: onboardingState.experienceLevel,
        goal: onboardingState.goal,
        city,
        trainingFrequency: Number(frequency),
        trainingLocation: location,
        equipmentAvailable: [],
        dietPreference: diet,
        mainDifficulty: difficulty,
        waterGoalMl,
        waterProgressMl: 0,
        notificationsEnabled: { push: true, email: true },
        selectedWorkoutId,
        selectedDietId,
      }
      
      await profileService.completeOnboarding(authUser.uid, profile)
      navigate('/app/today')
    } catch (error) {
      console.error("Error saving onboarding:", error)
      toastError("Falha ao salvar seu perfil. Verifique sua conexão.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="ec-app-bg flex min-h-screen flex-col bg-bg-primary px-5 py-10 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-ec-violet/[0.03] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[440px] mx-auto w-full z-10"
      >
        <div className="mb-8">
          <Badge color="violet" className="mb-4">
            Passo 3 de 3
          </Badge>
          <h1 className="font-display text-heading-1 text-text-primary mb-3">
            Preferências
          </h1>
          <p className="text-body-md text-text-secondary">
            Últimos detalhes para configurarmos seu ecossistema fitness.
          </p>
        </div>

        <form onSubmit={handleFinish} className="space-y-6">
          <FormInput
            label="Cidade"
            type="text"
            placeholder="Ex: São Paulo, SP"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            icon={<MapPin className="w-5 h-5" />}
          />

          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase font-body">
              Frequência Semanal (Dias)
            </label>
            <div className="flex gap-2">
              {['2', '3', '4', '5', '6'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`
                    flex-1 py-3 rounded-lg border transition-all font-bold
                    ${frequency === f ? 'bg-ec-violet border-ec-violet text-white' : 'bg-surface-1 border-subtle text-text-muted'}
                  `}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase font-body">
              Onde você treina?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocation(loc.id)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                    ${location === loc.id ? 'ec-card border-ec-violet text-ec-violet' : 'ec-card border-subtle text-text-muted'}
                  `}
                >
                  <span>{loc.icon}</span>
                  <span className="text-[10px] font-bold uppercase">{loc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase font-body">
              Preferência Alimentar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {dietPrefs.map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => setDiet(dp.id)}
                  className={`
                    p-3 rounded-lg border transition-all text-xs font-bold
                    ${diet === dp.id ? 'ec-card border-ec-violet text-ec-violet' : 'ec-card border-subtle text-text-muted'}
                  `}
                >
                  {dp.label}
                </button>
              ))}
            </div>
          </div>

          <FormInput
            label="Principal Dificuldade"
            type="text"
            placeholder="Ex: Constância, Doces, Tempo..."
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            icon={<AlertCircle className="w-5 h-5" />}
          />

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Finalizar Configuração
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
