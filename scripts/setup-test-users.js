const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));
const projectIdArg = process.argv.find((arg) => arg.startsWith('--project='));
const projectId = projectIdArg?.split('=')[1] || process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
const environment = process.env.EXPERT_CLUB_FIREBASE_ENV || process.env.FIREBASE_ENV || 'unconfirmed';
const confirmQaProject = args.has('--confirm-qa-project') || process.env.EXPERT_CLUB_CONFIRM_QA_PROJECT === 'true';

if (!projectId) {
  console.error('Missing Firebase project. Run with --project=<projectId> or set FIREBASE_PROJECT_ID/GCLOUD_PROJECT.');
  process.exit(1);
}

if (environment === 'production') {
  console.error('Refusing to write setup data while EXPERT_CLUB_FIREBASE_ENV/FIREBASE_ENV is production.');
  process.exit(1);
}

if (projectId === 'expertcoaching-b91e2' && !confirmQaProject) {
  console.error('Refusing to write setup data to expertcoaching-b91e2 without --confirm-qa-project.');
  process.exit(1);
}

// Initialize with project ID. It might pick up ADC if available.
// If not, this script will fail and we'll ask for a service account key.
admin.initializeApp({
  projectId
});

const db = admin.firestore();

async function setupUsers() {
  const users = [
    {
      uid: '6vCkv26kp4PNtvW9QhLZ7VJTQ7B3',
      data: {
        uid: '6vCkv26kp4PNtvW9QhLZ7VJTQ7B3',
        displayName: 'Admin Expert',
        email: 'admin@expertclub.com.br',
        role: 'admin',
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      },
      profile: {
        uid: '6vCkv26kp4PNtvW9QhLZ7VJTQ7B3',
        experienceLevel: 'intermediate',
        goal: 'hypertrophy',
        waterGoalMl: 2000
      },
      stats: {
        uid: '6vCkv26kp4PNtvW9QhLZ7VJTQ7B3',
        currentStreak: 0,
        totalXP: 0,
        level: 1
      }
    },
    {
      uid: '9Df8S4u4mXvY3qR2nKj7Lh6P0Tg1',
      data: {
        uid: '9Df8S4u4mXvY3qR2nKj7Lh6P0Tg1',
        displayName: 'Mentor Expert',
        email: 'mentor@expertclub.com.br',
        role: 'mentor',
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      },
      profile: {
        uid: '9Df8S4u4mXvY3qR2nKj7Lh6P0Tg1',
        experienceLevel: 'advanced',
        goal: 'hypertrophy',
        waterGoalMl: 2000
      },
      stats: {
        uid: '9Df8S4u4mXvY3qR2nKj7Lh6P0Tg1',
        currentStreak: 0,
        totalXP: 0,
        level: 1
      }
    },
    {
      uid: '1qvkudqmK6Wg42ebVIYEc5nKDL43',
      data: {
        uid: '1qvkudqmK6Wg42ebVIYEc5nKDL43',
        displayName: 'Aluno Ativo',
        email: 'aluno@expertclub.com.br',
        role: 'member',
        mentorId: '9Df8S4u4mXvY3qR2nKj7Lh6P0Tg1',
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      },
      profile: {
        uid: '1qvkudqmK6Wg42ebVIYEc5nKDL43',
        experienceLevel: 'intermediate',
        goal: 'hypertrophy',
        waterGoalMl: 2000
      },
      stats: {
        uid: '1qvkudqmK6Wg42ebVIYEc5nKDL43',
        currentStreak: 0,
        totalXP: 0,
        level: 1
      }
    }
  ];

  for (const user of users) {
    console.log(`Setting up user: ${user.uid} (${user.data.role})...`);
    await db.collection('users').doc(user.uid).set(user.data, { merge: true });
    await db.collection('profiles').doc(user.uid).set(user.profile, { merge: true });
    await db.collection('stats').doc(user.uid).set(user.stats, { merge: true });
    await db.collection('subscriptions').doc(user.uid).set({
      uid: user.uid,
      planId: 'founder',
      planName: 'Expert Club Fundador',
      status: 'active',
      provider: 'manual',
      price: 49,
      currency: 'BRL',
      interval: 'monthly',
      startedAt: new Date().toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`Done for ${user.uid}`);
  }
}

setupUsers()
  .then(() => {
    console.log('Successfully updated all users.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error updating users:', err);
    process.exit(1);
  });
