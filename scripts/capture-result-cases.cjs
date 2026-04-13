const fs = require('fs');
const path = require('path');
const { chromium, request } = require('playwright');

const baseUrl = process.env.APP_URL || 'http://localhost:3000';
const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputRoot = path.resolve(process.cwd(), 'artifacts/result-cases');

const careers = ['it', 'marketing', 'sales', 'finance', 'manufacturing', 'design', 'food', 'education', 'medical', 'logistics', 'realestate', 'public', 'service', 'office'];
const regions = ['metro', 'city', 'town', 'rural'];
const licenses = ['none', 'food', 'beauty', 'pro', 'etc'];
const timings = ['now', '3m', '6m', '1y'];
const families = ['single', 'dual', 'sole'];
const capitals = [1000, 3000, 7000, 15000, 30000];
const incomes = [300, 500, 800, 1000];

function createRng(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function scoreProfile(rng, mode) {
  const base = Array.from({ length: 12 }, () => 1 + Math.floor(rng() * 5));

  if (mode === 'tech') {
    base[0] = 4;
    base[3] = 5;
    base[7] = 4;
    base[11] = 4;
  } else if (mode === 'operator') {
    base[2] = 4;
    base[5] = 5;
    base[8] = 5;
    base[9] = 4;
  } else if (mode === 'creative') {
    base[1] = 5;
    base[7] = 5;
    base[11] = 5;
  } else if (mode === 'leader') {
    base[2] = 4;
    base[4] = 4;
    base[10] = 5;
  }

  return base;
}

function personalityProfile(mode) {
  if (mode === 'tech') return ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a'];
  if (mode === 'operator') return ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'b'];
  if (mode === 'creative') return ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a', 'b'];
  if (mode === 'leader') return ['a', 'a', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a'];
  return ['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'];
}

function buildScenario(index) {
  const rng = createRng(1000 + index * 97);
  const mode = ['tech', 'operator', 'creative', 'leader'][index % 4];

  return {
    hardFilter: {
      capital: capitals[index % capitals.length],
      region: regions[index % regions.length],
      license: licenses[index % licenses.length],
      timing: timings[index % timings.length],
      family: families[index % families.length],
      income: incomes[index % incomes.length],
      career: careers[index % careers.length],
      loan: rng() > 0.45
    },
    competencyScores: scoreProfile(rng, mode),
    personalityAnswers: personalityProfile(mode),
    nickname: `case-${index}`
  };
}

function nowStamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function sanitizeFileName(value) {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function collectDistinctCases(limit) {
  const api = await request.newContext({ baseURL: baseUrl });
  const selected = [];
  const seen = new Set();

  try {
    for (let index = 0; index < 80 && selected.length < limit; index += 1) {
      const scenario = buildScenario(index);
      const response = await api.post('/api/diagnose', { data: scenario });
      if (!response.ok()) {
        throw new Error(`Scenario ${index} failed with status ${response.status()}`);
      }

      const payload = await response.json();
      const topResult = payload.results?.[0];
      const topName = topResult?.item?.name;

      if (!topName || seen.has(topName)) {
        continue;
      }

      seen.add(topName);
      selected.push({
        index,
        sessionId: payload.sessionId,
        topName,
        score: Math.round(topResult.finalScore),
        scenario
      });
    }
  } finally {
    await api.dispose();
  }

  if (selected.length < limit) {
    throw new Error(`Expected ${limit} distinct result cases, got ${selected.length}`);
  }

  return selected;
}

async function captureCaseScreenshots(cases, outputDir) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromeExecutable) ? chromeExecutable : undefined
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      locale: 'ko-KR'
    });

    for (let position = 0; position < cases.length; position += 1) {
      const item = cases[position];
      const page = await context.newPage();
      await page.goto(`${baseUrl}/result/${item.sessionId}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('text=129개 업종 × 12개 역량 × 현실 조건 교차 분석 결과', { timeout: 30000 });
      const fileName = `${String(position + 1).padStart(2, '0')}-scenario-${item.index}-${sanitizeFileName(item.topName)}.png`;
      const target = path.join(outputDir, fileName);
      await page.screenshot({ path: target, fullPage: true });
      item.fileName = fileName;
      console.log(`saved ${target}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

function writeReport(cases, outputDir) {
  const lines = [
    '# Result Case Capture',
    '',
    `- Generated: ${new Date().toISOString()}`,
    `- Base URL: ${baseUrl}`,
    `- Cases: ${cases.length}`,
    '',
    '| No | Screenshot | Top Result | Score | Career | Capital | License | Timing | Family | Income | Loan | Session |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  ];

  for (let position = 0; position < cases.length; position += 1) {
    const item = cases[position];
    const filter = item.scenario.hardFilter;
    lines.push(
      `| ${position + 1} | ${item.fileName} | ${item.topName} | ${item.score} | ${filter.career} | ${filter.capital} | ${filter.license} | ${filter.timing} | ${filter.family} | ${filter.income} | ${filter.loan ? 'Y' : 'N'} | ${item.sessionId} |`
    );
  }

  fs.writeFileSync(path.join(outputDir, 'README.md'), `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const stamp = nowStamp();
  const outputDir = path.join(outputRoot, stamp);
  fs.mkdirSync(outputDir, { recursive: true });

  const cases = await collectDistinctCases(10);
  await captureCaseScreenshots(cases, outputDir);
  writeReport(cases, outputDir);

  console.log(`output_dir=${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
