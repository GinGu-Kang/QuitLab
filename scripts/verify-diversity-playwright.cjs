const { request } = require('playwright');

const baseUrl = process.env.APP_URL || 'http://localhost:3000';
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

function pick(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

function scoreProfile(rng, mode) {
  const base = Array.from({ length: 12 }, () => 1 + Math.floor(rng() * 5));

  if (mode === 'tech') {
    base[0] = 4; base[3] = 5; base[7] = 4; base[11] = 4;
  } else if (mode === 'operator') {
    base[2] = 4; base[5] = 5; base[8] = 5; base[9] = 4;
  } else if (mode === 'creative') {
    base[1] = 5; base[7] = 5; base[11] = 5;
  } else if (mode === 'leader') {
    base[2] = 4; base[4] = 4; base[10] = 5;
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
    nickname: `seed-${index}`
  };
}

async function main() {
  const api = await request.newContext({ baseURL: baseUrl });
  const distinct = new Map();
  const samples = [];

  for (let index = 0; index < 40; index += 1) {
    const scenario = buildScenario(index);
    const response = await api.post('/api/diagnose', { data: scenario });
    if (!response.ok()) {
      throw new Error(`Scenario ${index} failed with status ${response.status()}`);
    }
    const payload = await response.json();
    const topName = payload.results?.[0]?.item?.name;
    if (!topName) {
      throw new Error(`Scenario ${index} returned no top result`);
    }
    distinct.set(topName, {
      scenario: index,
      career: scenario.hardFilter.career,
      capital: scenario.hardFilter.capital
    });
    samples.push({ index, topName, career: scenario.hardFilter.career });
  }

  console.log(`distinct_top1=${distinct.size}`);
  console.log('sample_results=');
  console.log(samples.slice(0, 12).map((item) => `${item.index}: ${item.topName} (${item.career})`).join('\n'));
  console.log('distinct_items=');
  console.log([...distinct.keys()].sort().join('\n'));

  if (distinct.size < 8) {
    throw new Error(`Expected at least 8 distinct top results, got ${distinct.size}`);
  }

  await api.dispose();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
