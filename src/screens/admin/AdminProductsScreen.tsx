import { useState, useEffect } from 'react'
import { Plus, Copy, ExternalLink, Pencil, Trash2, Check, Tag } from 'lucide-react'
import { PageShell } from '../../components/ui/Premium'
import { Button } from '../../components/ui/Button'
import { AdminToolbar, Field, TextInput, TextArea, ConfirmButton } from './AdminShared'
import { planProductService } from '../../services/planProductService'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import type { Plan, PlanTier } from '../../types/domain'

const TIER_OPTIONS: Array<{ value: PlanTier; label: string; color: string }> = [
  { value: 'low_ticket', label: 'Expert Club (Low Ticket)', color: 'text-accent-lime' },
  { value: 'mentoring_quarterly', label: 'Mentoria Trimestral', color: 'text-ec-violet' },
  { value: 'mentoring_semester', label: 'Mentoria Semestral', color: 'text-ec-violet' },
  { value: 'mentoring_annual', label: 'Mentoria Anual', color: 'text-ec-violet' },
]

const INTERVAL_OPTIONS = [
  { value: 'monthly', label: 'Mensal', months: 1 },
  { value: 'quarterly', label: 'Trimestral', months: 3 },
  { value: 'semester', label: 'Semestral', months: 6 },
  { value: 'annual', label: 'Anual', months: 12 },
] as const

