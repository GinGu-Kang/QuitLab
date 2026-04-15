import type { DiagnoseInput } from '@/types';

const careers = ['it', 'marketing', 'sales', 'finance', 'manufacturing', 'design', 'food', 'education', 'medical', 'logistics', 'realestate', 'public', 'service', 'office'] as const;
const regions = ['metro', 'city', 'town', 'rural'] as const;
const licenses = ['none', 'food', 'beauty', 'pro', 'etc'] as const;
const timings = ['now', '3m', '6m', '1y'] as const;
const families = ['single', 'dual', 'sole'] as const;
const capitals = [1000, 3000, 7000, 15000, 30000] as const;
const incomes = [300, 500, 800, 1000] as const;

function createRng(seed: number) {
  let value = seed >>> 0;
  return function next() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function scoreProfile(rng: () => number, mode: 'tech' | 'operator' | 'creative' | 'leader') {
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

function personalityProfile(mode: 'tech' | 'operator' | 'creative' | 'leader'): DiagnoseInput['personalityAnswers'] {
  if (mode === 'tech') return ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a'];
  if (mode === 'operator') return ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'b'];
  if (mode === 'creative') return ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a', 'b'];
  return ['a', 'a', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a'];
}

export function buildValidationScenario(index: number): DiagnoseInput {
  const rng = createRng(1000 + index * 97);
  const mode = ['tech', 'operator', 'creative', 'leader'][index % 4] as 'tech' | 'operator' | 'creative' | 'leader';

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

export const MASTER_DATA_VALIDATION_SCENARIO_COUNT = 40;
