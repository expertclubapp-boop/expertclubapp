import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { mockDiets } from '../src/data/mockDiets';
import { mockWorkouts } from '../src/data/mockWorkouts';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
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
  console.log('🚀 Starting Firestore Seed...');

  // 1. Seed Diets
  console.log('🥗 Seeding Diets...');
  for (const diet of mockDiets) {
    const docRef = doc(db, 'diets', diet.id);
    await setDoc(docRef, {
      ...diet,
      status: 'published',
      isSeed: true,
      source: 'phase3-seed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(` ✅ Seeded Diet: ${diet.title}`);
  }

  // 2. Seed Workouts
  console.log('💪 Seeding Workouts...');
  for (const workout of mockWorkouts) {
    const docRef = doc(db, 'workouts', workout.id);
    await setDoc(docRef, {
      ...workout,
      status: 'published',
      isSeed: true,
      source: 'phase3-seed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(` ✅ Seeded Workout: ${workout.title}`);
  }

  // 3. Seed Badges
  console.log('🏆 Seeding Badges...');
  const badges = [
    {
      id: 'badge-first-checkin',
      title: 'Primeiro Passo',
      description: 'Completou o primeiro check-in diário.',
      icon: '🌱',
      rarity: 'common',
      criteriaType: 'manual',
      criteriaValue: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'badge-consistency-7',
      title: 'Semana Imbatível',
      description: 'Manteve 7 dias de streak no app.',
      icon: '🔥',
      rarity: 'rare',
      criteriaType: 'streak',
      criteriaValue: 7,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'badge-workout-pro',
      title: 'Mestre do Ferro',
      description: 'Completou 50 treinos na plataforma.',
      icon: '🏋️',
      rarity: 'epic',
      criteriaType: 'workout_count',
      criteriaValue: 50,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'badge-challenge-founder',
      title: 'Pioneiro de Desafios',
      description: 'Completou o primeiro desafio mensal do Expert Club.',
      icon: '🥇',
      rarity: 'legendary',
      criteriaType: 'manual',
      criteriaValue: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  for (const badge of badges) {
    await setDoc(doc(db, 'badges', badge.id), badge);
  }
  console.log(' ✅ Seeded Badges');

  // 4. Seed Challenges
  console.log('🏆 Seeding Challenges...');
  const activeChallenge = {
    id: 'challenge-21-days-may-2024',
    title: 'Desafio 21 Dias: Força Total',
    description: 'Transforme seu corpo e sua mente em 21 dias de disciplina absoluta. Treinos, dieta e mindset alinhados para o seu melhor resultado.',
    monthKey: '2024-05',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    theme: 'consistency',
    rules: [
      'Realizar check-in diário antes das 10:00.',
      'Completar pelo menos 5 treinos por semana.',
      'Seguir a dieta com pelo menos 90% de aderência.',
      'Participar das lives semanais de tirar dúvidas.'
    ],
    missions: [
      { id: 'm-checkin', title: 'Check-in Madrugador', description: 'Faça seu check-in antes das 08:00.', points: 100, type: 'checkin' },
      { id: 'm-workout', title: 'Guerreiro do Ferro', description: 'Complete seu treino do dia conforme prescrito.', points: 200, type: 'workout' },
      { id: 'm-diet', title: 'Nutrição de Elite', description: 'Bata todos os macros do dia na dieta.', points: 150, type: 'diet' },
      { id: 'm-hydration', title: 'Hidratação Máxima', description: 'Bata sua meta de água do dia.', points: 50, type: 'hydration' },
      { id: 'm-live', title: 'Mindset de Mestre', description: 'Assista à live semanal de conteúdo.', points: 500, type: 'content' }
    ],
    badges: ['badge-challenge-founder'],
    rankingEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'challenges', activeChallenge.id), activeChallenge);
  console.log(' ✅ Seeded Challenge: Desafio 21 Dias');

  // 5. Seed Content
  console.log('📺 Seeding Content...');
  const contentItems = [
    {
      id: 'content-sq-mech',
      title: 'Mecânica do Agachamento: Dominando o Exercício Base',
      description: 'Nesta aula completa, vamos dissecar a mecânica do agachamento, corrigindo os erros mais comuns que impedem sua evolução e podem causar lesões.',
      category: 'training',
      type: 'youtube',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
      thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600',
      durationMinutes: 24,
      featured: true,
      tags: ['agachamento', 'técnica', 'treino-base'],
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'content-hormones-intro',
      title: 'Eixo Hormonal: O que você precisa saber antes de começar',
      description: 'Entenda como funcionam os principais hormônios anabólicos e como otimizá-los naturalmente através de treino, dieta e descanso.',
      category: 'hormones',
      type: 'youtube',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1576091160550-2173bdd99625?q=80&w=600',
      durationMinutes: 45,
      featured: false,
      tags: ['hormônios', 'fisiologia', 'saúde'],
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'content-diet-macros',
      title: 'Cálculo de Macros: A Matemática do Shape',
      description: 'Aprenda a calcular seus macronutrientes de forma precisa para emagrecimento ou hipertrofia, sem segredos e sem enrolação.',
      category: 'nutrition',
      type: 'youtube',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600',
      durationMinutes: 18,
      featured: true,
      tags: ['dieta', 'macros', 'nutrição'],
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  for (const item of contentItems) {
    await setDoc(doc(db, 'content', item.id), item);
  }
  console.log(' ✅ Seeded Content Items');

  // 6. Seed Community Settings
  console.log('🤝 Seeding Community Settings...');
  const communitySettings = {
    whatsappGroupUrl: 'https://chat.whatsapp.com/expert-club-platinum',
    rules: [
      'Respeito Mútuo: Críticas construtivas são bem-vindas, ofensas não.',
      'Sem Spam: Foco total em performance, treinos e dieta.',
      'Dados Reais: Compartilhe sua evolução com transparência.'
    ],
    supportUrl: 'https://wa.me/5511999999999',
    instagramUrl: 'https://instagram.com/expertclub',
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'settings', 'community'), communitySettings);
  console.log(' ✅ Seeded Community Settings');

  // 7. Seed Plans
  console.log('💳 Seeding Subscription Plans...');
  const plans = [
    {
      id: 'founder',
      name: 'Expert Club Fundador',
      slug: 'founder-plan',
      description: 'Acesso vitalício com as melhores condições de lançamento.',
      price: 49,
      currency: 'BRL',
      interval: 'monthly',
      status: 'active',
      features: ['Todos os Treinos', 'Todas as Dietas', 'Check-ins Ilimitados', 'Comunidade Platinum', 'Suporte Prioritário'],
      isFounderPlan: true,
      trialDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'monthly',
      name: 'Expert Club Mensal',
      slug: 'monthly-plan',
      description: 'Acesso completo renovado mês a mês.',
      price: 97,
      currency: 'BRL',
      interval: 'monthly',
      status: 'active',
      features: ['Todos os Treinos', 'Todas as Dietas', 'Check-ins Ilimitados', 'Comunidade Platinum'],
      isFounderPlan: false,
      trialDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  for (const plan of plans) {
    await setDoc(doc(db, 'plans', plan.id), plan);
  }
  console.log(' ✅ Seeded Subscription Plans');

  console.log('✨ Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
