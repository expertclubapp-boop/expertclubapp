# Expert Club — Implementation Handoff
> Stack alvo: React 18 + TypeScript + Tailwind CSS + Firebase  
> Gerado em: 29/abr/2026 | Versão: 1.0

---

## 1. Telas finais e rotas sugeridas

| # | Tela | Arquivo HTML | Rota | Auth required | Sub required |
|---|------|-------------|------|:---:|:---:|
| 1 | Login | `login.html` | `/login` | ❌ | ❌ |
| 2 | Signup | `signup.html` | `/signup` | ❌ | ❌ |
| 3 | Onboarding — Objetivo | `onboarding_goal.html` | `/onboarding/goal` | ✅ | ❌ |
| 4 | Onboarding — Perfil | `onboarding_profile.html` | `/onboarding/profile` | ✅ | ❌ |
| 5 | Today Dashboard | `today_dashboard.html` | `/today` | ✅ | ✅ |
| 6 | Biblioteca de Treinos | `workouts_library.html` | `/workouts` | ✅ | ✅ |
| 7 | Detalhe do Treino | `workout_detail.html` | `/workouts/:id` | ✅ | ✅ |
| 8 | Execução do Treino | `workout_execution.html` | `/workouts/:id/execute` | ✅ | ✅ |
| 9 | Biblioteca de Dietas | `diets_library.html` | `/diets` | ✅ | ✅ |
| 10 | Detalhe da Dieta | `diet_detail.html` | `/diets/:id` | ✅ | ✅ |
| 11 | Hidratação | `hydration.html` | `/hydration` | ✅ | ✅ |
| 12 | Check-in Diário | `daily_check_in.html` | `/checkin/daily` | ✅ | ✅ |
| 13 | Check-in Semanal | `weekly_check_in.html` | `/checkin/weekly` | ✅ | ✅ |
| 14 | Dashboard de Evolução | `evolution_dashboard.html` | `/evolution` | ✅ | ✅ |
| 15 | Desafios / Ranking | `challenges_ranking.html` | `/challenges` | ✅ | ✅ |
| 16 | Expert Center (Conteúdo) | `expert_center.html` | `/content` | ✅ | ✅ |
| 17 | Comunidade | `community.html` | `/community` | ✅ | ✅ |
| 18 | Perfil & Configurações | `profile_settings.html` | `/profile` | ✅ | ✅ |
| 19 | Bloqueio de Assinatura | `subscription_lock.html` | `/subscription/locked` | ✅ | ❌ |

**Fluxo de autenticação:**
```
/ → (não autenticado) → /login
/ → (autenticado, sem onboarding) → /onboarding/goal
/ → (autenticado, onboarding ok, sub ativa) → /today
/ → (autenticado, sub expired/past_due/cancelled) → /subscription/locked
```

---

## 2. Componentes reutilizáveis

### Componentes de Layout
```
BottomNav            — 5 tabs, estado ativo por rota
TopBar               — logo, avatar, streak, notificação
ScreenWrapper        — padding + pb-nav + bg-primary
SectionLabel         — label de seção uppercase
Divider              — linha sutil entre rows
```

### Componentes de Card
```
Card                 — container padrão (radius-card, surface-1, border)
GlassCard            — card com blur (login, modais)
HeroCard             — card com glow e gradient (treino do dia)
DashedCTACard        — card dashed para check-in
PlanCard             — card de plano ativo (gradient lime)
StreakBadge          — badge de sequência com ícone de fogo
```

### Componentes de Input
```
TextInput            — input escuro com focus sky
TextareaInput        — textarea escuro
InputWithIcon        — TextInput + ícone à esquerda
RangeSlider          — slider com valor e labels
ScaleSelector        — row de botões 0–10 com seleção única
YesNoSelector        — par de botões Sim/Não
PhotoUploadSlot      — slot para upload de foto com label
Toggle               — switch checkbox estilizado
```

