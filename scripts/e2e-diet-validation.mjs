import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'qa', 'diet-real-validation');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runTest() {
  const browser = await chromium.launch({ headless: false }); // run headful so user can see it too
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'student@expertclub.test');
  await page.fill('input[type="password"]', 'ExpertClubQA@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/today');

  // Go to /app/diets/today
  await page.goto('http://localhost:5173/app/diets/today');
  // Wait for the diet items to load. We look for the foods we added.
  await page.waitForSelector('text=Ovos inteiros');
  
  // Screenshot 390px
  await page.screenshot({ path: path.join(outDir, 'student-diet-today-real-390.png') });

  // Mark first item as completed. 
  // We'll click the row or the checkbox.
  // We look for a clickable element inside the first food item.
  // The structure is usually a row with the text.
  await page.locator('text=Ovos inteiros').click();
  // Wait a little for UI update and possible Firestore write
  await page.waitForTimeout(2000);

  // Take another screenshot after marking completed
  await page.screenshot({ path: path.join(outDir, 'student-diet-today-real-progress-390.png') });

  // Switch viewport to 430
  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'student-diet-today-real-430.png') });

  // Switch viewport to 1440
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'student-diet-today-real-1440.png') });

  // Back to 390 for other routes
  await page.setViewportSize({ width: 390, height: 844 });
  
  // Go to /app/diets
  await page.goto('http://localhost:5173/app/diets');
  await page.waitForSelector('text=Dieta QA Base');
  await page.screenshot({ path: path.join(outDir, 'student-diets-real-390.png') });

  // Go to /app/today
  await page.goto('http://localhost:5173/app/today');
  await page.waitForSelector('text=Dieta QA Base');
  await page.screenshot({ path: path.join(outDir, 'student-today-diet-progress-390.png') });

  await browser.close();
}

runTest().catch(console.error);
