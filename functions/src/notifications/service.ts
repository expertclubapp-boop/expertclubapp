import * as admin from 'firebase-admin';

// Re-defining domain types for functions scope
export type NotificationType = 
  | "badge_unlocked"
  | "xp_earned"
  | "content_published"
  | "challenge_published"
  | "challenge_mission_completed"
  | "ranking_updated"
  | "official_post"
  | "comment_reply";

export interface CreateNotificationParams {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  sourceId?: string;
  sourceType?: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

// Ensure sanitized URLs
export function sanitizeActionUrl(url: string | undefined, defaultType: NotificationType): string {
  if (!url) return getFallbackUrl(defaultType);
  if (url.startsWith('javascript:') || url.startsWith('data:')) return getFallbackUrl(defaultType);
  if (url.startsWith('http')) return getFallbackUrl(defaultType); // Block external
  if (!url.startsWith('/')) return '/' + url;
  
  // Basic validation that it's an internal route
  const allowedPrefixes = ['/expert-center', '/challenges', '/community', '/ranking', '/badges', '/profile', '/app'];
  const isAllowed = allowedPrefixes.some(prefix => url.startsWith(prefix));
  
  return isAllowed ? url : getFallbackUrl(defaultType);
}

function getFallbackUrl(type: NotificationType): string {
  switch(type) {
    case 'badge_unlocked': return '/app/badges';
    case 'xp_earned': return '/app/ranking';
    case 'content_published': return '/app/content';
    case 'challenge_published': return '/app/challenges';
    case 'challenge_mission_completed': return '/app/challenges';
    case 'official_post': return '/app/community';
    case 'comment_reply': return '/app/community';
    default: return '/app/today';
  }
}

export const notificationService = {
  async createNotificationOnce(params: CreateNotificationParams): Promise<void> {
    const db = admin.firestore();
    const safeUrl = sanitizeActionUrl(params.actionUrl, params.type);
    
    // Hash dedupeKey or use it as ID if safe
    // Replace forbidden characters in doc ID
    const safeDocId = params.dedupeKey.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
    
    const notifRef = db.collection(`users/${params.userId}/notifications`).doc(safeDocId);
    
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(notifRef);
      if (docSnap.exists) {
        // Idempotent: already exists, don't create again
        return;
      }
      
      transaction.set(notifRef, {
        id: safeDocId,
        workspaceId: params.workspaceId,
        userId: params.userId,
        type: params.type,
        title: params.title.substring(0, 100), // Enforce length limit
        body: params.body.substring(0, 300),
        actionUrl: safeUrl,
        sourceId: params.sourceId || null,
        sourceType: params.sourceType || null,
        dedupeKey: params.dedupeKey,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "system",
        metadata: params.metadata || null
      });
    });
  },

  async createNotificationForUsers(
    params: Omit<CreateNotificationParams, 'userId' | 'dedupeKey'> & { dedupePrefix: string },
    limitCount = 1000
  ): Promise<void> {
    const db = admin.firestore();
    
    // For this architecture, all users in the users collection are valid targets for now
    // We fetch users in chunks and use batch writes
    // Note: If workspace isolation is strictly enforced via workspaces/{id}/members, we should query that instead.
    // However, the domain is often flat `users` with `role="member"`
    
    const usersSnap = await db.collection('users')
      .where('role', '==', 'member')
      .limit(limitCount)
      .get();
      
    if (usersSnap.empty) return;
    
    const batches = [];
    let currentBatch = db.batch();
    let opCount = 0;
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const dedupeKey = `${params.dedupePrefix}:${userId}`;
      const safeDocId = dedupeKey.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
      const safeUrl = sanitizeActionUrl(params.actionUrl, params.type);
      
      const notifRef = db.collection(`users/${userId}/notifications`).doc(safeDocId);
      
      currentBatch.set(notifRef, {
        id: safeDocId,
        workspaceId: params.workspaceId,
        userId: userId,
        type: params.type,
        title: params.title.substring(0, 100),
        body: params.body.substring(0, 300),
        actionUrl: safeUrl,
        sourceId: params.sourceId || null,
        sourceType: params.sourceType || null,
        dedupeKey: dedupeKey,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: "system",
        metadata: params.metadata || null
      }, { merge: true }); // Merge true handles idempotency silently without a transaction read
      
      opCount++;
      if (opCount === 450) { // Keep under 500 limit
        batches.push(currentBatch);
        currentBatch = db.batch();
        opCount = 0;
      }
    }
    
    if (opCount > 0) {
      batches.push(currentBatch);
    }
    
    await Promise.all(batches.map(batch => batch.commit()));
    console.log(`Successfully broadcasted notification to ${usersSnap.docs.length} users.`);
  }
}
