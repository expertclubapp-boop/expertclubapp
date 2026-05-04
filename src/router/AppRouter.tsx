import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

import { AdminRoute } from './AdminRoute'
import { AffiliateRoute } from './AffiliateRoute'
import { AppRoute } from './AppRoute'
import { OnboardingRoute } from './OnboardingRoute'
import { PublicRoute } from './PublicRoute'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { getDefaultRouteForUser, getUserRole } from './utils'

const LoginScreen = lazy(() => import('../screens/auth/LoginScreen').then(m => ({ default: m.LoginScreen })))
const SignupScreen = lazy(() => import('../screens/auth/SignupScreen').then(m => ({ default: m.SignupScreen })))
const ResetPasswordScreen = lazy(() => import('../screens/auth/ResetPasswordScreen').then(m => ({ default: m.ResetPasswordScreen })))
const GoalScreen = lazy(() => import('../screens/onboarding/GoalScreen').then(m => ({ default: m.GoalScreen })))
const ProfileScreen = lazy(() => import('../screens/onboarding/ProfileScreen').then(m => ({ default: m.ProfileScreen })))
const PreferencesScreen = lazy(() => import('../screens/onboarding/PreferencesScreen').then(m => ({ default: m.PreferencesScreen })))
const TodayScreen = lazy(() => import('../screens/today/TodayScreen').then(m => ({ default: m.TodayScreen })))
const DietsLibraryScreen = lazy(() => import('../screens/diets/DietsLibraryScreen').then(m => ({ default: m.DietsLibraryScreen })))
const DietDetailScreen = lazy(() => import('../screens/diets/DietDetailScreen').then(m => ({ default: m.DietDetailScreen })))
const DietDayScreen = lazy(() => import('../screens/diets/DietDayScreen').then(m => ({ default: m.DietDayScreen })))
const WorkoutsLibraryScreen = lazy(() => import('../screens/workouts/WorkoutsLibraryScreen').then(m => ({ default: m.WorkoutsLibraryScreen })))
const WorkoutDetailScreen = lazy(() => import('../screens/workouts/WorkoutDetailScreen').then(m => ({ default: m.WorkoutDetailScreen })))
const WorkoutExecutionScreen = lazy(() => import('../screens/workouts/WorkoutExecutionScreen').then(m => ({ default: m.WorkoutExecutionScreen })))
const ProfileSettingsScreen = lazy(() => import('../screens/profile/ProfileSettingsScreen').then(m => ({ default: m.ProfileSettingsScreen })))
const SubscriptionLockScreen = lazy(() => import('../screens/subscription/SubscriptionLockScreen').then(m => ({ default: m.SubscriptionLockScreen })))
const DailyCheckinScreen = lazy(() => import('../screens/checkin/DailyCheckinScreen').then(m => ({ default: m.DailyCheckinScreen })))
const WeeklyCheckinScreen = lazy(() => import('../screens/checkin/WeeklyCheckinScreen').then(m => ({ default: m.WeeklyCheckinScreen })))
const EvolutionScreen = lazy(() => import('../screens/evolution/EvolutionScreen').then(m => ({ default: m.EvolutionScreen })))
const EvolutionCheckinScreen = lazy(() => import('../screens/evolution/EvolutionCheckinScreen').then(m => ({ default: m.EvolutionCheckinScreen })))
const ChallengesScreen = lazy(() => import('../screens/challenges/ChallengesScreen').then(m => ({ default: m.ChallengesScreen })))
const ExpertCenterScreen = lazy(() => import('../screens/content/ExpertCenterScreen').then(m => ({ default: m.ExpertCenterScreen })))
const CommunityScreen = lazy(() => import('../screens/community/CommunityScreen').then(m => ({ default: m.CommunityScreen })))
const HydrationScreen = lazy(() => import('../screens/hydration/HydrationScreen').then(m => ({ default: m.HydrationScreen })))
const PlansScreen = lazy(() => import('../screens/billing/PlansScreen').then(m => ({ default: m.PlansScreen })))
const BillingDashboardScreen = lazy(() => import('../screens/billing/BillingDashboardScreen').then(m => ({ default: m.BillingDashboardScreen })))
const PaymentSuccessScreen = lazy(() => import('../screens/billing/PaymentSuccessScreen').then(m => ({ default: m.PaymentSuccessScreen })))
const PaymentFailureScreen = lazy(() => import('../screens/billing/PaymentFailureScreen').then(m => ({ default: m.PaymentFailureScreen })))
const PaymentPendingScreen = lazy(() => import('../screens/billing/PaymentPendingScreen').then(m => ({ default: m.PaymentPendingScreen })))
const AdminSubscriptionsScreen = lazy(() => import('../screens/admin/AdminSubscriptionsScreen').then(m => ({ default: m.AdminSubscriptionsScreen })))
const AdminDashboardScreen = lazy(() => import('../screens/admin/AdminDashboardScreen').then(m => ({ default: m.AdminDashboardScreen })))
const AdminAffiliatesScreen = lazy(() => import('../screens/admin/AdminAffiliatesScreen').then(m => ({ default: m.AdminAffiliatesScreen })))
const AdminAffiliateDetailScreen = lazy(() => import('../screens/admin/AdminAffiliateDetailScreen').then(m => ({ default: m.AdminAffiliateDetailScreen })))
const AdminCommissionsScreen = lazy(() => import('../screens/admin/AdminCommissionsScreen').then(m => ({ default: m.AdminCommissionsScreen })))
const AdminUsersScreen = lazy(() => import('../screens/admin/AdminUsersScreen').then(m => ({ default: m.AdminUsersScreen })))
const AdminUserDetailScreen = lazy(() => import('../screens/admin/AdminUserDetailScreen').then(m => ({ default: m.AdminUserDetailScreen })))
const AdminBadgeEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminBadgeEditorScreen })))
const AdminBadgesScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminBadgesScreen })))
const AdminChallengesScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminChallengesScreen })))
const AdminChallengeEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminChallengeEditorScreen })))
const AdminContentEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminContentEditorScreen })))
const AdminContentScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminContentScreen })))
const AdminDietEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminDietEditorScreen })))
const AdminDietsScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminDietsScreen })))
const AdminPlansScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminPlansScreen })))
const AdminWorkoutEditorScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminWorkoutEditorScreen })))
const AdminWorkoutsScreen = lazy(() => import('../screens/admin/AdminCatalogScreens').then(m => ({ default: m.AdminWorkoutsScreen })))
const AdminFoodsScreen = lazy(() => import('../screens/admin/AdminFoodsScreen').then(m => ({ default: m.AdminFoodsScreen })))
const AdminFoodEditorScreen = lazy(() => import('../screens/admin/AdminFoodEditorScreen').then(m => ({ default: m.AdminFoodEditorScreen })))
const AdminExercisesScreen = lazy(() => import('../screens/admin/AdminExercisesScreen').then(m => ({ default: m.AdminExercisesScreen })))
const AdminExerciseEditorScreen = lazy(() => import('../screens/admin/AdminExerciseEditorScreen').then(m => ({ default: m.AdminExerciseEditorScreen })))
const AdminAuditLogsScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then(m => ({ default: m.AdminAuditLogsScreen })))
const AdminCommunityScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then(m => ({ default: m.AdminCommunityScreen })))
const AdminPayoutsScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then(m => ({ default: m.AdminPayoutsScreen })))
const AdminSettingsScreen = lazy(() => import('../screens/admin/AdminOperationsScreens').then(m => ({ default: m.AdminSettingsScreen })))
const AdminLaunchDashboardScreen = lazy(() => import('../screens/admin/AdminLaunchDashboardScreen').then(m => ({ default: m.AdminLaunchDashboardScreen })))
const AffiliatePortalScreen = lazy(() => import('../screens/affiliate/AffiliatePortalScreen').then(m => ({ default: m.AffiliatePortalScreen })))
const AffiliateDashboardScreen = lazy(() => import('../screens/affiliate/AffiliateDashboardScreen').then(m => ({ default: m.AffiliateDashboardScreen })))
const WhoAmIScreen = lazy(() => import('../screens/dev/WhoAmIScreen').then(m => ({ default: m.WhoAmIScreen })))
const PublicLandingScreen = lazy(() => import('../screens/landing/PublicLandingScreen').then(m => ({ default: m.PublicLandingScreen })))
const DesignSystemScreen = lazy(() => import('../screens/design-system/DesignSystemScreen').then(m => ({ default: m.DesignSystemScreen })))
const UxBlueprintScreen = lazy(() => import('../screens/design-system/UxBlueprintScreen').then(m => ({ default: m.UxBlueprintScreen })))
const StudentDashboardScreen = lazy(() => import('../screens/student/StudentDashboardScreen').then(m => ({ default: m.StudentDashboardScreen })))
const MentorDashboardScreen = lazy(() => import('../screens/mentor/MentorDashboardScreen').then(m => ({ default: m.MentorDashboardScreen })))
function RootRoute() {
  return <PublicLandingScreen />
}

