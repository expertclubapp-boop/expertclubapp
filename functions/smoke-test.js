const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'expertcoaching-b91e2'
  });
}

const db = admin.firestore();
const TEST_USER_ID = '0jzqCj387KQsdXXZD8TsucW3H1G3';

async function runSmokeTest() {
  console.log('--- STARTING SMOKE TEST ---');

  // 1. Content Published
  console.log('1. Publishing test content...');
  const contentRef = db.collection('content').doc('smoke_test_content');
  await contentRef.set({
    title: 'Aula de Teste Smoke',
    status: 'draft',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await contentRef.update({ status: 'published' });

  // 2. Challenge Published
  console.log('2. Publishing test challenge...');
  const challengeRef = db.collection('challenges').doc('smoke_test_challenge');
  await challengeRef.set({
    title: 'Desafio Smoke 30 Dias',
    status: 'draft',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await challengeRef.update({ status: 'published' });

  // 3. Badge Earned
  console.log('3. Awarding test badge...');
  const badgeRef = db.collection(`users/${TEST_USER_ID}/earnedBadges`).doc('smoke_test_badge');
  await badgeRef.set({
    name: 'Pioneiro Smoke',
    earnedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 4. XP Earned
  console.log('4. Updating test XP...');
  const participantRef = db.collection(`challenges/smoke_test_challenge/participants`).doc(TEST_USER_ID);
  await participantRef.set({
    uid: TEST_USER_ID,
    xpTotal: 100,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await participantRef.update({ xpTotal: 250 });

  // 5. Official Post
  console.log('5. Creating official community post...');
  const postRef = db.collection('community_posts').doc('smoke_test_official');
  await postRef.set({
    content: 'Este é um comunicado oficial de teste smoke.',
    isOfficial: true,
    status: 'published',
    authorId: 'admin_test',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 6. Comment Reply
  console.log('6. Testing comment reply...');
  const userPostRef = db.collection('community_posts').doc('smoke_user_post');
  await userPostRef.set({
    content: 'Meu post para receber resposta',
    authorId: TEST_USER_ID,
    status: 'published',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  const commentRef = db.collection(`community_posts/smoke_user_post/comments`).doc('smoke_test_comment');
  await commentRef.set({
    content: 'Bela postagem!',
    authorId: 'other_user_id',
    authorName: 'Visitante Smoke',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('--- SMOKE TEST DATA INJECTED ---');
  console.log('Waiting 10 seconds for triggers to fire and broadcast...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('Checking notifications for user:', TEST_USER_ID);
  const notifsSnap = await db.collection(`users/${TEST_USER_ID}/notifications`).get();
  console.log(`Found ${notifsSnap.size} notifications total for this user.`);
  
  // Sort by createdAt (manual because we don't have indexes for this query yet maybe?)
  const docs = notifsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  docs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  docs.slice(0, 10).forEach(n => {
    console.log(`- [${n.type}] ${n.title}: ${n.body}`);
  });

  console.log('--- SMOKE TEST COMPLETE ---');
}

runSmokeTest().catch(console.error);