### Componentes de Progresso
```
ProgressBar          — barra linear, aceita cor e percentual
ProgressRing         — SVG ring (hidratação), aceita valor/meta/cor
MacroBar             — ProgressBar com label e valor atual/meta
WeeklyBarChart       — 7 barras verticais (histórico semanal)
```

### Componentes de Ação
```
ButtonPrimary        — lime, full-width por padrão
ButtonGhost          — ghost border, full-width por padrão
ButtonGoogle         — OAuth Google com SVG logo
ButtonDestructive    — red, para logout/cancelar
ButtonAddWater       — botão de adicionar ml (hidratação)
RowButton            — row de lista com ícone, label, value, chevron
```

### Componentes de Status
```
PillBadge            — badge colorido (lime/sky/purple/yellow/red)
FilterChip           — chip de filtro com estado selected
DifficultyChip       — chip de dificuldade (weekly check-in)
StatusDot            — dot de status (subscription states)
```

### Componentes Especiais
```
MacroCard            — card de macros com 3 barras (carbs/protein/fat)
WorkoutCard          — card hero do treino do dia
ExerciseRow          — linha de exercício com sets/reps/load
WhatsAppCTA          — card de entrada para comunidade
SubscriptionLockCard — tela de bloqueio com 4 estados
EmptyState           — ícone + título + descrição + CTA opcional
SkeletonCard         — skeleton loading com shimmer
```

---

## 3. Entidades de dados por tela

### Auth / User
```typescript
interface User {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  createdAt: Timestamp
  onboardingComplete: boolean
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'expired' | 'pending'
  subscriptionPlan: 'pro' | 'basic'
  subscriptionRenewAt?: Timestamp
}

interface UserProfile {
  uid: string
  birthDate: string          // ISO date
  height: number             // cm
  initialWeight: number      // kg
  city?: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  goal: 'hypertrophy' | 'fat_loss' | 'endurance' | 'health' | 'strength'
  selectedWorkoutId?: string
  selectedDietId?: string
  waterGoalMl: number        // default 3000
  notificationsEnabled: Record<string, boolean>
}
```

### Treinos
```typescript
interface Workout {
  id: string
  title: string
  objective: 'hypertrophy' | 'fat_loss' | 'endurance' | 'strength'
  level: 'beginner' | 'intermediate' | 'advanced'
  durationMinutes: number
  estimatedKcal: number
  exercises: Exercise[]
  tags: string[]
  publishedAt: Timestamp
}

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string       // "8-12" ou "10"
  load?: string      // "70% 1RM" ou "20kg"
  restSeconds: number
  rpe?: number
  videoUrl?: string
  muscleGroups: string[]
}

interface WorkoutLog {
  id: string
  uid: string
  workoutId: string
  startedAt: Timestamp
  completedAt?: Timestamp
  setsCompleted: SetLog[]
  xpEarned: number
}

interface SetLog {
  exerciseId: string
  setNumber: number
  reps: number
  loadKg: number
  rpe?: number
}
```

### Dietas
```typescript
interface Diet {
  id: string
  title: string
  objective: 'hypertrophy' | 'fat_loss' | 'maintenance'
  totalKcal: number
  macros: { carbs: number; protein: number; fat: number }  // gramas
  meals: Meal[]
  tags: string[]
}

interface Meal {
  id: string
  name: string          // "Café da manhã"
  timeLabel?: string    // "07:00"
  foods: FoodItem[]
}

interface FoodItem {
  name: string
  amount: string        // "150g"
  kcal: number
  substitutes?: string[]
}
```

### Hidratação
```typescript
interface HydrationLog {
  id: string
  uid: string
  date: string           // YYYY-MM-DD
  entries: WaterEntry[]
  totalMl: number
  goalMl: number
  goalMet: boolean
}

interface WaterEntry {
  ml: number
  timestamp: Timestamp
  label?: string         // "Garrafa", "Copo"
}
```

