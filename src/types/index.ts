export type CompetencyKey =
  | 'analytical'
  | 'creativity'
  | 'interpersonal'
  | 'tech'
  | 'sales'
  | 'selfManagement'
  | 'risk'
  | 'trend'
  | 'stamina'
  | 'finance'
  | 'leadership'
  | 'content';

export type CareerKey =
  | 'it'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'manufacturing'
  | 'design'
  | 'food'
  | 'education'
  | 'medical'
  | 'logistics'
  | 'realestate'
  | 'public'
  | 'service'
  | 'office';

export type HardFilterValue = string | number | boolean;
export type PersonalityChoice = 'a' | 'b';
export type ResultTabKey = 'match' | 'why' | 'guide' | 'future';

export interface CompetencyScoreMap {
  analytical: number;
  creativity: number;
  interpersonal: number;
  tech: number;
  sales: number;
  selfManagement: number;
  risk: number;
  trend: number;
  stamina: number;
  finance: number;
  leadership: number;
  content: number;
}

export const COMPETENCY_KEYS: CompetencyKey[] = [
  'analytical',
  'creativity',
  'interpersonal',
  'tech',
  'sales',
  'selfManagement',
  'risk',
  'trend',
  'stamina',
  'finance',
  'leadership',
  'content'
];

export const COMPETENCY_LABELS = [
  '분석력',
  '창의력',
  '대인관계',
  '기술활용',
  '영업력',
  '자기관리',
  '리스크',
  '트렌드',
  '체력',
  '재무관리',
  '리더십',
  '콘텐츠'
] as const;

export const COMPETENCY_FULL_LABELS = [
  '분석적 사고력',
  '창의력',
  '대인관계 능력',
  '기술 활용 능력',
  '영업/세일즈 능력',
  '자기관리/규율',
  '리스크 감수 성향',
  '트렌드 민감도',
  '체력/지구력',
  '재무관리 능력',
  '리더십/조직관리',
  '콘텐츠/커뮤니케이션'
] as const;

export const COMPETENCY_ICONS = [
  '🧠',
  '💡',
  '🤝',
  '📱',
  '💬',
  '⏰',
  '🎲',
  '👀',
  '💪',
  '💰',
  '👑',
  '📸'
] as const;

export const CAREER_OPTIONS: { key: CareerKey; label: string; icon: string }[] = [
  { key: 'it', label: 'IT/개발', icon: '💻' },
  { key: 'marketing', label: '마케팅/광고', icon: '📢' },
  { key: 'sales', label: '영업/세일즈', icon: '🤝' },
  { key: 'finance', label: '금융/회계', icon: '💰' },
  { key: 'manufacturing', label: '제조/생산', icon: '🏭' },
  { key: 'design', label: '디자인/크리에이티브', icon: '🎨' },
  { key: 'food', label: '요리/식품', icon: '🍳' },
  { key: 'education', label: '교육/강의', icon: '📚' },
  { key: 'medical', label: '의료/건강', icon: '🏥' },
  { key: 'logistics', label: '물류/유통', icon: '📦' },
  { key: 'realestate', label: '부동산', icon: '🏠' },
  { key: 'public', label: '공무원/공공', icon: '🏛️' },
  { key: 'service', label: '서비스직', icon: '🛎️' },
  { key: 'office', label: '사무/경영지원', icon: '📋' }
];

export interface StartupItem {
  id: number;
  category: string;
  name: string;
  coreSkills: string;
  investmentRange: string;
  investmentMin: number;
  investmentMax: number | null;
  competencyScores: CompetencyScoreMap;
  operationType: string;
  requiredStaff: string;
  weekendWork: string;
  workLifeBalance: number;
  seasonality: string;
  requiredLicense: string;
  avgMonthlyRevenue: string;
  operatingMargin: string;
  breakeven: string;
  competitionLevel: number;
  differentiationRoom: number;
  closureRate: string;
  growthPotential: number;
  entryBarrier: number;
}

export interface CompetencyQuestion {
  id: number;
  competency: CompetencyKey;
  competencyIndex: number;
  scenario: string;
  options: { score: number; text: string }[];
}

export interface HardFilterOption {
  text: string;
  value: HardFilterValue;
  icon: string;
}

export interface HardFilter {
  id: keyof DiagnoseInput['hardFilter'];
  question: string;
  helper?: string;
  options: HardFilterOption[];
}

export interface PersonalityQuestion {
  id: number;
  dimension: string;
  question: string;
  choiceA: { text: string; favorableCategories: string[]; icon?: string };
  choiceB: { text: string; favorableCategories: string[]; icon?: string };
}

export type CareerSynergyMatrix = Record<CareerKey, Record<string, number>>;

export interface CompetencyGuide {
  competency: CompetencyKey;
  competencyIndex: number;
  name: string;
  definition: string;
  examples: string;
  scoringCriteria: string;
}

