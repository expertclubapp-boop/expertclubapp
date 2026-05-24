export const referralUtils = {
  captureReferralParams(): void {
    const params = new URLSearchParams(window.location.search)
    
    const referralCode = params.get('ref')
    const couponCode = params.get('coupon')
    const source = params.get('utm_source') || params.get('source')
    const campaign = params.get('utm_campaign') || params.get('campaign')

    if (referralCode) localStorage.setItem('referralCode', referralCode)
    if (couponCode) localStorage.setItem('couponCode', couponCode)
    if (source) localStorage.setItem('referralSource', source)
    if (campaign) localStorage.setItem('referralCampaign', campaign)

  },

  getStoredReferral(): { referralCode?: string, couponCode?: string, source?: string, campaign?: string } {
    return {
      referralCode: localStorage.getItem('referralCode') || undefined,
      couponCode: localStorage.getItem('couponCode') || undefined,
      source: localStorage.getItem('referralSource') || undefined,
      campaign: localStorage.getItem('referralCampaign') || undefined
    }
  },

  clearStoredReferral(): void {
    localStorage.removeItem('referralCode')
    localStorage.removeItem('couponCode')
    localStorage.removeItem('referralSource')
    localStorage.removeItem('referralCampaign')
  }
}