### Check-ins
```typescript
interface DailyCheckIn {
  id: string
  uid: string
  date: string
  trained: boolean
  dietFollowed: boolean
  waterGoalMet: boolean
  sleepHours: number
  energyLevel: number    // 1-10
  hungerLevel: number    // 1-10
  moodLevel: number      // 1-10
  sorenessLevel: number  // 1-10
  notes?: string
  xpEarned: number
}

interface WeeklyCheckIn {
  id: string
  uid: string
  weekNumber: number     // ISO week
  year: number
  weightKg: number
  waistCm: number
  absomenCm: number
  hipCm: number
  photoUrls: { front?: string; back?: string; side?: string; extra?: string }
  workoutsCompleted: number   // 0-7+
  dietDaysFollowed: number    // 0-7
  waterGoalDays: number       // 0-7
  cardioCompleted: boolean
  avgSleepHours: number
  avgHungerLevel: number
  mainDifficulty: string
  weeklyWin: string
  observations?: string
  xpEarned: number
}
```

### Evolução
```typescript
interface EvolutionSnapshot {
  uid: string
  date: string
  weightKg: number
  waistCm?: number
  absomenCm?: number
  hipCm?: number
  bodyFatPct?: number
}

interface UserStats {
  uid: string
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  totalCheckIns: number
  totalXP: number
  level: number
  challengesCompleted: number
}
```

### Desafios
```typescript
interface Challenge {
  id: string
  title: string
  description: string
  type: 'weekly' | 'monthly'
  xpReward: number
  requirements: ChallengeRequirement[]
  startDate: Timestamp
  endDate: Timestamp
}

interface ChallengeParticipation {
  uid: string
  challengeId: string
  joinedAt: Timestamp
  progress: number       // 0-100
  completedAt?: Timestamp
  xpEarned: number
}
```

---

## 4. Estados de loading / empty / error por tela

| Tela | Loading | Empty state | Error state |
|------|---------|-------------|-------------|
| Today Dashboard | Skeleton de cards | "Seu dia começa aqui" + CTA check-in | Banner de reconexão |
| Workouts Library | Skeleton grid 2-col | "Nenhum treino disponível" | Retry button |
| Workout Detail | Skeleton linear | — | Retry + voltar |
| Workout Execution | Spinner no load inicial | — | Salvar localmente + retry |
| Diets Library | Skeleton grid | "Nenhuma dieta disponível" | Retry |
| Diet Detail | Skeleton | — | Retry + voltar |
| Hydration | Spinner | Estado inicial zerado (0ml) | Salvar localmente |
| Daily Check-in | — | — | Toast de erro + retry |
| Weekly Check-in | — | — | Toast de erro + retry |
| Evolution | Skeleton de gráfico | "Nenhum dado ainda" + CTA check-in | Retry |
| Challenges | Skeleton grid | "Nenhum desafio ativo" | Retry |
| Expert Center | Skeleton grid | "Em breve" | Retry |
| Community | Spinner | "Grupo sendo configurado" | Retry |
| Profile | Skeleton de hero | — | Toast |
| Subscription Lock | — | — | Retry Stripe |

---

## 5. Ações principais por tela

### Today Dashboard
- `loadTodayPlan()` — busca treino + dieta do dia do usuário
- `navigateToWorkout(workoutId)` — abre detalhe do treino
- `navigateToDailyCheckIn()` — abre check-in diário
- `openWhatsAppGroup()` — deep link WhatsApp com número configurado
- `dismissCard(cardType)` — oculta card já concluído

### Workout Execution
- `startWorkout(workoutId)` — cria WorkoutLog, salva timestamp
- `logSet(setData)` — persiste set individualmente (offline-first)
- `completeWorkout()` — finaliza log, soma XP, atualiza streak
- `pauseWorkout()` — salva estado local, permite retomar
- `cancelWorkout()` — descarta log ou salva parcial

### Hydration
- `addWater(ml)` — adiciona entrada, atualiza total e ring
- `removeEntry(entryId)` — remove entrada do log do dia
- `updateGoal(ml)` — atualiza meta diária no UserProfile
- `checkGoalAchieved()` — dispara notificação/XP se 100%

### Daily Check-in
- `submitDailyCheckIn(data)` — persiste no Firestore, soma XP, atualiza streak
- `checkAlreadySubmittedToday()` — bloqueia duplo check-in

