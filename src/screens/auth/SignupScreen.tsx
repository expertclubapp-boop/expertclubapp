import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Lock, Mail, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormInput } from '../../components/ui/FormInput'
import { useAuth } from '../../contexts/AuthContext'
import { GoogleIcon } from '../../components/icons/GoogleIcon'
import { Badge } from '../../components/ui/Badge'
import { getFriendlyAuthError } from '../../lib/firebase/authErrors'

export function SignupScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithGoogle, signupWithEmail } = useAuth()
  const from = (location.state as { from?: { pathname: string; search?: string; hash?: string } } | null)?.from
  const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/app'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false)

  const handleGoogleSignup = async () => {
    setErrorMessage('')
    setIsSubmittingGoogle(true)
    try {
      await loginWithGoogle()
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error))
    } finally {
      setIsSubmittingGoogle(false)
    }
  }

  const handleEmailSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (password.length < 6) {
      setErrorMessage('Use uma senha com pelo menos 6 caracteres.')
      return
    }

    setIsSubmittingEmail(true)
    try {
      await signupWithEmail(email.trim(), password, displayName.trim())
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error))
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  return (
    <div className="ec-app-bg flex min-h-screen items-center justify-center px-5 py-10 relative overflow-hidden bg-bg-primary">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-purple/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Badge color="purple" className="mb-4">NOVA CONTA</Badge>
          <h1 className="font-display text-heading-1 text-text-primary text-center uppercase italic leading-none mb-4">
             Faça parte do <span className="text-ec-violet">Expert Club</span>
          </h1>
          <p className="font-body text-body-md text-text-secondary/60 text-center font-medium">
            Crie sua conta para escolher seu objetivo e começar sua rotina.
          </p>
        </div>

        <div className="ec-glass-strong p-8 rounded-card">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <FormInput
              label="Nome"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              icon={<User className="h-5 w-5" />}
              required
            />
            <FormInput
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              icon={<Mail className="h-5 w-5" />}
              required
            />
            <FormInput
              label="Senha"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              icon={<Lock className="h-5 w-5" />}
              minLength={6}
              required
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingEmail}
              className="w-full py-5 rounded-2xl"
            >
              Criar conta com e-mail
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">ou</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <Button
            variant="google"
            onClick={handleGoogleSignup}
            isLoading={isSubmittingGoogle}
            icon={<GoogleIcon />}
            className="w-full py-5 rounded-2xl"
          >
            Começar com Google
          </Button>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="font-body text-body-sm text-text-muted">
              Já possui uma conta?
            </p>
            <Link to="/login" state={{ from }} className="inline-flex min-h-8 items-center text-accent-sky text-xs font-bold uppercase tracking-widest hover:underline">
              Fazer Login →
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  )
}
