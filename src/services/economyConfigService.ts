/**
 * economyConfigService — Kill switch and feature flags for the economy system.
 *
 * Config is cached for 60s to avoid a Firestore read on every economy operation.
 * Admin panel uses subscribe() to get real-time updates and also invalidates the cache.
 *
 * Usage in services:
 *   await economyConfigService.assertEnabled('payoutsEnabled')
 *   // throws if master switch or feature is off
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase/firebase'

export interface EconomyConfig {
  // Master kill switch — disables everything when false
  economyEnabled: boolean
  // Feature-level switches
  storeEnabled: boolean
  referralsEnabled: boolean
  payoutsEnabled: boolean
  // Safety limits
  maxSinglePayoutBrl: number
  maxDailyPayoutsPerInfluencer: number
  // Shown to users when disabled
  maintenanceMessage: string
  updatedAt: string
  updatedBy: string
}

const DEFAULTS: EconomyConfig = {
  economyEnabled: true,
  storeEnabled: true,
  referralsEnabled: true,
  payoutsEnabled: true,
  maxSinglePayoutBrl: 5000,
  maxDailyPayoutsPerInfluencer: 1,
  maintenanceMessage: '',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
}

const CONFIG_DOC_ID = 'economy'

let cache: { value: EconomyConfig; exp: number } | null = null

function configRef() {
  return doc(db, 'systemConfig', CONFIG_DOC_ID)
}

async function readConfig(): Promise<EconomyConfig> {
  if (cache && cache.exp > Date.now()) return cache.value
  const snap = await getDoc(configRef())
  const value = snap.exists() ? (snap.data() as EconomyConfig) : DEFAULTS
  cache = { value, exp: Date.now() + 60_000 }
  return value
}

function invalidate() {
  cache = null
}

export const economyConfigService = {
  getConfig: readConfig,

  async assertEnabled(feature: 'storeEnabled' | 'referralsEnabled' | 'payoutsEnabled'): Promise<void> {
    const cfg = await readConfig()
    if (!cfg.economyEnabled) {
      throw new Error(cfg.maintenanceMessage || 'Sistema de economia temporariamente indisponível.')
    }
    if (!cfg[feature]) {
      const labels: Record<string, string> = {
        storeEnabled: 'Loja',
        referralsEnabled: 'Indicações',
        payoutsEnabled: 'Saques',
      }
      throw new Error(`${labels[feature] ?? feature} está temporariamente desativado(a). Tente novamente mais tarde.`)
    }
  },

  async updateConfig(
    updates: Partial<Omit<EconomyConfig, 'updatedAt' | 'updatedBy'>>,
    adminUid: string
  ): Promise<void> {
    invalidate()
    const current = await readConfig()
    await setDoc(configRef(), {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid,
    })
  },

  // Real-time subscription for admin panel — also warms cache on update
  subscribe(fn: (cfg: EconomyConfig) => void): () => void {
    return onSnapshot(configRef(), (snap) => {
      const value = snap.exists() ? (snap.data() as EconomyConfig) : DEFAULTS
      cache = { value, exp: Date.now() + 60_000 }
      fn(value)
    })
  },
}
