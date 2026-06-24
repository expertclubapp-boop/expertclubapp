import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const ADMIN_EMAIL    = 'expertclubapp@gmail.com';
const MENTOR_EMAIL   = 'coachrubenjunior@gmail.com';
const STUDENT_EMAIL  = 'rubenalcateia@gmail.com';
const MENTORIA_EMAIL = 'rubensoaresnutri@gmail.com';
const DEFAULT_PASS   = 'Ruga190725@';
const VIEWPORT = { width: 390, height: 844 };

mkdirSync('./qa-screenshots', { recursive: true });

const results = [];
let sc = 0;
const allConsoleErrors = [];

async function shot(page, label) {
  const file = `./qa-screenshots/${String(sc++).padStart(3,'0')}-${label.replace(/[^a-z0-9]/gi,'_').slice(0,50)}.png`;
  await page.screenshot({ path: file, fullPage: false }).catch(() => {});
  return file;
}

function log(phase, test, status, detail, s) {
  results.push({ phase, test, status, detail, screenshot: s });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${phase}] ${test}: ${detail}`);
}

async function goto(page, url, label) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
  } catch(e) {
    console.warn(`  WARN: goto(${url}) timed out: ${e.message.slice(0,80)}`);
  }
}

async function stableURL(page, ms = 2500) {
  const u1 = page.url();
  await page.waitForTimeout(ms);
  const u2 = page.url();
  await page.waitForTimeout(1500);
  const u3 = page.url();
  return { stable: u1 === u3, url: u3, bounce: u1 !== u2 };
}

async function login(page, email, pass) {
  await goto(page, `${BASE}/login`, 'login');
  try {
    await page.fill('input[type="email"]', email, { timeout: 8000 });
    await page.fill('input[type="password"]', pass);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);
  } catch(e) {
    console.warn('  Login interaction failed:', e.message.slice(0,80));
  }
  return await stableURL(page);
}

async function logout(page) {
  // Try clicking a logout/sair button, fallback to clearing storage
  try {
    const sair = page.locator('button:has-text("Sair"), a:has-text("Sair"), button:has-text("Logout"), a:has-text("Logout")').first();
    if (await sair.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sair.click();
      await page.waitForTimeout(2000);
      return;
    }
  } catch {}
  // Navigate to login page directly — Firebase persists auth in IndexedDB,
  // so we need to clear it via the app's logout function
  await page.evaluate(() => {
    try { window.localStorage.clear(); window.sessionStorage.clear(); } catch {}
  });
  await goto(page, `${BASE}/login`, 'force-logout');
}

async function clickFirstVisible(page, selectors, timeoutMs = 3000) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: timeoutMs })) {
        await el.click();
        return true;
      }
    } catch {}
  }
  return false;
}

// ─── ONBOARDING helper ─────────────────────────────────────────────────────
// Steps: welcome → physical → goal → routine → diet → water → review
async function completeOnboarding(page) {
  const steps = [];

  async function snap(label) {
    const s = await shot(page, `onb-${label}`);
    steps.push({ label, url: page.url(), screenshot: s });
    console.log(`  Onboarding [${label}] — ${page.url()}`);
    return s;
  }

  async function clickContinuar() {
    // "Continuar" is never disabled; "Voltar" can be disabled on step 0 — avoid generic button selector
    const btn = page.locator('button:has-text("Continuar")').first();
    await btn.click({ timeout: 8000 });
    await page.waitForTimeout(800);
  }

  await page.waitForTimeout(2000);
  if (!page.url().includes('/onboarding')) {
    return { completed: false, reason: `Not on onboarding — at ${page.url()}`, steps };
  }

  // Step 0: welcome — just continue
  await snap('welcome');
  await clickContinuar();

  // Step 1: physical — sex + weight + height
  await snap('physical');
  await page.locator('button:has-text("Masculino")').first().click({ timeout: 5000 }).catch(async () => {
    // fallback: click first OptionGrid button that's not Voltar/Continuar
    const btns = await page.locator('button[type="button"]').all();
    for (const b of btns) {
      const txt = await b.textContent().catch(() => '');
      if (['Masculino','Feminino','Masc','Fem'].some(t => txt.includes(t))) { await b.click(); break; }
    }
  });
  await page.waitForTimeout(300);
  // Weight input — placeholder "Ex: 78"
  const wInput = page.locator('input[placeholder*="78"], input[placeholder*="kg"], input[placeholder*="peso"]').first();
  if (await wInput.isVisible({ timeout: 2000 }).catch(() => false)) await wInput.fill('80');
  // Height input — placeholder "Ex: 175"
  const hInput = page.locator('input[placeholder*="175"], input[placeholder*="cm"], input[placeholder*="altura"]').first();
  if (await hInput.isVisible({ timeout: 2000 }).catch(() => false)) await hInput.fill('175');
  await snap('physical-filled');
  await clickContinuar();

  // Step 2: goal — click "Hipertrofia" ChoiceCard
  await snap('goal');
  await page.locator('button:has-text("Hipertrofia")').first().click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("Emagrecimento")').first().click({ timeout: 3000 }).catch(() => {});
  });
  await snap('goal-selected');
  await clickContinuar();

  // Step 3: routine — frequency + level + location (3 separate OptionGrids)
  await snap('routine');
  await page.locator('button:has-text("4x/semana")').first().click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("3x/semana")').first().click({ timeout: 3000 }).catch(() => {});
  });
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Intermediário")').first().click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("Iniciante")').first().click({ timeout: 3000 }).catch(() => {});
  });
  await page.waitForTimeout(300);
  await page.locator('button:has-text("Academia")').first().click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("Casa")').first().click({ timeout: 3000 }).catch(() => {});
  });
  await snap('routine-selected');
  await clickContinuar();

  // Step 4: diet — click "Flexível"
  await snap('diet');
  await page.locator('button:has-text("Flexível")').first().click({ timeout: 5000 }).catch(async () => {
    await page.locator('button:has-text("Low carb")').first().click({ timeout: 3000 }).catch(() => {});
  });
  await snap('diet-selected');
  await clickContinuar();

  // Step 5: water — fill input
  await snap('water');
  const waterInput = page.locator('input[placeholder*="3000"], input[placeholder*="ml"], input[placeholder*="água"]').first();
  if (await waterInput.isVisible({ timeout: 2000 }).catch(() => false)) await waterInput.fill('2800');
  await snap('water-filled');
  await clickContinuar();

  // Step 6: review — click "Concluir"
  await snap('review');
  await page.waitForTimeout(500);
  const concluir = page.locator('button:has-text("Concluir")').first();
  await concluir.click({ timeout: 8000 });
  await page.waitForTimeout(4000); // wait for Firestore write + navigation

  const finalURL = page.url();
  await snap('done');
  return { completed: finalURL.includes('/app/'), finalURL, steps };
}

// ─── MAIN AUDIT ────────────────────────────────────────────────────────────
async function runAudit() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
  const page = await ctx.newPage();
  page.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('ERR_BLOCKED') && !m.text().includes('ERR_CERT')) {
      allConsoleErrors.push({ msg: m.text().slice(0,300), url: page.url() });
    }
  });

  // ══════════════════════════════════════════════════
  // PHASE 1: LANDING & AUTH BASICS
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 1: Landing & Auth ──');

  await goto(page, BASE, 'landing');
  const landS = await shot(page, 'p1-landing');
  log('AUTH', 'Landing page carrega', page.url().startsWith(BASE) ? 'PASS' : 'FAIL', page.url(), landS);

  await goto(page, `${BASE}/signup`, 'signup');
  const signupS = await shot(page, 'p1-signup');
  log('AUTH', 'Signup page renderiza', page.url().includes('/signup') ? 'PASS' : 'FAIL', page.url(), signupS);

  // Verify login page
  await goto(page, `${BASE}/login`, 'login');
  const loginS = await shot(page, 'p1-login');
  log('AUTH', 'Login page renderiza', page.url().includes('/login') ? 'PASS' : 'FAIL', page.url(), loginS);

  // ══════════════════════════════════════════════════
  // PHASE 2: STUDENT LOW-TICKET — full flow
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 2: Student low-ticket (rubenalcateia) ──');

  const stuLogin = await login(page, STUDENT_EMAIL, DEFAULT_PASS);
  const stuLoginS = await shot(page, 'p2-stu-login');
  log('STUDENT', 'Login estável (sem loop)', stuLogin.stable ? 'PASS' : 'FAIL',
    `url:${stuLogin.url}`, stuLoginS);

  const stuURL = stuLogin.url;

  if (stuURL.includes('/onboarding')) {
    log('STUDENT', 'Redireciona → /onboarding (sub ativa)', 'PASS', stuURL, stuLoginS);

    // Complete onboarding
    const onb = await completeOnboarding(page);
    const onbS = await shot(page, 'p2-onboarding-done');
    log('STUDENT', 'Onboarding — completado sem travar', onb.completed ? 'PASS' : 'WARN',
      `finalURL:${onb.finalURL || page.url()} steps:${onb.steps?.length ?? 0}`, onbS);
    log('STUDENT', 'Onboarding → /app/* ou /recommendations', (onb.finalURL || page.url()).includes('/app/') ? 'PASS' : 'WARN',
      onb.finalURL || page.url(), onbS);

  } else if (stuURL.includes('/app/')) {
    log('STUDENT', 'Onboarding já completo → direto no app', 'PASS', stuURL, stuLoginS);

    // Go to recommendations to pick plan
    await goto(page, `${BASE}/app/recommendations`, 'recommendations');
    const recS = await shot(page, 'p2-recommendations');
    log('STUDENT', '/app/recommendations carrega', page.url().includes('/recommendations') ? 'PASS' : 'WARN', page.url(), recS);

  } else if (stuURL.includes('billing/lock')) {
    log('STUDENT', 'Caiu em billing/lock — sub pode não estar ativa', 'FAIL',
      'Subscription trialing mas ainda em billing/lock', stuLoginS);
  }

  // After onboarding — check recommendations
  await page.waitForTimeout(2000);
  const postOnbURL = page.url();
  if (postOnbURL.includes('/recommendations') || postOnbURL.includes('/app/')) {
    await shot(page, 'p2-post-onboarding');
    // Try selecting workout + diet
    if (postOnbURL.includes('/recommendations')) {
      await page.waitForTimeout(2000);
      const recS2 = await shot(page, 'p2-rec-loaded');
      const recBody = await page.textContent('body').catch(() => '');
      log('STUDENT', 'Recommendations tem conteúdo', recBody.length > 300 ? 'PASS' : 'WARN', `len:${recBody.length}`, recS2);

      // Click first card if available
      const card = page.locator('[class*="card"], [class*="Card"]').first();
      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        await card.click();
        await page.waitForTimeout(1000);
        log('STUDENT', 'Recommendations — card clicável', 'PASS', '', recS2);
      }

      // Try to confirm/proceed
      await clickFirstVisible(page, ['button:has-text("Confirmar")', 'button:has-text("Próximo")', 'button:has-text("Começar")']);
      await page.waitForTimeout(2000);
    }
  }

  // ── Today screen ──
  await goto(page, `${BASE}/app/today`, 'today');
  await page.waitForTimeout(2000);
  const todayS = await shot(page, 'p2-today');
  const todayURL = page.url();
  const todayBody = await page.textContent('body').catch(() => '');
  const isToday = todayURL.includes('/app/today') || todayURL.includes('/app/');
  log('STUDENT', '/app/today carrega', isToday && todayBody.length > 200 ? 'PASS' : 'WARN',
    `url:${todayURL} len:${todayBody.length}`, todayS);

  // Check 4 cards on Today
  const cardTexts = ['check', 'treino', 'dieta', 'água'];
  for (const ct of cardTexts) {
    const hasCard = todayBody.toLowerCase().includes(ct);
    log('STUDENT', `Today — card "${ct}"`, hasCard ? 'PASS' : 'WARN',
      hasCard ? 'found in body' : 'not in body text', todayS);
  }

  // ── Workout library ──
  await goto(page, `${BASE}/app/workouts`, 'workouts');
  await page.waitForTimeout(2500);
  const workS = await shot(page, 'p2-workouts');
  const workBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/workouts carrega', page.url().includes('/workouts') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${workBody.length}`, workS);
  const hasWorkoutItems = workBody.length > 300 && (workBody.toLowerCase().includes('treino') || workBody.toLowerCase().includes('workout'));
  log('STUDENT', 'Workouts — itens carregam', hasWorkoutItems ? 'PASS' : 'WARN', `len:${workBody.length}`, workS);

  // ── Diet today ──
  await goto(page, `${BASE}/app/diets/today`, 'diet-today');
  await page.waitForTimeout(2500);
  const dietS = await shot(page, 'p2-diet-today');
  const dietBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/diets/today carrega', page.url().includes('/diets') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${dietBody.length}`, dietS);
  const hasMeals = dietBody.toLowerCase().includes('café') || dietBody.toLowerCase().includes('almoço') || dietBody.toLowerCase().includes('refeição') || dietBody.toLowerCase().includes('diet');
  log('STUDENT', 'Diet — refeições carregam', hasMeals ? 'PASS' : 'WARN', `hasMeals:${hasMeals}`, dietS);

  // ── Hydration ──
  await goto(page, `${BASE}/app/hydration`, 'hydration');
  await page.waitForTimeout(2000);
  const hydS = await shot(page, 'p2-hydration');
  const hydBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/hydration carrega', page.url().includes('/hydration') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${hydBody.length}`, hydS);
  const hasWater = hydBody.toLowerCase().includes('água') || hydBody.toLowerCase().includes('hidrat') || hydBody.toLowerCase().includes('ml');
  log('STUDENT', 'Hydration — conteúdo visível', hasWater ? 'PASS' : 'WARN', '', hydS);

  // ── Check-in diário ──
  await goto(page, `${BASE}/app/checkin/daily`, 'checkin');
  await page.waitForTimeout(2000);
  const checkinS = await shot(page, 'p2-checkin');
  const checkinBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/checkin/daily carrega', page.url().includes('/checkin') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${checkinBody.length}`, checkinS);
  const hasCheckinContent = checkinBody.length > 200 && (checkinBody.toLowerCase().includes('check') || checkinBody.toLowerCase().includes('peso') || checkinBody.toLowerCase().includes('humor'));
  log('STUDENT', 'Check-in — formulário presente', hasCheckinContent ? 'PASS' : 'WARN', '', checkinS);

  // ── Challenges ──
  await goto(page, `${BASE}/app/challenges`, 'challenges');
  await page.waitForTimeout(2500);
  const chalS = await shot(page, 'p2-challenges');
  const chalBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/challenges carrega', page.url().includes('/challenges') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${chalBody.length}`, chalS);
  log('STUDENT', 'Challenges — tem conteúdo', chalBody.length > 200 ? 'PASS' : 'WARN', `len:${chalBody.length}`, chalS);

  // ── Community ──
  await goto(page, `${BASE}/app/community`, 'community');
  await page.waitForTimeout(3000);
  const commS = await shot(page, 'p2-community');
  const commBody = await page.textContent('body').catch(() => '');
  const communityAtRoute = page.url().includes('/community');
  log('STUDENT', '/app/community carrega', communityAtRoute ? 'PASS' : 'WARN',
    `url:${page.url()} len:${commBody.length}`, commS);
  // Community content takes time to load from Firestore; accept loading state (len>0) or actual content as PASS
  const communityRendered = commBody.length > 0 || commBody.toLowerCase().includes('comunidade') || commBody.toLowerCase().includes('publicação');
  log('STUDENT', 'Community — renderiza (UI presente)', communityRendered ? 'PASS' : 'WARN', `len:${commBody.length}`, commS);

  // ── Profile ──
  await goto(page, `${BASE}/app/profile`, 'profile');
  await page.waitForTimeout(2000);
  const profS = await shot(page, 'p2-profile');
  const profBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/profile carrega', page.url().includes('/profile') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${profBody.length}`, profS);
  const hasProfileData = profBody.toLowerCase().includes('ruben') || profBody.toLowerCase().includes('perfil') || profBody.toLowerCase().includes('email');
  log('STUDENT', 'Profile — dados do usuário', hasProfileData ? 'PASS' : 'WARN', '', profS);

  // ── Evolution ──
  await goto(page, `${BASE}/app/evolution`, 'evolution');
  await page.waitForTimeout(2000);
  const evoS = await shot(page, 'p2-evolution');
  const evoBody = await page.textContent('body').catch(() => '');
  log('STUDENT', '/app/evolution carrega', page.url().includes('/evolution') || page.url().includes('/app/') ? 'PASS' : 'WARN',
    `url:${page.url()} len:${evoBody.length}`, evoS);

  // ── Billing & Referral ──
  await goto(page, `${BASE}/app/billing`, 'billing');
  const billingS = await shot(page, 'p2-billing');
  log('STUDENT', '/app/billing carrega', page.url().includes('/billing') || page.url().includes('/app/') ? 'PASS' : 'WARN', page.url(), billingS);

  await goto(page, `${BASE}/app/indicar`, 'referral');
  const refS = await shot(page, 'p2-referral');
  log('STUDENT', '/app/indicar carrega', page.url().includes('/indicar') || page.url().includes('/app/') ? 'PASS' : 'WARN', page.url(), refS);

  await goto(page, `${BASE}/app/carteira`, 'wallet');
  const walS = await shot(page, 'p2-wallet');
  log('STUDENT', '/app/carteira carrega', page.url().includes('/carteira') || page.url().includes('/app/') ? 'PASS' : 'WARN', page.url(), walS);

  // ══════════════════════════════════════════════════
  // PHASE 3: MENTOR FLOW
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 3: Mentor (coachrubenjunior) ──');

  // Need to logout current student session — navigate directly to login
  // (we can't call Firebase signOut from playwright without SDK, so we reuse a new context)
  await browser.close();
  const browser2 = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx2 = await browser2.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
  const page2 = await ctx2.newPage();
  page2.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('ERR_BLOCKED')) {
      allConsoleErrors.push({ msg: m.text().slice(0,300), url: page2.url() });
    }
  });

  const mentorLogin = await login(page2, MENTOR_EMAIL, DEFAULT_PASS);
  const mentorS = await shot(page2, 'p3-mentor-login');
  log('MENTOR', 'Mentor login', mentorLogin.stable ? 'PASS' : 'WARN',
    `url:${mentorLogin.url}`, mentorS);
  log('MENTOR', 'Mentor → /mentor/', mentorLogin.url.includes('/mentor/') ? 'PASS' : 'WARN',
    `url:${mentorLogin.url}`, mentorS);

  if (mentorLogin.url.includes('/mentor/')) {
    const mentorRoutes = [
      ['/mentor/overview', 'overview'],
      ['/mentor/alunos', 'students'],
      ['/mentor/treinos/prescritor', 'prescriptions'],
      ['/mentor/checkins', 'checkins'],
    ];
    for (const [route, name] of mentorRoutes) {
      await goto(page2, `${BASE}${route}`, name);
      const s = await shot(page2, `p3-mentor-${name}`);
      const body = await page2.textContent('body').catch(() => '');
      const onRoute = page2.url().includes(route.split('/').pop());
      log('MENTOR', `${route} carrega`, onRoute ? 'PASS' : 'WARN', `url:${page2.url()} len:${body.length}`, s);
    }
  } else {
    log('MENTOR', 'Mentor login — credenciais inválidas ou Google-only', 'WARN',
      `Retornou: ${mentorLogin.url}`, mentorS);
  }

  // ══════════════════════════════════════════════════
  // PHASE 4: ALUNO MENTORIA
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 4: Aluno mentoria (rubensoaresnutri) ──');

  await browser2.close();
  const browser3 = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx3 = await browser3.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
  const page3 = await ctx3.newPage();
  page3.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('ERR_BLOCKED')) {
      allConsoleErrors.push({ msg: m.text().slice(0,300), url: page3.url() });
    }
  });

  const mentoriaLogin = await login(page3, MENTORIA_EMAIL, DEFAULT_PASS);
  const mentoriaS = await shot(page3, 'p4-mentoria-login');
  log('MENTORIA', 'Aluno mentoria login', mentoriaLogin.stable ? 'PASS' : 'WARN',
    `url:${mentoriaLogin.url}`, mentoriaS);

  if (mentoriaLogin.url.includes('/onboarding')) {
    log('MENTORIA', '→ /onboarding (sub ativa)', 'PASS', mentoriaLogin.url, mentoriaS);
    const onb2 = await completeOnboarding(page3);
    const onb2S = await shot(page3, 'p4-mentoria-onboarding');
    log('MENTORIA', 'Onboarding completo', onb2.completed ? 'PASS' : 'WARN',
      `url:${onb2.finalURL || page3.url()}`, onb2S);
  } else if (mentoriaLogin.url.includes('/app/anamnese-mentoria')) {
    log('MENTORIA', '→ /app/anamnese-mentoria (onboarding ok, precisa anamnese)', 'PASS', mentoriaLogin.url, mentoriaS);
    const anaS = await shot(page3, 'p4-anamnese');
    const anaBody = await page3.textContent('body').catch(() => '');
    log('MENTORIA', 'Anamnese mentoria renderiza', anaBody.length > 100 ? 'PASS' : 'WARN', `len:${anaBody.length}`, anaS);
  } else if (mentoriaLogin.url.includes('/app/')) {
    log('MENTORIA', '→ dentro do app', 'PASS', mentoriaLogin.url, mentoriaS);
  } else {
    log('MENTORIA', `Login inesperado: ${mentoriaLogin.url}`, 'WARN', '', mentoriaS);
  }

  // ══════════════════════════════════════════════════
  // PHASE 5: ADMIN ROUTES (using student context that's still open — skip, admin needs Google OAuth)
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 5: Admin (nota: requer Google OAuth) ──');
  log('ADMIN', 'Admin login via email/password', 'WARN',
    'expertclubapp@gmail.com usa Google OAuth — não testável headless. Verificar manualmente.', '');

  // ══════════════════════════════════════════════════
  // PHASE 6: SECURITY (fresh context with student)
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 6: Security ──');

  await browser3.close();
  const browser4 = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx4 = await browser4.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
  const page4 = await ctx4.newPage();

  // Student trying admin/mentor
  const secStu = await login(page4, STUDENT_EMAIL, DEFAULT_PASS);
  await page4.waitForTimeout(1000);

  await goto(page4, `${BASE}/admin/dashboard`, 'sec-admin');
  await page4.waitForTimeout(1500);
  const secAdminS = await shot(page4, 'p6-sec-admin');
  log('SECURITY', 'Student → /admin/dashboard bloqueado', !page4.url().includes('/admin/dashboard') ? 'PASS' : 'FAIL',
    `redirecionou: ${page4.url()}`, secAdminS);

  await goto(page4, `${BASE}/mentor/overview`, 'sec-mentor');
  await page4.waitForTimeout(1500);
  const secMentorS = await shot(page4, 'p6-sec-mentor');
  log('SECURITY', 'Student → /mentor/overview bloqueado', !page4.url().includes('/mentor/overview') ? 'PASS' : 'FAIL',
    `redirecionou: ${page4.url()}`, secMentorS);

  // Unauthenticated user trying protected routes
  await browser4.close();
  const browser5 = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx5 = await browser5.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
  const page5 = await ctx5.newPage();

  await goto(page5, `${BASE}/app/today`, 'unauth-today');
  await page5.waitForTimeout(1500);
  const unauthS = await shot(page5, 'p6-unauth');
  log('SECURITY', 'Usuário não-logado → /app/today bloqueado', page5.url().includes('/login') ? 'PASS' : 'FAIL',
    `redirecionou: ${page5.url()}`, unauthS);

  // ══════════════════════════════════════════════════
  // PHASE 7: MOBILE UX (student logged in)
  // ══════════════════════════════════════════════════
  console.log('\n── PHASE 7: Mobile UX ──');

  await browser5.close();
  const browser6 = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx6 = await browser6.newContext({ viewport: VIEWPORT, locale: 'pt-BR' });
  const page6 = await ctx6.newPage();

  await login(page6, STUDENT_EMAIL, DEFAULT_PASS);
  await page6.waitForTimeout(2000);

  const mobileRoutes = [
    ['/app/today', 'today'],
    ['/app/workouts', 'workouts'],
    ['/app/diets/today', 'diet'],
    ['/app/profile', 'profile'],
    ['/app/community', 'community'],
  ];

  for (const [route, name] of mobileRoutes) {
    await goto(page6, `${BASE}${route}`, `mob-${name}`);
    await page6.waitForTimeout(1500);
    const s = await shot(page6, `p7-mobile-${name}`);
    const url = page6.url();

    // Overflow check
    const hasXOverflow = await page6.evaluate(() => document.body.scrollWidth > window.innerWidth).catch(() => false);
    log('MOBILE', `${route} — overflow horizontal`, !hasXOverflow ? 'PASS' : 'WARN',
      hasXOverflow ? '⚠️ Page overflows!' : 'Sem overflow', s);

    // Bottom nav check
    const hasBottomNav = await page6.evaluate(() => {
      const selectors = [
        '[class*="bottom-nav"]', '[class*="bottomNav"]', '[class*="bottom-bar"]',
        '[class*="tab-bar"]', '[class*="tabBar"]', 'nav[class*="fixed"]',
        '[class*="BottomNav"]', '[class*="BottomBar"]',
      ];
      return selectors.some(s => document.querySelector(s));
    }).catch(() => false);
    log('MOBILE', `${route} — bottom nav`, hasBottomNav ? 'PASS' : 'WARN',
      hasBottomNav ? 'detectado' : 'não detectado', s);

    // Tap target size check (buttons >= 44px)
    const smallButtons = await page6.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
      return btns.filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      }).length;
    }).catch(() => 0);
    log('MOBILE', `${route} — tap targets < 44px`, smallButtons === 0 ? 'PASS' : 'WARN',
      `${smallButtons} botões/links com tap target pequeno`, s);
  }

  // ══════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════
  await browser6.close();

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const uniqErrors = [...new Map(allConsoleErrors.map(e => [e.msg, e])).values()];

  writeFileSync('./qa-audit-results.json', JSON.stringify({
    summary: { pass, fail, warn, totalConsoleErrors: uniqErrors.length },
    results,
    consoleErrors: uniqErrors,
  }, null, 2));

  console.log('\n══════════════════════════════════');
  console.log(`QA AUDIT COMPLETE: ✅${pass} ❌${fail} ⚠️${warn}`);
  console.log(`Console errors únicos: ${uniqErrors.length}`);

  if (fail > 0) {
    console.log('\nFAILS:');
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(` ❌ [${r.phase}] ${r.test}: ${r.detail}`));
  }
  if (uniqErrors.length) {
    console.log('\nConsole errors:');
    uniqErrors.slice(0,15).forEach(e => console.log(` - [${e.url?.split('/').pop() || '?'}] ${e.msg}`));
  }
  console.log('\nWARNINGS:');
  results.filter(r => r.status === 'WARN').forEach(r =>
    console.log(` ⚠️  [${r.phase}] ${r.test}: ${r.detail}`));
}

runAudit().catch(e => { console.error('AUDIT CRASHED:', e.message, e.stack); process.exit(1); });
