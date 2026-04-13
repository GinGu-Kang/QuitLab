const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = process.env.APP_URL || 'http://localhost:3000';
const screenshotDir = path.resolve(process.cwd(), 'artifacts/screenshots');
const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function save(page, name, fullPage = true) {
  const target = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: target, fullPage });
  console.log(`saved ${target}`);
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromeExecutable) ? chromeExecutable : undefined
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    locale: 'ko-KR'
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await save(page, '16-admin-login');
  await page.locator('input[type="email"]').fill('admin@local.dev');
  await page.locator('input[type="password"]').fill('admin1234!');
  await page.getByRole('button', { name: /로그인/ }).click();
  await page.waitForTimeout(1000);

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=관리자 모드', { timeout: 120000 });
  await page.waitForSelector('text=전체 참여자', { timeout: 120000 });
  await save(page, '17-admin-dashboard');

  await page.goto(`${baseUrl}/admin/customers`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=고객 DB', { timeout: 120000 });
  await save(page, '18-admin-customers');

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
