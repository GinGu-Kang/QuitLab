import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const workbookPath = path.resolve(process.cwd(), 'startup_guide_v2.xlsx');
const outputDir = path.resolve(process.cwd(), 'src/data');

const CAREER_KEY_MAP: Record<string, string> = {
  'IT/개발': 'it',
  '마케팅/광고': 'marketing',
  '영업/세일즈': 'sales',
  '금융/회계': 'finance',
  '제조/생산': 'manufacturing',
  '디자인/크리에이티브': 'design',
  '요리/식품': 'food',
  '교육/강의': 'education',
  '의료/건강': 'medical',
  '물류/유통': 'logistics',
  '부동산': 'realestate',
  '공무원/공공': 'public',
  '서비스직': 'service',
  '사무/경영지원': 'office'
};

const COMPETENCY_MAP: Record<string, string> = {
  분석적사고력: 'analytical',
  '분석적 사고력': 'analytical',
  창의력: 'creativity',
  대인관계: 'interpersonal',
  '대인관계능력': 'interpersonal',
  '대인관계 능력': 'interpersonal',
  기술활용: 'tech',
  '기술 활용 능력': 'tech',
  '기술활용능력': 'tech',
  '영업세일즈': 'sales',
  '영업/세일즈': 'sales',
  '영업/세일즈 능력': 'sales',
  '영업/세일즈능력': 'sales',
  '자기관리/규율': 'selfManagement',
  '자기관리/규율능력': 'selfManagement',
  자기관리규율: 'selfManagement',
  리스크감수: 'risk',
  '리스크 감수 성향': 'risk',
  '리스크감수성향': 'risk',
  '트렌드민감도': 'trend',
  '트렌드 민감도': 'trend',
  '체력/지구력': 'stamina',
  체력지구력: 'stamina',
  재무관리: 'finance',
  '재무관리 능력': 'finance',
  '재무관리능력': 'finance',
  리더십: 'leadership',
  '리더십/조직관리': 'leadership',
  '리더십/조직관리능력': 'leadership',
  '콘텐츠/커뮤니케이션': 'content',
  '콘텐츠/커뮤니케이션능력': 'content',
  콘텐츠커뮤니케이션: 'content'
};

