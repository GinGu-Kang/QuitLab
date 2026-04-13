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

async function clickButtonByText(page, texts) {
  for (const text of texts) {
    const locator = page.getByRole('button', { name: new RegExp(text) }).first();
    if (await locator.count()) {
      await locator.click();
      return;
    }
  }
  throw new Error(`Unable to find button with texts: ${texts.join(', ')}`);
}

async function clickTabByText(page, text) {
  const locator = page.getByRole('tab', { name: new RegExp(text) }).first();
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  await locator.click();
}

async function waitForUrlContains(page, part) {
  await page.waitForURL((url) => url.toString().includes(part), { timeout: 120000 });
}

function getLatestSessionId() {
  const storagePath = path.resolve(process.cwd(), '.local-data/storage.json');
  const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
  const latest = storage.results[storage.results.length - 1];
  return latest ? latest.sessionId : null;
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

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await save(page, '01-landing');

  await clickButtonByText(page, ['내 운명 가게 찾기']);
  await waitForUrlContains(page, '/diagnose/step-1');
  await save(page, '02-step1-hard-filter');

  const step1Answers = [
    '3,000~7,000만원',
    '적극 활용',
    '3개월 안',
    '맞벌이',
    '300~500만원',
    'IT/개발',
    '수도권',
    '없음'
  ];

  for (const answer of step1Answers) {
    await page.getByRole('button', { name: new RegExp(answer) }).first().click();
  }

  await waitForUrlContains(page, '/diagnose/step-2');
  await save(page, '03-step2-competency');

  const step2Choices = [
    '즐겁다, 바로 시작',
    '데이터부터 뜯어보겠다',
    '3개는 낼 수 있다',
    '재미있겠다, 해볼만',
    '부드럽게 거절 후 대안 탐색',
    '준비하면 할 수 있다',
    '대부분 가능, 일부 도움 필요',
    '시간 들이면 된다',
    '부담되지만 할 수 있다',
    '처음엔 어색하지만 적응',
    '최소한은 한다',
    '힘들지만 버틴다',
    '긴장되지만 감수한다',
    '불안하지만 1년은 본다',
    '빨리 테스트해보겠다',
    '주 3~4회 정기적으로',
    '힘들지만 할 수 있다',
    '적응 기간 필요',
    '계산기 두드리면 된다',
    '홈택스로 해봤다',
    '대화로 풀어보겠다',
    '해본 적은 없지만 할 수 있다',
    '시간 들이면 할 수 있다',
    '참고할 게 있으면 가능'
  ];

  for (const choice of step2Choices) {
    await page.getByRole('button', { name: new RegExp(choice.replace(/[()[\]/]/g, '\\$&')) }).first().click();
  }

  await waitForUrlContains(page, '/diagnose/step-3');
  await save(page, '04-step3-personality');

  const step3Choices = [
    /집\/사무실에서 컴퓨터 앞에서/,
    /혼자서 끝까지/,
    /들쭉날쭉해도 잭팟 가능/,
    /내가 원할 때 일하고 싶다/,
    /주말은 반드시 쉬어야/,
    /앉아서 머리 쓰는 게 좋다/,
    /직원 10명 이상, 법인 전환, 투자유치/,
    /에너지가 소모된다/,
    /절대 불가, 30% 이하만/,
    /기술이 핵심 경쟁력이어야/
  ];

  for (const choice of step3Choices) {
    await page.getByRole('button', { name: choice }).first().click();
  }

  await page.waitForSelector('text=모든 진단 완료!');
  await save(page, '05-step3-name');

  await page.getByPlaceholder('닉네임 입력').fill('테스터');
  await clickButtonByText(page, ['분석 결과 보기']);

  await waitForUrlContains(page, '/diagnose/loading');
  await page.waitForTimeout(800);
  await save(page, '06-loading');

  try {
    await page.waitForURL((url) => url.toString().includes('/ad?sid='), { timeout: 12000 });
  } catch (error) {
    const fallbackSessionId = getLatestSessionId();
    if (!fallbackSessionId) {
      throw error;
    }
    await page.goto(`${baseUrl}/ad?sid=${fallbackSessionId}`, { waitUntil: 'networkidle' });
  }
  await save(page, '07-ad');
  await page.waitForTimeout(16000);
  await clickButtonByText(page, ['분석 결과 확인하기']);

  await waitForUrlContains(page, '/result/');
  await page.waitForLoadState('networkidle');
  const resultUrl = page.url();
  const sessionId = resultUrl.split('/result/')[1];
  await save(page, '08-result-match');

  await clickTabByText(page, '분석근거');
  await page.waitForSelector('text=왜 이 자영업이 추천되었을까?');
  await save(page, '09-result-why');

  await clickTabByText(page, '가이드');
  await page.waitForSelector('text=실행 로드맵');
  await save(page, '10-result-guide');

  await clickTabByText(page, '미래상상');
  await page.waitForSelector('text=분석 결과 저장하기');
  await save(page, '11-result-future');

  await page.getByPlaceholder('이름').fill('홍길동');
  await page.getByPlaceholder('이메일').fill('hong@example.com');
  await page.getByPlaceholder('전화번호').fill('010-1234-5678');
  await page.getByLabel(/개인정보 수집 및 이용에 동의합니다/).check();
  await page.getByLabel(/창업 관련 유용한 정보를 받아보겠습니다/).check();
  await clickButtonByText(page, ['결과 받기']);
  await page.waitForTimeout(1500);
  await save(page, '12-result-future-after-submit');

  const storage = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '.local-data/storage.json'), 'utf8'));
  const contact = storage.contacts.find((entry) => entry.sessionId === sessionId);
  if (!contact) {
    throw new Error('Unable to find saved contact in local storage.');
  }

  await page.goto(`${baseUrl}/privacy`, { waitUntil: 'networkidle' });
  await save(page, '13-privacy');

  await page.goto(`${baseUrl}/terms`, { waitUntil: 'networkidle' });
  await save(page, '14-terms');

  await page.goto(`${baseUrl}/unsubscribe/${contact.unsubscribeToken}`, { waitUntil: 'networkidle' });
  await save(page, '15-unsubscribe');

  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await save(page, '16-admin-login');
  await page.locator('input[type="email"]').fill('admin@local.dev');
  await page.locator('input[type="password"]').fill('admin1234!');
  await clickButtonByText(page, ['로그인']);
  await page.waitForTimeout(1000);
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=관리자 모드', { timeout: 120000 });
  await page.waitForSelector('text=전체 참여자', { timeout: 120000 });
  await save(page, '17-admin-dashboard');

  await page.goto(`${baseUrl}/admin/customers`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=고객 DB');
  await save(page, '18-admin-customers');

  console.log(`sessionId=${sessionId}`);
  console.log(`unsubscribeToken=${contact.unsubscribeToken}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
