import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Search, DollarSign, TrendingUp, ShieldX, Loader2, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { influencerService } from '../../services/influencerService'
import { referralService } from '../../services/referralService'
import { Button } from '../../components/ui/Button'
import { PageShell, GlassCard, StatusBadge } from '../../components/ui/Premium'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import type { InfluencerAccount } from '../../types/domain'

interface CreateForm {
  uid: string
  displayName: string
  email: string
  instagram: string
  tier: InfluencerAccount['tier']
  payoutMethod: InfluencerAccount['payoutMethod']
  pixKey: string
}

const emptyForm: CreateForm = {
  uid: '',
  displayName: '',
  email: '',
  instagram: '',
  tier: 'nano',
  payoutMethod: 'pix',
  pixKey: '',
}

export function AdminInfluencersScreen() {
  const { firebaseUser } = useAuth()
  const [accounts, setAccounts] = useState<InfluencerAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setAccounts(await influencerService.listAccounts())
    } catch {
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = accounts.filter((a) =>
    a.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.uid.trim() || !form.displayName.trim() || !form.email.trim()) {
      toastError('UID, nome e e-mail são obrigatórios.')
      return
    }
    if (!firebaseUser) return
    setIsSaving(true)
    try {
      await influencerService.createAccount(
        {
          uid: form.uid.trim(),
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          instagram: form.instagram.trim() || undefined,
          status: 'active',
          tier: form.tier,
          payoutMethod: form.payoutMethod,
          pixKey: form.pixKey.trim() || undefined,
          minPayoutAmount: 50,
          holdDays: 15,
          phone: undefined,
          youtubeChannel: undefined,
          pixKeyType: undefined,
          bankName: undefined,
          bankAgency: undefined,
          bankAccount: undefined,
          notes: undefined,
          customCommissionTiers: undefined,
        },
        firebaseUser.uid
      )

      // Also generate a referral code for the influencer
      await referralService.generateCode({
        ownerUid: form.uid.trim(),
        ownerType: 'influencer',
        ownerDisplayName: form.displayName.trim(),
      })

      toastSuccess(`Influenciador ${form.displayName} criado com sucesso!`)
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao criar influenciador.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBlock = async (uid: string, displayName: string) => {
    if (!firebaseUser) return
    if (!confirm(`Bloquear ${displayName}? Isso impedirá novas comissões.`)) return
    try {
      await influencerService.blockAccount(uid, firebaseUser.uid, 'Bloqueado pelo admin')
      toastSuccess('Conta bloqueada.')
      await load()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao bloquear.')
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
          <h1 className="font-display text-display-md font-black text-text-primary">Influenciadores</h1>
          <p className="text-sm text-text-secondary mt-0.5">{accounts.length} contas · Gestão de comissões BRL</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Novo influenciador
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <GlassCard className="rounded-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Novo influenciador</h3>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">Firebase UID *</label>
              <input
                value={form.uid}
                onChange={(e) => setForm((p) => ({ ...p, uid: e.target.value }))}
                placeholder="uid do Firebase Auth"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Nome completo *</label>
              <input
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Nome Sobrenome"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Instagram</label>
              <input
                value={form.instagram}
                onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))}
                placeholder="@handle"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Tier</label>
              <select
                value={form.tier}
                onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value as InfluencerAccount['tier'] }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-volt-600/50"
              >
                <option value="nano">Nano (&lt;10k)</option>
                <option value="micro">Micro (10k–100k)</option>
                <option value="macro">Macro (100k–1M)</option>
                <option value="mega">Mega (1M+)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Método de pagamento</label>
              <select
                value={form.payoutMethod}
                onChange={(e) => setForm((p) => ({ ...p, payoutMethod: e.target.value as InfluencerAccount['payoutMethod'] }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-volt-600/50"
              >
                <option value="pix">PIX</option>
                <option value="bank_transfer">TED/DOC</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            {form.payoutMethod === 'pix' && (
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-muted mb-1">Chave PIX</label>
                <input
                  value={form.pixKey}
                  onChange={(e) => setForm((p) => ({ ...p, pixKey: e.target.value }))}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="primary" className="gap-2" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando…</> : <><Plus className="h-4 w-4" /> Criar conta</>}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </GlassCard>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-volt-600/50"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
          <Users className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Nenhum influenciador encontrado.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((acc) => (
            <GlassCard key={acc.id} className="rounded-card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">{acc.displayName}</span>
                  <AccountStatusBadge status={acc.status} />
                  <span className="text-xs text-text-muted capitalize">{acc.tier}</span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">{acc.email}</p>
              </div>

              <div className="flex items-center gap-5 text-xs">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sky-400">
                    <Users className="h-3.5 w-3.5" />
                    <span>{acc.totalReferrals}</span>
                  </div>
                  <span className="text-text-muted">refs</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-amber-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>R${(acc.pendingCommissionBrl ?? 0).toFixed(0)}</span>
                  </div>
                  <span className="text-text-muted">pendente</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>R${(acc.paidCommissionBrl ?? 0).toFixed(0)}</span>
                  </div>
                  <span className="text-text-muted">pago</span>
                </div>
              </div>

              {acc.status !== 'blocked' && (
                <Button
                  variant="ghost"
                  className="text-xs px-2 h-8 text-red-400 hover:text-red-300"
                  onClick={() => handleBlock(acc.uid, acc.displayName)}
                >
                  <ShieldX className="h-3.5 w-3.5" />
                </Button>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function AccountStatusBadge({ status }: { status: InfluencerAccount['status'] }) {
  const tone =
    status === 'active'         ? 'green'   :
    status === 'pending_review' ? 'yellow'  :
    status === 'inactive'       ? 'neutral' :
    'red'
  const label =
    status === 'active'         ? 'Ativo'      :
    status === 'pending_review' ? 'Revisão'    :
    status === 'inactive'       ? 'Inativo'    :
    'Bloqueado'
  return <StatusBadge tone={tone as 'green' | 'yellow' | 'neutral' | 'red'}>{label}</StatusBadge>
}