const COMPETENCY_ORDER = [
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

const PERSONALITY_ICONS = [
  ['🏪', '💻'],
  ['👥', '🧍'],
  ['🪙', '🚀'],
  ['🕘', '🕊️'],
  ['🗓️', '🛋️'],
  ['💪', '🧠'],
  ['🙂', '🏢'],
  ['🤝', '🔕'],
  ['🎯', '🛡️'],
  ['⚙️', '🎨']
];

function normalize(text: string) {
  return text.replace(/\s+/g, '').replace(/\n/g, '');
}

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeJson(fileName: string, data: unknown) {
  fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseKoreanAmountToken(token: string) {
  const clean = token.replace(/\s/g, '');
  if (!clean) return null;
  const match = clean.match(/(\d[\d,]*(?:\.\d+)?)(억|천|만)?/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  if (Number.isNaN(value)) return null;
  const unit = match[2];
  if (unit === '억') return value * 10000;
  if (unit === '천') return value * 1000;
  return value;
}

function parseInvestmentRange(range: string) {
  const normalized = range.replace(/\s/g, '').replace(/만원/g, '').replace(/원/g, '');
  const parts = normalized.split('~');
  const min = parseKoreanAmountToken(parts[0]) ?? 0;
  const max = parts[1] ? parseKoreanAmountToken(parts[1]) : null;
  return { min, max };
}

function splitTags(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseStartupItems() {
  const sheet = workbook.Sheets['① 창업 아이템 DB'];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, raw: false });
  const items = rows.slice(4).filter((row) => row[0]);

  return items.map((row) => {
    const range = parseInvestmentRange(String(row[4] ?? '0'));
    return {
      id: Number(row[0]),
      category: String(row[1] ?? ''),
      name: String(row[2] ?? ''),
      coreSkills: String(row[3] ?? ''),
      investmentRange: String(row[4] ?? ''),
      investmentMin: range.min,
      investmentMax: range.max,
      competencyScores: {
        analytical: Number(row[5] ?? 0),
        creativity: Number(row[6] ?? 0),
        interpersonal: Number(row[7] ?? 0),
        tech: Number(row[8] ?? 0),
        sales: Number(row[9] ?? 0),
        selfManagement: Number(row[10] ?? 0),
        risk: Number(row[11] ?? 0),
        trend: Number(row[12] ?? 0),
        stamina: Number(row[13] ?? 0),
        finance: Number(row[14] ?? 0),
        leadership: Number(row[15] ?? 0),
        content: Number(row[16] ?? 0)
      },
      operationType: String(row[17] ?? ''),
      requiredStaff: String(row[18] ?? ''),
      weekendWork: String(row[19] ?? ''),
      workLifeBalance: Number(row[20] ?? 0),
      seasonality: String(row[21] ?? ''),
      requiredLicense: String(row[22] ?? ''),
      avgMonthlyRevenue: String(row[23] ?? ''),
      operatingMargin: String(row[24] ?? ''),
      breakeven: String(row[25] ?? ''),
      competitionLevel: Number(row[26] ?? 0),
      differentiationRoom: Number(row[27] ?? 0),
      closureRate: String(row[28] ?? ''),
      growthPotential: Number(row[29] ?? 0),
      entryBarrier: Number(row[30] ?? 0)
    };
  });
}

function parseCompetencyQuestions() {
  const sheet = workbook.Sheets['② 행동기반 역량진단'];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
  const questions = rows.slice(4).filter((row) => row[0]);
  const counts: Record<string, number> = {};

  return questions.map((row, index) => {
    const competencyLabel = normalize(String(row[0] ?? ''));
    const competency = COMPETENCY_MAP[competencyLabel];
    if (!competency) {
      throw new Error(`Unknown competency label: ${row[0]}`);
    }
    counts[competency] = (counts[competency] || 0) + 1;
    const competencyIndex = COMPETENCY_ORDER.indexOf(competency);

    return {
      id: index + 1,
      competency,
      competencyIndex,
      scenario: String(row[1] ?? ''),
      options: [
        { score: 5, text: String(row[2] ?? '') },
        { score: 4, text: String(row[3] ?? '') },
        { score: 3, text: String(row[4] ?? '') },
        { score: 2, text: String(row[5] ?? '') },
        { score: 1, text: String(row[6] ?? '') }
      ]
    };
  });
}

function buildHardFilters() {
  return [
    {
      id: 'capital',
      question: '창업에 쓸 수 있는 돈이 얼마야?',
      options: [
        { text: '500만~1,000만원', value: 1000, icon: '🪙' },
        { text: '1,000~3,000만원', value: 3000, icon: '💵' },
        { text: '3,000~7,000만원', value: 7000, icon: '💰' },
        { text: '7,000만~1.5억', value: 15000, icon: '🏦' },
        { text: '1.5억 이상', value: 30000, icon: '🏛️' }
      ]
    },
    {
      id: 'loan',
      question: '소상공인 정책자금/대출도 활용할 의향 있어?',
      helper: '활용하면 실질 투자가능금액을 1억원까지 더 볼게요.',
      options: [
        { text: '적극 활용', value: true, icon: '✅' },
        { text: '내 돈만으로 진행', value: false, icon: '🚫' }
      ]
    },
    {
      id: 'timing',
      question: '언제쯤 퇴사할 생각이야?',
      options: [
        { text: '이미 퇴사함 / 즉시', value: 'now', icon: '🔥' },
        { text: '3개월 안', value: '3m', icon: '⏳' },
        { text: '6개월 안', value: '6m', icon: '📅' },
        { text: '1년 안', value: '1y', icon: '🗓️' }
      ]
    },
    {
      id: 'family',
      question: '가족 상황은 어때?',
      options: [
        { text: '1인 가구', value: 'single', icon: '🧍' },
        { text: '맞벌이', value: 'dual', icon: '👫' },
        { text: '외벌이 + 부양가족', value: 'sole', icon: '👨‍👩‍👧' }
      ]
    },
    {
      id: 'income',
      question: '한 달에 최소 얼마는 벌어야 해?',
      options: [
        { text: '200~300만원', value: 300, icon: '📉' },
        { text: '300~500만원', value: 500, icon: '📊' },
        { text: '500~800만원', value: 800, icon: '📈' },
        { text: '800~1,000만원+', value: 1000, icon: '🚀' }
      ]
    },
    {
      id: 'career',
      question: '직전 직종/경력은?',
      options: [
        { text: 'IT/개발', value: 'it', icon: '💻' },
        { text: '마케팅/광고', value: 'marketing', icon: '📢' },
        { text: '영업/세일즈', value: 'sales', icon: '🤝' },
        { text: '금융/회계', value: 'finance', icon: '💰' },
        { text: '제조/생산', value: 'manufacturing', icon: '🏭' },
        { text: '디자인/크리에이티브', value: 'design', icon: '🎨' },
        { text: '요리/식품', value: 'food', icon: '🍳' },
        { text: '교육/강의', value: 'education', icon: '📚' },
        { text: '의료/건강', value: 'medical', icon: '🏥' },
        { text: '물류/유통', value: 'logistics', icon: '📦' },
        { text: '부동산', value: 'realestate', icon: '🏠' },
        { text: '공무원/공공', value: 'public', icon: '🏛️' },
        { text: '서비스직', value: 'service', icon: '🛎️' },
        { text: '사무/경영지원', value: 'office', icon: '📋' }
      ]
    },
    {
      id: 'region',
      question: '어디서 창업할 생각이야?',
      options: [
        { text: '수도권', value: 'metro', icon: '🏙️' },
        { text: '광역시', value: 'city', icon: '🌆' },
        { text: '중소도시', value: 'town', icon: '🏘️' },
        { text: '농어촌/지방', value: 'rural', icon: '🌾' }
      ]
    },
    {
      id: 'license',
      question: '가지고 있는 자격증/면허 있어?',
      options: [
        { text: '없음', value: 'none', icon: '❌' },
        { text: '식품/조리 관련', value: 'food', icon: '🍴' },
        { text: '미용/이용', value: 'beauty', icon: '💇' },
        { text: '공인중개사 등 전문', value: 'pro', icon: '📜' },
        { text: '기타', value: 'etc', icon: '📝' }
      ]
    }
  ];
}

function parsePersonalityQuestions() {
  const sheet = workbook.Sheets['④ 성향·가치관 진단'];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
  const questions = rows.slice(4).filter((row) => row[0]);

  return questions.map((row, index) => ({
    id: index + 1,
    dimension: String(row[0] ?? ''),
    question: String(row[1] ?? ''),
    choiceA: {
      text: String(row[2] ?? ''),
      favorableCategories: splitTags(String(row[4] ?? '')),
      icon: PERSONALITY_ICONS[index]?.[0] ?? 'A'
    },
    choiceB: {
      text: String(row[3] ?? ''),
      favorableCategories: splitTags(String(row[5] ?? '')),
      icon: PERSONALITY_ICONS[index]?.[1] ?? 'B'
    }
  }));
}

function parseCareerSynergy() {
  const sheet = workbook.Sheets['⑥ 경력 시너지 매핑'];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, raw: false });
  const header = rows[3].slice(1);
  const matrixRows = rows.slice(4).filter((row) => row[0]);
  const matrix: Record<string, Record<string, number>> = {};

  matrixRows.forEach((row) => {
    const rawCareer = String(row[0] ?? '');
    const careerKey = CAREER_KEY_MAP[rawCareer];
    if (!careerKey) {
      throw new Error(`Unknown career label: ${rawCareer}`);
    }
    matrix[careerKey] = {};
    header.forEach((category, index) => {
      matrix[careerKey][String(category)] = Number(row[index + 1] ?? 0);
    });
  });

  return matrix;
}

