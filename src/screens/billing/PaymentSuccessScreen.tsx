import { motion } from 'framer-motion'
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function PaymentSuccessScreen() {
  const navigate = useNavigate()

  return (
    <div className="ec-app-bg min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="ec-glass-strong max-w-md w-full rounded-3xl p-10 text-center ec-highlight-ring">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-accent-lime/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-accent-lime" />
        </motion.div>

        <h1 className="font-display text-h1 text-white uppercase italic font-black mb-4 leading-none">
          PAGAMENTO <span className="text-accent-lime">CONFIRMADO!</span>
        </h1>
        
        <p className="text-text-muted font-body-md mb-10">
          Sua assinatura foi processada com sucesso. Em alguns minutos, todo o conteúdo premium será liberado automaticamente.
        </p>

        <div className="space-y-4">
          <Button 
            variant="primary" 
            className="w-full py-5 text-sm font-black italic uppercase tracking-widest"
            onClick={() => navigate('/app/today')}
            icon={<Zap className="w-4 h-4 fill-current" />}
          >
            Acessar Plataforma
          </Button>
          
          <button 
            onClick={() => navigate('/app/billing')}
            className="w-full min-h-8 text-text-muted font-display text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            Ver detalhes da assinatura <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-[0.3em]">Expert Club Platinum</p>
        </div>
      </div>
    </div>
  )
}
