import { MASTER_DATA_VALIDATION_SCENARIO_COUNT, buildValidationScenario } from '@/lib/master-data-scenarios';
import { matchStartups } from '@/lib/matching';
import {
  COMPETENCY_KEYS,
  type DraftStartupItem,
  type MasterDataDraftPayload,
  type MasterDataValidationIssue,
  type MasterDataValidationReport,
  type PublishedMasterData
} from '@/types';

const REQUIRED_ITEM_FIELDS: Array<keyof DraftStartupItem> = [
  'category',
  'name',
  'coreSkills',
  'investmentRange',
  'operationType',
  'requiredStaff',
  'weekendWork',
  'seasonality',
  'requiredLicense',
  'avgMonthlyRevenue',
  'operatingMargin',
  'breakeven',
  'closureRate'
];

function addIssue(
  issues: MasterDataValidationIssue[],
  issue: Omit<MasterDataValidationIssue, 'severity'> & { severity?: MasterDataValidationIssue['severity'] }
) {
  issues.push({
    severity: issue.severity ?? 'error',
    ...issue
  });
}

export function buildPublishedMasterData(versionedData: {
  releaseId: string;
  version: string;
  draftData: MasterDataDraftPayload;
}): PublishedMasterData {
  return {
    releaseId: versionedData.releaseId,
    version: versionedData.version,
    startupItems: versionedData.draftData.startupItems
      .filter((item) => item.rowStatus === 'active')
      .map(({ draftId: _draftId, releaseId: _releaseId, sourceItemId: _sourceItemId, rowStatus: _rowStatus, ...item }) => item),
    competencyQuestions: versionedData.draftData.competencyQuestions,
    hardFilters: versionedData.draftData.hardFilters,
    personalityQuestions: versionedData.draftData.personalityQuestions,
    careerSynergy: versionedData.draftData.careerSynergy,
    competencyGuide: versionedData.draftData.competencyGuide
  };
}

export function previewReleaseDiff(candidate: PublishedMasterData, baseline?: PublishedMasterData | null) {
  return Array.from({ length: MASTER_DATA_VALIDATION_SCENARIO_COUNT }, (_, scenarioIndex) => {
    const scenario = buildValidationScenario(scenarioIndex);
    const previousTop1 = baseline ? matchStartups(scenario, baseline)[0]?.item.name ?? null : null;
    const nextTop1 = matchStartups(scenario, candidate)[0]?.item.name ?? null;

    return {
      scenarioIndex,
      previousTop1,
      nextTop1,
      changed: previousTop1 !== nextTop1
    };
  });
}

export function validateMasterDataDraft(params: {
  releaseId: string;
  version: string;
  draftData: MasterDataDraftPayload;
  baseline?: PublishedMasterData | null;
  allowedCategories?: string[];
}): MasterDataValidationReport {
  const issues: MasterDataValidationIssue[] = [];
  const published = buildPublishedMasterData(params);
  const activeItems = params.draftData.startupItems.filter((item) => item.rowStatus === 'active');
  const allowedCategories = new Set(
    (params.allowedCategories && params.allowedCategories.length ? params.allowedCategories : activeItems.map((item) => item.category)).filter(Boolean)
  );

  const seenNames = new Set<string>();
  const seenItemIds = new Set<number>();
  const seenSourceIds = new Set<number>();

  activeItems.forEach((item) => {
    REQUIRED_ITEM_FIELDS.forEach((field) => {
      const value = item[field];
      if (typeof value === 'string' && !value.trim()) {
        addIssue(issues, {
          code: 'missing_required_field',
          message: `${item.name || item.draftId}의 ${field} 값이 비어 있습니다.`,
          field,
          itemName: item.name
        });
      }
    });

    if (item.investmentMin < 0 || (item.investmentMax != null && item.investmentMax < item.investmentMin)) {
      addIssue(issues, {
        code: 'invalid_investment_range',
        message: `${item.name}의 투자비 min/max 정합성이 맞지 않습니다.`,
        field: 'investmentMin',
        itemName: item.name
      });
    }

    if (!allowedCategories.has(item.category)) {
      addIssue(issues, {
        code: 'unknown_category',
        message: `${item.name}의 카테고리 "${item.category}"는 허용된 분류에 없습니다.`,
        field: 'category',
        itemName: item.name
      });
    }

    COMPETENCY_KEYS.forEach((key) => {
      const score = item.competencyScores[key];
      if (!Number.isFinite(score) || score < 1 || score > 5) {
        addIssue(issues, {
          code: 'invalid_competency_score',
          message: `${item.name}의 ${key} 점수는 1~5 범위여야 합니다.`,
          field: key,
          itemName: item.name
        });
      }
    });

    ['workLifeBalance', 'competitionLevel', 'differentiationRoom', 'growthPotential', 'entryBarrier'].forEach((field) => {
      const score = item[field as keyof DraftStartupItem];
      if (typeof score !== 'number' || score < 1 || score > 5) {
        addIssue(issues, {
          code: 'invalid_rating_score',
          message: `${item.name}의 ${field} 값은 1~5 범위여야 합니다.`,
          field,
          itemName: item.name
        });
      }
    });

    const normalizedName = item.name.trim().toLowerCase();
    if (normalizedName) {
      if (seenNames.has(normalizedName)) {
        addIssue(issues, {
          code: 'duplicate_name',
          message: `중복 업종명이 있습니다: ${item.name}`,
          field: 'name',
          itemName: item.name
        });
      }
      seenNames.add(normalizedName);
    }

    if (seenItemIds.has(item.id)) {
      addIssue(issues, {
        code: 'duplicate_item_id',
        message: `중복 업종 ID가 있습니다: ${item.id}`,
        field: 'id',
        itemName: item.name
      });
    }
    seenItemIds.add(item.id);

    if (item.sourceItemId != null) {
      if (seenSourceIds.has(item.sourceItemId)) {
        addIssue(issues, {
          code: 'duplicate_source_item_id',
          message: `중복 sourceItemId가 있습니다: ${item.sourceItemId}`,
          field: 'sourceItemId',
          itemName: item.name
        });
      }
      seenSourceIds.add(item.sourceItemId);
    }
  });

  let distinctTop1Count = 0;
  try {
    const distinct = new Set<string>();

    for (let scenarioIndex = 0; scenarioIndex < MASTER_DATA_VALIDATION_SCENARIO_COUNT; scenarioIndex += 1) {
      const scenario = buildValidationScenario(scenarioIndex);
      const results = matchStartups(scenario, published);
      if (!results.length) {
        addIssue(issues, {
          code: 'empty_result_set',
          message: `검증 시나리오 ${scenarioIndex}에서 결과가 0건입니다. hard filter 전량 탈락 가능성이 있습니다.`,
          severity: 'warning'
        });
        continue;
      }
      distinct.add(results[0].item.name);
    }

    distinctTop1Count = distinct.size;
    if (distinctTop1Count < 8) {
      addIssue(issues, {
        code: 'low_top1_diversity',
        message: `top1 다양성이 ${distinctTop1Count}개로 기준(8개) 미만입니다.`
      });
    }
  } catch (error) {
    addIssue(issues, {
      code: 'matching_validation_failed',
      message: `매칭 검증 실행에 실패했습니다: ${error instanceof Error ? error.message : 'unknown error'}`
    });
  }

  return {
    releaseId: params.releaseId,
    version: params.version,
    validatedAt: new Date().toISOString(),
    issueCount: issues.length,
    distinctTop1Count,
    issues,
    sampleDiff: previewReleaseDiff(published, params.baseline ?? null)
  };
}
