import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Ruler, Weight, Calendar, Zap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../contexts/AuthContext'
import type { ExperienceLevel, Sex, UserGoal } from '../../types/domain'

const experienceLevels: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Iniciante', desc: 'Menos de 6 meses de treino consistente.' },
  { id: 'intermediate', label: 'Intermediário', desc: 'Entre 6 meses e 2 anos de treino.' },
  { id: 'advanced', label: 'Avançado', desc: 'Mais de 2 anos de treino de alto nível.' },
]

export function ProfileScreen() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user: authUser } = useAuth()
  const onboardingState = state as { goal?: UserGoal } | null
  
  const [sex, setSex] = useState<Sex>('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [experience, setExperience] = useState<ExperienceLevel>('intermediate')

  useEffect(() => {
    if (!onboardingState?.goal) {
      navigate('/onboarding/goal', { replace: true })
    }
  }, [navigate, onboardingState?.goal])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/onboarding/preferences', { 
      state: { 
        ...state,
        sex,
        height: Number(height),
        weight: Number(weight),
        birthDate,
        experienceLevel: experience
      } 
    })
  }

  return (
    <div className="ec-app-bg flex min-h-screen flex-col bg-bg-primary px-5 py-10 relative overflow-hidden">
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent-sky/[0.03] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[440px] mx-auto w-full z-10"
      >
        <div className="mb-8">
          <Badge color="sky" className="mb-4">
            Passo 2 de 3
          </Badge>
          <h1 className="font-display text-heading-1 text-text-primary mb-3">
            Dados Biométricos
          </h1>
          <p className="text-body-md text-text-secondary">
            Olá {authUser?.displayName?.split(' ')[0] || 'atleta'}, precisamos dessas informações para personalizar seu plano.
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase font-body">
              Sexo Biológico
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'other'] as Sex[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  className={`
                    py-3 rounded-lg border transition-all text-sm font-bold
                    ${sex === s ? 'bg-accent-sky/10 border-accent-sky text-accent-sky' : 'bg-surface-1 border-subtle text-text-muted'}
                  `}
                >
                  {s === 'male' ? 'Masc' : s === 'female' ? 'Fem' : 'Outro'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Altura (cm)"
              type="number"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              icon={<Ruler className="w-5 h-5" />}
              required
            />
            <FormInput
              label="Peso Atual (kg)"
              type="number"
              placeholder="80.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              icon={<Weight className="w-5 h-5" />}
              required
            />
          </div>

          <FormInput
            label="Data de Nascimento"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            icon={<Calendar className="w-5 h-5" />}
            required
          />

          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-text-muted tracking-[0.1em] uppercase font-body">
              Nível de Experiência
            </label>
            <div className="space-y-2">
              {experienceLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExperience(lvl.id)}
                  className={`
                    w-full text-left p-4 rounded-lg border transition-all
                    flex items-center gap-3
                    ${
                      experience === lvl.id
                        ? 'ec-card border-accent-sky text-accent-sky'
                        : 'ec-card border-subtle text-text-muted hover:border-white/10'
                    }
                  `}
                >
                  <Zap className={`w-5 h-5 ${experience === lvl.id ? 'fill-accent-sky' : ''}`} />
                  <div>
                    <div className={`text-sm font-bold ${experience === lvl.id ? 'text-white' : ''}`}>
                      {lvl.label}
                    </div>
                    <div className="text-[11px] opacity-60 font-body">{lvl.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Continuar
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