### Weekly Check-in
- `submitWeeklyCheckIn(data)` — persiste, soma XP, dispara badge se evolução
- `uploadPhoto(file, angle)` — faz upload para Storage, salva URL
- `getPreviousWeekData()` — carrega última semana para exibir delta

### Subscription Lock
- `handleRenew()` — abre checkout Stripe (redirect ou webview)
- `openSupportWhatsApp()` — deep link com número de suporte
- `checkSubscriptionStatus()` — polling a cada 30s para detectar ativação

---

## 6. Prioridade de implementação

### Fase 1 — Core (MVP, semana 1–2)
```
1. Login + Signup (Firebase Auth)
2. Onboarding goal + profile (salvar UserProfile)
3. Today Dashboard (estático, dados mock)
4. Workout Library + Detail
5. Workout Execution (log básico, sem offline)
6. Bottom Navigation
7. Subscription Lock (interceptar rota)
```

### Fase 2 — Check-ins & Evolução (semana 3–4)
```
8. Daily Check-in (completo, XP)
9. Weekly Check-in (completo, upload foto)
10. Hydration Tracker (completo, ring animado)
11. Evolution Dashboard (gráfico peso, medidas)
12. Profile & Settings (completo)
```

### Fase 3 — Gamificação & Conteúdo (semana 5–6)
```
13. Challenges / Ranking (XP, leaderboard)
14. Expert Center (conteúdo, vídeos)
15. Community (links externos, feed)
16. Notificações push (Firebase Messaging)
17. Offline-first (workout execution + check-ins)
```

### Fase 4 — Billing & Afiliados (semana 7+)
```
18. Stripe integration (checkout, webhook)
19. Subscription management
20. Affiliate tracking
21. Admin panel (separado)
```

---

## 7. Responsividade

**Abordagem:** Mobile-first. Design otimizado para 375–430px.

```
Breakpoints:
  mobile:  375px–430px  (design base)
  tablet:  768px         (ajuste de grid, padding)
  desktop: 1280px        (max-width 480px centrado, resto é fundo)

Regras:
- Bottom nav: sempre fixed, pb-safe para safe-area-inset
- Cards: width 100%, max-width 480px em desktop
- Inputs: mínimo 44px de altura (touch target)
- Botões: mínimo 48px de altura
- Textos: nunca abaixo de 12px
- Imagens: object-fit: cover sempre
```

**Gestos mobile esperados:**
- Swipe left/right em workout execution (próximo/anterior exercício)
- Pull-to-refresh em Today Dashboard e Libraries
- Tap e hold em cards de exercício para ver substituições

---

## 8. Critérios de aceite por tela

### Login / Signup
- [ ] Login com email/senha funcional (Firebase Auth)
- [ ] Login com Google funcional (Firebase OAuth)
- [ ] Signup cria usuário + documento `users/{uid}`
- [ ] Redirect correto pós-auth (onboarding ou today)
- [ ] Esqueci minha senha envia e-mail
- [ ] Validações de campo com mensagens inline
- [ ] Estados de loading durante submit

### Onboarding
- [ ] Objetivo salvo em `users/{uid}.goal`
- [ ] Perfil completo salvo em `userProfiles/{uid}`
- [ ] `onboardingComplete: true` após último step
- [ ] Não exibe onboarding se já completo

### Today Dashboard
- [ ] Treino do dia baseado no treino selecionado pelo usuário
- [ ] Check-in diário marcado como feito se já submetido hoje
- [ ] Streak atualizado em tempo real
- [ ] CTA WhatsApp abre número configurado
- [ ] 7 cards visíveis: treino, dieta, hidratação, check-in, missão, desafio, live

### Workout Execution
- [ ] Séries registradas com sets, reps e carga
- [ ] Timer de descanso funcional e configurável
- [ ] XP somado ao completar
- [ ] Streak incrementado ao completar primeiro treino do dia
- [ ] Estado salvo localmente em caso de fechamento acidental

