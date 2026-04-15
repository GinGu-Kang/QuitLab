import { COMPETENCY_KEYS, type DraftStartupItem } from '@/types';

export type CatalogFormValue = Omit<DraftStartupItem, 'draftId' | 'releaseId' | 'id'> & {
  id?: number;
};

function getNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export function parseCatalogItemFormData(formData: FormData): CatalogFormValue {
  return {
    id: getNumber(formData, 'id') ?? undefined,
    sourceItemId: getNumber(formData, 'sourceItemId'),
    rowStatus: getString(formData, 'rowStatus') === 'inactive' ? 'inactive' : 'active',
    category: getString(formData, 'category'),
    name: getString(formData, 'name'),
    coreSkills: getString(formData, 'coreSkills'),
    investmentRange: getString(formData, 'investmentRange'),
    investmentMin: getNumber(formData, 'investmentMin') ?? 0,
    investmentMax: getNumber(formData, 'investmentMax'),
    competencyScores: COMPETENCY_KEYS.reduce((acc, key) => {
      acc[key] = getNumber(formData, `competency_${key}`) ?? 1;
      return acc;
    }, {} as DraftStartupItem['competencyScores']),
    operationType: getString(formData, 'operationType'),
    requiredStaff: getString(formData, 'requiredStaff'),
    weekendWork: getString(formData, 'weekendWork'),
    workLifeBalance: getNumber(formData, 'workLifeBalance') ?? 1,
    seasonality: getString(formData, 'seasonality'),
    requiredLicense: getString(formData, 'requiredLicense'),
    avgMonthlyRevenue: getString(formData, 'avgMonthlyRevenue'),
    operatingMargin: getString(formData, 'operatingMargin'),
    breakeven: getString(formData, 'breakeven'),
    competitionLevel: getNumber(formData, 'competitionLevel') ?? 1,
    differentiationRoom: getNumber(formData, 'differentiationRoom') ?? 1,
    closureRate: getString(formData, 'closureRate'),
    growthPotential: getNumber(formData, 'growthPotential') ?? 1,
    entryBarrier: getNumber(formData, 'entryBarrier') ?? 1
  };
}

export function buildEmptyCatalogItem(category?: string): CatalogFormValue {
  return {
    id: 0,
    sourceItemId: null,
    rowStatus: 'active',
    category: category ?? '',
    name: '',
    coreSkills: '',
    investmentRange: '',
    investmentMin: 0,
    investmentMax: null,
    competencyScores: {
      analytical: 3,
      creativity: 3,
      interpersonal: 3,
      tech: 3,
      sales: 3,
      selfManagement: 3,
      risk: 3,
      trend: 3,
      stamina: 3,
      finance: 3,
      leadership: 3,
      content: 3
    },
    operationType: '',
    requiredStaff: '',
    weekendWork: '',
    workLifeBalance: 3,
    seasonality: '',
    requiredLicense: '없음',
    avgMonthlyRevenue: '',
    operatingMargin: '',
    breakeven: '',
    competitionLevel: 3,
    differentiationRoom: 3,
    closureRate: '',
    growthPotential: 3,
    entryBarrier: 3
  };
}
