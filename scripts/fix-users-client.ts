import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('Using project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUser(uid, role) {
  console.log(`Fixing user: ${uid} as ${role}...`);
  
  // Force User Role
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { role, subscriptionStatus: 'active', onboardingComplete: true }, { merge: true });
  
  // Force Subscription
  const subRef = doc(db, 'subscriptions', uid);
  await setDoc(subRef, {
    uid,
    status: 'active',
    planId: 'founder',
    planName: 'Expert Club Fundador',
    provider: 'manual'
  }, { merge: true });
  
  // Check if it worked
  const check = await getDoc(subRef);
  console.log(`Verified status for ${uid}:`, check.data()?.status);
}

async function run() {
  try {
    await fixUser('6vCkv26kp4PNtvW9QhLZ7VJTQ7B3', 'admin');
    await fixUser('1qvkudqmK6Wg42ebVIYEc5nKDL43', 'member');
    console.log('✅ ALL DONE!');
    process.exit(0);
  } catch (e) {
    console.error('❌ ERROR:', e);
    process.exit(1);
  }
}

run();
