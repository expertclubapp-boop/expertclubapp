import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function promote() {
  const adminUid = 'ORqR86Zn2IXNfuxNHYc2Rr03DF42';
  const studentUid = 'q9qzBNVh93Pb0ujhEv4q83rTFZ73';
  const qatesterUid = 'bMR2bRc5pmf1PlY2X06BJmoVqdg2';

  // Promote qatester to admin for easier login
  await updateDoc(doc(db, 'users', qatesterUid), { role: 'admin' });
  console.log('✅ qatester promoted to admin');

  // Activate student
  await updateDoc(doc(db, 'subscriptions', studentUid), { status: 'active' });
  console.log('✅ aluno.ativo subscription activated');

  // Activate qatester subscription too just in case
  await setDoc(doc(db, 'subscriptions', qatesterUid), { 
    uid: qatesterUid,
    status: 'active',
    planId: 'founder',
    planName: 'Expert Club Fundador',
    price: 49,
    currency: 'BRL',
    interval: 'monthly',
    startedAt: new Date().toISOString(),
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000).toISOString()
  }, { merge: true });
  console.log('✅ qatester subscription activated');

  process.exit(0);
}

promote().catch(console.error);
