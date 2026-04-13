import careerSynergyJson from '@/data/career-synergy.json';
import personalityQuestionsJson from '@/data/personality-questions.json';
import startupItemsJson from '@/data/startup-items.json';
import {
  COMPETENCY_FULL_LABELS,
  COMPETENCY_KEYS,
  COMPETENCY_LABELS,
  type CareerSynergyMatrix,
  type DiagnoseInput,
  type MatchResult,
  type PersonalityQuestion,
  type StartupItem
} from '@/types';
import { clamp, parseMonthlyRevenueRange, parsePercentageRange } from '@/lib/utils';

const startupItems = startupItemsJson as StartupItem[];
const careerSynergy = careerSynergyJson as CareerSynergyMatrix;
const personalityQuestions = personalityQuestionsJson as PersonalityQuestion[];

const CATEGORY_ALIASES: Record<string, string[]> = {
  'F&B': ['F&B', '음식', '카페', '프랜차이즈'],
  '리테일/유통': ['리테일/유통', '리테일', '유통', '온라인유통', '온라인쇼핑몰'],
  'IT/테크': ['IT/테크', 'IT', '테크', 'SaaS', '앱', 'AI', 'AI솔루션', 'IoT', '데이터분석'],
  '교육/컨설팅': ['교육/컨설팅', '교육', '컨설팅', '온라인강의'],
  '건강/뷰티': ['건강/뷰티', '건강', '뷰티', '헬스'],
  '생활서비스': ['생활서비스', '인테리어', '이사', '펫시터'],
  '제조/생산': ['제조/생산', '제조', '생산', '제조/OEM'],
  부동산: ['부동산', '부동산경매'],
  '콘텐츠/미디어': ['콘텐츠/미디어', '콘텐츠', '미디어', '이벤트기획', '브랜드 런칭'],
  '금융/투자': ['금융/투자', '금융'],
  반려동물: ['반려동물', '펫'],
  '무인/자동화': ['무인/자동화', '무인', '자동화', '1인서비스'],
  '농업/1차산업': ['농업/1차산업', '농업'],
  '물류/모빌리티': ['물류/모빌리티', '물류'],
  '문화/엔터': ['문화/엔터', '문화', '엔터'],
  전문서비스: ['전문서비스', '프리랜서형'],
  '환경/에너지': ['환경/에너지', '환경', '에너지'],
  '여행/레저': ['여행/레저', '여행', '레저'],
  기타: ['기타']
};

function buildItemTags(item: StartupItem) {
  const tags = new Set<string>(CATEGORY_ALIASES[item.category] ?? [item.category]);

  if (item.operationType === '온라인형') {
    ['온라인 비즈니스', '온라인유통', '온라인', '집/사무실에서 컴퓨터 앞에서'].forEach((tag) => tags.add(tag));
  }
  if (item.operationType === '현장형') {
    ['현장', '매장', '사람 만나는 게 에너지'].forEach((tag) => tags.add(tag));
  }
  if (item.operationType === '무인형') {
    ['무인', '무인/자동화', '자동화', '1인서비스'].forEach((tag) => tags.add(tag));
  }
  if (item.requiredStaff.includes('혼자')) {
    ['혼자', '1인 운영', '프리랜서형'].forEach((tag) => tags.add(tag));
  } else {
    ['팀', '직원', '리더'].forEach((tag) => tags.add(tag));
  }
  if (item.weekendWork === '필수') {
    tags.add('주말·공휴일 근무 OK');
  }
  if (item.weekendWork === '불필요' || item.workLifeBalance >= 4) {
    tags.add('주말은 반드시 쉬어야');
  }
  if (item.growthPotential >= 4 || item.entryBarrier >= 4) {
    ['성장형', '직원 10명 이상, 법인 전환, 투자유치'].forEach((tag) => tags.add(tag));
  }
  if (item.competitionLevel <= 3 && item.workLifeBalance >= 3) {
    ['안정형', '매달 비슷한 수준 (안정형)'].forEach((tag) => tags.add(tag));
  }
  if (item.competencyScores.interpersonal >= 4 || item.competencyScores.sales >= 4) {
    tags.add('고객응대');
  }
  if (item.competencyScores.tech >= 4) {
    ['기술이 핵심 경쟁력이어야', 'SaaS', '앱', 'AI', 'AI솔루션', 'IoT', '데이터분석'].forEach((tag) => tags.add(tag));
  } else {
    tags.add('기술은 보조 수단이면 충분');
  }
  if (item.competencyScores.stamina >= 4 || item.operationType === '현장형') {
    ['몸을 쓰는 일', '땀 흘리며 일하는 게 좋다'].forEach((tag) => tags.add(tag));
  } else {
    ['앉아서 머리 쓰는 게 좋다', '에너지가 소모된다'].forEach((tag) => tags.add(tag));
  }

  return tags;
}

