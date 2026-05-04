import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function PaymentFailureScreen() {
  const navigate = useNavigate()

  return (
    <div className="ec-app-bg min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="ec-glass-strong max-w-md w-full rounded-3xl p-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <AlertCircle className="w-12 h-12 text-accent-red" />
        </motion.div>

        <h1 className="font-display text-h1 text-white uppercase italic font-black mb-4 leading-none">
          OPS! <span className="text-accent-red">FALHA NO PAGAMENTO</span>
        </h1>
        
        <p className="text-text-muted font-body-md mb-10">
          Não foi possível processar sua cobrança. Verifique os dados do seu cartão ou tente outro método de pagamento.
        </p>

        <div className="space-y-4">
          <Button 
            variant="destructive" 
            className="w-full py-5 text-sm font-black italic uppercase tracking-widest"
            onClick={() => navigate('/app/billing/plans')}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Tentar Novamente
          </Button>
          
          <button 
            onClick={() => navigate('/app/today')}
            className="w-full min-h-8 text-text-muted font-display text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar para o Início
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-[0.3em]">Suporte: contato@expertclub.com.br</p>
        </div>
      </div>
    </div>
  )
}
