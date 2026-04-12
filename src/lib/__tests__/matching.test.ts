import { describe, expect, it } from 'vitest';

import { matchStartups } from '@/lib/matching';
import type { DiagnoseInput } from '@/types';

const baseInput: DiagnoseInput = {
  hardFilter: {
    capital: 5000,
    region: 'metro',
    license: 'none',
    timing: '3m',
    family: 'single',
    income: 300,
    career: 'it',
    loan: false
  },
  competencyScores: [4, 3, 3, 5, 2, 4, 3, 4, 3, 3, 2, 4],
  personalityAnswers: ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'a']
};

describe('matchStartups', () => {
  it('returns 5 sorted results', () => {
    const results = matchStartups(baseInput);
    expect(results).toHaveLength(5);
    expect(results[0].finalScore).toBeGreaterThanOrEqual(results[1].finalScore);
  });

  it('excludes items above the available capital', () => {
    const results = matchStartups({
      ...baseInput,
      hardFilter: {
        ...baseInput.hardFilter,
        capital: 1000,
        loan: false
      }
    });

    expect(results.every((entry) => entry.item.investmentMin <= 1000)).toBe(true);
  });

  it('is deterministic for the same answers', () => {
    const first = matchStartups(baseInput);
    const second = matchStartups(baseInput);
    expect(first).toEqual(second);
  });
});
