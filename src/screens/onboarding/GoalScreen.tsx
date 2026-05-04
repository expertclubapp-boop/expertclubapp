import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Dumbbell, Flame, Zap, Activity, HeartPulse } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import type { UserGoal } from '../../types/domain'

const goals: { id: UserGoal; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'hypertrophy',
    label: 'Hipertrofia',
    desc: 'Ganho de massa muscular e volume corporal com definição.',
    icon: <Dumbbell className="w-6 h-6" />,
  },
  {
    id: 'fat_loss',
    label: 'Emagrecimento',
    desc: 'Queima de gordura preservando a massa magra e tônus.',
    icon: <Flame className="w-6 h-6" />,
  },
  {
    id: 'strength',
    label: 'Força Bruta',
    desc: 'Foco em powerlifting e levantamento de cargas máximas.',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'endurance',
    label: 'Resistência',
    desc: 'Melhoria de fôlego, performance cardiovascular e fôlego.',
    icon: <Activity className="w-6 h-6" />,
  },
  {
    id: 'health',
    label: 'Saúde & Bem-estar',
    desc: 'Manutenção, longevidade e qualidade de vida geral.',
    icon: <HeartPulse className="w-6 h-6" />,
  },
]

export function GoalScreen() {
  const navigate = useNavigate()
  const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null)

  const handleNext = () => {
    if (selectedGoal) {
      // In a real app, we'd save this to a draft state or Firebase
      navigate('/onboarding/profile', { state: { goal: selectedGoal } })
    }
  }

  return (
    <div className="ec-app-bg flex min-h-screen flex-col bg-bg-primary px-5 py-10 relative overflow-hidden">
      {/* Bg Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-ec-violet/[0.03] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[440px] mx-auto w-full z-10 flex flex-col h-full"
      >
        <div className="mb-8">
          <Badge color="violet" className="mb-4">
            Passo 1 de 2
          </Badge>
          <h1 className="font-display text-heading-1 text-text-primary mb-3">
            Qual seu objetivo principal?
          </h1>
          <p className="text-body-md text-text-secondary">
            Isso definirá seu plano de treino e as metas de macronutrientes da sua dieta.
          </p>
        </div>

        <div className="space-y-3 flex-1">
          {goals.map((goal) => {
            const isSelected = selectedGoal === goal.id
            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`
                  w-full text-left p-5 rounded-card border transition-all duration-200
                  flex items-center gap-4 group
                  ${
                    isSelected
                      ? 'ec-card border-ec-violet shadow-[0_0_20px_rgba(91,75,255,0.1)]'
                      : 'ec-card border-subtle hover:border-white/20'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${isSelected ? 'bg-ec-violet/20 text-ec-violet' : 'bg-white/5 text-text-muted'}
                `}>
                  {goal.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-display text-body-lg font-bold ${isSelected ? 'text-ec-violet' : 'text-text-primary'}`}>
                    {goal.label}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {goal.desc}
                  </p>
                </div>
                <div className={`
                  w-6 h-6 rounded-full border flex items-center justify-center transition-all
                  ${isSelected ? 'bg-ec-violet border-ec-violet' : 'border-white/10'}
                `}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-10">
          <Button
            variant="primary"
            disabled={!selectedGoal}
            onClick={handleNext}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            Continuar
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
