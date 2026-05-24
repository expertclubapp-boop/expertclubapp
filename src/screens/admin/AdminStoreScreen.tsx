import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, Plus, Eye, EyeOff, Loader2, X, Clock, Package } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { storeService } from '../../services/storeService'
import { Button } from '../../components/ui/Button'
import { PageShell, GlassCard, StatusBadge } from '../../components/ui/Premium'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import type { StoreItem, StoreRedemption } from '../../types/domain'

type TabView = 'items' | 'redemptions'

interface NewItemForm {
  title: string
  description: string
  category: StoreItem['category']
  creditCost: string
  stock: string
  maxPerUser: string
  fulfillmentType: StoreItem['fulfillmentType']
  discountPercent: string
}

const emptyForm: NewItemForm = {
  title: '',
  description: '',
  category: 'digital_product',
  creditCost: '',
  stock: '-1',
  maxPerUser: '-1',
  fulfillmentType: 'manual_review',
  discountPercent: '',
}

const categoryLabels: Record<StoreItem['category'], string> = {
  plan_discount:    'Desconto em plano',
  plan_upgrade:     'Upgrade de plano',
  digital_product:  'Produto digital',
  physical_product: 'Produto físico',
  consultation:     'Mentoria 1:1',
  vip_access:       'Acesso VIP',
  challenge_entry:  'Entrada em desafio',
  custom:           'Personalizado',
}

export function AdminStoreScreen() {
  const { firebaseUser } = useAuth()
  const [items, setItems] = useState<StoreItem[]>([])
  const [redemptions, setRedemptions] = useState<StoreRedemption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<TabView>('items')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewItemForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [allItems, pending] = await Promise.all([
        storeService.getAllItems(),
        storeService.getPendingRedemptions(),
      ])
      setItems(allItems)
      setRedemptions(pending)
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.creditCost) {
      toastError('Título, descrição e custo em créditos são obrigatórios.')
      return
    }
    if (!firebaseUser) return
    setIsSaving(true)
    try {
      await storeService.createItem(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          creditCost: parseInt(form.creditCost, 10),
          stock: parseInt(form.stock || '-1', 10),
          isActive: true,
          maxPerUser: parseInt(form.maxPerUser || '-1', 10),
          fulfillmentType: form.fulfillmentType,
          discountPercent: form.discountPercent ? parseInt(form.discountPercent, 10) : undefined,
          createdBy: firebaseUser.uid,
        },
        firebaseUser.uid
      )
      toastSuccess('Item criado com sucesso!')
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao criar item.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (item: StoreItem) => {
    setActionId(item.id)
    try {
      await storeService.updateItem(item.id, { isActive: !item.isActive })
      toastSuccess(item.isActive ? 'Item desativado.' : 'Item ativado.')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro.')
    } finally {
      setActionId(null)
    }
  }

  const handleFulfill = async (redemptionId: string) => {
    if (!firebaseUser) return
    setActionId(redemptionId)
    try {
      await storeService.fulfillRedemption(redemptionId, firebaseUser.uid)
      toastSuccess('Resgate entregue!')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao entregar.')
    } finally {
      setActionId(null)
    }
  }

  const handleCancelRedemption = async (redemptionId: string) => {
    if (!firebaseUser) return
    if (!confirm('Cancelar este resgate? Os créditos serão devolvidos ao aluno.')) return
    setActionId(redemptionId)
    try {
      await storeService.cancelRedemption(redemptionId, firebaseUser.uid)
      toastSuccess('Resgate cancelado. Créditos devolvidos.')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao cancelar.')
    } finally {
      setActionId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-display-md font-black text-text-primary">Loja de Créditos</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {items.filter((i) => i.isActive).length} itens ativos · {redemptions.length} resgates pendentes
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Novo item
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['items', 'redemptions'] as TabView[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-pill px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t ? 'bg-volt-600 text-white' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            {t === 'items' ? 'Catálogo' : `Resgates (${redemptions.length})`}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && tab === 'items' && (
        <GlassCard className="rounded-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Novo item</h3>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">Título *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-muted mb-1">Descrição *</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as StoreItem['category'] }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white focus:outline-none"
              >
                {(Object.entries(categoryLabels) as [StoreItem['category'], string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Custo (créditos) *</label>
              <input
                type="number"
                min="1"
                value={form.creditCost}
                onChange={(e) => setForm((p) => ({ ...p, creditCost: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-volt-600/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Estoque (-1 = ilimitado)</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Máx. por aluno (-1 = ilimitado)</label>
              <input
                type="number"
                value={form.maxPerUser}
                onChange={(e) => setForm((p) => ({ ...p, maxPerUser: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Entrega</label>
              <select
                value={form.fulfillmentType}
                onChange={(e) => setForm((p) => ({ ...p, fulfillmentType: e.target.value as StoreItem['fulfillmentType'] }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="manual_review">Manual (requer aprovação)</option>
                <option value="automatic">Automática</option>
              </select>
            </div>
            {form.category === 'plan_discount' && (
              <div>
                <label className="block text-xs text-text-muted mb-1">Desconto (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="primary" className="gap-2" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando…</> : <><Plus className="h-4 w-4" /> Criar item</>}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      {/* Items list */}
      {tab === 'items' && (
        items.length === 0 ? (
          <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
            <ShoppingBag className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Nenhum item no catálogo.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <GlassCard key={item.id} className="rounded-card p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">{item.title}</span>
                    <StatusBadge tone={item.isActive ? 'green' : 'neutral'}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {categoryLabels[item.category]} · {item.creditCost} créditos ·{' '}
                    {item.stock === -1 ? 'Ilimitado' : `${Math.max(0, item.stock - item.reservedStock)} restantes`}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  className="text-xs px-3 h-8 gap-1.5"
                  onClick={() => handleToggleActive(item)}
                  disabled={actionId === item.id}
                >
                  {actionId === item.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : item.isActive
                      ? <><EyeOff className="h-3.5 w-3.5" /> Desativar</>
                      : <><Eye className="h-3.5 w-3.5" /> Ativar</>
                  }
                </Button>
              </GlassCard>
            ))}
          </div>
        )
      )}

      {/* Pending redemptions */}
      {tab === 'redemptions' && (
        redemptions.length === 0 ? (
          <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
            <Package className="h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Nenhum resgate pendente de entrega.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {redemptions.map((r) => (
              <GlassCard key={r.id} className="rounded-card p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sm font-semibold text-text-primary">{r.storeItemTitle}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Aluno: {r.userId} · {r.creditCost} créditos ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="text-xs px-3 h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => handleFulfill(r.id)}
                    disabled={actionId === r.id}
                  >
                    {actionId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Entregar'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs px-3 h-8 text-red-400"
                    onClick={() => handleCancelRedemption(r.id)}
                    disabled={actionId === r.id}
                  >
                    Cancelar
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )
      )}
    </PageShell>
  )
}
