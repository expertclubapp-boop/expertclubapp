import { onDocumentCreated, onDocumentWritten, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { notificationService } from './service';
import * as admin from 'firebase-admin';

export const onBadgeEarned = onDocumentCreated('users/{uid}/earnedBadges/{badgeId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const badgeData = snap.data();
  const uid = event.params.uid;
  const badgeId = event.params.badgeId;

  await notificationService.createNotificationOnce({
    workspaceId: 'default', // Assuming single workspace or fetch from user
    userId: uid,
    type: 'badge_unlocked',
    title: 'Nova Conquista Desbloqueada! 🏆',
    body: `Parabéns! Você desbloqueou a conquista: ${badgeData.name || 'Nova Badge'}.`,
    actionUrl: '/app/badges',
    sourceId: badgeId,
    sourceType: 'badge',
    dedupeKey: `badge_unlocked:default:${uid}:${badgeId}`
  });
});

export const onChallengeParticipantUpdated = onDocumentUpdated('challenges/{challengeId}/participants/{uid}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  
  const uid = event.params.uid;
  const challengeId = event.params.challengeId;
  const xpBefore = before.xpTotal || 0;
  const xpAfter = after.xpTotal || 0;
  
  // XP Earned
  if (xpAfter > xpBefore) {
    const xpGained = xpAfter - xpBefore;
    // We create a hash of the current timestamp to group XP if needed, 
    // or just use the current total as dedupe to avoid spamming for same total
    await notificationService.createNotificationOnce({
      workspaceId: 'default',
      userId: uid,
      type: 'xp_earned',
      title: `+${xpGained} XP Recebido! ⚡`,
      body: `Sua participação gerou XP no Expert Club. Continue assim!`,
      actionUrl: '/app/ranking',
      sourceId: challengeId,
      sourceType: 'challenge_participant',
      dedupeKey: `xp_earned:default:${uid}:${challengeId}:${xpAfter}`
    });
  }
  
  // Mission Completed
  const missionsBefore = before.completedMissions || [];
  const missionsAfter = after.completedMissions || [];
  if (missionsAfter.length > missionsBefore.length) {
    // Find the new mission
    const newMissions = missionsAfter.filter((m: string) => !missionsBefore.includes(m));
    for (const missionId of newMissions) {
      await notificationService.createNotificationOnce({
        workspaceId: 'default',
        userId: uid,
        type: 'challenge_mission_completed',
        title: 'Missão Concluída! ✅',
        body: `Você concluiu uma nova missão no desafio!`,
        actionUrl: `/app/challenges/${challengeId}`,
        sourceId: missionId,
        sourceType: 'challenge_mission',
        dedupeKey: `mission_completed:default:${uid}:${challengeId}:${missionId}`
      });
    }
  }
});

export const onContentWritten = onDocumentWritten('content/{contentId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  
  // If deleted, do nothing
  if (!after) return;
  
  const isNowPublished = after.status === 'published';
  const wasPublished = before?.status === 'published';
  
  if (isNowPublished && !wasPublished) {
    const contentId = event.params.contentId;
    await notificationService.createNotificationForUsers({
      workspaceId: 'default',
      type: 'content_published',
      title: 'Nova Aula Disponível! 📚',
      body: `O conteúdo "${after.title}" já está disponível na Expert Club.`,
      actionUrl: `/app/content/${contentId}`,
      sourceId: contentId,
      sourceType: 'content',
      dedupePrefix: `content_published:default:${contentId}`
    });
  }
});

export const onChallengeWritten = onDocumentWritten('challenges/{challengeId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  
  if (!after) return;
  
  const isNowPublished = after.status === 'published';
  const wasPublished = before?.status === 'published';
  
  if (isNowPublished && !wasPublished) {
    const challengeId = event.params.challengeId;
    await notificationService.createNotificationForUsers({
      workspaceId: 'default',
      type: 'challenge_published',
      title: 'Novo Desafio Liberado! 🎯',
      body: `O desafio "${after.title}" está disponível para você participar.`,
      actionUrl: `/app/challenges/${challengeId}`,
      sourceId: challengeId,
      sourceType: 'challenge',
      dedupePrefix: `challenge_published:default:${challengeId}`
    });
  }
});

export const onCommunityPostWritten = onDocumentWritten('community_posts/{postId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  
  if (!after) return;
  
  const isNowOfficialOrPinned = after.isOfficial || after.isPinned;
  const wasOfficialOrPinned = before?.isOfficial || before?.isPinned;
  const isPublished = after.status === 'published';
  
  if (isPublished && isNowOfficialOrPinned && !wasOfficialOrPinned) {
    const postId = event.params.postId;
    // Avoid too long body
    const bodyPreview = after.content ? (after.content.length > 60 ? after.content.substring(0, 60) + '...' : after.content) : 'Confira a nova atualização.';
    
    await notificationService.createNotificationForUsers({
      workspaceId: 'default',
      type: 'official_post',
      title: 'Aviso Oficial da Expert Club 📢',
      body: bodyPreview,
      actionUrl: `/app/community`,
      sourceId: postId,
      sourceType: 'community_post',
      dedupePrefix: `official_post:default:${postId}`
    });
  }
});

export const onCommentCreated = onDocumentCreated('community_posts/{postId}/comments/{commentId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  
  const comment = snap.data();
  const postId = event.params.postId;
  const commentId = event.params.commentId;
  
  const db = admin.firestore();
  const postSnap = await db.collection('community_posts').doc(postId).get();
  
  if (!postSnap.exists) return;
  const post = postSnap.data();
  
  if (!post || !post.authorId) return;
  
  // Don't notify if the user commented on their own post
  if (post.authorId === comment.authorId) return;
  
  await notificationService.createNotificationOnce({
    workspaceId: 'default',
    userId: post.authorId,
    type: 'comment_reply',
    title: 'Novo Comentário no seu Post 💬',
    body: `${comment.authorName} comentou na sua publicação.`,
    actionUrl: `/app/community`,
    sourceId: commentId,
    sourceType: 'community_comment',
    dedupeKey: `comment_reply:default:${post.authorId}:${commentId}`
  });
});
