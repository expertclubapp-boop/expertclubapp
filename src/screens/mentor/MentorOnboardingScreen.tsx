import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, ClipboardList, Dumbbell, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { track } from '../../lib/analytics'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'

type StepId = 'welcome' | 'features' | 'first-protocol'

const STEPS: Array<{ id: StepId; title: string; description: string }> = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao seu espaço de mentor.',
    description: 'Aqui você acompanha seus alunos, prescreve protocolos e monitora a evolução de cada um.',
  },
  {
    id: 'features',
    title: 'O que você pode fazer aqui.',
    description: 'Uma visão rápida das ferramentas disponíveis no seu painel.',
  },
  {
    id: 'first-protocol',
    title: 'Pronto para começar?',
    description: 'Seu primeiro passo é criar um protocolo de treino ou dieta para atribuir aos seus alunos.',
  },
]

const FEATURES = [
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Acompanhamento de alunos',
    description: 'Veja o progresso, check-ins e dados de evolução de cada aluno vinculado a você.',
  },
  {
    icon: <Dumbbell className="h-5 w-5" />,
    title: 'Prescritor de treinos',
    description: 'Monte protocolos de treino completos e atribua diretamente para seus alunos.',
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    title: 'Prescritor de dietas',
    description: 'Crie planos alimentares personalizados com base no perfil e objetivo de cada aluno.',
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: 'Revisão de check-ins',
    description: 'Acompanhe os check-ins diários, semanais e de evolução dos seus alunos.',
  },
]

export function MentorOnboardingScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentStep = STEPS[currentStepIndex]
  const progress = Math.round(((currentStepIndex + 1) / STEPS.length) * 100)
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === STEPS.length - 1

  function nextStep() {
    track('onboarding_step_completed', { step: currentStep.id, step_index: currentStepIndex })
    setCurrentStepIndex((i) => i + 1)
  }

  function prevStep() {
    setCurrentStepIndex((i) => i - 1)
  }

  async function handleFinish(destination: 'treinos' | 'dietas') {
    if (!firebaseUser) return
    setIsSaving(true)
    setError(null)
    try {
      const profileRef = doc(db, COLLECTIONS.PROFILES, firebaseUser.uid)
      await setDoc(
        profileRef,
        { uid: firebaseUser.uid, mentorOnboardingCompleted: true, updatedAt: serverTimestamp() },
        { merge: true }
      )
      track('onboarding_completed', { role: 'mentor' })
      navigate(destination === 'treinos' ? '/mentor/treinos/prescritor' : '/mentor/dietas/prescritor', { replace: true })
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSkip() {
    if (!firebaseUser) return
    setIsSaving(true)
    try {
      const profileRef = doc(db, COLLECTIONS.PROFILES, firebaseUser.uid)
      await setDoc(
        profileRef,
        { uid: firebaseUser.uid, mentorOnboardingCompleted: true, updatedAt: serverTimestamp() },
        { merge: true }
      )
      track('onboarding_completed', { role: 'mentor' })
      navigate('/mentor/overview', { replace: true })
    } catch {
      // Non-blocking — navigate anyway
      navigate('/mentor/overview', { replace: true })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="w-8">
          {!isFirst && (
            <button
              onClick={prevStep}
              className="flex items-center justify-center w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="text-xs text-zinc-500 font-medium">
          {currentStepIndex + 1} de {STEPS.length}
        </span>
        <button
          onClick={handleSkip}
          disabled={isSaving}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
        >
          Pular
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-8">
        <ProgressBar value={progress} height={4} color="lime" />
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">{currentStep.title}</h1>
            <p className="text-zinc-400 text-sm mb-8">{currentStep.description}</p>

            {currentStep.id === 'welcome' && <WelcomeStep />}
            {currentStep.id === 'features' && <FeaturesStep />}
            {currentStep.id === 'first-protocol' && (
              <FirstProtocolStep onFinish={handleFinish} isSaving={isSaving} error={error} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav (only for non-last steps) */}
      {!isLast && (
        <div className="px-4 py-6 max-w-lg mx-auto w-full">
          <Button onClick={nextStep} className="w-full">
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function WelcomeStep() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-lime-500/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-lime-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-100">Mentor Expert Club</p>
          <p className="text-xs text-zinc-500">Plataforma de acompanhamento</p>
        </div>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        Você tem acesso completo ao perfil, progresso e check-ins de cada aluno vinculado a você.
        Prescreva treinos, dietas e acompanhe os resultados em tempo real.
      </p>
      <div className="border-t border-zinc-800 pt-4">
        <p className="text-xs text-zinc-500">
          Este guia rápido vai te orientar sobre as principais ferramentas disponíveis.
        </p>
      </div>
    </div>
  )
}

function FeaturesStep() {
  return (
    <div className="space-y-3">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-lime-400">{feature.icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100">{feature.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface FirstProtocolStepProps {
  onFinish: (destination: 'treinos' | 'dietas') => void
  isSaving: boolean
  error: string | null
}

function FirstProtocolStep({ onFinish, isSaving, error }: FirstProtocolStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onFinish('treinos')}
          disabled={isSaving}
          className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-lime-500/50 hover:bg-zinc-800 p-5 transition-all disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-lime-500/10 flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-lime-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-100">Criar treino</p>
            <p className="text-xs text-zinc-500 mt-0.5">Prescritor de protocolos</p>
          </div>
        </button>

        <button
          onClick={() => onFinish('dietas')}
          disabled={isSaving}
          className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-lime-500/50 hover:bg-zinc-800 p-5 transition-all disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-lime-500/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-lime-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-100">Criar dieta</p>
            <p className="text-xs text-zinc-500 mt-0.5">Prescritor alimentar</p>
          </div>
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-zinc-600">ou</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-3">
        <Check className="h-4 w-4 text-lime-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          Você também pode ir direto ao painel e explorar por conta própria. As ferramentas estão todas disponíveis no menu lateral.
        </p>
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  )
}
