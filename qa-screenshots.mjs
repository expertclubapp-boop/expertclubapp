import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login to set session...");
  await page.goto('http://localhost:5174/login');
  
  // Try to login as Admin
  await page.fill('input[type="email"]', 'admin@expertclub.test');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Entrar"), button[type="submit"]');
  await page.waitForTimeout(3000);

  // 1. Admin Workout Assignment
  console.log("Taking Admin Workout Assignment screenshot...");
  await page.goto('http://localhost:5174/admin/users');
  await page.waitForTimeout(2000);
  // Just click the first user
  const userRow = await page.locator('.ec-card, table tr, button').filter({ hasText: 'aluno' }).first();
  if (await userRow.count() > 0) {
    await userRow.click();
    await page.waitForTimeout(2000);
    // Click Treino tab
    await page.click('button:has-text("Treino")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa/prescriptors-sprints/admin-workout-assignment.png' });
    
    // 2. Admin Progression Panel
    console.log("Taking Admin Progression Panel screenshot...");
    await page.screenshot({ path: 'qa/prescriptors-sprints/admin-student-progression.png' });
  } else {
    await page.goto('http://localhost:5174/admin/dashboard');
    await page.screenshot({ path: 'qa/prescriptors-sprints/admin-workout-assignment.png' });
    await page.screenshot({ path: 'qa/prescriptors-sprints/admin-student-progression.png' });
  }

  // 3. Admin Food Library
  console.log("Taking Admin Food Library screenshot...");
  await page.goto('http://localhost:5174/admin/foods');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/prescriptors-sprints/admin-food-library.png' });

  // 4. Admin Diet Builder
  console.log("Taking Admin Diet Builder screenshot...");
  await page.goto('http://localhost:5174/admin/diets');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Novo"), button:has-text("Nova")').catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/prescriptors-sprints/admin-diet-builder.png' });

  // Logout
  await page.evaluate(() => localStorage.clear());
  await context.clearCookies();

  // Login as Student
  console.log("Navigating to login to set student session...");
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', 'aluno.ativo@expertclub.test');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Entrar"), button[type="submit"]');
  await page.waitForTimeout(3000);

  // 5. Student Workout Execution History
  console.log("Taking Student Workout Execution History screenshot...");
  await page.goto('http://localhost:5174/app/workouts');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("INICIAR TREINO")').catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/prescriptors-sprints/student-workout-execution-history.png' });

  // 6. Student Diet Real Flow
  console.log("Taking Student Diet Real Flow screenshot...");
  await page.goto('http://localhost:5174/app/diets/today');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'qa/prescriptors-sprints/student-diet-real-flow.png' });

  await browser.close();
  console.log("Done.");
})();
