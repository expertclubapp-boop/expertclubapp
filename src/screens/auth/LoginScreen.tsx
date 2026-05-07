import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { FormInput } from '../../components/ui/FormInput'
import { useAuth } from '../../contexts/AuthContext'
import { GoogleIcon } from '../../components/icons/GoogleIcon'
import { ExpertLogo } from '../../components/ui/ExpertLogo'
import { getFriendlyAuthError } from '../../lib/firebase/authErrors'

export function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithGoogle, loginWithEmail, isLoading, isFirebaseConfigured } = useAuth()
  const from = (location.state as { from?: { pathname: string; search?: string; hash?: string } } | null)?.from
  const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/app'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false)

  const handleGoogleLogin = async () => {
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

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmittingEmail(true)

    try {
      await loginWithEmail(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error))
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  return (
    <div className="ec-app-bg flex min-h-screen items-center justify-center px-5 py-10 relative overflow-hidden bg-bg-primary">
      {/* Background Glows — Violet */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-ec-violet/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-ec-violet/3 blur-[100px] rounded-full pointer-events-none" />

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <ExpertLogo variant="full" className="h-20 mb-8" />
          <h1 className="font-display text-heading-2 text-text-primary text-center">
            Menos achismo. Mais método.
          </h1>
          <p className="font-body text-body-md text-text-secondary/60 mt-2 text-center font-medium">
            Aulas, desafios, comunidade e evolução por R$49/mês.
          </p>
        </div>

        {/* Benefit Pills */}
        <div className="flex gap-2 justify-center flex-wrap mb-10">
          <Badge color="violet">Aulas</Badge>
          <Badge color="violet">Desafios</Badge>
          <Badge color="violet">Comunidade</Badge>
        </div>

        {/* Login Card */}
        <div className="ec-glass-strong p-8 rounded-card flex flex-col items-center">
           <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Acesse sua conta</p>

          {errorMessage && (
            <div className="mb-5 flex w-full items-start gap-3 rounded-2xl bg-accent-red/10 px-4 py-3 text-left text-sm text-accent-red">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isFirebaseConfigured && (
            <div className="mb-5 flex w-full items-start gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Login temporariamente indisponivel. O deploy esta sem as variaveis do Firebase configuradas.</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="w-full space-y-4">
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
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5" />}
              minLength={6}
              required
            />

            <div className="flex justify-end">
              <Link to="/reset-password" className="min-h-8 text-xs font-bold uppercase tracking-widest text-accent-sky hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingEmail || (isLoading && !isSubmittingGoogle)}
              disabled={!isFirebaseConfigured || !email || password.length < 6 || isSubmittingEmail}
              className="w-full py-5 rounded-2xl"
            >
              Entrar com e-mail
            </Button>
          </form>

          <div className="my-6 flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">ou</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
           
           <Button
            type="button"
            variant="google"
            onClick={handleGoogleLogin}
            isLoading={isSubmittingGoogle}
            disabled={!isFirebaseConfigured}
            icon={<GoogleIcon />}
            className="w-full py-5 rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
          >
            Entrar com Google
          </Button>

          {/* Signup section */}
          <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-4">
            <p className="font-body text-body-sm text-text-muted font-medium">
              Ao entrar você aceita nossos Termos e Privacidade.
            </p>
            <Link to="/signup" state={{ from }} className="inline-flex min-h-8 items-center text-ec-violet text-xs font-bold uppercase tracking-widest hover:underline">
               Criar conta com e-mail →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center">
          <p className="font-display text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">
            Inteligência · Sistema · Evolução
          </p>
        </div>
      </motion.main>
    </div>
  )
}
