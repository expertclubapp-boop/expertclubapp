import type { User, UserStats } from '../types/user.types'
import type { TodayDashboardData } from '../types/dashboard.types'

export const mockUser: User = {
  uid: 'mock-user-001',
  displayName: 'Rubens',
  email: 'rubens@expertclub.com',
  photoURL: undefined,
  role: 'member',
  createdAt: '2025-12-01T00:00:00Z',
  onboardingCompleted: true,
  onboardingComplete: true,
  subscriptionStatus: 'active',
  subscriptionPlan: 'pro',
  subscriptionRenewAt: '2026-06-01T00:00:00Z',
}

export const mockStats: UserStats = {
  uid: 'mock-user-001',
  currentStreak: 8,
  longestStreak: 21,
  totalWorkouts: 147,
  totalCheckIns: 89,
  totalXP: 4580,
  level: 12,
  challengesCompleted: 5,
}

export const mockTodayData: TodayDashboardData = {
  userName: 'Rubens',
  greeting: 'Bom dia',
  date: 'Seg, 29 abr',
  streak: 8,
  workout: {
    id: 'workout-001',
    title: 'Lower Body Power & Hypertrophy',
    objective: 'hypertrophy',
    level: 'intermediate',
    durationMinutes: 55,
    estimatedKcal: 2400,
    exerciseCount: 6,
    description:
      'Foco em explosão nos primeiros blocos e volume técnico na cadeia posterior para finalização.',
    tags: ['lower', 'power', 'hypertrophy'],
  },
  diet: {
    id: 'diet-001',
    title: 'Hipertrofia — Alta Proteína',
    objective: 'hypertrophy',
    totalKcal: 2800,
    macros: { carbs: 240, protein: 165, fat: 58 },
    macroTargets: { carbs: 300, protein: 180, fat: 75 },
    tags: ['hipertrofia', 'alta-proteina'],
  },
  hydration: {
    currentMl: 2400,
    goalMl: 3500,
    percentage: 68,
  },
  checkIn: {
    completed: false,
    date: new Date().toISOString().split('T')[0],
  },
  weeklyMission: {
    title: 'Completar 4 treinos de alta intensidade e 30km de cardio total.',
    description: 'Desafio semanal para membros do Expert Club',
    participantCount: 12,
  },
  challenge: {
    id: 'challenge-001',
    title: 'Desafio 30 Dias de Consistência',
    description: 'Complete check-ins diários por 30 dias consecutivos',
    type: 'monthly',
    xpReward: 500,
    progress: 42,
    participantCount: 234,
    daysLeft: 18,
  },
  liveEvent: {
    id: 'live-001',
    title: 'Estratégias de Recuperação Avançada',
    topic: 'Biohacking & Performance',
    time: '19:00 BRT',
    speaker: 'Dr. Ricardo Silva',
    speakerRole: 'Fisiologista do Exercício',
    isLive: false,
    label: 'AO VIVO AMANHÃ',
  },
  community: {
    memberCount: 847,
    whatsappLink: 'https://chat.whatsapp.com/expertclub',
  },
}
