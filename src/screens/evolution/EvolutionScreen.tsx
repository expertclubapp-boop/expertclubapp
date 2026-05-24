import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Camera, CalendarClock, Droplets, Dumbbell, HeartPulse, Scale, Target, TrendingUp, Utensils } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FilterChip } from '../../components/ui/FilterChip'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { PageShell, SectionHeader } from '../../components/ui/Premium'

type EvolutionTab = 'PESO' | 'FORÇA' | 'MEDIDAS' | 'FOTOS'
import { useAuth } from '../../contexts/AuthContext'
import { fromFirestoreDate } from '../../lib/firebase/date'
import { studentEvolutionReportService, type StudentEvolutionReport } from '../../services/studentEvolutionReportService'
import { consistencyLevelPt, evolutionPeriodPt } from '../../utils/labels'

type PeriodOption = 15 | 30

function formatDate(value?: unknown) {
  const date = fromFirestoreDate(value as Parameters<typeof fromFirestoreDate>[0])
  return date ? date.toLocaleDateString('pt-BR') : '-'
}

function formatWeight(value?: number) {
  if (typeof value !== 'number') return 'Sem dado real'
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
}

function formatPercent(value?: number) {
  if (typeof value !== 'number') return 'Sem dado real'
  return `${value}%`
}

function formatSignedKg(value?: number) {
  if (typeof value !== 'number') return 'Dados iniciais'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
}

