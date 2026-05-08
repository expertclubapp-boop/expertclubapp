import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { AdminLayout, MentorLayout } from './Layouts'
import { AdminRoute } from './AdminRoute'
import { AffiliateRoute } from './AffiliateRoute'
import { AppRoute } from './AppRoute'
import { MentorRoute } from './MentorRoute'
import { OnboardingRoute } from './OnboardingRoute'
import { PublicRoute } from './PublicRoute'
import { getDefaultRouteForUser, getUserRole } from './utils'

const LoginScreen = lazy(() => import('../screens/auth/LoginScreen').then((m) => ({ default: m.LoginScreen })))
const SignupScreen = lazy(() => import('../screens/auth/SignupScreen').then((m) => ({ default: m.SignupScreen })))
const ResetPasswordScreen = lazy(() => import('../screens/auth/ResetPasswordScreen').then((m) => ({ default: m.ResetPasswordScreen })))
const GoalScreen = lazy(() => import('../screens/onboarding/GoalScreen').then((m) => ({ default: m.GoalScreen })))
const ProfileScreen = lazy(() => import('../screens/onboarding/ProfileScreen').then((m) => ({ default: m.ProfileScreen })))
const PreferencesScreen = lazy(() => import('../screens/onboarding/PreferencesScreen').then((m) => ({ default: m.PreferencesScreen })))
const TodayScreen = lazy(() => import('../screens/today/TodayScreen').then((m) => ({ default: m.TodayScreen })))
const DietsLibraryScreen = lazy(() => import('../screens/diets/DietsLibraryScreen').then((m) => ({ default: m.DietsLibraryScreen })))
const DietDetailScreen = lazy(() => import('../screens/diets/DietDetailScreen').then((m) => ({ default: m.DietDetailScreen })))
const DietDayScreen = lazy(() => import('../screens/diets/DietDayScreen').then((m) => ({ default: m.DietDayScreen })))
const WorkoutsLibraryScreen = lazy(() => import('../screens/workouts/WorkoutsLibraryScreen').then((m) => ({ default: m.WorkoutsLibraryScreen })))
const WorkoutDetailScreen = lazy(() => import('../screens/workouts/WorkoutDetailScreen').then((m) => ({ default: m.WorkoutDetailScreen })))
const WorkoutExecutionScreen = lazy(() => import('../screens/workouts/WorkoutExecutionScreen').then((m) => ({ default: m.WorkoutExecutionScreen })))
const ProfileSettingsScreen = lazy(() => import('../screens/profile/ProfileSettingsScreen').then((m) => ({ default: m.ProfileSettingsScreen })))
const SubscriptionLockScreen = lazy(() => import('../screens/subscription/SubscriptionLockScreen').then((m) => ({ default: m.SubscriptionLockScreen })))
const DailyCheckinScreen = lazy(() => import('../screens/checkin/DailyCheckinScreen').then((m) => ({ default: m.DailyCheckinScreen })))
const WeeklyCheckinScreen = lazy(() => import('../screens/checkin/WeeklyCheckinScreen').then((m) => ({ default: m.WeeklyCheckinScreen })))
const EvolutionScreen = lazy(() => import('../screens/evolution/EvolutionScreen').then((m) => ({ default: m.EvolutionScreen })))
const EvolutionCheckinScreen = lazy(() => import('../screens/evolution/EvolutionCheckinScreen').then((m) => ({ default: m.EvolutionCheckinScreen })))
const ChallengesScreen = lazy(() => import('../screens/challenges/ChallengesScreen').then((m) => ({ default: m.ChallengesScreen })))
const ExpertCenterScreen = lazy(() => import('../screens/content/ExpertCenterScreen').then((m) => ({ default: m.ExpertCenterScreen })))
const CommunityScreen = lazy(() => import('../screens/community/CommunityScreen').then((m) => ({ default: m.CommunityScreen })))
const HydrationScreen = lazy(() => import('../screens/hydration/HydrationScreen').then((m) => ({ default: m.HydrationScreen })))
const PlansScreen = lazy(() => import('../screens/billing/PlansScreen').then((m) => ({ default: m.PlansScreen })))
const BillingDashboardScreen = lazy(() => import('../screens/billing/BillingDashboardScreen').then((m) => ({ default: m.BillingDashboardScreen })))
const PaymentSuccessScreen = lazy(() => import('../screens/billing/PaymentSuccessScreen').then((m) => ({ default: m.PaymentSuccessScreen })))
const PaymentFailureScreen = lazy(() => import('../screens/billing/PaymentFailureScreen').then((m) => ({ default: m.PaymentFailureScreen })))
const PaymentPendingScreen = lazy(() => import('../screens/billing/PaymentPendingScreen').then((m) => ({ default: m.PaymentPendingScreen })))
const AdminSubscriptionsScreen = lazy(() => import('../screens/admin/AdminSubscriptionsScreen').then((m) => ({ default: m.AdminSubscriptionsScreen })))
const AdminAffiliatesScreen = lazy(() => import('../screens/admin/AdminAffiliatesScreen').then((m) => ({ default: m.AdminAffiliatesScreen })))
const AdminAffiliateDetailScreen = lazy(() => import('../screens/admin/AdminAffiliateDetailScreen').then((m) => ({ default: m.AdminAffiliateDetailScreen })))
const AdminCommissionsScreen = lazy(() => import('../screens/admin/AdminCommissionsScreen').then((m) => ({ default: m.AdminCommissionsScreen })))
const AdminUsersScreen = lazy(() => import('../screens/admin/AdminUsersScreen').then((m) => ({ default: m.AdminUsersScreen })))
const AdminUserDetailScreen = lazy(() => import('../screens/admin/AdminUserDetailScreen').then((m) => ({ default: m.AdminUserDetailScreen })))
const AdminBadgeEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminBadgeEditorScreen })))
const AdminBadgesScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminBadgesScreen })))
const AdminChallengesScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminChallengesScreen })))
const AdminChallengeEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminChallengeEditorScreen })))
const AdminContentEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminContentEditorScreen })))
const AdminContentScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminContentScreen })))
const AdminDietEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminDietEditorScreen })))
const AdminDietsScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminDietsScreen })))
const AdminPlansScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminPlansScreen })))
const AdminWorkoutEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminWorkoutEditorScreen })))
const AdminWorkoutsScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then((m) => ({ default: m.AdminWorkoutsScreen })))
const AdminFoodsScreen = lazy(() => import('../screens/admin/AdminFoodsScreen').then((m) => ({ default: m.AdminFoodsScreen })))
const AdminFoodEditorScreen = lazy(() => import('../screens/admin/AdminFoodEditorScreen').then((m) => ({ default: m.AdminFoodEditorScreen })))
const AdminExercisesScreen = lazy(() => import('../screens/admin/AdminExercisesScreen').then((m) => ({ default: m.AdminExercisesScreen })))
const AdminExerciseEditorScreen = lazy(() => import('../screens/admin/AdminExerciseEditorScreen').then((m) => ({ default: m.AdminExerciseEditorScreen })))
const AdminAuditLogsScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then((m) => ({ default: m.AdminAuditLogsScreen })))
const AdminCommunityScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then((m) => ({ default: m.AdminCommunityScreen })))
const AdminPayoutsScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then((m) => ({ default: m.AdminPayoutsScreen })))
const AdminSettingsScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then((m) => ({ default: m.AdminSettingsScreen })))
const AdminLaunchDashboardScreen = lazy(() => import('../screens/admin/AdminLaunchDashboardScreen').then((m) => ({ default: m.AdminLaunchDashboardScreen })))
const AdminWorkspacesScreen = lazy(() => import('../screens/admin/AdminBackofficeScreens').then((m) => ({ default: m.AdminWorkspacesScreen })))
const AdminFinanceOverviewScreen = lazy(() => import('../screens/admin/AdminBackofficeScreens').then((m) => ({ default: m.AdminFinanceOverviewScreen })))
const AdminSupportOverviewScreen = lazy(() => import('../screens/admin/AdminBackofficeScreens').then((m) => ({ default: m.AdminSupportOverviewScreen })))
const AffiliatePortalScreen = lazy(() => import('../screens/affiliate/AffiliatePortalScreen').then((m) => ({ default: m.AffiliatePortalScreen })))
const AffiliateDashboardScreen = lazy(() => import('../screens/affiliate/AffiliateDashboardScreen').then((m) => ({ default: m.AffiliateDashboardScreen })))
const WhoAmIScreen = lazy(() => import('../screens/dev/WhoAmIScreen').then((m) => ({ default: m.WhoAmIScreen })))
const PublicLandingScreen = lazy(() => import('../screens/landing/PublicLandingScreen').then((m) => ({ default: m.PublicLandingScreen })))
const DesignSystemScreen = lazy(() => import('../screens/design-system/DesignSystemScreen').then((m) => ({ default: m.DesignSystemScreen })))
const UxBlueprintScreen = lazy(() => import('../screens/design-system/UxBlueprintScreen').then((m) => ({ default: m.UxBlueprintScreen })))
const StudentDashboardScreen = lazy(() => import('../screens/student/StudentDashboardScreen').then((m) => ({ default: m.StudentDashboardScreen })))
const MentorDashboardScreen = lazy(() => import('../screens/mentor/MentorDashboardScreen').then((m) => ({ default: m.MentorDashboardScreen })))
const MentorOverviewScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorOverviewScreen })))
const MentorCheckinsScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorCheckinsScreen })))
const MentorAgendaScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorAgendaScreen })))
const MentorFinanceScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorFinanceScreen })))
const MentorReportsScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorReportsScreen })))
const MentorSettingsScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorSettingsScreen })))
const MentorWorkoutPrescriptorScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorWorkoutPrescriptorScreen })))
const MentorDietPrescriptorScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorDietPrescriptorScreen })))
const MentorStudentsScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorStudentsScreen })))
const MentorInfluencersScreen = lazy(() => import('../screens/mentor/MentorWorkspaceScreens').then((m) => ({ default: m.MentorInfluencersScreen })))