function matchesPreferredTags(item: StartupItem, preferredTags: string[]) {
  const tags = buildItemTags(item);
  return preferredTags.some((tag) => {
    const normalized = tag.trim();
    if (!normalized) return false;
    if (tags.has(normalized)) return true;
    const aliasMatch = Object.entries(CATEGORY_ALIASES).find(([, aliases]) => aliases.includes(normalized));
    if (!aliasMatch) return false;
    return aliasMatch[0] === item.category;
  });
}

function parseClosureRate(item: StartupItem) {
  const match = item.closureRate.match(/(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : null;
}

function estimateMonthlyProfit(item: StartupItem) {
  const revenue = parseMonthlyRevenueRange(item.avgMonthlyRevenue);
  const margin = parsePercentageRange(item.operatingMargin);
  if (!revenue || !margin) return null;

  return {
    min: Math.round(revenue.min * (margin.min / 100)),
    max: Math.round(revenue.max * (margin.max / 100))
  };
}

function hasRequiredLicense(item: StartupItem, license: DiagnoseInput['hardFilter']['license']) {
  const requirement = item.requiredLicense;
  if (!requirement || requirement === '없음' || requirement === '-' || requirement === '업종별 상이') {
    return true;
  }

  if (license === 'food') return /식품|조리|제과|영업신고/i.test(requirement);
  if (license === 'beauty') return /미용|뷰티|이용/i.test(requirement);
  if (license === 'pro') return /공인중개사|세무사|노무|법무|행정사|전문/i.test(requirement);
  return false;
}

function getRegionPenalty(item: StartupItem, region: DiagnoseInput['hardFilter']['region']) {
  if (region === 'metro' && item.category === '농업/1차산업') return 15;
  if (region === 'rural' && ['IT/테크', '문화/엔터', '부동산'].includes(item.category)) return 12;
  if (region === 'town' && item.category === '문화/엔터') return 8;
  return 0;
}

function getFamilyPenalty(item: StartupItem, family: DiagnoseInput['hardFilter']['family']) {
  const closure = parseClosureRate(item) ?? 0;
  if (family === 'sole' && (item.workLifeBalance <= 2 || closure >= 35 || item.competencyScores.risk >= 4)) {
    return 8;
  }
  if (family === 'dual' && item.workLifeBalance >= 4) {
    return -3;
  }
  return 0;
}

function getIncomePenalty(item: StartupItem, income: number) {
  const profit = estimateMonthlyProfit(item);
  if (!profit) return { penalty: 0, warning: null as string | null };
  if (profit.max < income) {
    return {
      penalty: 12,
      warning: `예상 순이익이 희망 수입 ${income}만원에 미달할 가능성`
    };
  }
  if (profit.min < income) {
    return {
      penalty: 6,
      warning: `희망 수입 ${income}만원을 안정적으로 넘기려면 추가 설계가 필요`
    };
  }
  return { penalty: 0, warning: null };
}

function applyHardFilters(items: StartupItem[], input: DiagnoseInput) {
  const effectiveCapital = input.hardFilter.loan ? input.hardFilter.capital + 10000 : input.hardFilter.capital;

  return items
    .map((item) => {
      const warningTags: string[] = [];
      const missingRequiredLicense = !hasRequiredLicense(item, input.hardFilter.license);
      const excluded = item.investmentMin > effectiveCapital || missingRequiredLicense;
      let penalty = 0;

      if (missingRequiredLicense) {
        warningTags.push(`자격증 필요: ${item.requiredLicense}`);
      }

      const regionPenalty = getRegionPenalty(item, input.hardFilter.region);
      if (regionPenalty > 0) {
        penalty += regionPenalty;
        warningTags.push('선택 지역과 상권 적합도 재확인 필요');
      }

      if (input.hardFilter.timing === 'now' && (item.entryBarrier >= 4 || missingRequiredLicense)) {
        penalty += 10;
        warningTags.push('즉시 퇴사 기준으로는 준비기간이 긴 업종');
      }

      const familyPenalty = getFamilyPenalty(item, input.hardFilter.family);
      penalty += familyPenalty;
      if (familyPenalty > 0) {
        warningTags.push('가족 상황상 안정성 검토가 더 필요한 업종');
      }

      const incomeCheck = getIncomePenalty(item, input.hardFilter.income);
      penalty += incomeCheck.penalty;
      if (incomeCheck.warning) {
        warningTags.push(incomeCheck.warning);
      }

      return { item, excluded, warningTags, penalty };
    })
    .filter((entry) => !entry.excluded);
}

function calcCompetencyFit(userScores: number[], item: StartupItem) {
  const scores = COMPETENCY_KEYS.map((key) => item.competencyScores[key]);
  let total = 0;
  let maxPossible = 0;

  for (let index = 0; index < scores.length; index += 1) {
    const gap = Math.abs(userScores[index] - scores[index]);
    const weight = scores[index];
    total += (5 - gap) * weight;
    maxPossible += 5 * weight;
  }

  return maxPossible > 0 ? (total / maxPossible) * 100 : 0;
}

function calcPersonalityFit(answers: DiagnoseInput['personalityAnswers'], item: StartupItem) {
  const matches = answers.reduce((count, answer, index) => {
    const question = personalityQuestions[index];
    if (!question) return count;
    const preferred = answer === 'a' ? question.choiceA.favorableCategories : question.choiceB.favorableCategories;
    return count + (matchesPreferredTags(item, preferred) ? 1 : 0);
  }, 0);

  return (matches / Math.max(answers.length, 1)) * 100;
}

function calcCareerSynergy(career: DiagnoseInput['hardFilter']['career'], category: string) {
  const score = careerSynergy[career]?.[category] ?? 0;
  return score * 25;
}

function calcMarketAttractiveness(item: StartupItem) {
  const raw = item.growthPotential - item.competitionLevel + item.differentiationRoom;
  return ((raw + 3) / 12) * 100;
}

function generateRiskWarnings(item: StartupItem) {
  const warnings: string[] = [];
  const closure = parseClosureRate(item);
  if (closure && closure >= 25) warnings.push(`폐업률 주의 (${closure}%)`);
  if (item.competitionLevel >= 4) warnings.push(`경쟁강도 높음 (${item.competitionLevel}/5)`);
  if (item.seasonality === '높음') warnings.push('계절성 영향이 큰 업종');
  if (item.growthPotential <= 2) warnings.push('성장 잠재력은 낮은 편');
  return warnings;
}

function calcCompetencyGap(userScores: number[], item: StartupItem) {
  return COMPETENCY_KEYS.map((key, index) => ({
    competency: key,
    label: COMPETENCY_LABELS[index],
    userScore: userScores[index],
    requiredScore: item.competencyScores[key]
  }))
    .filter((gap) => gap.requiredScore >= 3 && gap.userScore < gap.requiredScore)
    .sort((left, right) => right.requiredScore - right.userScore - (left.requiredScore - left.userScore));
}

function buildReason(userScores: number[], item: StartupItem) {
  const strengths = COMPETENCY_KEYS.map((key, index) => ({
    label: COMPETENCY_FULL_LABELS[index],
    userScore: userScores[index],
    requiredScore: item.competencyScores[key]
  }))
    .filter((entry) => entry.userScore >= entry.requiredScore && entry.requiredScore >= 4)
    .slice(0, 2);

  const strengthText = strengths.length
    ? strengths.map((entry) => entry.label).join(', ')
    : `${item.operationType} 운영 적응력`;

  return `${item.category} 업종 중에서도 ${item.name}은(는) ${strengthText}이 강점으로 드러난 프로필과 잘 맞아요. 핵심 역량인 ${item.coreSkills}을 실제 운영에 바로 연결하기 좋습니다.`;
}

function buildMarketSummary(item: StartupItem) {
  return `투자비는 ${item.investmentRange}, 평균 월매출은 ${item.avgMonthlyRevenue}, 영업이익률은 ${item.operatingMargin}, 손익분기 예상은 ${item.breakeven}입니다. 경쟁강도 ${item.competitionLevel}/5, 성장잠재력 ${item.growthPotential}/5 기준으로 보면 ${item.differentiationRoom >= 4 ? '차별화 여지가 있는 편' : '차별화 포인트 설계가 중요'}합니다.`;
}

function buildPreparationGuide(userScores: number[], item: StartupItem) {
  const gap = calcCompetencyGap(userScores, item)[0];
  const improvementText = gap
    ? `${gap.label}은 현재 ${gap.userScore}점, 업종 요구치는 ${gap.requiredScore}점이어서 먼저 보완 계획을 세우는 편이 안전합니다.`
    : '핵심 역량 격차는 크지 않지만 운영 루틴을 미리 연습하는 편이 좋습니다.';

  return `준비 포인트는 ${item.coreSkills}과 ${item.requiredLicense} 요건 확인입니다. ${improvementText} 초기에는 ${item.requiredStaff} 규모로 시작하는 구성이 현실적입니다.`;
}

export function getEntrepreneurType(scores: number[]) {
  const sorted = scores.map((score, index) => ({ score, index })).sort((left, right) => right.score - left.score);
  const topIndex = sorted[0]?.index ?? 0;

  if ([0, 3, 9].includes(topIndex)) {
    return { name: '전략형 사장님', desc: '데이터로 판단하고 계획대로 실행하는 타입' };
  }
  if ([1, 7, 11].includes(topIndex)) {
    return { name: '감성 장인', desc: '예쁘게 만들고 트렌디하게 표현하는 타입' };
  }
  if ([2, 4].includes(topIndex)) {
    return { name: '인싸 사장님', desc: '사람을 끌어모으고 관계로 성장하는 타입' };
  }
  if ([5, 8].includes(topIndex)) {
    return { name: '현장형 파이터', desc: '몸으로 뛰며 성실함으로 승부하는 타입' };
  }
  if (topIndex === 6) {
    return { name: '도전형 개척자', desc: '남들이 안 하는 걸 과감하게 시작하는 타입' };
  }
  if (topIndex === 10) {
    return { name: '보스형 리더', desc: '팀을 만들고 키워서 사업을 확장하는 타입' };
  }
  return { name: '올라운더 CEO', desc: '골고루 잘하는 균형 잡힌 타입' };
}

export function matchStartups(input: DiagnoseInput): MatchResult[] {
  const filtered = applyHardFilters(startupItems, input);

  const scored = filtered.map(({ item, warningTags, penalty }) => {
    const competencyFit = calcCompetencyFit(input.competencyScores, item);
    const personalityFit = calcPersonalityFit(input.personalityAnswers, item);
    const careerFit = calcCareerSynergy(input.hardFilter.career, item.category);
    const marketAttractiveness = calcMarketAttractiveness(item);

    const finalScore = clamp(
      competencyFit * 0.5 + personalityFit * 0.3 + careerFit * 0.1 + marketAttractiveness * 0.1 - penalty,
      0,
      100
    );

    return {
      item,
      finalScore,
      breakdown: {
        competencyFit,
        personalityFit,
        careerSynergy: careerFit,
        marketAttractiveness
      },
      riskWarnings: generateRiskWarnings(item),
      competencyGap: calcCompetencyGap(input.competencyScores, item),
      warningTags,
      reason: buildReason(input.competencyScores, item),
      marketSummary: buildMarketSummary(item),
      preparationGuide: buildPreparationGuide(input.competencyScores, item)
    };
  });

  return scored.sort((left, right) => right.finalScore - left.finalScore).slice(0, 5);
}