export interface DiagnoseInput {
  hardFilter: {
    capital: number;
    region: 'metro' | 'city' | 'town' | 'rural';
    license: string;
    timing: 'now' | '3m' | '6m' | '1y';
    family: 'single' | 'dual' | 'sole';
    income: number;
    career: CareerKey;
    loan: boolean;
  };
  competencyScores: number[];
  personalityAnswers: PersonalityChoice[];
  nickname?: string;
}

export interface MatchBreakdown {
  competencyFit: number;
  personalityFit: number;
  careerSynergy: number;
  marketAttractiveness: number;
}

export interface CompetencyGap {
  competency: CompetencyKey;
  label: string;
  userScore: number;
  requiredScore: number;
}

export interface MatchResult {
  item: StartupItem;
  finalScore: number;
  breakdown: MatchBreakdown;
  riskWarnings: string[];
  competencyGap: CompetencyGap[];
  warningTags: string[];
  reason: string;
  marketSummary: string;
  preparationGuide: string;
}

export interface PersistedResult {
  id: string;
  sessionId: string;
  nickname?: string;
  createdAt: string;
  hardFilterInputs: DiagnoseInput['hardFilter'];
  competencyScores: number[];
  personalityAnswers: PersonalityChoice[];
  top5Results: MatchResult[];
  comicImageUrl?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
  masterDataReleaseId?: string | null;
  masterDataVersion?: string | null;
  matchingEngineVersion?: string | null;
}

export interface ContactInput {
  sessionId: string;
  name: string;
  email: string;
  phone: string;
  privacyConsent: true;
  marketingConsent: boolean;
}

export interface PersistedContact {
  id: string;
  userResultId: string;
  sessionId: string;
  name: string;
  email: string;
  phoneEncrypted: string;
  phoneHash: string;
  privacyConsent: boolean;
  privacyConsentAt: string;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
  consentIpHash: string | null;
  consentUserAgent: string | null;
  unsubscribedAt: string | null;
  unsubscribeToken: string;
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsEventName =
  | 'landing_view'
  | 'step1_start'
  | 'step1_complete'
  | 'step2_complete'
  | 'step3_complete'
  | 'ad_watched'
  | 'result_view'
  | 'share_click_kakao'
  | 'share_click_copy'
  | 'email_submit';

export interface PersistedAnalyticsEvent {
  id: string;
  sessionId: string;
  eventType: AnalyticsEventName;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface TopItemCount {
  name: string;
  count: number;
}

export interface AdminStats {
  totalParticipants: number;
  dailyTrend: DailyCount[];
  topItems: TopItemCount[];
  funnel: { eventType: string; count: number }[];
  emailCollectionRate: number;
}

export interface AppStorageShape {
  results: PersistedResult[];
  contacts: PersistedContact[];
  events: PersistedAnalyticsEvent[];
  admins: { email: string; passwordHash: string; createdAt: string }[];
  masterDataReleases: StoredMasterDataRelease[];
  adminAuditLogs: AdminAuditLogEntry[];
}

export type MasterDataReleaseStatus = 'draft' | 'published' | 'archived';
export type DraftRowStatus = 'active' | 'inactive';

export interface DraftStartupItem extends StartupItem {
  draftId: string;
  releaseId: string;
  sourceItemId: number | null;
  rowStatus: DraftRowStatus;
}

export interface MasterDataDraftPayload {
  startupItems: DraftStartupItem[];
  competencyQuestions: CompetencyQuestion[];
  hardFilters: HardFilter[];
  personalityQuestions: PersonalityQuestion[];
  careerSynergy: CareerSynergyMatrix;
  competencyGuide: CompetencyGuide[];
}

export interface PublishedMasterData {
  releaseId: string;
  version: string;
  startupItems: StartupItem[];
  competencyQuestions: CompetencyQuestion[];
  hardFilters: HardFilter[];
  personalityQuestions: PersonalityQuestion[];
  careerSynergy: CareerSynergyMatrix;
  competencyGuide: CompetencyGuide[];
}

export interface MasterDataReleaseRecord {
  id: string;
  version: string;
  status: MasterDataReleaseStatus;
  snapshotJson: PublishedMasterData | null;
  baseReleaseId: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export interface StoredMasterDataRelease extends MasterDataReleaseRecord {
  draftData: MasterDataDraftPayload;
}

export interface MasterDataReleaseSummary extends MasterDataReleaseRecord {
  itemCount: number;
  activeItemCount: number;
}

export interface MasterDataValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  field?: string;
  itemName?: string;
}

export interface ReleaseDiffPreviewItem {
  scenarioIndex: number;
  previousTop1: string | null;
  nextTop1: string | null;
  changed: boolean;
}

export interface MasterDataValidationReport {
  releaseId: string;
  version: string;
  validatedAt: string;
  issueCount: number;
  distinctTop1Count: number;
  issues: MasterDataValidationIssue[];
  sampleDiff: ReleaseDiffPreviewItem[];
}

export interface AdminAuditLogEntry {
  id: string;
  adminUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  beforeJson: unknown | null;
  afterJson: unknown | null;
  createdAt: string;
}