function AppIndexRedirect() {
  const { user } = useAuth()
  const { subscription } = useSubscription()

  if (!user) return <Navigate to="/login" replace />
  if (getUserRole(user) === 'admin') return <Navigate to="/admin/dashboard" replace />

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
  { path: '/student/dashboard', element: <StudentDashboardScreen /> },
  { path: '/dashboard/aluno', element: <StudentDashboardScreen /> },
  { path: '/mentor/dashboard', element: <MentorDashboardScreen /> },
  { path: '/dashboard/mentor', element: <MentorDashboardScreen /> },
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
            element: <ChallengesScreen />, // We'll update ChallengesScreen to handle ID
          },
          {
            path: 'content',
            element: <ExpertCenterScreen />,
          },
          {
            path: 'content/:contentId',
            element: <ExpertCenterScreen />, // We'll update ExpertCenterScreen to handle ID
          },
          {
            path: 'badges',
            element: <ChallengesScreen />, // We'll update this or create a dedicated one
          },
          {
            path: 'community',
            element: <CommunityScreen />,
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
  // Admin Routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AppShell />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardScreen />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardScreen />,
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
      { path: 'payouts', element: <AdminPayoutsScreen /> },
      { path: 'audit-logs', element: <AdminAuditLogsScreen /> },
      { path: 'settings', element: <AdminSettingsScreen /> },
    ],
  },
  // Public / App Return Routes (from checkout)
  { path: '/billing/success', element: <PaymentSuccessScreen /> },
  { path: '/billing/failure', element: <PaymentFailureScreen /> },
  { path: '/billing/pending', element: <PaymentPendingScreen /> },

  // Affiliate Public Portal
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
