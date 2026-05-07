import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  ArrowUpRight,
  UserPlus,
  X,
  Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PageShell } from '../../components/ui/Premium'
import type { AffiliateAccount } from '../../types/domain'
import { adminAffiliateService } from '../../services/adminAffiliateService'
import { useAuth } from '../../contexts/AuthContext'
import { toastSuccess, toastError } from '../../components/ui/Toast'

interface NewAffiliateForm {
  name: string
  email: string
}

export function AdminAffiliatesScreen() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [affiliates, setAffiliates] = useState<AffiliateAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewAffiliateForm>({ name: '', email: '' })
  const [isSaving, setIsSaving] = useState(false)

  const pendingCommissionTotal = affiliates.reduce((total, a) => total + (a.pendingCommission || 0), 0)

  useEffect(() => {
    adminAffiliateService
      .list()
      .then(setAffiliates)
      .catch(() => setAffiliates([]))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredAffiliates = affiliates.filter(
    a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  async function handleCreateAffiliate() {
    if (!form.name.trim() || !form.email.trim()) {
      toastError('Preencha nome e e-mail antes de criar a afiliada.')
      return
    }
    setIsSaving(true)
    try {
      const { code, affiliate } = await adminAffiliateService.create(
        { uid: firebaseUser?.uid, email: firebaseUser?.email },
        { name: form.name.trim(), email: form.email.trim() },
      )
      setAffiliates(prev => [affiliate, ...prev])
      setShowForm(false)
      setForm({ name: '', email: '' })
      toastSuccess(`Afiliada criada! Código gerado: ${code}`)
    } catch (error) {
      console.error('Error creating affiliate:', error)
      toastError('Erro ao criar afiliada. Verifique o console.')
    } finally {
      setIsSaving(false)
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
    <PageShell wide>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 text-accent-purple mb-2">
            <UserPlus className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gestão de crescimento</span>
          </div>
          <h1 className="font-display text-h1 text-white uppercase italic font-black">Gestão de Afiliadas</h1>
        </div>
        <Button variant="primary" className="md:w-auto" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-5 h-5 mr-2" /> Nova Afiliada
        </Button>
      </header>

      {/* Inline create form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-accent-lime/20 bg-accent-lime/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Nova afiliada</p>
            <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">
                Nome completo
              </label>
              <input
                id="new-affiliate-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Maria Silva"
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">
                E-mail
              </label>
              <input
                id="new-affiliate-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Ex: maria@exemplo.com"
                className="ec-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              id="btn-create-affiliate"
              variant="primary"
              onClick={handleCreateAffiliate}
              disabled={isSaving || !form.name.trim() || !form.email.trim()}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar afiliada'}
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <KPICard label="Total Afiliadas" value={affiliates.length.toString()} icon={Users} color="purple" />
        <KPICard
          label="Status Ativo"
          value={affiliates.filter(a => a.status === 'active').length.toString()}
          icon={ShieldCheck}
          color="lime"
        />
        <KPICard
          label="Aguardando pagamento"
          value={`R$ ${pendingCommissionTotal.toFixed(2)}`}
          icon={Clock}
          color="sky"
        />
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar afiliada por nome ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ec-input w-full rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary outline-none transition-all"
        />
      </div>

      {/* Table */}
      <div className="ec-card rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white/5 border-b border-subtle">
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Afiliada</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Status</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Comissão</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Total Pago</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Criada em</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredAffiliates.map(affiliate => (
              <tr key={affiliate.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-purple/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent-purple" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{affiliate.name}</p>
                      <p className="text-[10px] text-text-muted">{affiliate.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <StatusBadge status={affiliate.status} />
                </td>
                <td className="p-5">
                  <span className="text-xs font-bold text-white">{(affiliate.commissionRate * 100).toFixed(0)}% Recorrente</span>
                </td>
                <td className="p-5">
                  <span className="text-xs font-display font-bold text-accent-lime italic">
                    R$ {affiliate.totalCommissionPaid.toFixed(2)}
                  </span>
                </td>
                <td className="p-5">
                  <span className="text-xs text-text-secondary">
                    {new Date(affiliate.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="p-5">
                  <button
                    id={`btn-open-affiliate-${affiliate.id}`}
                    onClick={() => navigate(`/admin/affiliates/${affiliate.id}`)}
                    className="p-2 bg-white/5 border border-subtle rounded-lg text-text-muted hover:text-white hover:border-accent-purple transition-all group"
                  >
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAffiliates.length === 0 && (
          <div className="p-20 text-center text-text-muted italic text-sm">Nenhuma afiliada encontrada.</div>
        )}
      </div>
    </PageShell>
  )
}

function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const colors: Record<string, string> = {
    purple: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
    lime: 'text-accent-lime bg-accent-lime/10 border-accent-lime/20',
    sky: 'text-accent-sky bg-accent-sky/10 border-accent-sky/20',
  }
  return (
    <div className={`ec-card p-6 rounded-2xl border ${colors[color]} flex items-center justify-between`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
        <p className="font-display text-2xl font-black italic uppercase">{value}</p>
      </div>
      <Icon className="w-8 h-8 opacity-40" />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    active:   { color: 'text-accent-lime', bg: 'bg-accent-lime/10', icon: ShieldCheck, label: 'Ativa' },
    inactive: { color: 'text-text-muted',  bg: 'bg-white/5',        icon: ShieldAlert, label: 'Inativa' },
    blocked:  { color: 'text-accent-red',  bg: 'bg-accent-red/10',  icon: ShieldX,     label: 'Bloqueada' },
    pending:  { color: 'text-accent-sky',  bg: 'bg-accent-sky/10',  icon: Clock,       label: 'Pendente' },
  }
  const config = configs[status] || configs.inactive
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
      <config.icon className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  )
}
