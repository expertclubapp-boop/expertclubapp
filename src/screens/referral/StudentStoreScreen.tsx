import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, Coins, CheckCircle, AlertCircle, Clock, Tag, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { storeService } from '../../services/storeService'
import { walletService } from '../../services/walletService'
import { Button } from '../../components/ui/Button'
import {
  DashboardHero,
  FloatingPill,
  GlassCard,
  PageShell,
  SectionHeader,
  StatusBadge,
} from '../../components/ui/Premium'
import type { StoreItem, StoreRedemption, WalletBalance } from '../../types/domain'

export function StudentStoreScreen() {
  const { firebaseUser } = useAuth()
  const [items, setItems] = useState<StoreItem[]>([])
  const [redemptions, setRedemptions] = useState<StoreRedemption[]>([])
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const load = useCallback(async () => {
    if (!firebaseUser) return
    setIsLoading(true)
    try {
      const [storeItems, bal, history] = await Promise.all([
        storeService.getActiveItems(),
        walletService.getBalance(firebaseUser.uid),
        storeService.getUserRedemptions(firebaseUser.uid),
      ])
      setItems(storeItems)
      setBalance(bal)
      setRedemptions(history)
    } catch (err) {
      console.error('Error loading store:', err)
    } finally {
      setIsLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  const handleRedeem = async (item: StoreItem) => {
    if (!firebaseUser) return
    setRedeeming(item.id)
    setFeedback(null)
    try {
      await storeService.redeem({
        userId: firebaseUser.uid,
        storeItemId: item.id,
        accountType: 'student',
      })
      setFeedback({ type: 'success', message: `"${item.title}" resgatado com sucesso!` })
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resgatar item.'
      setFeedback({ type: 'error', message })
    } finally {
      setRedeeming(null)
    }
  }

  const available = balance?.availableBalance ?? 0

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-volt-600/30 border-t-volt-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell className="space-y-6">
      <SectionHeader
        eyebrow="Loja de Créditos"
        title="Troque seus créditos"
        description="Use os créditos que você acumulou por indicações para resgatar benefícios exclusivos."
        tone="violet"
        icon={<ShoppingBag className="h-4 w-4" />}
      />

      {/* Balance hero */}
      <DashboardHero className="min-h-[160px]">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <FloatingPill tone="violet" icon={<Coins className="h-3.5 w-3.5" />}>
              Seu saldo
            </FloatingPill>
            <h2 className="mt-4 font-display text-display-lg font-black text-text-primary leading-none">
              {available.toLocaleString('pt-BR')} créditos
            </h2>
          </div>
          <ShoppingBag className="h-12 w-12 text-volt-600/30" />
        </div>
      </DashboardHero>

      {/* Feedback toast */}
      {feedback && (
        <div className={`flex items-center gap-3 rounded-lg p-4 border ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle className="h-5 w-5 shrink-0" />
            : <AlertCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm">{feedback.message}</p>
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 ? (
        <GlassCard className="rounded-card p-8 flex flex-col items-center gap-3 text-center">
          <ShoppingBag className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            A loja está sendo preparada. Volte em breve!
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <StoreItemCard
              key={item.id}
              item={item}
              availableBalance={available}
              isRedeeming={redeeming === item.id}
              onRedeem={handleRedeem}
              userRedemptions={redemptions.filter((r) => r.storeItemId === item.id && (r.status === 'pending_fulfillment' || r.status === 'fulfilled')).length}
            />
          ))}
        </div>
      )}

      {/* Redemption history */}
      {redemptions.length > 0 && (
        <div>
          <h3 className="text-label-md text-text-secondary mb-3 uppercase tracking-wide">
            Histórico de resgates
          </h3>
          <div className="space-y-2">
            {redemptions.map((r) => (
              <GlassCard key={r.id} className="rounded-card p-4 flex items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt-600/15">
                  <Tag className="h-4 w-4 text-volt-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{r.storeItemTitle}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')} · {r.creditCost} créditos
                  </p>
                </div>
                <RedemptionStatusBadge status={r.status} />
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}

function StoreItemCard({
  item,
  availableBalance,
  isRedeeming,
  onRedeem,
  userRedemptions,
}: {
  item: StoreItem
  availableBalance: number
  isRedeeming: boolean
  onRedeem: (item: StoreItem) => void
  userRedemptions: number
}) {
  const canAfford = availableBalance >= item.creditCost
  const maxReached = item.maxPerUser !== -1 && userRedemptions >= item.maxPerUser
  const isOutOfStock = item.stock !== -1 && item.stock - item.reservedStock <= 0

  const categoryLabel: Record<StoreItem['category'], string> = {
    plan_discount:    'Desconto em plano',
    plan_upgrade:     'Upgrade de plano',
    digital_product:  'Produto digital',
    physical_product: 'Produto físico',
    consultation:     'Mentoria',
    vip_access:       'Acesso VIP',
    challenge_entry:  'Entrada em desafio',
    custom:           'Benefício',
  }

  return (
    <GlassCard className="rounded-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-text-muted uppercase tracking-wide">
            {categoryLabel[item.category]}
          </span>
          <h4 className="mt-1 text-sm font-semibold text-text-primary leading-snug">{item.title}</h4>
        </div>
        {item.fulfillmentType === 'automatic' && (
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400 shrink-0">
            <Zap className="h-2.5 w-2.5" />
            Auto
          </div>
        )}
      </div>

      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{item.description}</p>

      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-volt-400" />
          <span className="font-display text-sm font-black text-volt-400">
            {item.creditCost.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-text-muted">créditos</span>
        </div>

        {isOutOfStock ? (
          <span className="text-xs text-text-muted">Esgotado</span>
        ) : maxReached ? (
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" /> Limite atingido
          </span>
        ) : (
          <Button
            variant={canAfford ? 'primary' : 'ghost'}
            className="text-xs px-3 py-1.5 h-auto"
            onClick={() => onRedeem(item)}
            disabled={!canAfford || isRedeeming}
          >
            {isRedeeming ? 'Resgatando…' : canAfford ? 'Resgatar' : 'Créditos insuficientes'}
          </Button>
        )}
      </div>

      {item.stock !== -1 && (
        <p className="text-[10px] text-text-muted -mt-2">
          {Math.max(0, item.stock - item.reservedStock)} disponíveis
        </p>
      )}
    </GlassCard>
  )
}

function RedemptionStatusBadge({ status }: { status: StoreRedemption['status'] }) {
  const map = {
    pending_fulfillment: { label: 'Aguardando', tone: 'yellow' as const },
    fulfilled:           { label: 'Entregue',   tone: 'green'  as const },
    cancelled:           { label: 'Cancelado',  tone: 'red'    as const },
    reversed:            { label: 'Revertido',  tone: 'red'    as const },
  }
  const { label, tone } = map[status] ?? { label: status, tone: 'neutral' as const }
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