function parseCompetencyGuide() {
  const sheet = workbook.Sheets['⑦ 역량지표 가이드'];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
  const guideRows = rows.slice(3, 15).filter((row) => row[0] && row[1]);

  return guideRows.map((row, index) => {
    const name = String(row[1] ?? '');
    const competency = COMPETENCY_MAP[normalize(name)];
    if (!competency) {
      throw new Error(`Unknown competency guide label: ${name}`);
    }
    return {
      competency,
      competencyIndex: index,
      name,
      definition: String(row[2] ?? ''),
      examples: String(row[3] ?? ''),
      scoringCriteria:
        '1점: 낯설고 실행이 어렵다 · 3점: 도움을 받으면 가능하다 · 5점: 혼자 설계하고 반복 실행할 수 있다'
    };
  });
}

const workbook = XLSX.readFile(workbookPath, { cellDates: false });

function main() {
  ensureOutputDir();

  writeJson('startup-items.json', parseStartupItems());
  writeJson('competency-questions.json', parseCompetencyQuestions());
  writeJson('hard-filters.json', buildHardFilters());
  writeJson('personality-questions.json', parsePersonalityQuestions());
  writeJson('career-synergy.json', parseCareerSynergy());
  writeJson('competency-guide.json', parseCompetencyGuide());

  console.log('Seed complete: src/data/*.json updated from startup_guide_v2.xlsx');
}

main();