export function EvolutionScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [periodDays, setPeriodDays] = useState<PeriodOption>(15)
  const [activeTab, setActiveTab] = useState<EvolutionTab>('PESO')
  const [report, setReport] = useState<StudentEvolutionReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentUid = firebaseUser?.uid
    if (!currentUid) {
      setReport(null)
      setIsLoading(false)
      return
    }
    const uid = currentUid

    let cancelled = false

    async function loadReport() {
      setIsLoading(true)
      setError(null)
      try {
        const nextReport = await studentEvolutionReportService.getStudentEvolutionReport(uid, { periodDays })
        if (!cancelled) setReport(nextReport)
      } catch (loadError) {
        if (!cancelled) {
          setReport(null)
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seu relatório agora.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadReport()

    return () => {
      cancelled = true
    }
  }, [firebaseUser?.uid, periodDays])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ec-violet/30 border-t-ec-violet" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <PageShell wide>
        <section className="rounded-3xl border border-white/10 bg-[#0b111c] p-6">
          <Badge color="red">Relatório de evolução</Badge>
          <h1 className="mt-4 text-3xl font-black uppercase italic text-white">Não deu para abrir seu relatório agora.</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{error || 'Tente novamente em instantes.'}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="sm:w-auto" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
            <Button variant="ghost" className="sm:w-auto" onClick={() => navigate('/app/today')}>
              Voltar para hoje
            </Button>
          </div>
        </section>
      </PageShell>
    )
  }

  const bodyEmpty = !report.body.hasEnoughBodyData
  const hasPhotos = (report.body.latestPhotos || []).length > 0
  const primaryCtaLabel = report.automatedSummary.ctaLabel || 'Continuar plano'
  const primaryCtaTo = report.automatedSummary.ctaTo || '/app/today'

  return (
    <PageShell wide>
      {/* Tab pills + period filter */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['PESO', 'FORÇA', 'MEDIDAS', 'FOTOS'] as EvolutionTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] transition-all ${
                activeTab === tab
                  ? 'bg-volt-600 text-white'
                  : 'border border-white/15 bg-transparent text-text-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <FilterChip label="15 dias" isSelected={periodDays === 15} onClick={() => setPeriodDays(15)} />
          <FilterChip label="30 dias" isSelected={periodDays === 30} onClick={() => setPeriodDays(30)} />
        </div>
      </div>

      {/* Weight delta card — shown on PESO tab */}
      {activeTab === 'PESO' && !report.body.hasEnoughBodyData === false && typeof report.body.latestWeightKg === 'number' && (
        <div className="mb-6 rounded-2xl border border-volt-600/25 bg-ink-700 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-text-muted tracking-[0.15em] uppercase">Peso · {evolutionPeriodPt(report.periodDays)}</p>
            <p className="font-display text-3xl font-bold text-white mt-1">{formatWeight(report.body.latestWeightKg)}</p>
            {typeof report.body.weightDeltaKg === 'number' && (
              <p className={`font-mono text-sm font-bold mt-1 ${report.body.weightDeltaKg <= 0 ? 'text-lime-ok' : 'text-[#FF3D6E]'}`}>
                {formatSignedKg(report.body.weightDeltaKg)} desde o início
              </p>
            )}
          </div>
          <Button onClick={() => navigate('/app/evolution/checkin')}>Check-in</Button>
        </div>
      )}

      {activeTab === 'PESO' && (
      <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          eyebrow="Sua evolução"
          title="Sua evolução"
          description={evolutionPeriodPt(report.periodDays)}
          tone="violet"
        />
        <Button className="sm:w-auto" onClick={() => navigate('/app/evolution/checkin')}>
          Fazer check-in de evolução
        </Button>
      </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-accent-lime/15 bg-accent-lime/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={report.consistency.level === 'high' ? 'lime' : report.consistency.level === 'medium' ? 'yellow' : 'red'}>
              {consistencyLevelPt(report.consistency.level)} consistência
            </Badge>
            {report.isPartial && <Badge color="sky">Relatório parcial</Badge>}
          </div>
          <h2 className="mt-4 text-2xl font-black uppercase italic text-white">{report.automatedSummary.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{report.automatedSummary.message}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {report.automatedSummary.bullets.map((bullet) => (
              <div key={bullet} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-text-secondary">
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b111c] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-ec-violet">Consistência</p>
              <h2 className="mt-2 text-4xl font-black text-white">{report.consistency.score}</h2>
            </div>
            <div className="rounded-2xl bg-ec-violet/10 p-3 text-ec-violet">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-sm text-text-secondary">{report.consistency.label}</p>
          <div className="mt-4">
            <ProgressBar value={report.consistency.score} max={100} color="violet" height={12} />
          </div>

          <div className="mt-5 space-y-2">
            {report.consistency.reasons.map((reason) => (
              <p key={reason} className="text-sm text-text-secondary">
                {reason}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <ReportCard
          eyebrow="Corpo"
          title={bodyEmpty ? 'Dados corporais iniciais' : 'Comparativo corporal'}
          description={bodyEmpty
            ? 'Ainda precisamos de pelo menos dois check-ins de evolução para comparar seu progresso corporal.'
            : 'Use peso, fotos e medidas como comparação do ciclo, sem inventar interpretação além dos dados reais.'}
          icon={<Scale className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricBox label="Peso atual" value={formatWeight(report.body.latestWeightKg)} />
            <MetricBox label="Peso anterior" value={formatWeight(report.body.previousWeightKg)} />
            <MetricBox label="Diferença de peso" value={formatSignedKg(report.body.weightDeltaKg)} />
            <MetricBox label="Gordura corporal" value={formatPercent(report.body.latestBodyFatPct)} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-text-secondary">
            {bodyEmpty
              ? 'Seu próximo passo aqui é registrar mais um check-in de evolução com peso e, se possível, fotos.'
              : typeof report.body.weightDeltaKg === 'number'
                ? `Seu peso mudou ${formatSignedKg(report.body.weightDeltaKg)} desde o último registro.`
                : 'Seu comparativo corporal já está ativo, mas ainda faltam mais pontos para ampliar a leitura.'}
          </div>
        </ReportCard>

        <ReportCard
          eyebrow="Treino"
          title="Treinos concluídos"
          description="Sessões completas, volume acumulado e highlights reais de progressão registrados no período."
          icon={<Dumbbell className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricBox label="Sessões" value={String(report.training.completedSessions)} />
            <MetricBox label="Volume total" value={`${report.training.totalTonnage.toLocaleString('pt-BR')} kg`} />
            <MetricBox label="Último treino" value={formatDate(report.training.lastWorkoutAt)} />
          </div>

          <div className="mt-4 space-y-3">
            {report.training.bestHighlights.length > 0 ? report.training.bestHighlights.map((highlight) => (
              <div key={`${highlight.exerciseName}-${highlight.metric}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-bold text-white">{highlight.exerciseName}</p>
                <p className="mt-1 text-sm text-text-secondary">{highlight.metric}</p>
                <p className="mt-2 text-base font-black text-accent-lime">{highlight.value}</p>
              </div>
            )) : (
              <EmptyBox message="Conclua treinos e registre suas cargas para liberar highlights reais de progressão." />
            )}
          </div>
        </ReportCard>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <ReportCard
          eyebrow="Dieta"
          title="Aderência alimentar"
          description="Dias registrados e média de aderência com base nas refeições ou itens realmente marcados."
          icon={<Utensils className="h-5 w-5" />}
        >
          <div className="grid gap-4">
            <MetricBox label="Dias registrados" value={`${report.diet.loggedDays}/${report.periodDays}`} />
            <MetricBox label="Média de aderência" value={`${report.diet.averageAdherencePct}%`} />
            <MetricBox label="Melhor dia" value={typeof report.diet.bestDayPct === 'number' ? `${report.diet.bestDayPct}%` : 'Sem dado real'} />
          </div>
        </ReportCard>

        <ReportCard
          eyebrow="Água"
          title="Hidratação"
          description="Média diária de consumo e percentual da meta considerando os dias realmente registrados."
          icon={<Droplets className="h-5 w-5" />}
        >
          <div className="grid gap-4">
            <MetricBox label="Média da meta" value={`${report.hydration.averagePct}%`} />
            <MetricBox label="Média em ml" value={typeof report.hydration.averageMl === 'number' ? `${report.hydration.averageMl.toLocaleString('pt-BR')} ml` : 'Sem dado real'} />
            <MetricBox label="Meta usada" value={typeof report.hydration.goalMl === 'number' ? `${report.hydration.goalMl.toLocaleString('pt-BR')} ml` : 'Sem dado real'} />
          </div>
        </ReportCard>

        <ReportCard
          eyebrow="Check-ins"
          title="Ritmo de registros"
          description="Check-ins diários e quinzenais usados para acompanhar energia, humor e consistência do ciclo."
          icon={<HeartPulse className="h-5 w-5" />}
        >
          <div className="grid gap-4">
            <MetricBox label="Diários" value={`${report.checkins.dailyCompleted}/${report.checkins.dailyExpected}`} />
            <MetricBox label="Quinzenais" value={String(report.checkins.weeklyCompleted)} />
            <MetricBox label="Último humor" value={report.checkins.latestMood || 'Sem dado real'} />
            <MetricBox label="Última energia" value={report.checkins.latestEnergy || 'Sem dado real'} />
          </div>
        </ReportCard>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <ReportCard
          eyebrow="Registro visual"
          title="Fotos recentes"
          description="Sem foto fake: só aparecem imagens reais do seu check-in de evolução mais recente."
          icon={<Camera className="h-5 w-5" />}
        >
          {hasPhotos ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(report.body.latestPhotos || []).map((photo) => (
                <div key={`${photo.type || 'other'}-${photo.url}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img src={photo.url} alt={`Foto ${photo.type || 'evolução'}`} className="h-36 w-full object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-bold text-white">{photo.type === 'front' ? 'Frente' : photo.type === 'side' ? 'Lado' : photo.type === 'back' ? 'Costas' : 'Extra'}</p>
                    <p className="mt-1 text-sm text-text-secondary">{formatDate(photo.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBox message="Ainda não há fotos de evolução registradas. Adicione fotos no próximo check-in para enriquecer o comparativo." />
          )}
        </ReportCard>

        <ReportCard
          eyebrow="Próximo passo"
          title="O que vale fazer agora"
          description="O relatório não vira chat. Ele aponta a próxima ação prática para manter a rotina andando."
          icon={<Target className="h-5 w-5" />}
        >
          <div className="grid gap-3">
            <NextStep
              icon={<CalendarClock className="h-4 w-4" />}
              title="Atualizar evolução"
              description="Enviar peso e fotos quando a janela de check-in estiver disponível."
            />
            <NextStep
              icon={<Activity className="h-4 w-4" />}
              title="Registrar check-in diário"
              description="Manter humor, energia e consistência vivos no ciclo."
            />
            <NextStep
              icon={<Droplets className="h-4 w-4" />}
              title="Bater sua meta de água"
              description="Melhorar leitura do ciclo sem depender de interpretação manual."
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="sm:w-auto" onClick={() => navigate(primaryCtaTo)}>
              {primaryCtaLabel}
            </Button>
            <Button variant="ghost" className="sm:w-auto" onClick={() => navigate('/app/today')}>
              Continuar plano
            </Button>
          </div>
        </ReportCard>
      </section>

      {report.warnings && report.warnings.length > 0 && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-[#0b111c] p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-yellow">Limitações do relatório</p>
          <div className="mt-4 grid gap-3">
            {report.warnings.map((warning) => (
              <div key={warning} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-text-secondary">
                {warning}
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  )
}

function ReportCard({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b111c] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black uppercase italic text-white">{title}</h2>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 text-ec-violet">{icon}</div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  )
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-relaxed text-text-secondary">
      {message}
    </div>
  )
}

function NextStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-3 text-white">
        <span className="rounded-xl bg-white/5 p-2 text-ec-violet">{icon}</span>
        <p className="text-base font-bold">{title}</p>
      </div>
      <p className="mt-3 text-sm text-text-secondary">{description}</p>
    </div>
  )
}
