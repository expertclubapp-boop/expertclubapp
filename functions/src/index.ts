import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createHmac, timingSafeEqual } from 'crypto';
import { MercadoPagoConfig, Preference, PreApproval } from 'mercadopago';

admin.initializeApp();
const db = admin.firestore();

// Collections constants (matched with paths.ts)
const COLLECTIONS = {
  PLANS: 'plans',
  SUBSCRIPTIONS: 'subscriptions',
  CHECKOUT_SESSIONS: 'checkoutSessions',
  BILLING_EVENTS: 'billingEvents',
  AUDIT_LOGS: 'auditLogs',
  AFFILIATE_ACCOUNTS: 'affiliateAccounts',
  REFERRAL_CODES: 'referralCodes',
  REFERRAL_ATTRIBUTIONS: 'referralAttributions',
  COMMISSION_LEDGER: 'commissionLedger',
  AFFILIATE_PAYOUTS: 'affiliatePayouts',
};

function durationMsForPlan(interval: string, durationMonths?: number): number {
  const months = durationMonths || (
    interval === 'quarterly' ? 3 :
    interval === 'semester' ? 6 :
    interval === 'annual' ? 12 : 1
  )
  return months * 30 * 24 * 60 * 60 * 1000
}

/**
 * Helper to normalize Mercado Pago status to Expert Club status
 */
function normalizeStatus(status: string): string {
  switch (status) {
    case 'authorized':
    case 'active':
    case 'approved':
      return 'active';
    case 'pending':
    case 'in_process':
      return 'pending';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'cancelled';
    case 'expired':
      return 'expired';
    default:
      return 'pending';
  }
}

