import { useState } from 'react'
import { Droplets, Plus, Target } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import {
  DashboardHero,
  FloatingPill,
  GlassCard,
  PageShell,
  SectionHeader,
} from '../../components/ui/Premium'
import { useAuth } from '../../contexts/AuthContext'
import { useHydrationToday } from '../../hooks/useHydrationToday'
import { useProfile } from '../../hooks/useProfile'
import { hydrationService } from '../../services/hydrationService'

const quickAmounts = [250, 500, 750]

export function HydrationScreen() {
  const { firebaseUser } = useAuth()
  const { profile } = useProfile()
  const { hydration, isLoading } = useHydrationToday()
  const [isSaving, setIsSaving] = useState(false)

  const currentWater = hydration?.totalMl || 0
  const goalWater = hydration?.goalMl || profile?.waterGoalMl || (profile?.weight ? Math.round(profile.weight * 35) : 2500)
  const waterProgress = Math.min(100, (currentWater / goalWater) * 100)
  const remaining = Math.max(goalWater - currentWater, 0)

  const handleAddWater = async (amount: number) => {
    if (!firebaseUser || !profile) return
    setIsSaving(true)
    try {
      await hydrationService.addWater(firebaseUser.uid, amount, profile.waterGoalMl)
    } catch (error) {
      console.error('Error adding water:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-sky/30 border-t-accent-sky rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell className="space-y-6">
      <SectionHeader
        eyebrow="Hidratação"
        title="Água do dia"
        description="Acompanhe sua meta diária sem sair do fluxo do treino."
        tone="sky"
        icon={<Droplets className="h-4 w-4" />}
      />

      <DashboardHero className="min-h-[300px]">
        <div className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <FloatingPill tone="sky" icon={<Target className="h-3.5 w-3.5" />}>
              Meta ativa
            </FloatingPill>
            <h2 className="mt-6 font-display text-display-lg font-black uppercase italic leading-none text-text-primary">
              {(currentWater / 1000).toFixed(1)}L
            </h2>
            <p className="mt-3 max-w-xl text-body-md text-text-secondary">
              Faltam {(remaining / 1000).toFixed(1)}L para bater sua meta de {(goalWater / 1000).toFixed(1)}L hoje.
            </p>
            <div className="mt-8 max-w-xl">
              <ProgressBar value={waterProgress} color="sky" height={12} showLabel />
            </div>
          </div>

          <GlassCard className="rounded-card p-5">
            <div className="grid gap-3">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={amount === 500 ? 'lime' : 'ghost'}
                  isLoading={isSaving}
                  onClick={() => handleAddWater(amount)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  + {amount} ml
                </Button>
              ))}
            </div>
          </GlassCard>
        </div>
      </DashboardHero>
    </PageShell>
  )
}
