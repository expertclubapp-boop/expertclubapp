import { motion } from 'framer-motion'
import { Clock, HelpCircle, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function PaymentPendingScreen() {
  const navigate = useNavigate()

  return (
    <div className="ec-app-bg min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="ec-glass-strong max-w-md w-full rounded-3xl p-10 text-center">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 bg-accent-sky/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <Clock className="w-12 h-12 text-accent-sky" />
        </motion.div>

        <h1 className="font-display text-h1 text-white uppercase italic font-black mb-4 leading-none">
          PAGAMENTO em <span className="text-accent-sky">ANÁLISE</span>
        </h1>
        
        <p className="text-text-muted font-body-md mb-10">
          Seu pagamento está sendo processado pelo Mercado Pago. Isso pode levar alguns minutos (ou até 48h para boletos). Avisaremos você assim que for aprovado.
        </p>

        <div className="space-y-4">
          <Button 
            variant="ghost" 
            className="w-full py-5 text-sm font-black italic uppercase tracking-widest border-accent-sky/30 text-accent-sky"
            onClick={() => navigate('/app/billing')}
            icon={<LayoutDashboard className="w-4 h-4" />}
          >
            Ver Billing Dashboard
          </Button>
          
          <button 
            className="w-full min-h-8 text-text-muted font-display text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-3 h-3" /> Falar com Suporte
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-[0.3em]">Obrigado pela paciência.</p>
        </div>
      </div>
    </div>
  )
}
