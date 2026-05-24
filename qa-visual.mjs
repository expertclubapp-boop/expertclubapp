// Visual QA script — screenshots all key student screens
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const BASE = 'http://localhost:5175';
const OUT  = './qa-screenshots';

const QA_USER = {
  uid: 'qa-visual-001',
  email: 'qa@expertclub.com',
  displayName: 'Bruno QA',
  role: 'student',
  planTier: 'mentoring',
  currentStreak: 12,
  longestStreak: 18,
  onboardingCompleted: true,
  goal: 'hypertrophy',
  trainingLevel: 'intermediate',
  trainingFrequency: 4,
  trainingLocation: 'gym',
  dietPreference: 'flexible',
  waterGoalMl: 3000,
  selectedWorkoutId: null,
  selectedDietId: null,
};

async function ss(page, name, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() =>
    page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`✓ ${name}`);
}

(async () => {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // ── Mobile (375px) ──
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mp = await mobile.newPage();

  // Inject QA bypass
  await mp.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mp.evaluate((user) => {
    localStorage.setItem('expert_club_qa_user', JSON.stringify(user));
  }, QA_USER);

  // Student screens
  await ss(mp, '01-today-mobile',      '/app/today');
  await ss(mp, '02-workouts-mobile',   '/app/workouts');
  await ss(mp, '03-diets-today-mobile','/app/diets/today');
  await ss(mp, '04-evolution-mobile',  '/app/evolution');
  await ss(mp, '05-profile-mobile',    '/app/profile');
  await ss(mp, '06-hydration-mobile',  '/app/hydration');
  await ss(mp, '07-checkin-mobile',    '/app/checkin/daily');
  await ss(mp, '08-challenges-mobile', '/app/challenges');
  await ss(mp, '09-ranking-mobile',    '/app/ranking');
  await ss(mp, '10-meu-plano-mobile',  '/app/meu-plano');
  await ss(mp, '11-community-mobile',  '/app/community');
  await ss(mp, '12-content-mobile',    '/app/content');
  await ss(mp, '13-login',             '/login');

  await mobile.close();

  // ── Desktop (1440px) — Admin ──
  const adminUser = { ...QA_USER, role: 'admin', uid: 'qa-admin-001', email: 'admin@expertclub.com', displayName: 'Admin QA' };
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();

  await dp.goto(BASE, { waitUntil: 'domcontentloaded' });
  await dp.evaluate((user) => {
    localStorage.setItem('expert_club_qa_user', JSON.stringify(user));
  }, adminUser);

  await ss(dp, '20-admin-dashboard',     '/admin/dashboard');
  await ss(dp, '21-admin-users',         '/admin/users');
  await ss(dp, '22-admin-subscriptions', '/admin/subscriptions');
  await ss(dp, '23-admin-workouts',      '/admin/workouts');
  await ss(dp, '24-admin-diets',         '/admin/diets');
  await ss(dp, '25-admin-financeiro',    '/admin/financeiro');

  // ── Desktop (1440px) — Mentor ──
  const mentorUser = { ...QA_USER, role: 'mentor', uid: 'qa-mentor-001', displayName: 'Mentor QA' };
  await dp.evaluate((user) => {
    localStorage.setItem('expert_club_qa_user', JSON.stringify(user));
  }, mentorUser);

  await ss(dp, '30-mentor-overview',  '/mentor/overview');
  await ss(dp, '31-mentor-alunos',    '/mentor/alunos');
  await ss(dp, '32-mentor-checkins',  '/mentor/checkins');

  await desktop.close();
  await browser.close();

  console.log('\nAll screenshots saved to', OUT);
})();
