import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

async function seed() {
  console.log('🚀 Seeding Foods & Exercises Catalog...');

  const foods = [
    { id: 'ovo', name: 'Ovo Inteiro', category: 'protein', basePortion: { amount: 1, unit: 'unit', label: '1 ovo' }, macrosPerBasePortion: { calories: 70, protein: 6, carbs: 0.5, fat: 5 }, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'frango', name: 'Peito de Frango Grelhado', category: 'protein', basePortion: { amount: 100, unit: 'g', label: '100g' }, macrosPerBasePortion: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'arroz', name: 'Arroz Integral Cozido', category: 'carbohydrate', basePortion: { amount: 100, unit: 'g', label: '100g' }, macrosPerBasePortion: { calories: 111, protein: 2.6, carbs: 23, fat: 0.9 }, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'batata-doce', name: 'Batata Doce Cozida', category: 'carbohydrate', basePortion: { amount: 100, unit: 'g', label: '100g' }, macrosPerBasePortion: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 }, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'whey', name: 'Whey Protein Isolado', category: 'supplement', basePortion: { amount: 30, unit: 'g', label: '30g' }, macrosPerBasePortion: { calories: 110, protein: 25, carbs: 2, fat: 0.5 }, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'azeite', name: 'Azeite de Oliva', category: 'fat', basePortion: { amount: 13, unit: 'ml', label: '1 colher de sopa' }, macrosPerBasePortion: { calories: 119, protein: 0, carbs: 0, fat: 13.5 }, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  for (const f of foods) {
    await setDoc(doc(db, 'foods', f.id), f);
  }
  console.log('✅ Foods Seeded');

  const exercises = [
    { id: 'supino', name: 'Supino Reto Barra', muscleGroups: ['Peito', 'Tríceps'], equipment: 'barbell', level: 'beginner', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', instructions: 'Deite-se no banco, pegada média, desça a barra até o peito e empurre.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'agachamento', name: 'Agachamento Livre', muscleGroups: ['Quadríceps', 'Glúteo'], equipment: 'barbell', level: 'beginner', videoUrl: 'https://www.youtube.com/watch?v=SW_C1A-rejs', instructions: 'Barra no trapézio, pés na largura dos ombros, desça quebrando a paralela.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'levantamento-terra', name: 'Levantamento Terra', muscleGroups: ['Posterior', 'Costas'], equipment: 'barbell', level: 'intermediate', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', instructions: 'Barra próxima à canela, quadril baixo, suba mantendo as costas seladas.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'puxada-frente', name: 'Puxada Frente', muscleGroups: ['Costas', 'Bíceps'], equipment: 'cable', level: 'beginner', videoUrl: 'https://www.youtube.com/watch?v=lueej7IvL8Y', instructions: 'Puxe a barra em direção ao peito, mantendo o tronco levemente inclinado.', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  for (const e of exercises) {
    await setDoc(doc(db, 'exercises', e.id), e);
  }
  console.log('✅ Exercises Seeded');
  process.exit(0);
}

seed();
