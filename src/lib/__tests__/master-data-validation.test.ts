import { describe, expect, it } from 'vitest';

import { DEFAULT_MASTER_DATA, toDraftMasterData } from '@/lib/master-data-defaults';
import { buildPublishedMasterData, validateMasterDataDraft } from '@/lib/master-data-validation';

describe('master-data validation', () => {
  it('builds a published snapshot from active draft rows only', () => {
    const draftData = toDraftMasterData({
      ...DEFAULT_MASTER_DATA,
      releaseId: 'release_test',
      version: 'v-test'
    });
    draftData.startupItems[0].rowStatus = 'inactive';

    const published = buildPublishedMasterData({
      releaseId: 'release_test',
      version: 'v-test',
      draftData
    });

    expect(published.startupItems).toHaveLength(DEFAULT_MASTER_DATA.startupItems.length - 1);
    expect(published.startupItems.some((item) => item.name === draftData.startupItems[0].name)).toBe(false);
  });

  it('reports structural errors for invalid draft items', () => {
    const draftData = toDraftMasterData({
      ...DEFAULT_MASTER_DATA,
      releaseId: 'release_invalid',
      version: 'v-invalid'
    });
    draftData.startupItems[0] = {
      ...draftData.startupItems[0],
      name: '',
      investmentMax: 10,
      investmentMin: 100,
      competencyScores: {
        ...draftData.startupItems[0].competencyScores,
        analytical: 9
      }
    };

    const report = validateMasterDataDraft({
      releaseId: 'release_invalid',
      version: 'v-invalid',
      draftData,
      baseline: DEFAULT_MASTER_DATA,
      allowedCategories: DEFAULT_MASTER_DATA.startupItems.map((item) => item.category)
    });

    expect(report.issues.some((issue) => issue.code === 'missing_required_field')).toBe(true);
    expect(report.issues.some((issue) => issue.code === 'invalid_investment_range')).toBe(true);
    expect(report.issues.some((issue) => issue.code === 'invalid_competency_score')).toBe(true);
  });
});