function RootRoute() {
  return <PublicLandingScreen />
}

function AppIndexRedirect() {
  const { user } = useAuth()
  const { subscription } = useSubscription()

  if (!user) return <Navigate to="/login" replace />
  if (getUserRole(user) === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (getUserRole(user) === 'mentor') return <Navigate to="/mentor/overview" replace />

  return <Navigate to={getDefaultRouteForUser(user, null, subscription)} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />,
  },
  { path: '/expert-club', element: <PublicLandingScreen /> },
  { path: '/design-system', element: <DesignSystemScreen /> },
  { path: '/ux-blueprint', element: <UxBlueprintScreen /> },
  { path: '/student/dashboard', element: <Navigate to="/app/today" replace /> },
  { path: '/dashboard/aluno', element: <Navigate to="/app/today" replace /> },
  { path: '/student/workout', element: <Navigate to="/app/workouts" replace /> },
  { path: '/student/workouts', element: <Navigate to="/app/workouts" replace /> },
  { path: '/student/workout/session', element: <Navigate to="/app/workouts" replace /> },
  { path: '/student/workout-monitor', element: <Navigate to="/app/workouts" replace /> },
  { path: '/student/diet', element: <Navigate to="/app/diets/today" replace /> },
  { path: '/student/dieta', element: <Navigate to="/app/diets/today" replace /> },
  { path: '/student/profile', element: <Navigate to="/app/profile" replace /> },
  { path: '/student/ranking', element: <Navigate to="/app/challenges" replace /> },
  { path: '/student/legacy-dashboard', element: <StudentDashboardScreen /> },
  { path: '/dashboard/mentor', element: <Navigate to="/mentor/overview" replace /> },
  { path: '/mentor/legacy-dashboard', element: <MentorDashboardScreen /> },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginScreen />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <SignupScreen />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: <ResetPasswordScreen />,
  },
  {
    path: '/onboarding',
    element: <OnboardingRoute />,
    children: [
      { path: 'goal', element: <GoalScreen /> },
      { path: 'profile', element: <ProfileScreen /> },
      { path: 'preferences', element: <PreferencesScreen /> },
    ],
  },
  {
    path: '/app',
    element: (
      <AppRoute>
        <Outlet />
      </AppRoute>
    ),
    children: [
      {
        path: 'billing/plans',
        element: <PlansScreen />,
      },
      {
        path: 'billing/lock',
        element: <SubscriptionLockScreen />,
      },
      {
        path: 'workouts/session/:sessionId',
        element: <WorkoutExecutionScreen />,
      },
      {
        path: 'checkin/daily',
        element: <DailyCheckinScreen />,
      },
      {
        path: 'checkin/weekly',
        element: <WeeklyCheckinScreen />,
      },
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <AppIndexRedirect />,
          },
          {
            path: 'today',
            element: <TodayScreen />,
          },
          {
            path: 'workouts',
            element: <WorkoutsLibraryScreen />,
          },
          {
            path: 'workouts/:workoutId',
            element: <WorkoutDetailScreen />,
          },
          {
            path: 'diets',
            element: <DietsLibraryScreen />,
          },
          {
            path: 'diets/today',
            element: <DietDayScreen />,
          },
          {
            path: 'diets/:dietId',
            element: <DietDetailScreen />,
          },
          {
            path: 'profile',
            element: <ProfileSettingsScreen />,
          },
          {
            path: 'progress',
            element: <EvolutionScreen />,
          },
          {
            path: 'evolution',
            element: <EvolutionScreen />,
          },
          {
            path: 'evolution/checkin',
            element: <EvolutionCheckinScreen />,
          },
          {
            path: 'challenges',
            element: <ChallengesScreen />,
          },
          {
            path: 'challenges/:challengeId',
            element: <ChallengesScreen />,
          },
          {
            path: 'badges',
            element: <ChallengesScreen />,
          },
          {
            path: 'community',
            element: <CommunityScreen />,
          },
          {
            path: 'content',
            element: <ExpertCenterScreen />,
          },
          {
            path: 'content/:contentId',
            element: <ExpertCenterScreen />,
          },
          {
            path: 'hydration',
            element: <HydrationScreen />,
          },
          {
            path: 'billing',
            element: <BillingDashboardScreen />,
          },
        ],
      },
    ],
  },
  {
    path: '/mentor',
    element: (
      <MentorRoute>
        <MentorLayout />
      </MentorRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/mentor/overview" replace />,
      },
      {
        path: 'overview',
        element: <MentorOverviewScreen />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/mentor/overview" replace />,
      },
      {
        path: 'alunos',
        element: <MentorStudentsScreen />,
      },
      {
        path: 'students',
        element: <Navigate to="/mentor/alunos" replace />,
      },
      {
        path: 'checkins',
        element: <MentorCheckinsScreen />,
      },
      {
        path: 'agenda',
        element: <MentorAgendaScreen />,
      },
      {
        path: 'financeiro',
        element: <MentorFinanceScreen />,
      },
      {
        path: 'finance',
        element: <Navigate to="/mentor/financeiro" replace />,
      },
      {
        path: 'relatorios',
        element: <MentorReportsScreen />,
      },
      {
        path: 'configuracoes',
        element: <MentorSettingsScreen />,
      },
      {
        path: 'treinos/prescritor',
        element: <MentorWorkoutPrescriptorScreen />,
      },
      {
        path: 'workouts/prescriptor',
        element: <Navigate to="/mentor/treinos/prescritor" replace />,
      },
      {
        path: 'dietas/prescritor',
        element: <MentorDietPrescriptorScreen />,
      },
      {
        path: 'diets/prescriptor',
        element: <Navigate to="/mentor/dietas/prescritor" replace />,
      },
      {
        path: 'influencers',
        element: <MentorInfluencersScreen />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminLaunchDashboardScreen />,
      },
      {
        path: 'overview',
        element: <AdminLaunchDashboardScreen />,
      },
      {
        path: 'produto',
        element: <AdminLaunchDashboardScreen />,
      },
      {
        path: 'product',
        element: <AdminLaunchDashboardScreen />,
      },
      {
        path: 'workspaces',
        element: <AdminWorkspacesScreen />,
      },
      {
        path: 'launch',
        element: <AdminLaunchDashboardScreen />,
      },
      {
        path: 'subscriptions',
        element: <AdminSubscriptionsScreen />,
      },
      { path: 'users', element: <AdminUsersScreen /> },
      { path: 'users/:uid', element: <AdminUserDetailScreen /> },
      { path: 'diets', element: <AdminDietsScreen /> },
      { path: 'diets/new', element: <AdminDietEditorScreen /> },
      { path: 'diets/:dietId', element: <AdminDietEditorScreen /> },
      { path: 'foods', element: <AdminFoodsScreen /> },
      { path: 'foods/new', element: <AdminFoodEditorScreen /> },
      { path: 'foods/:foodId', element: <AdminFoodEditorScreen /> },
      { path: 'workouts', element: <AdminWorkoutsScreen /> },
      { path: 'workouts/new', element: <AdminWorkoutEditorScreen /> },
      { path: 'workouts/:workoutId', element: <AdminWorkoutEditorScreen /> },
      { path: 'exercises', element: <AdminExercisesScreen /> },
      { path: 'exercises/new', element: <AdminExerciseEditorScreen /> },
      { path: 'exercises/:exerciseId', element: <AdminExerciseEditorScreen /> },
      { path: 'content', element: <AdminContentScreen /> },
      { path: 'content/new', element: <AdminContentEditorScreen /> },
      { path: 'content/:contentId', element: <AdminContentEditorScreen /> },
      { path: 'challenges', element: <AdminChallengesScreen /> },
      { path: 'challenges/new', element: <AdminChallengeEditorScreen /> },
      { path: 'challenges/:challengeId', element: <AdminChallengeEditorScreen /> },
      { path: 'badges', element: <AdminBadgesScreen /> },
      { path: 'badges/new', element: <AdminBadgeEditorScreen /> },
      { path: 'badges/:badgeId', element: <AdminBadgeEditorScreen /> },
      { path: 'plans', element: <AdminPlansScreen /> },
      { path: 'community', element: <AdminCommunityScreen /> },
      {
        path: 'affiliates',
        element: <AdminAffiliatesScreen />,
      },
      {
        path: 'affiliates/:affiliateId',
        element: <AdminAffiliateDetailScreen />,
      },
      {
        path: 'commissions',
        element: <AdminCommissionsScreen />,
      },
      {
        path: 'financeiro',
        element: <AdminFinanceOverviewScreen />,
      },
      {
        path: 'support',
        element: <AdminSupportOverviewScreen />,
      },
      {
        path: 'metrics',
        element: <AdminLaunchDashboardScreen />,
      },
      { path: 'payouts', element: <AdminPayoutsScreen /> },
      { path: 'audit-logs', element: <AdminAuditLogsScreen /> },
      { path: 'settings', element: <AdminSettingsScreen /> },
    ],
  },
  { path: '/billing/success', element: <PaymentSuccessScreen /> },
  { path: '/billing/failure', element: <PaymentFailureScreen /> },
  { path: '/billing/pending', element: <PaymentPendingScreen /> },
  {
    path: '/affiliate/dashboard',
    element: (
      <AffiliateRoute>
        <AffiliateDashboardScreen />
      </AffiliateRoute>
    ),
  },
  { path: '/affiliate/:code', element: <AffiliatePortalScreen /> },
  { path: '/dev/whoami', element: <WhoAmIScreen /> },
])