function verifyMercadoPagoSignature(req: functions.https.Request, resourceId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('MERCADO_PAGO_WEBHOOK_SECRET is not configured.');
    return false;
  }

  const signatureHeader = req.get('x-signature') || '';
  const requestId = req.get('x-request-id') || '';
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.trim().split('=');
      return [key, value];
    })
  );

  const timestamp = parts.ts;
  const received = parts.v1;
  if (!requestId || !timestamp || !received) return false;

  const manifest = `id:${resourceId};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * createMercadoPagoCheckout
 * Creates a preference (one-time) or preapproval (subscription) in Mercado Pago
 */
export const createMercadoPagoCheckout = functions
  .region('southamerica-east1')
  .runWith({ secrets: ['MERCADO_PAGO_ACCESS_TOKEN'] })
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Validate Authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { planId, referralCode, couponCode, source, campaign } = data;
    const uid = context.auth.uid;
    const email = context.auth.token.email;

    // 2. Fetch Plan from Firestore
    const planDoc = await db.collection(COLLECTIONS.PLANS).doc(planId).get();
    if (!planDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Plan not found.');
    }
    const plan = planDoc.data()!;

    if (plan.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'This plan is not active.');
    }

    // 3. Resolve Affiliate from Referral Code (Backend Source of Truth)
    const normalizedReferralCode = typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';
    let affiliateId = null;
    let resolvedCommissionRate = 0.20; // Default

    if (normalizedReferralCode) {
      const refDoc = await db.collection(COLLECTIONS.REFERRAL_CODES).doc(normalizedReferralCode).get();
      if (refDoc.exists) {
        const refData = refDoc.data()!;
        if (refData.status === 'active') {
          // Verify Affiliate Account Status
          const affiliateDoc = await db.collection(COLLECTIONS.AFFILIATE_ACCOUNTS).doc(refData.affiliateId).get();
          if (affiliateDoc.exists && affiliateDoc.data()!.status === 'active') {
            affiliateId = refData.affiliateId;
            resolvedCommissionRate = refData.commissionRate || 0.20;
          }
        }
      }
    }

    // 4. Initialize Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
    });

    const appUrl = (process.env.APP_URL || 'https://expertclub.com.br').replace(/\/$/, '');

    try {
      let checkoutUrl = '';
      let providerPreferenceId = '';
      let providerPreapprovalId = '';

      if (plan.interval === 'monthly') {
        // Create Subscription (PreApproval)
        const preApproval = new PreApproval(client);
        const response = await preApproval.create({
          body: {
            reason: plan.name,
            auto_recurring: {
              frequency: 1,
              frequency_type: 'months',
              transaction_amount: plan.price,
              currency_id: 'BRL',
            },
            back_url: `${appUrl}/billing/success`,
            payer_email: email,
            external_reference: uid,
            status: 'pending',
          },
        });

        checkoutUrl = response.init_point!;
        providerPreapprovalId = response.id!;
      } else {
        // Create One-time payment (Preference) for quarterly/semester/annual
        const preference = new Preference(client);
        const response = await preference.create({
          body: {
            items: [{
              id: planId,
              title: plan.name,
              quantity: 1,
              unit_price: plan.price,
              currency_id: 'BRL',
            }],
            back_urls: {
              success: `${appUrl}/billing/success`,
              failure: `${appUrl}/billing/failure`,
              pending: `${appUrl}/billing/pending`,
            },
            auto_return: 'all',
            external_reference: uid,
          },
        });

        checkoutUrl = response.init_point!;
        providerPreferenceId = response.id!;
      }

      // 5. Create Checkout Session and Attribution in Firestore
      const sessionData = {
        uid,
        planId,
        status: 'pending',
        provider: 'mercadopago',
        amount: plan.price,
        currency: 'BRL',
        checkoutUrl,
        providerPreferenceId,
        providerPreapprovalId,
        planName: plan.name,
        referralCode: affiliateId ? normalizedReferralCode : null,
        affiliateId,
        commissionRate: resolvedCommissionRate,
        couponCode: couponCode || null,
        source: source || null,
        campaign: campaign || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      };

      const sessionRef = await db.collection(COLLECTIONS.CHECKOUT_SESSIONS).add(sessionData);

      // Log/Update Attribution
      if (affiliateId) {
        await db.collection(COLLECTIONS.REFERRAL_ATTRIBUTIONS).add({
          uid,
          affiliateId,
          referralCode: normalizedReferralCode,
          checkoutSessionId: sessionRef.id,
          status: 'pending',
          source: source || null,
          campaign: campaign || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return { checkoutUrl, sessionId: sessionRef.id };
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);
      throw new functions.https.HttpsError('internal', 'Error creating checkout.');
    }
  });

/**
 * mercadoPagoWebhook
 * Handles incoming notifications from Mercado Pago
 */
export const mercadoPagoWebhook = functions
  .region('southamerica-east1')
  .runWith({ secrets: ['MERCADO_PAGO_ACCESS_TOKEN', 'MERCADO_PAGO_WEBHOOK_SECRET'] })
  .https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // 1. Basic validation (MP usually sends type/data.id)
    const { type, data, action } = req.body;
    
    // ACTION check for v2 notifications
    const eventType = type || action;
    const resourceId = String(data?.id || req.query.id || req.query['data.id'] || '');
    const billingEventId = `${eventType || 'event'}_${resourceId}_${action || req.query.action || 'status'}`
      .replace(/[^a-zA-Z0-9_.-]/g, '_');

    if (!resourceId) {
      res.status(400).send('No resource ID found');
      return;
    }

    if (!verifyMercadoPagoSignature(req, resourceId)) {
      console.warn('Rejected Mercado Pago webhook with invalid signature', { resourceId });
      res.status(401).send('Unauthorized');
      return;
    }

    // 2. Idempotency — atomic claim via Firestore transaction (prevents race condition on concurrent retries)
    const eventRef = db.collection(COLLECTIONS.BILLING_EVENTS).doc(billingEventId);
    let claimed = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(eventRef);
      const status = snap.data()?.status as string | undefined;
      // Allow reclaim only if previous attempt explicitly failed (not if processing or processed)
      if (snap.exists && status !== 'failed') return;
      claimed = true;
      tx.set(eventRef, {
        status: 'processing',
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        provider: 'mercadopago',
        resourceId,
        eventType: eventType || 'unknown',
      }, { merge: false });
    });

    if (!claimed) {
      res.status(200).send('Already processed');
      return;
    }

    try {
      let uid = '';
      let status = '';
      let amount = 0;
      let providerPreferenceId = '';
      let providerPreapprovalId = '';

      // Handle different resource types
      if (eventType === 'payment') {
        // Fetch payment details
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
        });
        if (!response.ok) {
          throw new Error(`Mercado Pago payment fetch failed: ${response.status}`);
        }
        const paymentData = await response.json() as any;
        
        uid = paymentData.external_reference;
        status = paymentData.status;
        amount = paymentData.transaction_amount;
        providerPreferenceId = paymentData.preference_id || '';
      } else if (eventType === 'subscription' || eventType === 'preapproval') {
        const response = await fetch(`https://api.mercadopago.com/v1/preapproval/${resourceId}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
        });
        if (!response.ok) {
          throw new Error(`Mercado Pago preapproval fetch failed: ${response.status}`);
        }
        const subData = await response.json() as any;
        uid = subData.external_reference;
        status = subData.status;
        amount = subData.auto_recurring?.transaction_amount || 0;
        providerPreapprovalId = subData.id || resourceId;
      }

      const normalizedStatus = normalizeStatus(status);

      // Try to find checkout session for attribution before deciding the webhook is unlinked.
      let attributionData: any = {};
      let sessionsSnap: admin.firestore.QuerySnapshot | null = null;
      if (providerPreapprovalId) {
        sessionsSnap = await db.collection(COLLECTIONS.CHECKOUT_SESSIONS)
          .where('providerPreapprovalId', '==', providerPreapprovalId)
          .limit(1)
          .get();
      }
      if ((!sessionsSnap || sessionsSnap.empty) && providerPreferenceId) {
        sessionsSnap = await db.collection(COLLECTIONS.CHECKOUT_SESSIONS)
          .where('providerPreferenceId', '==', providerPreferenceId)
          .limit(1)
          .get();
      }
      if ((!sessionsSnap || sessionsSnap.empty) && uid) {
        sessionsSnap = await db.collection(COLLECTIONS.CHECKOUT_SESSIONS)
          .where('uid', '==', uid)
          .where('status', '==', 'pending')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
      }

      if (sessionsSnap && !sessionsSnap.empty) {
        const session = sessionsSnap.docs[0].data();
        const expectedAmount = Number(session.amount || 0);
        if (normalizedStatus === 'active' && amount > 0 && expectedAmount > 0 && Math.abs(amount - expectedAmount) > 0.01) {
          console.warn('Webhook amount mismatch', {
            resourceId,
            uid: uid || session.uid,
            amount,
            expectedAmount,
          });
          await eventRef.update({ status: 'processed', processedAt: new Date().toISOString(), note: 'amount_mismatch' });
          res.status(200).send('Processed (Amount mismatch)');
          return;
        }

        uid = uid || session.uid;
        attributionData = {
          affiliateId: session.affiliateId || null,
          referralCode: session.referralCode || null,
          source: session.source || null,
          campaign: session.campaign || null,
          commissionRate: session.commissionRate || 0.20,
          planId: session.planId,
          planName: session.planName || 'Expert Club Plan',
          checkoutSessionId: sessionsSnap.docs[0].id,
        };

        // Mark session as converted if successful
        if (normalizedStatus === 'active') {
          await sessionsSnap.docs[0].ref.update({
            status: 'converted',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          const attrSnap = await db.collection(COLLECTIONS.REFERRAL_ATTRIBUTIONS)
            .where('checkoutSessionId', '==', sessionsSnap.docs[0].id)
            .get();
          for (const doc of attrSnap.docs) {
            await doc.ref.update({ status: 'converted', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          }

          if (attributionData.referralCode) {
            await db.collection(COLLECTIONS.REFERRAL_CODES).doc(attributionData.referralCode).update({
              usageCount: admin.firestore.FieldValue.increment(1)
            });
          }
        }
      }

      if (normalizedStatus === 'active' && (!sessionsSnap || sessionsSnap.empty)) {
        console.warn('Active Mercado Pago event without matching checkout session', { resourceId, uid });
        await eventRef.update({ status: 'processed', processedAt: new Date().toISOString(), note: 'no_checkout_session' });
        res.status(200).send('Processed (No matching checkout)');
        return;
      }

      if (!uid) {
        console.warn('Webhook received but no UID found for resource:', resourceId);
        await eventRef.update({ status: 'processed', processedAt: new Date().toISOString(), note: 'no_uid' });
        res.status(200).send('Processed (No UID)');
        return;
      }

      // 4. Update Subscription
      const subRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(uid);
      const existingSubscription = await subRef.get();
      const existingData = existingSubscription.exists ? existingSubscription.data() || {} : {};
      const nowIso = new Date().toISOString();
      let planData: any = {};
      if (attributionData.planId) {
        const planSnap = await db.collection(COLLECTIONS.PLANS).doc(attributionData.planId).get();
        planData = planSnap.exists ? planSnap.data() || {} : {};
      }

      const resolvedInterval = planData.interval || existingData.interval || 'monthly';
      const periodMs = durationMsForPlan(resolvedInterval, planData.durationMonths);
      const nextPeriodEndIso = new Date(Date.now() + periodMs).toISOString();

      await subRef.set({
        uid,
        planId: attributionData.planId || existingData.planId || 'founder',
        planName: attributionData.planName || existingData.planName || planData.name || 'Expert Club Fundador',
        planTier: planData.tier || existingData.planTier || null,
        status: normalizedStatus,
        provider: 'mercadopago',
        providerSubscriptionId: providerPreapprovalId || providerPreferenceId || existingData.providerSubscriptionId || null,
        providerPreapprovalId: providerPreapprovalId || existingData.providerPreapprovalId || null,
        checkoutSessionId: attributionData.checkoutSessionId || existingData.checkoutSessionId || null,
        price: amount || existingData.price || planData.price || 49,
        currency: 'BRL',
        interval: resolvedInterval,
        startedAt: existingData.startedAt || nowIso,
        currentPeriodStart: normalizedStatus === 'active' ? nowIso : existingData.currentPeriodStart || nowIso,
        currentPeriodEnd: normalizedStatus === 'active' ? nextPeriodEndIso : existingData.currentPeriodEnd || nextPeriodEndIso,
        renewalDate: normalizedStatus === 'active' ? nextPeriodEndIso : existingData.renewalDate || null,
        updatedAt: nowIso,
        createdAt: existingData.createdAt || nowIso,
        ...attributionData
      }, { merge: true });

      // 5. Mark Billing Event as processed with full details
      await eventRef.set({
        status: 'processed',
        provider: 'mercadopago',
        providerEventId: resourceId,
        idempotencyKey: billingEventId,
        eventType,
        uid,
        rawStatus: status,
        normalizedStatus,
        amount,
        currency: 'BRL',
        processedAt: new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        rawPayload: req.body,
      }, { merge: true });

      // 6. Generate Commission Ledger Entry if approved
      if (normalizedStatus === 'active' && attributionData.affiliateId) {
        const commissionId = `comm_${billingEventId}`;
        const commDoc = await db.collection(COLLECTIONS.COMMISSION_LEDGER).doc(commissionId).get();
        const affiliateDoc = await db.collection(COLLECTIONS.AFFILIATE_ACCOUNTS).doc(attributionData.affiliateId).get();
        const affiliateIsActive = affiliateDoc.exists && affiliateDoc.data()?.status === 'active';
        
        if (!commDoc.exists && affiliateIsActive) {
          const commissionAmount = Number((amount * attributionData.commissionRate).toFixed(2));
          
          await db.collection(COLLECTIONS.COMMISSION_LEDGER).doc(commissionId).set({
            affiliateId: attributionData.affiliateId,
            uid,
            billingEventId,
            subscriptionId: uid,
            checkoutSessionId: attributionData.checkoutSessionId || null,
            referralCode: attributionData.referralCode || null,
            planId: attributionData.planId || null,
            planName: attributionData.planName || null,
            grossAmount: amount,
            commissionRate: attributionData.commissionRate,
            commissionAmount,
            currency: 'BRL',
            status: 'approved',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            isDemo: false
          });

          await db.collection(COLLECTIONS.AFFILIATE_ACCOUNTS).doc(attributionData.affiliateId).update({
            pendingCommission: admin.firestore.FieldValue.increment(commissionAmount),
            totalCommission: admin.firestore.FieldValue.increment(commissionAmount),
            activeSubscriptionsCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook Error:', error);
      try {
        await eventRef.update({
          status: 'failed',
          failedAt: new Date().toISOString(),
          error: String(error),
        });
      } catch (updateErr) {
        console.error('Failed to mark billing event as failed:', updateErr);
      }
      res.status(500).send('Internal Server Error');
    }
  });
export * from './notifications';
export * from './scheduled';
