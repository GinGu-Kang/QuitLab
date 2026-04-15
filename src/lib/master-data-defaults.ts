import careerSynergyJson from '@/data/career-synergy.json';
import competencyGuideJson from '@/data/competency-guide.json';
import competencyQuestionsJson from '@/data/competency-questions.json';
import hardFiltersJson from '@/data/hard-filters.json';
import personalityQuestionsJson from '@/data/personality-questions.json';
import startupItemsJson from '@/data/startup-items.json';
import type {
  CareerSynergyMatrix,
  CompetencyGuide,
  CompetencyQuestion,
  HardFilter,
  MasterDataDraftPayload,
  PersonalityQuestion,
  PublishedMasterData,
  StartupItem
} from '@/types';

export const STATIC_MASTER_DATA_VERSION = 'json-fallback';
export const STATIC_MASTER_DATA_RELEASE_ID = 'static-json-fallback';

export const DEFAULT_MASTER_DATA: PublishedMasterData = {
  releaseId: STATIC_MASTER_DATA_RELEASE_ID,
  version: STATIC_MASTER_DATA_VERSION,
  startupItems: startupItemsJson as StartupItem[],
  competencyQuestions: competencyQuestionsJson as CompetencyQuestion[],
  hardFilters: hardFiltersJson as HardFilter[],
  personalityQuestions: personalityQuestionsJson as PersonalityQuestion[],
  careerSynergy: careerSynergyJson as CareerSynergyMatrix,
  competencyGuide: competencyGuideJson as CompetencyGuide[]
};

export function toDraftMasterData(data: PublishedMasterData): MasterDataDraftPayload {
  return {
    startupItems: data.startupItems.map((item) => ({
      ...item,
      draftId: `draft_item_${item.id}`,
      releaseId: data.releaseId,
      sourceItemId: item.id,
      rowStatus: 'active'
    })),
    competencyQuestions: data.competencyQuestions,
    hardFilters: data.hardFilters,
    personalityQuestions: data.personalityQuestions,
    careerSynergy: data.careerSynergy,
    competencyGuide: data.competencyGuide
  };
}
