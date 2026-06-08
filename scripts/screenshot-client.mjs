import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOTS_DIR = 'c:/Users/vAito/Desktop/RankEX/screenshots';
const BASE_URL = 'https://rankex-app-dev.web.app';
const EMAIL = 'client@test.rankex';
const PASSWORD = 'ClientTest1';

const VIEWPORT = { width: 390, height: 844 };

async function shot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, name);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`[OK] Saved: ${name}`);
}

async function waitAndClick(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // ─────────────────────────────────────────────────────────────────────────
  // 0. Login page
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Navigating to login page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(1500);
  await shot(page, '00_login.png');

  // ─────────────────────────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Logging in...');
  // Fill email
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="mail" i]');
  if (!emailInput) throw new Error('Email input not found');
  await emailInput.fill(EMAIL);

  // Fill password
  const passInput = await page.$('input[type="password"]');
  if (!passInput) throw new Error('Password input not found');
  await passInput.fill(PASSWORD);

  // Submit
  const submitBtn = await page.$('button[type="submit"], button:has-text("Accedi"), button:has-text("Login"), button:has-text("Entra")');
  if (!submitBtn) throw new Error('Submit button not found');
  await submitBtn.click();

  // Wait for navigation after login
  console.log('Waiting for post-login navigation...');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(2000);

  // Check if password change screen
  const pageContent = await page.content();
  if (pageContent.includes('Cambia password') || pageContent.includes('mustChangePassword')) {
    console.log('Password change screen detected — skipping');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Hub home con pentagono
  // ─────────────────────────────────────────────────────────────────────────
  await sleep(2000);
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  await shot(page, '01_hub_home.png');

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: find nav item by text
  // ─────────────────────────────────────────────────────────────────────────
  async function clickNavItem(labelPatterns) {
    for (const pattern of labelPatterns) {
      try {
        const el = await page.$(`text="${pattern}"`);
        if (el) {
          await el.click();
          await sleep(1500);
          return true;
        }
      } catch (e) {}
    }
    // Try case-insensitive via evaluate
    for (const pattern of labelPatterns) {
      try {
        const found = await page.evaluate((txt) => {
          const all = document.querySelectorAll('button, a, [role="tab"], nav *');
          for (const el of all) {
            if (el.textContent.trim().toUpperCase() === txt.toUpperCase()) {
              el.click();
              return true;
            }
          }
          return false;
        }, pattern);
        if (found) {
          await sleep(1500);
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. TEST section
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking TEST...');
  const testClicked = await clickNavItem(['TEST', 'Test', 'TEST FISICI', 'Tests']);
  if (!testClicked) console.warn('TEST nav item not found, trying direct selector');
  await sleep(1500);
  await shot(page, '02_test_fisici.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 3. TROFEI section
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking TROFEI...');
  await clickNavItem(['TROFEI', 'Trofei', 'BADGES', 'Badge', 'Badges']);
  await sleep(1500);
  await shot(page, '03_trofei.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CALENDARIO section
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking CALENDARIO...');
  await clickNavItem(['CALENDARIO', 'Calendario', 'CALENDAR']);
  await sleep(1500);
  await shot(page, '04_calendario.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 5. SCHEDA section
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking SCHEDA...');
  await clickNavItem(['SCHEDA', 'Scheda', 'WORKOUT', 'Workout', 'ALLENAMENTO']);
  await sleep(1500);
  await shot(page, '05_scheda.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 6. PROFILO → sub-tab AVATAR
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking PROFILO...');
  await clickNavItem(['PROFILO', 'Profilo', 'PROFILE', 'Profile']);
  await sleep(1500);
  // Try to click AVATAR sub-tab
  await clickNavItem(['AVATAR', 'Avatar']);
  await sleep(1000);
  await shot(page, '06_profilo_avatar.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Sub-tab ATTIVITA
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking ATTIVITÀ...');
  await clickNavItem(['ATTIVITÀ', 'Attività', 'ATTIVITA', 'Attivita', 'ACTIVITY']);
  await sleep(1000);
  await shot(page, '07_profilo_attivita.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Sub-tab MISURE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking MISURE...');
  await clickNavItem(['MISURE', 'Misure', 'MEASUREMENTS']);
  await sleep(1000);
  await shot(page, '08_profilo_misure.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Sub-tab TEMA
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking TEMA...');
  await clickNavItem(['TEMA', 'Tema', 'THEME', 'Theme']);
  await sleep(1000);
  await shot(page, '09_profilo_tema.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Sub-tab ACCOUNT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Clicking ACCOUNT...');
  await clickNavItem(['ACCOUNT', 'Account']);
  await sleep(1000);
  await shot(page, '10_profilo_account.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 11. Tema Carbon: go back to hub, then tema, select Carbon, screenshot hub
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Setting theme to Carbon...');
  // Go to TEMA sub-tab first
  await clickNavItem(['PROFILO', 'Profilo', 'PROFILE', 'Profile']);
  await sleep(800);
  await clickNavItem(['TEMA', 'Tema', 'THEME', 'Theme']);
  await sleep(800);

  // Try to click Carbon theme option
  const carbonClicked = await page.evaluate(() => {
    const all = document.querySelectorAll('button, div[role="button"], [data-theme], label');
    for (const el of all) {
      const txt = el.textContent.trim().toLowerCase();
      if (txt === 'carbon' || txt.includes('carbon')) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log('Carbon theme clicked:', carbonClicked);
  await sleep(1500);

  // Go to hub
  await clickNavItem(['HOME', 'Hub', 'HUB', 'Home', 'DASHBOARD']);
  await sleep(1500);
  await shot(page, '11_tema_carbon_hub.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 12. Carbon + TEST
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Carbon theme + TEST...');
  await clickNavItem(['TEST', 'Test', 'TEST FISICI']);
  await sleep(1500);
  await shot(page, '12_tema_carbon_test.png');

  // ─────────────────────────────────────────────────────────────────────────
  // 13. Tema Midnight
  // ─────────────────────────────────────────────────────────────────────────
  console.log('Setting theme to Midnight...');
  await clickNavItem(['PROFILO', 'Profilo', 'PROFILE', 'Profile']);
  await sleep(800);
  await clickNavItem(['TEMA', 'Tema', 'THEME', 'Theme']);
  await sleep(800);

  const midnightClicked = await page.evaluate(() => {
    const all = document.querySelectorAll('button, div[role="button"], [data-theme], label');
    for (const el of all) {
      const txt = el.textContent.trim().toLowerCase();
      if (txt === 'midnight' || txt.includes('midnight')) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log('Midnight theme clicked:', midnightClicked);
  await sleep(1500);

  await clickNavItem(['HOME', 'Hub', 'HUB', 'Home', 'DASHBOARD']);
  await sleep(1500);
  await shot(page, '13_tema_midnight_hub.png');

  // ─────────────────────────────────────────────────────────────────────────
  // Done
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\nAll screenshots saved to:', SCREENSHOTS_DIR);
  await browser.close();
})().catch(async (err) => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
