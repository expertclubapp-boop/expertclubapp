import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase/firebase'

interface CheckoutPayload {
  planId: string
  referralCode?: string
  couponCode?: string
  source?: string
  campaign?: string
}

interface CheckoutResult {
  checkoutUrl: string
  sessionId: string
}

const createCheckoutFn = httpsCallable<CheckoutPayload, CheckoutResult>(
  functions,
  'createMercadoPagoCheckout'
)

export const checkoutService = {
  async createCheckout(payload: CheckoutPayload): Promise<string> {
    const { data } = await createCheckoutFn(payload)
    return data.checkoutUrl
  },
}
