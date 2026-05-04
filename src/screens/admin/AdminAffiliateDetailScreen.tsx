import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc
} from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { 
  Users, 
  ArrowLeft,
  Copy,
  CheckCircle2,
  CreditCard,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Target
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PageShell } from '../../components/ui/Premium'
import type { AffiliateAccount, ReferralCode, CommissionEntry, ReferralAttribution } from '../../types/domain'
import { adminAffiliateService } from '../../services/adminAffiliateService'
import { useAuth } from '../../contexts/AuthContext'

export function AdminAffiliateDetailScreen() {
  const { affiliateId } = useParams()
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null)
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [commissions, setCommissions] = useState<CommissionEntry[]>([])
  const [attributions, setAttributions] = useState<ReferralAttribution[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!affiliateId) return
      try {
        const affDoc = await getDoc(doc(db, COLLECTIONS.AFFILIATE_ACCOUNTS, affiliateId))
        if (!affDoc.exists()) {
          alert('Afiliada não encontrada.')
          navigate('/admin/affiliates')
          return
        }
        setAffiliate(affDoc.data() as AffiliateAccount)

        // Load Referral Codes
        const codesSnap = await getDocs(query(collection(db, COLLECTIONS.REFERRAL_CODES), where('affiliateId', '==', affiliateId)))
        setReferralCodes(codesSnap.docs.map(d => d.data() as ReferralCode))

        // Load Commissions (Limit 20)
        const commSnap = await getDocs(query(
          collection(db, COLLECTIONS.COMMISSION_LEDGER), 
          where('affiliateId', '==', affiliateId)
        ))
        const allCommissions = commSnap.docs.map(d => d.data() as CommissionEntry)
        allCommissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setCommissions(allCommissions.slice(0, 20))

        // Load Attributions
        const attrSnap = await getDocs(query(
          collection(db, COLLECTIONS.REFERRAL_ATTRIBUTIONS),
          where('affiliateId', '==', affiliateId)
        ))
        const allAttributions = attrSnap.docs.map(d => d.data() as ReferralAttribution)
        allAttributions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setAttributions(allAttributions.slice(0, 20))

      } catch (error) {
        console.error('Error loading affiliate details:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [affiliateId, navigate])

  const handleUpdateStatus = async (status: AffiliateAccount['status']) => {
    if (!affiliate) return
    if (status === 'blocked' && !window.confirm(`Bloquear ${affiliate.name}? Os códigos de indicação ativos serão inativados.`)) return
    if (status === 'active' && !window.confirm(`Ativar ${affiliate.name}?`)) return
    try {
      await adminAffiliateService.updateStatus({ uid: firebaseUser?.uid, email: firebaseUser?.email }, affiliate.id, status)
      if (status === 'blocked') {
        setReferralCodes(prev => prev.map(code => ({ ...code, status: 'inactive' })))
      }
      setAffiliate({ ...affiliate, status })
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopyLink = (code: string) => {
    const link = `https://expertclub.com.br/?ref=${code}&utm_source=affiliate`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  if (isLoading || !affiliate) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell wide>
      {/* Header */}
      <header className="mb-10">
        <button onClick={() => navigate('/admin/affiliates')} className="flex items-center gap-2 text-text-muted hover:text-white transition-all mb-4 text-xs font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
              <Users className="w-10 h-10 text-accent-purple" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-h1 text-white uppercase italic font-black leading-none">{affiliate.name}</h1>
                <StatusBadge status={affiliate.status} />
              </div>
              <p className="text-text-muted font-mono text-sm">{affiliate.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
             {affiliate.status !== 'active' && (
               <Button variant="primary" onClick={() => handleUpdateStatus('active')}>
                 <ShieldCheck className="w-4 h-4 mr-2" /> Ativar
               </Button>
             )}
             {affiliate.status === 'active' && (
               <Button variant="ghost" className="border-accent-red/30 text-accent-red hover:bg-accent-red/10" onClick={() => handleUpdateStatus('blocked')}>
                 <ShieldX className="w-4 h-4 mr-2" /> Bloquear
               </Button>
             )}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <KPIMini label="Comissão Atual" value="20%" icon={TrendingUp} />
        <KPIMini label="Saldo Pendente" value={`R$ ${affiliate.pendingCommission.toFixed(2)}`} icon={DollarSign} />
        <KPIMini label="Total Pago" value={`R$ ${affiliate.totalCommissionPaid.toFixed(2)}`} icon={CheckCircle2} />
        <KPIMini label="Indicações" value={attributions.length.toString()} icon={Target} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Codes & Attributions */}
        <div className="lg:col-span-8 space-y-10">
          {/* Referral Codes */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-h3 text-white uppercase italic font-bold">Links de Divulgação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referralCodes.map(code => (
                <div key={code.code} className="ec-card rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-accent-purple tracking-widest mb-1">CÓDIGO: {code.code}</p>
                    <p className="text-xs font-bold text-white">{code.usageCount} Conversões</p>
                  </div>
                  <button onClick={() => handleCopyLink(code.code)} className="p-3 bg-white/5 rounded-xl text-text-muted hover:text-accent-lime transition-all">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Attribution History */}
          <section>
            <h3 className="font-display text-h3 text-white uppercase italic font-bold mb-6">Indicações Recentes</h3>
            <div className="ec-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-subtle">
                    <tr>
                      <th className="p-4 text-[9px] font-black uppercase text-text-muted tracking-widest">Usuário</th>
                      <th className="p-4 text-[9px] font-black uppercase text-text-muted tracking-widest">Data</th>
                      <th className="p-4 text-[9px] font-black uppercase text-text-muted tracking-widest">Origem</th>
                      <th className="p-4 text-[9px] font-black uppercase text-text-muted tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attributions.map(attr => (
                      <tr key={attr.id} className="text-xs">
                        <td className="p-4 font-mono text-text-primary">{attr.uid.slice(0, 8)}...</td>
                        <td className="p-4 text-text-muted">{new Date(attr.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-text-muted">{attr.source || 'Direto'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${attr.status === 'converted' ? 'bg-accent-lime/10 text-accent-lime' : 'bg-white/5 text-text-muted'}`}>
                            {attr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attributions.length === 0 && (
                      <tr><td colSpan={4} className="p-10 text-center text-text-muted italic">Sem indicações registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Commission and payment info */}
        <div className="lg:col-span-4 space-y-10">
          <section className="ec-card rounded-3xl p-6">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
               <CreditCard className="w-4 h-4 text-accent-purple" /> Dados Financeiros
            </h4>
            <div className="space-y-4">
               <div>
                 <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Método de pagamento</p>
                 <p className="text-sm text-white font-bold">{affiliate.payoutMethod === 'pix' ? 'PIX' : 'Manual'}</p>
               </div>
               <div>
                 <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Chave PIX</p>
                 <p className="text-sm text-accent-lime font-mono break-all">{affiliate.pixKey || 'Não cadastrada'}</p>
               </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider italic">Últimas Comissões</h3>
            <div className="space-y-4">
              {commissions.map(comm => (
                <div key={comm.id} className="ec-card rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[9px] font-black uppercase text-text-muted tracking-tighter">REF: {comm.billingEventId.slice(0, 10)}</p>
                    <span className="text-xs font-display font-bold text-white">R$ {comm.commissionAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-muted">{new Date(comm.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className={`text-[9px] font-black uppercase ${comm.status === 'paid' ? 'text-accent-lime' : 'text-accent-sky'}`}>{commissionStatusPt(comm.status)}</span>
                  </div>
                </div>
              ))}
              {commissions.length === 0 && (
                <div className="p-10 text-center border border-dashed border-subtle rounded-2xl text-text-muted text-xs italic">
                   Aguardando primeira venda...
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  )
}

function KPIMini({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="ec-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-4 h-4 text-text-muted" />
        <span className="text-[9px] font-black uppercase text-text-muted tracking-widest">{label}</span>
      </div>
      <p className="font-display text-xl font-bold text-white italic">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    active: { color: 'text-accent-lime', bg: 'bg-accent-lime/10', icon: ShieldCheck, label: 'Ativa' },
    inactive: { color: 'text-text-muted', bg: 'bg-white/5', icon: ShieldAlert, label: 'Inativa' },
    blocked: { color: 'text-accent-red', bg: 'bg-accent-red/10', icon: ShieldX, label: 'Bloqueada' },
  }
  const config = configs[status] || configs.inactive
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
      <config.icon className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
    </div>
  )
}

function commissionStatusPt(status: string) {
  return ({ approved: 'Aprovada', paid: 'Paga', cancelled: 'Cancelada', reversed: 'Revertida', pending: 'Pendente' } as Record<string, string>)[status] || status
}
