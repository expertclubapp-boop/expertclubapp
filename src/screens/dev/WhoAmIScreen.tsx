import { useAuth } from '../../contexts/AuthContext'
import { PageShell } from '../../components/ui/Premium'
import { getDefaultRouteForUser } from '../../router/utils'

export function WhoAmIScreen() {
  const { user, firebaseUser, isLoading } = useAuth()

  if (isLoading) return <div className="p-10 text-white">Loading Auth...</div>

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="font-display text-h1 text-white uppercase italic mb-8">Debug: Who Am I</h1>
        
        <div className="ec-card rounded-2xl p-6 space-y-6">
          <DebugItem label="Firebase UID" value={firebaseUser?.uid || 'Not Authenticated'} />
          <DebugItem label="Email" value={user?.email || firebaseUser?.email || 'N/A'} />
          <DebugItem label="Role" value={user?.role || 'member (default)'} />
          <DebugItem label="Onboarding Completed" value={user?.onboardingComplete ? 'Yes' : 'No'} />
          <DebugItem label="Subscription Status" value={user?.subscriptionStatus || 'N/A'} />
          <DebugItem label="Default Route" value={getDefaultRouteForUser(user)} />
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-[10px] font-mono text-text-muted break-all">
            {JSON.stringify(user, null, 2)}
          </p>
        </div>
      </div>
    </PageShell>
  )
}

function DebugItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase text-accent-lime tracking-widest">{label}</span>
      <span className="text-sm font-mono text-white bg-black/20 p-2 rounded-lg border border-white/5">{value}</span>
    </div>
  )
}
