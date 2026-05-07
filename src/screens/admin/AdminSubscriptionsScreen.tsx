import { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { Users, Search, CheckCircle2, AlertCircle, XCircle, Clock, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { PageShell } from '../../components/ui/Premium'
import type { Subscription, User } from '../../types/domain'
import { toastSuccess, toastError } from '../../components/ui/Toast'

export function AdminSubscriptionsScreen() {
  const { firebaseUser } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [usersById, setUsersById] = useState<Record<string, User>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        const subRef = collection(db, COLLECTIONS.SUBSCRIPTIONS)
        const q = query(subRef, orderBy('updatedAt', 'desc'))
        const [subSnap, userSnap] = await Promise.all([
          getDocs(q),
          getDocs(collection(db, COLLECTIONS.USERS)),
        ])
        setSubscriptions(subSnap.docs.map(d => d.data() as Subscription))
        setUsersById(Object.fromEntries(userSnap.docs.map(d => [d.id, d.data() as User])))
      } catch (error) {
        console.error('Error loading subscriptions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSubscriptions()
  }, [])

  const handleStatusChange = async (uid: string, newStatus: any, currentSub: Subscription) => {
    if (newStatus === currentSub.status) return
    try {
      const docRef = doc(db, COLLECTIONS.SUBSCRIPTIONS, uid)
      await updateDoc(docRef, { status: newStatus, updatedAt: new Date().toISOString() })
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        actorUid: firebaseUser?.uid,
        actorEmail: firebaseUser?.email,
        action: 'manual_status_update',
        targetType: 'subscription',
        targetId: uid,
        before: currentSub.status,
        after: newStatus,
        createdAt: serverTimestamp(),
      })
      setSubscriptions(prev => prev.map(s => s.uid === uid ? { ...s, status: newStatus } : s))
      toastSuccess(`Assinatura atualizada para "${newStatus}".`)
    } catch (error) {
      console.error('Error updating status:', error)
      toastError('Falha ao atualizar status. Verifique o console.')
    }
  }

  const filteredSubs = subscriptions.filter(s => {
    const user = usersById[s.uid]
    const haystack = `${user?.displayName || ''} ${user?.email || ''} ${s.uid} ${s.planName}`.toLowerCase()
    const matchesSearch = haystack.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell wide>
      <header className="mb-10">
        <div className="flex items-center gap-3 text-accent-red mb-2">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Painel administrativo</span>
        </div>
        <h1 className="font-display text-h1 text-white uppercase italic font-black">Gestão de Assinaturas</h1>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          className="ec-input w-full rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary outline-none transition-all"
          />
        </div>
        <div className="md:col-span-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ec-input w-full rounded-xl py-3 px-4 text-sm text-text-primary outline-none transition-all appearance-none"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="trialing">Em teste</option>
            <option value="past_due">Pendentes</option>
            <option value="cancelled">Cancelados</option>
            <option value="expired">Expirados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="ec-card rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white/5 border-b border-subtle">
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Usuário</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Plano</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Status</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Provedor</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Próxima Renovação</th>
              <th className="p-5 text-[10px] font-black uppercase text-text-muted tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSubs.map((sub) => {
              const user = usersById[sub.uid]
              return (
              <tr key={sub.uid} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Users className="w-4 h-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{user?.displayName || 'Usuário sem nome'}</p>
                      <p className="text-[10px] text-text-muted">{user?.email || sub.uid}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className="text-xs font-bold text-white">{sub.planName}</span>
                </td>
                <td className="p-5">
                  <StatusBadge status={sub.status} />
                </td>
                <td className="p-5">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">{sub.provider}</span>
                </td>
                <td className="p-5">
                  <span className="text-xs text-text-secondary">{new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}</span>
                </td>
                <td className="p-5">
                  <select 
                    className="bg-bg-primary border border-subtle rounded-lg py-1 px-2 text-[10px] font-bold text-text-primary outline-none focus:border-accent-lime transition-all"
                    onChange={(e) => handleStatusChange(sub.uid, e.target.value, sub)}
                    value={sub.status}
                  >
                    <option value="active">Ativar</option>
                    <option value="past_due">Marcar pendente</option>
                    <option value="cancelled">Cancelar</option>
                    <option value="expired">Expirar</option>
                    <option value="trialing">Marcar teste</option>
                  </select>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        {filteredSubs.length === 0 && (
          <div className="p-20 text-center text-text-muted italic text-sm">
            Nenhuma assinatura encontrada com os filtros aplicados.
          </div>
        )}
      </div>
    </PageShell>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    active: { color: 'text-accent-lime', bg: 'bg-accent-lime/10', icon: CheckCircle2, label: 'Ativa' },
    trialing: { color: 'text-accent-sky', bg: 'bg-accent-sky/10', icon: Clock, label: 'Trial' },
    past_due: { color: 'text-accent-red', bg: 'bg-accent-red/10', icon: AlertCircle, label: 'Pendente' },
    cancelled: { color: 'text-text-muted', bg: 'bg-white/5', icon: XCircle, label: 'Cancelada' },
    expired: { color: 'text-accent-red', bg: 'bg-accent-red/5', icon: XCircle, label: 'Expirada' },
  }
  const config = configs[status] || configs.cancelled
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
      <config.icon className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  )
}
