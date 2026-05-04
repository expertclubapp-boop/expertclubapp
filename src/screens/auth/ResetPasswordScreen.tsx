import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../contexts/AuthContext'
import { getFriendlyAuthError } from '../../lib/firebase/authErrors'

export function ResetPasswordScreen() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await resetPassword(email.trim())
      setSuccessMessage('Enviamos um link de redefinição para o seu e-mail.')
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ec-app-bg flex min-h-screen items-center justify-center px-5 py-10 relative overflow-hidden bg-bg-primary">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-sky/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Badge color="sky" className="mb-4">Senha</Badge>
          <h1 className="font-display text-heading-2 text-text-primary text-center uppercase italic">
            Recupere seu acesso
          </h1>
          <p className="font-body text-body-md text-text-secondary/60 mt-2 text-center font-medium">
            Digite seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <div className="ec-glass-strong p-8 rounded-card">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-ec-violet/10 px-4 py-3 text-sm text-ec-violet">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              icon={<Mail className="h-5 w-5" />}
              required
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full py-5 rounded-2xl"
            >
              Enviar link de recuperação
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link to="/login" className="inline-flex min-h-8 items-center text-accent-sky text-xs font-bold uppercase tracking-widest hover:underline">
              Voltar para login
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  )
}
