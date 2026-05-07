import { useState, useEffect } from 'react'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Filter,
  TrendingUp,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PageShell } from '../../components/ui/Premium'
import type { CommissionEntry } from '../../types/domain'
import { adminCommissionService } from '../../services/adminCommissionService'
import { useAuth } from '../../contexts/AuthContext'
import { toastSuccess, toastError, toastInfo } from '../../components/ui/Toast'

export function AdminCommissionsScreen() {
  const { firebaseUser } = useAuth()
  const [entries, setEntries] = useState<CommissionEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadCommissions() {
      try {
        setEntries(await adminCommissionService.listCommissions())
      } catch (error) {
        console.error('Error loading commissions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCommissions()
  }, [])

  const filteredEntries = entries.filter(e => statusFilter === 'all' || e.status === statusFilter)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleCreatePayout = async () => {
    if (selectedIds.length === 0) return
    const itemsToPay = entries.filter(e => selectedIds.includes(e.id))

    const affiliateIds = new Set(itemsToPay.map(i => i.affiliateId))
    if (affiliateIds.size > 1) {
      toastInfo('Selecione apenas comissões da mesma afiliada para criar um pagamento.')
      return
    }

    const totalAmount = itemsToPay.reduce((sum, i) => sum + i.commissionAmount, 0)
    const affiliateId = Array.from(affiliateIds)[0]

    if (!window.confirm(`Criar pagamento de R$ ${totalAmount.toFixed(2)} para ${affiliateId}?`)) return

    setIsSaving(true)
    try {
      await adminCommissionService.createPayout(
        { uid: firebaseUser?.uid, email: firebaseUser?.email },
        affiliateId,
        selectedIds,
      )
      setEntries(prev => prev.map(e => selectedIds.includes(e.id) ? { ...e, status: 'paid' } : e))
      setSelectedIds([])
      toastSuccess(`Pagamento criado — ${selectedIds.length} comissão(ões) marcadas como pagas.`)
    } catch (error) {
      console.error('Error creating payment:', error)
      toastError('Erro ao processar pagamento. Verifique o console.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
      </div>
    )
  }

  const totals = {
    pending: entries.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.commissionAmount, 0),
    paid: entries.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.commissionAmount, 0),
  }

  return (
    <PageShell wide>
      <header className="mb-10">
        <div className="flex items-center gap-3 text-accent-purple mb-2">
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Controle financeiro</span>
        </div>
        <h1 className="font-display text-h1 text-white uppercase italic font-black">Comissões</h1>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="ec-card rounded-3xl p-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Total aguardando pagamento</p>
            <p className="font-display text-3xl font-black text-accent-sky italic">R$ {totals.pending.toFixed(2)}</p>
          </div>
          <Clock className="w-10 h-10 text-accent-sky opacity-20" />
        </div>
        <div className="ec-card rounded-3xl p-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-1">Total Pago</p>
            <p className="font-display text-3xl font-black text-accent-lime italic">R$ {totals.paid.toFixed(2)}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-accent-lime opacity-20" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="ec-input rounded-xl py-2.5 pl-9 pr-8 text-xs text-text-primary outline-none appearance-none"
             >
               <option value="all">Todos os status</option>
               <option value="approved">Aprovadas</option>
               <option value="paid">Pagas</option>
               <option value="cancelled">Canceladas</option>
               <option value="reversed">Revertidas</option>
             </select>
          </div>
          {selectedIds.length > 0 && (
            <span className="text-xs font-bold text-accent-purple">{selectedIds.length} selecionadas</span>
          )}
        </div>
        
        {selectedIds.length > 0 && (
          <Button variant="primary" onClick={handleCreatePayout} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Criar pagamento selecionado
          </Button>
        )}
      </div>

      {/* Commission table */}
      <div className="ec-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 border-b border-subtle">
                <th className="p-5 w-10"></th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Afiliada</th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Referência</th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Bruto</th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Comissão (%)</th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Valor Líquido</th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Status</th>
                <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className={`hover:bg-white/[0.02] transition-colors ${selectedIds.includes(entry.id) ? 'bg-accent-purple/5' : ''}`}>
                  <td className="p-5">
                    {entry.status === 'approved' && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="w-4 h-4 rounded border-subtle bg-transparent text-accent-purple focus:ring-accent-purple"
                      />
                    )}
                  </td>
                  <td className="p-5">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">{entry.affiliateId}</p>
                  </td>
                  <td className="p-5">
                    <div>
                      <p className="text-[10px] font-mono text-text-muted uppercase">Aluno: {entry.uid.slice(0, 8)}</p>
                      <p className="text-[9px] text-text-muted truncate max-w-[150px]">{entry.billingEventId}</p>
                    </div>
                  </td>
                  <td className="p-5 text-xs text-text-secondary">R$ {entry.grossAmount.toFixed(2)}</td>
                  <td className="p-5 text-xs text-text-secondary">{(entry.commissionRate * 100).toFixed(0)}%</td>
                  <td className="p-5">
                    <span className="text-xs font-display font-bold text-white italic">R$ {entry.commissionAmount.toFixed(2)}</span>
                  </td>
                  <td className="p-5">
                    <EntryStatusBadge status={entry.status} />
                  </td>
                  <td className="p-5 text-xs text-text-muted">
                    {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-text-muted italic text-sm">
                    Nenhuma comissão registrada para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  )
}

function EntryStatusBadge({ status }: { status: string }) {
  const configs: any = {
    approved: { color: 'text-accent-sky', bg: 'bg-accent-sky/10', icon: CheckCircle2, label: 'Aprovada' },
    paid: { color: 'text-accent-lime', bg: 'bg-accent-lime/10', icon: CheckCircle2, label: 'Paga' },
    cancelled: { color: 'text-text-muted', bg: 'bg-white/5', icon: AlertCircle, label: 'Cancelada' },
    reversed: { color: 'text-accent-red', bg: 'bg-accent-red/10', icon: AlertCircle, label: 'Revertida' },
  }
  const config = configs[status] || configs.cancelled
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
      <config.icon className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  )
}