### Hydration
- [ ] Total persistido por dia (`hydrationLogs/{uid}/{date}`)
- [ ] Ring animado reflete total em tempo real
- [ ] Goal achieved state exibe ao atingir 100%
- [ ] Streak de água atualizado corretamente
- [ ] Histórico semanal busca últimos 7 dias

### Daily Check-in
- [ ] Impede duplo check-in no mesmo dia
- [ ] Todos os 9 campos registrados
- [ ] XP somado (+10 por check-in)
- [ ] Streak atualizado

### Weekly Check-in
- [ ] Upload de fotos para Firebase Storage com paths estruturados
- [ ] Deltas calculados vs. semana anterior
- [ ] XP somado (+20 por check-in semanal)
- [ ] Disponível apenas uma vez por semana (segunda a domingo)

### Subscription Lock
- [ ] Intercepta todas as rotas protegidas por sub (lista da tabela acima)
- [ ] Exibe estado correto baseado em `subscriptionStatus`
- [ ] "Regularizar" redireciona para checkout Stripe
- [ ] Polling ou webhook atualiza estado ao reativar

---

## 9. Variáveis de ambiente necessárias

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=          # apenas backend/functions
STRIPE_WEBHOOK_SECRET=      # apenas backend/functions

# App
VITE_WHATSAPP_SUPPORT_NUMBER=+5511999999999
VITE_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/...
VITE_APP_VERSION=2.5.0
```

---

## 10. Estrutura de pastas sugerida (React)

```
src/
  components/
    layout/
      BottomNav.tsx
      TopBar.tsx
      ScreenWrapper.tsx
    cards/
      Card.tsx
      GlassCard.tsx
      HeroCard.tsx
      WorkoutCard.tsx
      MacroCard.tsx
    inputs/
      TextInput.tsx
      RangeSlider.tsx
      ScaleSelector.tsx
      YesNoSelector.tsx
      Toggle.tsx
      PhotoUploadSlot.tsx
    progress/
      ProgressBar.tsx
      ProgressRing.tsx
      WeeklyBarChart.tsx
    ui/
      PillBadge.tsx
      FilterChip.tsx
      RowButton.tsx
      StreakBadge.tsx
      EmptyState.tsx
      SkeletonCard.tsx
      ButtonPrimary.tsx
      ButtonGhost.tsx
  screens/
    auth/
      LoginScreen.tsx
      SignupScreen.tsx
    onboarding/
      GoalScreen.tsx
      ProfileScreen.tsx
    today/
      TodayScreen.tsx
    workouts/
      WorkoutsLibraryScreen.tsx
      WorkoutDetailScreen.tsx
      WorkoutExecutionScreen.tsx
    diets/
      DietsLibraryScreen.tsx
      DietDetailScreen.tsx
    hydration/
      HydrationScreen.tsx
    checkin/
      DailyCheckInScreen.tsx
      WeeklyCheckInScreen.tsx
    evolution/
      EvolutionScreen.tsx
    challenges/
      ChallengesScreen.tsx
    content/
      ExpertCenterScreen.tsx
    community/
      CommunityScreen.tsx
    profile/
      ProfileScreen.tsx
    subscription/
      SubscriptionLockScreen.tsx
  hooks/
    useAuth.ts
    useUserProfile.ts
    useWorkouts.ts
    useDiets.ts
    useHydration.ts
    useCheckIn.ts
    useEvolution.ts
    useChallenges.ts
    useSubscription.ts
    useXP.ts
  services/
    firebase.ts
    auth.service.ts
    firestore.service.ts
    storage.service.ts
    stripe.service.ts
  store/
    auth.store.ts
    user.store.ts
    workout.store.ts
  types/
    user.types.ts
    workout.types.ts
    diet.types.ts
    checkin.types.ts
  utils/
    date.utils.ts
    xp.utils.ts
    hydration.utils.ts
  router/
    AppRouter.tsx
    ProtectedRoute.tsx
    SubscriptionGuard.tsx
```

---

*Expert Club Implementation Handoff v1.0 — 29/abr/2026*