function emptyPlan(): Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    slug: '',
    description: '',
    subtitle: '',
    price: 0,
    currency: 'BRL',
    interval: 'monthly',
    durationMonths: 1,
    status: 'draft',
    tier: 'low_ticket',
    features: [],
    badge: '',
    highlighted: false,
    isFounderPlan: false,
    trialDays: 0,
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getCheckoutUrl(planId: string): string {
  return `${window.location.origin}/checkout/${planId}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${copied ? 'bg-accent-lime/20 text-accent-lime' : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado!' : 'Copiar link'}
    </button>
  )
}

export function AdminProductsScreen() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [featuresText, setFeaturesText] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setIsLoading(true)
    try {
      const data = await planProductService.list()
      setPlans(data)
    } finally {
      setIsLoading(false)
    }
  }

  function openNew() {
    const blank = emptyPlan()
    setEditing(blank as Plan)
    setFeaturesText('')
    setIsNew(true)
  }

  function openEdit(plan: Plan) {
    setEditing({ ...plan })
    setFeaturesText((plan.features || []).join('\n'))
    setIsNew(false)
  }

  function closeEditor() {
    setEditing(null)
    setIsNew(false)
  }

  function updateField<K extends keyof Plan>(key: K, value: Plan[K]) {
    setEditing((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  async function save() {
    if (!editing) return
    if (!editing.name || !editing.price) {
      toastError('Nome e preço são obrigatórios.')
      return
    }
    setSaving(true)
    try {
      const interval = INTERVAL_OPTIONS.find((o) => o.value === editing.interval)
      const data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> = {
        ...editing,
        slug: editing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        features: featuresText.split('\n').map((f) => f.trim()).filter(Boolean),
        durationMonths: interval?.months ?? 1,
      }
      if (isNew) {
        const id = await planProductService.create(data)
        toastSuccess('Produto criado!')
        setPlans((prev) => [{ ...data, id, createdAt: '', updatedAt: '' }, ...prev])
      } else {
        await planProductService.update(editing.id, data)
        toastSuccess('Produto salvo!')
        setPlans((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...data } : p)))
      }
      closeEditor()
    } catch {
      toastError('Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePlan(id: string) {
    try {
      await planProductService.delete(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
      toastSuccess('Produto excluído.')
    } catch {
      toastError('Erro ao excluir.')
    }
  }

  const statusColor: Record<string, string> = {
    active: 'text-accent-lime bg-accent-lime/10 border-accent-lime/20',
    draft: 'text-text-muted bg-white/5 border-white/10',
    inactive: 'text-red-400 bg-red-400/10 border-red-400/20',
  }

  return (
    <PageShell wide>
      <AdminToolbar
        title="Produtos & Planos"
        eyebrow="Financeiro"
        description="Crie os planos que você vende. Cada plano gera um link de venda com checkout integrado ao Mercado Pago."
        action={
          <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>
            Novo produto
          </Button>
        }
      />

      {/* Editor panel */}
      {editing && (
        <div className="mb-8 ec-card rounded-2xl border border-ec-violet/25 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black uppercase italic text-white">
              {isNew ? 'Novo produto' : `Editando: ${editing.name}`}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={closeEditor}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Nome do plano">
              <TextInput value={editing.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ex: Mentoria Semestral 1:1" />
            </Field>

            <Field label="Subtítulo">
              <TextInput value={editing.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Ex: Transformação completa em 6 meses" />
            </Field>

            <Field label="Preço (R$)">
              <TextInput
                type="number"
                value={editing.price}
                onChange={(e) => updateField('price', Number(e.target.value))}
                placeholder="29.90"
              />
            </Field>

            <Field label="Período">
              <select
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                value={editing.interval}
                onChange={(e) => updateField('interval', e.target.value as Plan['interval'])}
              >
                {INTERVAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Tier / Tipo de acesso">
              <select
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                value={editing.tier || 'low_ticket'}
                onChange={(e) => updateField('tier', e.target.value as PlanTier)}
              >
                {TIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white"
                value={editing.status}
                onChange={(e) => updateField('status', e.target.value as Plan['status'])}
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo (visível)</option>
                <option value="inactive">Inativo</option>
              </select>
            </Field>

            <Field label="Badge (ex: Mais popular)">
              <TextInput value={editing.badge || ''} onChange={(e) => updateField('badge', e.target.value)} placeholder="Mais popular" />
            </Field>

            <div className="flex items-center gap-3">
              <Field label="Destaque na página">
                <button
                  type="button"
                  onClick={() => updateField('highlighted', !editing.highlighted)}
                  className={`flex items-center gap-3 w-full rounded-xl border px-3 py-2.5 transition-all ${editing.highlighted ? 'bg-ec-violet/10 border-ec-violet/30 text-ec-violet' : 'bg-white/5 border-white/10 text-text-muted'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left">Destacar</span>
                  <div className={`w-8 h-4 rounded-full relative ${editing.highlighted ? 'bg-ec-violet' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${editing.highlighted ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </button>
              </Field>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Descrição (aparece na página de checkout)">
                <TextArea value={editing.description} onChange={(e) => updateField('description', e.target.value)} className="min-h-20" placeholder="Descrição do plano..." />
              </Field>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Benefícios incluídos (um por linha)">
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={8}
                  className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white resize-none"
                  placeholder={`Treino personalizado pelo mentor\nDieta individualizada\nCheck-ins quinzenais\nAcesso a todos os conteúdos\n...`}
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* Products list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="ec-card rounded-2xl border-dashed p-16 text-center">
          <Tag className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
          <h3 className="text-lg font-black italic uppercase text-white mb-2">Nenhum produto criado</h3>
          <p className="text-sm text-text-muted mb-6">Crie seu primeiro plano para começar a vender.</p>
          <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>Criar primeiro produto</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className={`ec-card rounded-2xl p-5 border ${plan.highlighted ? 'border-ec-violet/30 bg-gradient-to-b from-ec-violet/8 to-transparent' : 'border-white/5'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColor[plan.status]}`}>
                      {plan.status === 'active' ? 'Ativo' : plan.status === 'draft' ? 'Rascunho' : 'Inativo'}
                    </span>
                    {plan.badge && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-white text-sm leading-tight">{plan.name}</h3>
                  {plan.subtitle && <p className="text-xs text-text-muted mt-0.5">{plan.subtitle}</p>}
                </div>
                <p className="text-xl font-black italic text-white ml-3 shrink-0">{formatCurrency(plan.price)}</p>
              </div>

              <p className="text-[10px] text-text-muted mb-3">
                {INTERVAL_OPTIONS.find((o) => o.value === plan.interval)?.label ?? plan.interval}
                {' · '}
                {TIER_OPTIONS.find((o) => o.value === plan.tier)?.label ?? plan.tier ?? '—'}
              </p>

              {plan.features?.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="text-[11px] text-text-muted flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-accent-lime mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-[10px] text-text-muted pl-4.5">+{plan.features.length - 4} mais</li>
                  )}
                </ul>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                {plan.status === 'active' && (
                  <>
                    <CopyButton text={getCheckoutUrl(plan.id)} />
                    <a
                      href={`/checkout/${plan.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver página
                    </a>
                  </>
                )}
                <button
                  onClick={() => openEdit(plan)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/5 text-text-muted hover:text-white transition-all ml-auto"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
                <ConfirmButton
                  variant="destructive"
                  message={`Excluir "${plan.name}"?`}
                  onConfirm={() => deletePlan(plan.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
