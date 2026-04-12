const { chromium } = require('playwright');
const fs = require('fs');

const baseUrl = process.env.APP_URL || 'http://localhost:3000';
const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromeExecutable) ? chromeExecutable : undefined
  });

  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'ko-KR' })).newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /내 운명 가게 찾기/ }).click();

  const step1 = ['3,000~7,000만원', '적극 활용', '3개월 안', '맞벌이', '300~500만원', 'IT/개발', '수도권', '없음'];
  for (const text of step1) {
    await page.getByRole('button', { name: new RegExp(text) }).first().click();
  }

  const step2 = ['즐겁다, 바로 시작', '데이터부터 뜯어보겠다', '3개는 낼 수 있다', '재미있겠다, 해볼만', '부드럽게 거절 후 대안 탐색', '준비하면 할 수 있다', '대부분 가능, 일부 도움 필요', '시간 들이면 된다', '부담되지만 할 수 있다', '처음엔 어색하지만 적응', '최소한은 한다', '힘들지만 버틴다', '긴장되지만 감수한다', '불안하지만 1년은 본다', '빨리 테스트해보겠다', '주 3~4회 정기적으로', '힘들지만 할 수 있다', '적응 기간 필요', '계산기 두드리면 된다', '홈택스로 해봤다', '대화로 풀어보겠다', '해본 적은 없지만 할 수 있다', '시간 들이면 할 수 있다', '참고할 게 있으면 가능'];
  for (const text of step2) {
    await page.getByRole('button', { name: new RegExp(text.replace(/[()[\]/]/g, '\\$&')) }).first().click();
  }

  const step3 = [/집\/사무실에서 컴퓨터 앞에서/, /혼자서 끝까지/, /들쭉날쭉해도 잭팟 가능/, /내가 원할 때 일하고 싶다/, /주말은 반드시 쉬어야/, /앉아서 머리 쓰는 게 좋다/, /직원 10명 이상, 법인 전환, 투자유치/, /에너지가 소모된다/, /절대 불가, 30% 이하만/, /기술이 핵심 경쟁력이어야/];
  for (const pattern of step3) {
    await page.getByRole('button', { name: pattern }).first().click();
  }

  await page.getByPlaceholder('닉네임 입력').fill('플검증');
  await page.getByRole('button', { name: /분석 결과 보기/ }).click();
  await page.waitForURL((url) => url.toString().includes('/ad?sid='), { timeout: 15000 });
  await page.waitForTimeout(16000);
  await page.getByRole('button', { name: /분석 결과 확인하기/ }).click();
  await page.waitForURL((url) => url.toString().includes('/result/'), { timeout: 30000 });
  await page.waitForSelector('text=129개 업종 × 12개 역량 × 현실 조건 교차 분석 결과', { timeout: 30000 });

  const topText = await page.locator('text=1위 추천').first().locator('..').textContent().catch(() => null);
  console.log(`result_url=${page.url()}`);
  console.log(`top_block=${(topText || '').trim().slice(0, 200)}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
