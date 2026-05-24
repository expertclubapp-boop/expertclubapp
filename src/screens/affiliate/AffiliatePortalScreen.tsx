import { useState, useEffect } from 'react'
import { 
  doc, 
  getDoc
} from 'firebase/firestore'
import { db } from '../../lib/firebase/firebase'
import { COLLECTIONS } from '../../lib/firebase/paths'
import { 
  Copy,
  TrendingUp,
  Target,
  Gift,
  Share2,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { toastSuccess } from '../../components/ui/Toast'
import type { ReferralCode } from '../../types/domain'

export function AffiliatePortalScreen() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [refData, setRefData] = useState<ReferralCode | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPublicData() {
      if (!code) return
      try {
        const docRef = doc(db, COLLECTIONS.REFERRAL_CODES, code.toUpperCase())
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
          const data = snap.data() as ReferralCode
          if (data.status === 'active') {
            setRefData(data)
          }
        }
      } catch (error) {
        console.error('Error loading public affiliate data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPublicData()
  }, [code])

  const handleCopy = () => {
    const link = `https://expertclub.com.br/?ref=${code?.toUpperCase()}&hero=B&utm_source=affiliate&utm_campaign=stories`
    navigator.clipboard.writeText(link)
    toastSuccess('Link copiado com sucesso.')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!refData) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
           <Zap className="w-10 h-10 text-text-muted" />
        </div>
        <h1 className="font-display text-h1 text-white uppercase italic font-black mb-4">Link Inválido</h1>
        <p className="text-text-muted max-w-xs mx-auto mb-10">Este link de indicação não existe ou foi desativado. Entre em contato com o suporte se acredita ser um erro.</p>
        <Button variant="ghost" className="border-white/10" onClick={() => navigate('/')}>Voltar ao Início</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-purple/30">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-lime/5 blur-[100px] rounded-full" />
      </div>

      <main className="relative max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12">
        {/* Welcome Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Portal de Crescimento</span>
          </div>
          <h1 className="font-display text-[42px] md:text-[56px] text-white uppercase italic font-black leading-[0.9] tracking-tighter">
            Seja bem-vinda,<br />
            <span className="text-accent-purple">{refData.affiliateName || 'Afiliada'}</span>
          </h1>
          <p className="text-text-muted font-body-md max-w-md mx-auto">
            Este é seu centro de indicações. Use seu link exclusivo para trazer novas alunas e garantir sua comissão recorrente de 20%.
          </p>
        </header>

        {/* Exclusive Link Card */}
        <section className="bg-surface-1 border border-subtle rounded-[32px] p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
            <Share2 className="w-40 h-40 text-white" />
          </div>
          
          <div className="relative space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent-purple" />
              </div>
              <h2 className="font-display text-h2 text-white uppercase italic font-bold">Seu Link Exclusivo</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/input hover:border-accent-purple/30 transition-all">
                <span className="text-xs font-mono text-text-muted truncate mr-4">
                  expertclub.com.br/?ref={code?.toUpperCase()}&hero=B
                </span>
                <button onClick={handleCopy} className="p-2 bg-white/5 rounded-lg text-text-muted hover:text-white transition-all">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <Button variant="primary" className="md:w-auto px-10 shadow-lg shadow-accent-lime/20" onClick={handleCopy}>
                 COPIAR LINK
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PortalStat label="Status da Conta" value="Ativa" icon={ShieldCheck} color="lime" />
          <PortalStat label="Sua Comissão" value="20%" sub="Recorrente" icon={TrendingUp} color="purple" />
          <PortalStat label="Indicações" value={refData.usageCount.toString()} sub="Totais" icon={Target} color="sky" />
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10">
          <div className="space-y-4">
            <h3 className="font-display text-xl text-white uppercase italic font-bold">Como Funciona?</h3>
            <ul className="space-y-4">
              <InfoStep number="01" text="Compartilhe seu link exclusivo com sua audiência." />
              <InfoStep number="02" text="Cada aluna que assinar através do seu link é atribuída a você." />
              <InfoStep number="03" text="Você recebe 20% de comissão sobre cada mensalidade paga." />
              <InfoStep number="04" text="Enquanto a aluna estiver ativa, sua comissão continua caindo." />
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="font-display text-xl text-white uppercase italic font-bold">Dicas de Sucesso</h3>
            <div className="bg-surface-2 border border-subtle rounded-2xl p-6 space-y-4">
               <p className="text-xs text-text-muted leading-relaxed">
                 Poste nos stories mostrando seus resultados e use o link na bio. A transparência gera mais conversão!
               </p>
               <Button variant="ghost" className="w-full text-[10px] border-white/5 text-text-muted">
                 Baixar Kit de Marketing <ExternalLink className="w-3 h-3 ml-2" />
               </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-20 text-center border-t border-white/5 bg-black/20">
         <p className="font-display font-black italic text-white/20 text-4xl tracking-tighter uppercase">
           Expert Club · Growth
         </p>
      </footer>
    </div>
  )
}

function PortalStat({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'purple' | 'lime' | 'sky'
}) {
  const colors: Record<'purple' | 'lime' | 'sky', string> = {
    purple: 'text-accent-purple',
    lime: 'text-accent-lime',
    sky: 'text-accent-sky',
  }
  return (
    <div className="bg-surface-1 border border-subtle rounded-[24px] p-6 text-center space-y-2">
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">{label}</p>
      <div className="flex items-baseline justify-center gap-1">
        <p className={`font-display text-2xl font-black italic uppercase ${colors[color]}`}>{value}</p>
        {sub && <span className="text-[10px] font-bold text-text-muted uppercase">{sub}</span>}
      </div>
    </div>
  )
}

function InfoStep({ number, text }: { number: string, text: string }) {
  return (
    <li className="flex gap-4 group">
      <span className="font-display text-xl font-black italic text-accent-purple/40 group-hover:text-accent-purple transition-colors">{number}</span>
      <p className="text-sm text-text-muted leading-relaxed pt-1">{text}</p>
    </li>
  )
}
