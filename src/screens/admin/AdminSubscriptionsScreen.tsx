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
import { fromFirestoreDate, nowTimestamp } from '../../lib/firebase/date'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import type { Subscription, User } from '../../types/domain'
import { toastSuccess, toastError } from '../../components/ui/Toast'
import { V2Card, V2Badge, V2Avatar, cx } from '../../components/v2/ExpertClubV2Base'

const statusTone: Record<string, any> = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  cancelled: 'neutral',
  expired: 'neutral',
}

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
      await updateDoc(docRef, { status: newStatus, updatedAt: nowTimestamp() })
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
      toastError('Falha ao atualizar status.')
    }
  }

  const filteredSubs = subscriptions.filter(s => {
    const user = usersById[s.uid]
    const haystack = `${user?.displayName || ''} ${user?.email || ''} ${s.uid} ${s.planName}`.toLowerCase()
    const matchesSearch = haystack.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-ec-violet/30 border-t-ec-violet rounded-full animate-spin" /></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-ec-violet uppercase mb-1 block">OPERAÇÃO FINANCEIRA</span>
          <h1 className="text-3xl font-black italic text-white uppercase leading-tight">GESTÃO DE ASSINATURAS</h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-ec-violet transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold placeholder:text-text-muted focus:border-ec-violet/50 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            ['all', 'Todos'], ['active', 'Ativos'], ['past_due', 'Pendente'], ['cancelled', 'Cancelados']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={cx(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                statusFilter === id ? "bg-ec-violet text-white" : "bg-white/5 text-text-muted hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <V2Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-white/5">
                <th className="p-6">Assinante</th>
                <th className="p-6">Plano</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-center">Provedor</th>
                <th className="p-6 text-center">Próxima Renovação</th>
                <th className="p-6 text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => {
                const user = usersById[sub.uid]
                const currentPeriodEnd = fromFirestoreDate(sub.currentPeriodEnd as any)
                return (
                  <tr key={sub.uid} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <V2Avatar uid={sub.uid} name={user?.displayName} size="sm" />
                        <div>
                          <p className="text-sm font-black italic text-white uppercase group-hover:text-ec-violet transition-colors">{user?.displayName || 'Sem nome'}</p>
                          <p className="text-[10px] text-text-muted font-bold">{user?.email || sub.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">{sub.planName}</p>
                    </td>
                    <td className="p-6 text-center">
                      <V2Badge tone={statusTone[sub.status]}>
                        {sub.status?.toUpperCase()}
                      </V2Badge>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">{sub.provider}</span>
                    </td>
                    <td className="p-6 text-center text-xs text-text-muted font-bold">
                      {currentPeriodEnd ? currentPeriodEnd.toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-6 text-right">
                       <select
                        className="bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase italic text-white outline-none focus:border-ec-violet/50 transition-all cursor-pointer"
                        onChange={(e) => handleStatusChange(sub.uid, e.target.value, sub)}
                        value={sub.status}
                      >
                        <option value="active">Ativar</option>
                        <option value="past_due">Pendente</option>
                        <option value="cancelled">Cancelar</option>
                        <option value="expired">Expirar</option>
                        <option value="trialing">Teste</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredSubs.length === 0 && (
            <div className="p-20 text-center text-text-muted font-black uppercase italic">Nenhuma assinatura encontrada.</div>
          )}
        </div>
      </V2Card>
    </div>
  )
}
