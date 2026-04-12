import { useState, useCallback } from "react";

const C = {
  bg:"#0A0E1A",card:"#111827",hover:"#1F2A42",
  teal:"#0D9488",tealG:"#14B8A6",gold:"#F59E0B",goldL:"#FCD34D",
  purple:"#8B5CF6",pink:"#EC4899",green:"#10B981",
  w:"#F1F5F9",g:"#94A3B8",gd:"#64748B",border:"#1E293B",
};

// ⚠️ 12개 역량 명칭은 엑셀 startup_guide_v2.xlsx → ⑦ 역량지표 가이드 시트와 1:1 일치해야 함
// (분석적사고력/창의력/대인관계/기술활용/영업세일즈/자기관리규율/리스크감수/트렌드민감도/체력지구력/재무관리/리더십/콘텐츠커뮤니케이션)
const SHORT=["분석력","창의력","대인관계","기술활용","영업력","자기관리","리스크","트렌드","체력","재무관리","리더십","콘텐츠"];
const ICONS=["🧠","💡","🤝","📱","💬","⏰","🎲","👀","💪","💰","👑","📸"];

// ⚠️ STEP 1: 역량 진단 (24문항 = 12역량 × 2문항)
// 데이터 소스: startup_guide_v2.xlsx → ② 행동기반 역량진단 시트 (Row 5~28, 24행)
// 각 문항: { competency: 역량인덱스(0~11), q: 시나리오질문, opts: [{t,s,i}] (5점=5,4점=4,3점=3,2점=2,1점=1) }
// 예시 2개만 인라인. 나머지 22개는 클로드 코드가 엑셀 시딩 시 채울 것 (또는 /api/questions/competency 엔드포인트로 로드)
// 동일 역량 2문항의 점수를 평균하여 해당 역량의 최종 점수(1~5) 산출 (PRD F-CA-04)
const QS=[
  // 역량 0: 분석적 사고력 — 엑셀 ② 시트 Row 5
  {competency:0,q:"경쟁 카페 5곳의 메뉴·가격·리뷰 데이터를 정리하고 우리 매장 포지셔닝 전략을 도출하라고 한다면?",opts:[
    {t:"즐겁다, 바로 시작",s:5,i:"📊"},{t:"할 수 있다, 시간 좀 걸림",s:4,i:"⏱️"},
    {t:"누가 알려주면 가능",s:3,i:"🗣️"},{t:"막막하지만 해보겠다",s:2,i:"😅"},{t:"절대 못한다",s:1,i:"🙅"},
  ]},
  // 역량 0: 분석적 사고력 — 엑셀 ② 시트 Row 6
  {competency:0,q:"월말 매출이 지난달 대비 20% 하락했다. 원인을 분석하고 대응책을 세워야 한다면?",opts:[
    {t:"데이터부터 뜯어보겠다",s:5,i:"🔍"},{t:"감은 있는데 정리는 어렵다",s:4,i:"💭"},
    {t:"대충 짐작은 간다",s:3,i:"🤷"},{t:"어디서부터 봐야할지 모르겠다",s:2,i:"😵"},{t:"그냥 다음달 잘하면 되지",s:1,i:"🙃"},
  ]},
  // ─────────────────────────────────────────────
  // 🚨 아래는 임시 더미 데이터 (개발 중 UI 동작 확인용)
  // 클로드 코드: 엑셀 ② 시트 Row 7~28 (역량 1~11, 22문항) 시딩 완료 후 아래 전부 삭제할 것
  // 점수가 1~5 범위, competency 인덱스가 0~11 범위로 매칭되어야 함
  // ─────────────────────────────────────────────
  {q:"여행 계획을 세울 때 나는?",idx:0,opts:[
    {t:"교통·숙소·맛집 스프레드시트로 정리",s:5,i:"📊"},{t:"대충 방향만 정하고 즉흥으로",s:2,i:"🎒"},
    {t:"경험자한테 물어보고 따라감",s:3,i:"🗣️"},{t:"유튜버 코스 그대로 복붙",s:1,i:"📺"},
  ]},
  {q:"친구 생일 선물을 고를 때?",idx:1,opts:[
    {t:"직접 뭔가 만들어서 줌",s:5,i:"🎁"},{t:"요즘 뭐 좋아하는지 물어보고 삼",s:3,i:"🛒"},
    {t:"무난한 기프티콘 ㄱㄱ",s:1,i:"☕"},{t:"같이 밥 먹자~ 하고 한턱",s:2,i:"🍽️"},
  ]},
  {q:"처음 보는 사람들 모임에서 나는?",idx:2,opts:[
    {t:"30분이면 다 친해져 있음",s:5,i:"🎉"},{t:"옆사람이랑은 자연스럽게 대화",s:4,i:"😊"},
    {t:"먼저 말 걸어주면 괜찮음",s:2,i:"🙂"},{t:"폰만 보다가 일찍 감",s:1,i:"📱"},
  ]},
  {q:"새 가전제품 샀을 때?",idx:3,opts:[
    {t:"앱 연동·스마트홈 세팅까지 끝냄",s:5,i:"📲"},{t:"기본 설정 정도는 문제없음",s:3,i:"👍"},
    {t:"설명서 보면서 겨우 설치",s:2,i:"📖"},{t:"가족한테 부탁함",s:1,i:"🆘"},
  ]},
  {q:"마음에 드는 물건인데 좀 비쌀 때?",idx:4,opts:[
    {t:"좀 깎아주세요가 자연스러움",s:5,i:"🤝"},{t:"쿠폰·캐시백 총동원 최저가 구매",s:4,i:"🔍"},
    {t:"고민하다가 그냥 정가에 삼",s:2,i:"💸"},{t:"비싸면 안 삼",s:1,i:"✋"},
  ]},
  {q:"새해 목표를 세우면?",idx:5,opts:[
    {t:"12월까지 거의 다 달성함",s:5,i:"✅"},{t:"반 정도는 지키는 편",s:3,i:"📝"},
    {t:"2월이면 이미 까먹음",s:1,i:"😅"},{t:"목표 자체를 안 세움",s:1,i:"🤷"},
  ]},
  {q:"새로운 제안이 왔을 때?",idx:6,opts:[
    {t:"일단 해보지 뭐! 바로 시작",s:5,i:"🔥"},{t:"괜찮아 보이면 도전",s:4,i:"💡"},
    {t:"좀 더 알아보고 결정",s:2,i:"🤔"},{t:"검증된 거 아니면 안 함",s:1,i:"🛡️"},
  ]},
  {q:"요즘 뭐가 유행하는지?",idx:7,opts:[
    {t:"남들보다 먼저 알고 있음",s:5,i:"🔮"},{t:"SNS 보면서 자연스럽게 파악",s:4,i:"📡"},
    {t:"주변이 하면 나도 따라해봄",s:2,i:"👂"},{t:"유행에 관심 없음",s:1,i:"😶"},
  ]},
  {q:"하루 종일 서서 일해야 한다면?",idx:8,opts:[
    {t:"체력 자신 있어. 거뜬함",s:5,i:"💪"},{t:"힘들겠지만 할 수 있음",s:3,i:"🏃"},
    {t:"반나절이 한계",s:2,i:"😵"},{t:"절대 불가",s:1,i:"🪑"},
  ]},
  {q:"월급 들어오면 제일 먼저?",idx:9,opts:[
    {t:"고정비 빼고 투자·저축 자동이체",s:5,i:"📊"},{t:"생활비 빼두고 나머지 저축",s:4,i:"🏦"},
    {t:"일단 쓰고 남으면 모아",s:2,i:"💳"},{t:"들어오는 족족 다 씀",s:1,i:"🛍️"},
  ]},
  {q:"조별과제에서 나의 역할은?",idx:10,opts:[
    {t:"역할 나누고 일정 관리하는 조장",s:5,i:"👑"},{t:"맡은 파트 확실히 해내는 핵심",s:3,i:"⚡"},
    {t:"시키면 하지만 알아서 하진 않음",s:2,i:"🙋"},{t:"존재감 없는 편",s:1,i:"👻"},
  ]},
  {q:"맛있는 음식을 먹으면?",idx:11,opts:[
    {t:"사진 찍고 SNS에 바로 후기",s:5,i:"📸"},{t:"사진은 찍는데 올리진 않음",s:3,i:"🤳"},
    {t:"맛있게 먹고 끝",s:1,i:"😋"},{t:"레시피가 궁금해서 검색",s:2,i:"🔍"},
  ]},
  // ─────────────────────────────────────────────
  // ⚠️ 위 12문항(idx 0~11)은 임시 더미. 엑셀 ② 시트 시딩 시 전체 교체
  // 시딩 후 24문항 = 12역량 × 2문항 (competency 필드 사용)
  // ─────────────────────────────────────────────
];

// ⚠️ STEP 2: 성향·가치관 진단 (10문항 이지선다)
// 데이터 소스: startup_guide_v2.xlsx → ④ 성향·가치관 진단 시트 (Row 5~14, 10행)
// 각 문항: { dimension: 차원명, q: 질문, a: {t,i,tags:[유리한 카테고리들]}, b: {t,i,tags:[...]} }
// PRD F-PV-02: 강제 양자택일 (중간값 없음)
// 시딩 시 엑셀 "A가 높으면 유리한 유형"/"B가 높으면 유리한 유형" 컬럼을 tags로 매핑
const PVQS=[
  // 차원: 업무환경 — 엑셀 ④ 시트 Row 5
  {dimension:"업무환경",q:"평일 하루를 어디서 보내고 싶어?",
    a:{t:"매장/현장에서 사람 만나며",i:"🏪",tags:["F&B","건강/뷰티","생활서비스","반려동물"]},
    b:{t:"집/사무실에서 컴퓨터 앞에서",i:"💻",tags:["IT/테크","콘텐츠/미디어","전문서비스","리테일/유통"]}},
  // TODO(클로드코드): 엑셀 ④ 시트 Row 6~14 9문항 추가 (일하는방식/수입구조/근무시간/주말공휴일/체력투입/성장목표/고객접점/리스크태도/기술의존도)
];

// ⚠️ STEP 3: 현실 조건 입력 (8개 하드필터)
// 데이터 소스: startup_guide_v2.xlsx → ③ 조건 필터 시트 (8개 항목)
// PRD F-HF-01 ~ F-HF-08
// 매칭 알고리즘 STEP 1 (하드필터)에서 사용 — 자본금/자격증/지역 미달 아이템 제외 또는 후순위
const PQS=[
  // F-HF-01 보유 자본금 (슬라이더지만 UX 단순화 위해 5단계 버킷)
  {id:"capital",q:"창업에 쓸 수 있는 돈이 얼마야?",opts:[
    {t:"500만~1,000만원",v:1000,i:"🪙"},{t:"1,000~3,000만원",v:3000,i:"💵"},
    {t:"3,000~7,000만원",v:7000,i:"💰"},{t:"7,000만~1.5억",v:15000,i:"🏦"},{t:"1.5억 이상",v:30000,i:"🏛️"},
  ]},
  // F-HF-08 대출/정부지원 활용 의향
  {id:"loan",q:"소상공인 정책자금/대출도 활용할 의향 있어?",opts:[
    {t:"적극 활용 (실질 투자가능액 ↑)",v:"yes",i:"✅"},{t:"내 돈만으로 가능한 업종만",v:"no",i:"🚫"},
  ]},
  // F-HF-04 퇴사 시기
  {id:"timing",q:"언제쯤 퇴사할 생각이야?",opts:[
    {t:"이미 퇴사함 / 즉시",v:"now",i:"🔥"},{t:"3개월 안",v:"3m",i:"⏳"},
    {t:"6개월 안",v:"6m",i:"📅"},{t:"1년 안",v:"1y",i:"🗓️"},
  ]},
  // F-HF-05 가족 상황
  {id:"family",q:"가족 상황은 어때?",opts:[
    {t:"1인 가구 (혼자)",v:"single",i:"🧍"},{t:"맞벌이 (배우자 소득 있음)",v:"dual",i:"👫"},
    {t:"외벌이 + 부양가족",v:"sole",i:"👨‍👩‍👧"},
  ]},
  // F-HF-06 희망 최소 월수입
  {id:"income",q:"한 달에 최소 얼마는 벌어야 해?",opts:[
    {t:"200~300만원",v:300,i:"📉"},{t:"300~500만원",v:500,i:"📊"},
    {t:"500~800만원",v:800,i:"📈"},{t:"800~1,000만원+",v:1000,i:"🚀"},
  ]},
  // F-HF-07 직전 직종/경력 — ⑥ 경력 시너지 매핑 시트의 14개 직종과 일치해야 함
  {id:"career",q:"직전 직종/경력은?",opts:[
    {t:"IT/개발",v:"it",i:"💻"},{t:"마케팅/광고",v:"mkt",i:"📢"},
    {t:"영업/세일즈",v:"sales",i:"🤝"},{t:"금융/회계",v:"finance",i:"💰"},
    {t:"제조/생산",v:"mfg",i:"🏭"},{t:"디자인/크리에이티브",v:"design",i:"🎨"},
    {t:"요리/식품",v:"food",i:"🍳"},{t:"교육/강의",v:"edu",i:"📚"},
    {t:"의료/건강",v:"med",i:"🏥"},{t:"물류/유통",v:"logi",i:"📦"},
    {t:"부동산",v:"realestate",i:"🏠"},{t:"공무원/공공",v:"public",i:"🏛️"},
    {t:"서비스직",v:"service",i:"🛎️"},{t:"사무/경영지원",v:"office",i:"📋"},
  ]},
  // F-HF-02 거주 지역
  {id:"region",q:"어디서 창업할 생각이야?",opts:[
    {t:"수도권 (서울/경기/인천)",v:"metro",i:"🏙️"},{t:"광역시 (부산/대구/대전 등)",v:"city",i:"🌆"},
    {t:"중소도시",v:"town",i:"🏘️"},{t:"농어촌/지방",v:"rural",i:"🌾"},
  ]},
  // F-HF-03 보유 자격증/면허 (복수선택 — UX 단순화 위해 단일선택으로)
  {id:"license",q:"가지고 있는 자격증/면허 있어?",opts:[
    {t:"없음",v:"none",i:"❌"},{t:"식품/조리 관련",v:"food",i:"🍴"},
    {t:"미용/이용",v:"beauty",i:"💇"},{t:"공인중개사 등 전문",v:"pro",i:"📜"},
    {t:"기타",v:"etc",i:"📝"},
  ]},
];

// (참고: 위 QS 배열에 임시 더미 12문항이 더 들어있음 — 엑셀 시딩 완료 시 정리)
// 기존 PQS 4문항(money/exp/style/alone)은 위 8개 하드필터(엑셀 ③ 시트)로 완전 교체됨

// ⚠️ 창업 아이템 DB (현재 일부만 하드코딩됨 — 더미 데이터)
// 데이터 소스: startup_guide_v2.xlsx → ① 창업 아이템 DB 시트 (129개 아이템, Row 5~132)
// 클로드 코드: 엑셀 시딩 시 아래 BIZ 배열을 전부 교체하고 다음 필드 매핑할 것
//   - cat: 카테고리, name: 창업아이템명, cost: 초기투자비(범위문자열), min: 초기투자비 하한값(만원)
//   - sc: [12개 역량점수] — 엑셀 ① 시트 "📊 역량 매칭 점수" 12개 컬럼 순서 (분석력→콘텐츠)
//   - why: 추천 근거 (UI에서 표시) — 시딩 시 LLM으로 자동 생성하거나 별도 컬럼 추가
//   - real: 현실 수익 (엑셀 평균월매출/영업이익률/손익분기/폐업률 등 조합)
//   - guide: 창업 가이드, pref: 선호태그, exp: 어울리는 경력
//   - 추가 매핑 권장: 운영형태/필요인력/주말근무/워라밸/계절성/필요자격증/경쟁강도/차별화여지/폐업률/성장잠재력/진입장벽
// 매칭 알고리즘 (PRD F-AL-01~06): 엑셀 ⑤ 매칭 알고리즘 설계 시트 그대로 구현
//   STEP1 하드필터(자본/자격증/지역/퇴사시기) → STEP2 소프트매칭(역량50%+성향30%+경력10%+시장매력도10%)
//   경력 시너지: 엑셀 ⑥ 경력 시너지 매핑 시트 14×19 매트릭스 사용
const BIZ=[
  {cat:"음식점",name:"치킨집",cost:"4천~1억",min:4000,sc:[2,3,3,2,3,5,3,3,5,4,3,2],
   why:"성실하게 매장을 운영하고 체력이 좋은 당신에게 맞아요. 프랜차이즈 시스템으로 초보도 시작 가능하고 배달 수요가 안정적이에요.",
   real:"평균 월 순이익 250~400만원. 손익분기 6~12개월. 폐업률 약 20%(3년). 튀김유 교체, 야간 배달이 체력적으로 힘든 부분.",
   guide:"가맹비 2~4천만원 + 인테리어 3~5천만원. 배달앱 수수료(15~25%) 감안한 가격 설계. 반경 1km 경쟁 매장 수 확인.",
   pref:["food"],exp:["service","labor","none"]},

  {cat:"음식점",name:"분식집",cost:"2천~5천",min:2000,sc:[2,2,4,2,3,5,2,2,5,3,2,1],
   why:"소자본으로 시작 가능하고, 친근한 성격이 단골을 만들어요. 메뉴가 단순해서 조리 난이도가 낮아요.",
   real:"평균 월 순이익 200~350만원. 원가율 30~35%. 점심 매출 집중이라 회전율이 핵심.",
   guide:"학교, 오피스 근처 입지 핵심. 떡볶이+튀김+김밥 3종 세트로 시작. 배달 병행 시 매출 30% 상승.",
   pref:["food"],exp:["service","none","labor"]},

  {cat:"음식점",name:"카페",cost:"3천~1억",min:3000,sc:[2,4,4,3,3,4,3,5,4,3,2,5],
   why:"트렌드 감각과 표현력이 뛰어나서, 예쁜 공간을 만들고 SNS로 알리는 능력이 핵심 강점이에요.",
   real:"평균 월 순이익 200~500만원. 커피 원가율 15~20%로 마진 좋지만 임대료가 수익 좌우. 폐업률 약 30%(3년).",
   guide:"커피머신 500~2천만원, 인테리어가 비용의 50%. 역세권 테이크아웃 vs 감성 동네카페 전략이 다름.",
   pref:["food","retail"],exp:["service","office","none"]},

  {cat:"음식점",name:"김밥/도시락",cost:"2천~5천",min:2000,sc:[2,2,3,2,3,5,2,3,5,3,2,1],
   why:"꾸준하고 성실한 성격이 강점. 새벽 준비가 핵심이라 자기관리 능력이 중요한 업종이에요.",
   real:"평균 월 순이익 250~400만원. 새벽 4~5시 출근. 점심 매출 70%. 단체 주문 확보 시 안정적.",
   guide:"오피스 밀집 지역에서 배달+포장+매장 3채널 운영. 식재료 당일 소진 원칙.",
   pref:["food"],exp:["service","labor","none"]},

  {cat:"음식점",name:"국밥/해장국집",cost:"3천~7천",min:3000,sc:[2,2,4,2,3,5,2,2,5,3,2,1],
   why:"체력과 성실함이 가장 중요한 업종. 경기 불황에도 강하고 중장년 단골 확보가 쉬워 안정적이에요.",
   real:"평균 월 순이익 300~500만원. 새벽 준비 필수. 맛의 일관성 유지가 핵심.",
   guide:"육수가 생명. 대량 조리 시스템 구축. 아침 7시 오픈이 경쟁력. 상권보다 맛으로 승부.",
   pref:["food"],exp:["service","labor","none"]},

  {cat:"음식점",name:"배달전문 식당",cost:"1천~3천",min:1000,sc:[3,3,2,4,3,5,3,4,4,4,2,3],
   why:"디지털 활용과 분석력이 있어서 배달앱 데이터로 전략을 짤 수 있어요. 매장 없이 소자본 시작 가능.",
   real:"평균 월 순이익 200~400만원. 배달앱 수수료 25~35%. 리뷰 관리가 매출 좌우.",
   guide:"공유주방에서 테스트 후 독립. 메뉴 3~5개 집중. 배달앱 광고비 월 30~80만원.",
   pref:["food"],exp:["office","tech","none"]},

  {cat:"음식점",name:"베이커리/빵집",cost:"5천~1.5억",min:5000,sc:[2,5,3,3,3,5,3,5,4,3,2,5],
   why:"손재주와 트렌드 감각이 뛰어나요. 예쁜 빵을 만들고 SNS로 알리는 게 핵심 성공 요인이에요.",
   real:"평균 월 순이익 300~700만원. 새벽 작업 필수. 원가율 25~35%.",
   guide:"제빵기능사 자격증 권장. 오븐 등 장비 1~3천만원. 시그니처 메뉴 1~2개에 집중.",
   pref:["food","craft"],exp:["service","none"]},

  {cat:"음식점",name:"반찬가게",cost:"1천~3천",min:1000,sc:[2,3,4,2,3,5,2,3,5,3,2,2],
   why:"성실하고 체력 좋은 당신에게 맞아요. 맛만 좋으면 단골이 빠르게 생겨요.",
   real:"평균 월 순이익 200~400만원. 새벽 준비 필수. 단골+정기배송이 안정 수익.",
   guide:"메뉴 10~15가지로 시작. 네이버 스마트스토어로 온라인 주문 병행 추천.",
   pref:["food"],exp:["service","labor","none"]},

  {cat:"소매/판매",name:"편의점",cost:"7천~1.5억",min:7000,sc:[2,1,3,3,2,5,2,2,4,4,3,1],
   why:"성실하고 돈 관리를 잘하는 당신에게 맞아요. 본사 시스템이 잡혀 있어 노하우 없이 시작 가능.",
   real:"평균 월 순이익 200~350만원. 24시간 시 알바비가 최대 지출. 유동인구에 의존.",
   guide:"가맹비+보증금+인테리어 7천~1.5억. 본사 마진 구조 반드시 이해.",
   pref:["retail"],exp:["service","office","none"]},

  {cat:"소매/판매",name:"꽃집",cost:"2천~5천",min:2000,sc:[2,5,4,2,3,4,2,4,3,3,1,5],
   why:"미적 감각이 뛰어나고 사람과의 교감을 잘해요. 꽃다발에 감성을 담을 수 있는 당신에게 딱이에요.",
   real:"평균 월 순이익 200~400만원. 기념일에 매출 집중. 여름 관리 어려움.",
   guide:"화훼시장 새벽 경매 참여. 꽃 정기구독 모델이 안정 수익원.",
   pref:["retail","craft"],exp:["service","none"]},

  {cat:"소매/판매",name:"문구/잡화 편집샵",cost:"2천~5천",min:2000,sc:[2,5,4,3,3,4,3,5,2,3,1,5],
   why:"트렌디한 아이템을 골라내고 예쁘게 디스플레이하는 감각이 있어요.",
   real:"평균 월 순이익 150~350만원. 온라인 병행 시 매출 2배. 관광지/대학가 유리.",
   guide:"소량 다품종 전략. 해외 직수입으로 차별화. 인스타 감성이 곧 매출.",
   pref:["retail","craft"],exp:["service","office","none"]},

  {cat:"소매/판매",name:"반려동물 용품샵",cost:"2천~5천",min:2000,sc:[2,3,4,3,3,4,3,4,3,3,2,4],
   why:"사교력이 강하고 반려인과 잘 어울려요. 반려동물 시장은 매년 성장 중이에요.",
   real:"평균 월 순이익 200~400만원. 단골 확보 쉬움. 사료 정기배송이 안정 수익.",
   guide:"프리미엄, 수제 위주로 쿠팡과 차별화. 동네 커뮤니티 마케팅 핵심.",
   pref:["retail"],exp:["service","none"]},

  {cat:"뷰티/건강",name:"네일아트 샵",cost:"1천~3천",min:1000,sc:[1,5,4,2,3,4,2,5,3,3,1,4],
   why:"섬세한 손재주와 트렌드 감각이 최고예요. 소자본으로 시작 가능하고 단골이 빠르게 생겨요.",
   real:"평균 월 순이익 200~400만원(1인). 예약제 운영. 손목 건강 관리 필요.",
   guide:"네일 자격증 필수. 소형 매장(5~10평). 인스타 포트폴리오가 곧 마케팅. 재료비 원가율 10~15%.",
   pref:["craft","body"],exp:["service","none"]},

  {cat:"뷰티/건강",name:"속눈썹/반영구 샵",cost:"1천~3천",min:1000,sc:[1,5,4,2,4,4,2,5,3,3,1,4],
   why:"섬세한 손기술과 유행 캐치 능력이 핵심. 시술 단가가 높아 소수 고객으로도 수익 가능.",
   real:"평균 월 순이익 300~500만원(1인). 시술 1건 5~15만원. 하루 4~6명이면 안정.",
   guide:"반영구 과정 3~6개월. 위생교육 필수. 초기 할인으로 후기 확보가 핵심.",
   pref:["body","craft"],exp:["service","none"]},

  {cat:"뷰티/건강",name:"헤어살롱/바버샵",cost:"3천~1억",min:3000,sc:[1,4,5,2,3,5,2,5,4,3,2,4],
   why:"사교력이 뛰어나서 고객과 자연스럽게 관계를 만들 수 있고 트렌드에 민감해요.",
   real:"평균 월 순이익 300~600만원. 고정 고객 100명이면 안정. 체력 소모 큼.",
   guide:"미용사 면허 필수. 바버샵은 남성 전문 차별화 가능. 예약앱 연동 필수.",
   pref:["body"],exp:["service","none"]},

  {cat:"뷰티/건강",name:"피부관리실",cost:"3천~7천",min:3000,sc:[2,3,5,3,4,5,3,4,3,4,2,3],
   why:"고객과 깊은 관계를 맺는 능력이 뛰어나요. 성실하게 관리하면 VIP 고객이 생겨요.",
   real:"평균 월 순이익 300~500만원. 관리 1회 5~20만원. 정기 회원권이 안정 수익.",
   guide:"피부미용 자격증 필수. 장비 1~3천만원. 아파트 밀집 지역 2층이 비용효율적.",
   pref:["body"],exp:["service","none"]},

  {cat:"뷰티/건강",name:"PT/피트니스 스튜디오",cost:"2천~5천",min:2000,sc:[2,2,5,3,5,5,3,4,5,3,2,4],
   why:"체력이 뛰어나고 사람을 동기부여하는 능력이 있어요. 소규모 그룹PT는 마진이 높아요.",
   real:"평균 월 순이익 300~600만원. 그룹PT 4~6인 회당 인당 2~3만원. 비수기 관리 필요.",
   guide:"체육 자격증 필수. 20~30평이면 충분. SNS 비포/애프터가 최고 마케팅.",
   pref:["body"],exp:["service","labor","none"]},

  {cat:"생활서비스",name:"청소/입주청소 업체",cost:"500~2천",min:500,sc:[3,1,4,3,4,5,3,2,5,3,3,2],
   why:"체력과 영업력이 강점. 소자본으로 시작 가능하고 후기 관리 잘하면 빠르게 성장해요.",
   real:"평균 월 순이익 300~500만원. 입주청소 건당 15~30만원. 하루 2건 가능.",
   guide:"장비비 100~300만원 초소자본. 숨고/크몽 플랫폼 등록. 후기 50개 넘으면 예약 폭주.",
   pref:["any"],exp:["labor","service","none"]},

  {cat:"생활서비스",name:"카워시/세차장",cost:"2천~7천",min:2000,sc:[2,2,3,3,4,5,2,3,5,3,2,3],
   why:"체력이 좋고 성실한 당신에게 맞아요. 반복 방문 고객이 많아 안정적 매출.",
   real:"평균 월 순이익 250~500만원. 손세차 건당 3~8만원. 코팅 추가 시 객단가 상승.",
   guide:"셀프세차 장비 2~4천만원. 배수 설비, 환경규제 확인 필수.",
   pref:["auto","body"],exp:["labor","service","none"]},

  {cat:"생활서비스",name:"인테리어/도배",cost:"1천~3천",min:1000,sc:[3,4,4,2,5,4,3,4,5,3,3,3],
   why:"손재주와 영업력을 동시에 갖고 있어요. 기술 습득 후 수요가 꾸준해서 고소득 가능.",
   real:"평균 월 순이익 400~800만원. 도배 일당 20~35만원. 봄, 가을 성수기.",
   guide:"도배 기술 학원 2~3개월. 부동산 네트워크가 영업 핵심.",
   pref:["craft"],exp:["labor","tech","none"]},

  {cat:"생활서비스",name:"사진관/프로필 스튜디오",cost:"2천~5천",min:2000,sc:[2,5,4,4,3,4,3,5,2,3,1,5],
   why:"미적 감각과 표현력이 뛰어나서 고객을 가장 멋지게 담아낼 수 있어요.",
   real:"평균 월 순이익 300~500만원. 프로필 건당 10~30만원. 예약제로 워라밸 좋음.",
   guide:"장비 500~2천만원. 보정 능력 필수. 인스타 포트폴리오가 핵심.",
   pref:["craft","retail"],exp:["none","office","service"]},

  {cat:"무인 사업",name:"무인 아이스크림",cost:"3천~5천",min:3000,sc:[3,1,1,4,2,4,3,2,2,4,1,1],
   why:"디지털 도구를 잘 다루고 돈 관리를 잘해요. 관리 시스템만 잘 갖추면 부업으로도 가능.",
   real:"평균 월 순이익 150~300만원. 여름 매출 집중. 도난 리스크 있음.",
   guide:"냉동고+결제단말기+CCTV 세트 2~3천만원. 학교, 아파트 앞 소형 매장.",
   pref:["auto"],exp:["office","tech","none"]},

  {cat:"무인 사업",name:"코인세탁방",cost:"5천~1.2억",min:5000,sc:[2,1,1,3,1,3,3,1,2,4,1,1],
   why:"초기 투자 후 손이 적게 가요. 돈 관리만 잘하면 꾸준한 수동 소득 가능.",
   real:"평균 월 순이익 150~300만원. 기계 고장 시 즉시 대응 필요.",
   guide:"세탁기 10대 기준 4~8천만원. 원룸, 오피스텔 밀집 지역. 건조기 비중 높이면 수익 상승.",
   pref:["auto"],exp:["office","none","tech"]},

  {cat:"무인 사업",name:"무인 사진부스",cost:"2천~4천",min:2000,sc:[2,4,1,4,2,4,3,5,1,3,1,4],
   why:"트렌드 감각이 뛰어나서 인기 프레임을 빠르게 반영할 수 있어요. MZ 인기 아이템.",
   real:"평균 월 순이익 150~350만원(1대). 위치가 매출의 80%.",
   guide:"부스 1대 1~2천만원. 번화가, 대학가 소형 공간. 시즌별 프레임 업데이트.",
   pref:["auto","retail"],exp:["tech","office","none"]},

  {cat:"무인 사업",name:"스터디카페",cost:"5천~1.5억",min:5000,sc:[3,2,2,4,2,4,3,3,2,4,2,1],
   why:"디지털 시스템 활용과 재무 관리를 잘해요. 무인 운영 가능해서 효율적.",
   real:"평균 월 순이익 200~400만원. 시험 시즌 매출 집중. 소음 관리가 리뷰 좌우.",
   guide:"키오스크+좌석관리시스템. 24시간 시 CCTV, 자동출입 필수. 대학가, 고시촌 최적.",
   pref:["auto","retail"],exp:["office","tech","none"]},

  {cat:"공방/체험",name:"캔들/비누 공방",cost:"500~2천",min:500,sc:[2,5,4,3,3,4,2,5,2,2,1,5],
   why:"손재주가 뛰어나고 트렌디한 감성을 잘 표현해요. 원데이클래스+판매 병행 가능.",
   real:"평균 월 순이익 150~350만원. 원데이클래스 인당 3~5만원. 재료비 마진 60% 이상.",
   guide:"재료비 30~50만원으로 시작. 자택도 가능. 클래스101/탈잉 입점으로 초기 고객 확보.",
   pref:["craft"],exp:["none","service","office"]},

  {cat:"공방/체험",name:"베이킹/쿠킹 클래스",cost:"1천~3천",min:1000,sc:[2,5,5,3,4,4,2,5,3,3,2,5],
   why:"손재주와 사교력이 모두 뛰어나요. 가르치는 걸 좋아하면 매일이 즐거운 자영업.",
   real:"평균 월 순이익 250~450만원. 인당 5~8만원, 4~8인. 주말 집중. 기업 팀빌딩 유치.",
   guide:"주방 설비 1~2천만원. 식품위생교육 이수. 시즌 메뉴 활용.",
   pref:["craft","food"],exp:["service","none"]},

  {cat:"온라인",name:"스마트스토어 판매",cost:"100~1천",min:100,sc:[4,2,2,5,3,5,2,4,1,4,1,3],
   why:"분석력과 디지털 활용이 뛰어나서 키워드 분석, 상품 소싱에 강해요. 초소자본 재택 시작.",
   real:"평균 월 순이익 100~500만원(편차 큼). 상위 10%가 전체 매출 70%. 꾸준한 상품 등록 핵심.",
   guide:"네이버 스마트스토어 무료 개설. 위탁판매로 재고 리스크 0.",
   pref:["any"],exp:["office","tech","sales","none"]},

  {cat:"온라인",name:"블로그/SNS 부업",cost:"0~100",min:0,sc:[3,4,2,4,2,5,2,5,1,2,1,5],
   why:"표현력과 트렌드 감각이 최고. 꾸준히 하면 협찬, 광고 수익이 생기는 가장 리스크 낮은 자영업.",
   real:"월 수입 30~200만원(초기). 팔로워 1만 이상이면 협찬 시작.",
   guide:"틱톡, 릴스 숏폼이 성장 가장 빠름. 하루 1포스팅 꾸준히. 카테고리 집중.",
   pref:["any"],exp:["none","office","service"]},

  {cat:"배달/운송",name:"택배/퀵서비스",cost:"500~2천",min:500,sc:[2,1,2,3,2,5,3,1,5,3,1,1],
   why:"체력과 성실함이 가장 큰 무기. 자본 거의 없이 시작 가능하고 일한 만큼 바로 수입.",
   real:"월 수입 250~500만원(풀타임). 유류비, 차량 유지비 차감 필요.",
   guide:"화물차 또는 오토바이 필수. 쿠팡플렉스, 배민커넥트 등 등록.",
   pref:["any"],exp:["labor","none"]},

  {cat:"반려동물",name:"반려동물 미용실",cost:"2천~5천",min:2000,sc:[1,5,4,2,3,5,2,4,4,3,1,3],
   why:"손재주가 뛰어나고 동물을 좋아해요. 기술만 있으면 단골이 저절로 생기는 안정 업종.",
   real:"평균 월 순이익 250~450만원. 소형견 1회 3~6만원. 하루 5~8마리.",
   guide:"반려동물미용사 자격증 6개월~1년. 장비 300~500만원. 입소문이 핵심.",
   pref:["body","craft"],exp:["service","none"]},

  {cat:"반려동물",name:"펫시터/산책대행",cost:"100~500",min:100,sc:[2,1,5,3,3,5,2,3,4,2,1,3],
   why:"사교력이 좋고 성실해요. 동물 사랑 + 체력만 있으면 바로 시작 가능.",
   real:"월 수입 150~350만원. 산책 1회 1.5~3만원. 돌봄 1박 3~5만원.",
   guide:"펫시터 교육 이수. 펫봄, 도그메이트 플랫폼 등록. 후기가 예약률 좌우.",
   pref:["any","body"],exp:["none","service"]},

  {cat:"기타",name:"자판기 사업",cost:"500~2천",min:500,sc:[3,1,2,3,3,4,2,2,3,4,1,1],
   why:"분석력과 돈 관리 능력이 있어서 위치 선정과 수익 관리를 잘할 수 있어요. 부업 적합.",
   real:"자판기 1대당 월 순이익 20~50만원. 3~5대 운영이 현실적.",
   guide:"자판기 1대 200~500만원. 오피스, 공장, 병원 등 입점 계약. 커피자판기가 마진 최고.",
   pref:["auto","any"],exp:["office","none","labor"]},

  {cat:"기타",name:"중고차 매매",cost:"3천~1억",min:3000,sc:[4,1,5,3,5,4,4,3,3,5,2,2],
   why:"사교력, 영업력, 분석력이 모두 높아요. 차량 가치 파악과 고객 설득이 핵심.",
   real:"차량 1대당 순이익 100~300만원. 월 5~10대 판매 목표.",
   guide:"중고차매매사원증 취득. 성능점검 투명 공개가 차별화.",
   pref:["any"],exp:["sales","labor","none"]},

  {cat:"기타",name:"부동산 중개",cost:"1천~3천",min:1000,sc:[4,1,5,3,5,5,3,4,3,5,2,3],
   why:"사교력과 영업력이 뛰어나고 분석력, 돈 관리까지 갖추고 있어요.",
   real:"평균 월 수입 300~700만원. 중개 수수료율 0.3~0.9%. 비수기 수입 감소.",
   guide:"공인중개사 자격증 필수. 사무실 등록 1~2천만원. 아파트 밀집 지역이 유리.",
   pref:["any"],exp:["sales","office","none"]},

  {cat:"기타",name:"대리운전",cost:"100~500",min:100,sc:[2,1,3,3,2,4,2,1,4,2,1,1],
   why:"초소자본 즉시 시작. 체력만 있으면 바로 수익 낼 수 있는 가장 낮은 진입장벽.",
   real:"월 수입 200~400만원. 밤 10시~새벽 3시 집중. 앱 수수료 20%.",
   guide:"대리운전 보험 가입 필수. 카카오T, 우티 등록. 주말, 공휴일 전날 최고 매출.",
   pref:["any"],exp:["none","labor","service"]},
];

function getType(sc){
  const sorted=sc.map((s,i)=>({s,i})).sort((a,b)=>b.s-a.s);
  const t1=sorted[0].i, t2=sorted[1].i;
  if([0,3,9].includes(t1)) return {name:"전략형 사장님",desc:"데이터로 판단하고 계획대로 실행하는 타입"};
  if([1,7,11].includes(t1)) return {name:"감성 장인",desc:"예쁘게 만들고 트렌디하게 표현하는 타입"};
  if([2,4].includes(t1)) return {name:"인싸 사장님",desc:"사람을 끌어모으고 관계로 성장하는 타입"};
  if([5,8].includes(t1)) return {name:"현장형 파이터",desc:"몸으로 뛰며 성실함으로 승부하는 타입"};
  if([6].includes(t1)) return {name:"도전형 개척자",desc:"남들이 안 하는 걸 과감하게 시작하는 타입"};
  if([10].includes(t1)) return {name:"보스형 리더",desc:"팀을 만들고 키워서 사업을 확장하는 타입"};
  return {name:"올라운더 CEO",desc:"골고루 잘하는 균형 잡힌 타입"};
}

function Radar({scores:sc,size=240}){
  const cx=size/2,cy=size/2,r=size*.36,n=12;
  const pt=(rd,i)=>{const a=Math.PI*2*i/n-Math.PI/2;return[cx+rd*Math.cos(a),cy+rd*Math.sin(a)];};
  const poly=ps=>ps.map(p=>p.join(",")).join(" ");
  const data=sc.map((s,i)=>pt(r*s/5,i));
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[.2,.4,.6,.8,1].map((l,i)=><polygon key={i} points={poly(Array.from({length:n},(_,j)=>pt(r*l,j)))} fill="none" stroke="#1E293B" strokeWidth="1"/>)}
      {Array.from({length:n},(_,i)=><line key={i} x1={cx} y1={cy} x2={pt(r,i)[0]} y2={pt(r,i)[1]} stroke="#1E293B" strokeWidth=".5"/>)}
      <polygon points={poly(data)} fill="rgba(13,148,136,0.2)" stroke="#0D9488" strokeWidth="2.5"/>
      {data.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="4" fill={sc[i]>=4?"#14B8A6":sc[i]>=3?"#F59E0B":"#475569"}/>)}
      {Array.from({length:n},(_,i)=>{const p=pt(r+18,i);return <text key={i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="8.5" fontWeight="600">{SHORT[i]}</text>;})}
    </svg>
  );
}

function Btn({children,onClick,primary,gold:isGold,full,style:sx}){
  const base={
    border:"none",borderRadius:14,padding:"14px 24px",fontSize:15,fontWeight:700,
    color:"white",cursor:"pointer",width:full?"100%":"auto",textAlign:"center",
    ...(primary?{background:`linear-gradient(135deg,#0D9488,#8B5CF6)`,boxShadow:"0 0 20px rgba(13,148,136,.25)"}:
    isGold?{background:`linear-gradient(135deg,#F59E0B,#EC4899)`,boxShadow:"0 0 20px rgba(245,158,11,.25)"}:
    {background:"#111827",border:"1px solid #1E293B",color:"#94A3B8"}),
    ...sx
  };
  return <button onClick={onClick} style={base}>{children}</button>;
}

function OptBtn({icon,text,onClick}){
  const[hov,setHov]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?"#1F2A42":"#111827",border:`1px solid ${hov?"#0D9488":"#1E293B"}`,
      borderRadius:14,padding:"14px 16px",fontSize:14,color:"#F1F5F9",cursor:"pointer",
      textAlign:"left",display:"flex",alignItems:"center",gap:10,
      transform:hov?"translateX(4px)":"none",transition:"all .15s",width:"100%"}}>
      <span style={{fontSize:20,flexShrink:0}}>{icon}</span><span>{text}</span>
    </button>
  );
}

export default function App(){
  const[phase,setPhase]=useState("landing");
  const[qi,setQi]=useState(0);
  const[pi,setPi]=useState(0);
  const[pvi,setPvi]=useState(0); // STEP 3 성향·가치관 진단 인덱스 (엑셀 ④ 시트 10문항)
  const[pvData,setPvData]=useState({}); // 성향 답변 저장
  const[scores,setScores]=useState(Array(12).fill(3));
  const[pData,setPData]=useState({});
  const[results,setResults]=useState(null);
  const[loadTxt,setLoadTxt]=useState("");
  const[fade,setFade]=useState(true);
  const[tab,setTab]=useState("match");
  const[name,setName]=useState("");
  const[openIdx,setOpenIdx]=useState(null);

  const go=useCallback((fn)=>{setFade(false);setTimeout(()=>{fn();setFade(true);},200);},[]);

  const pickQ=(oi)=>{
    // 새 구조: q.competency (0~11 역량 인덱스)
    // PRD F-CA-04: 동일 역량 2문항의 평균을 해당 역량 최종 점수로 — 매칭 알고리즘(백엔드)에서 계산
    // 프론트는 답변만 누적. scores는 마지막 답변으로 갱신해 UI 미리보기용으로 사용
    const q=QS[qi];
    const cIdx=q.competency!==undefined?q.competency:q.idx; // 구버전 호환
    const ns=[...scores];
    // 같은 역량 이전 답변이 있으면 평균, 없으면 현재 점수
    const prev=ns[cIdx];
    ns[cIdx]=prev&&prev!==3 ? Math.round((prev+q.opts[oi].s)/2) : q.opts[oi].s;
    setScores(ns);
    qi<QS.length-1?go(()=>setQi(qi+1)):go(()=>setPhase("pv"));
  };
  const pickP=(oi)=>{
    const q=PQS[pi];setPData({...pData,[q.id]:q.opts[oi].v});
    pi<PQS.length-1?go(()=>setPi(pi+1)):go(()=>setPhase("q"));
  };
  const skipP=()=>pi<PQS.length-1?go(()=>setPi(pi+1)):go(()=>setPhase("q"));

  // STEP 3: 성향·가치관 진단 (PVQS) — 엑셀 ④ 시트 10문항
  const pickPv=(choice)=>{ // choice: 'a' or 'b'
    const newData={...pvData,[pvi]:choice};
    setPvData(newData);
    pvi<PVQS.length-1?go(()=>setPvi(pvi+1)):go(()=>setPhase("name"));
  };
  const skipPv=()=>pvi<PVQS.length-1?go(()=>setPvi(pvi+1)):go(()=>setPhase("name"));

  const startLoad=()=>{
    setPhase("loading");
    const ts=["자영업 아이템 매칭 중...","숨은 재능 분석 중...","자금, 경험 현실 체크 중...","10년 후 미래 시뮬레이션 중...","찾았습니다!"];
    let i=0;setLoadTxt(ts[0]);
    const iv=setInterval(()=>{i++;if(i<ts.length)setLoadTxt(ts[i]);else{clearInterval(iv);calc();}},1000);
  };

  const calc=()=>{
    const money=pData.money||99999;const exp=pData.exp||"none";const style=pData.style||"any";
    let ranked=BIZ.map(b=>{
      let score=0;
      b.sc.forEach((req,i)=>{score+=(5-Math.abs(req-scores[i]))*req;});
      if(b.min<=money)score+=12;else score-=8;
      if(b.exp&&b.exp.includes(exp))score+=10;
      if(style!=="any"&&b.pref&&b.pref.includes(style))score+=15;
      return{...b,matchScore:score};
    });
    ranked.sort((a,b)=>b.matchScore-a.matchScore);
    setResults(ranked.slice(0,10));
    setTimeout(()=>setPhase("ad"),300);
  };

  const reset=()=>{setPhase("landing");setQi(0);setPi(0);setPvi(0);setPvData({});setScores(Array(12).fill(3));setPData({});setResults(null);setTab("match");setName("");setOpenIdx(null);};

  const dn=name||"도전자";
  const top=results?results[0]:null;
  // PRD F-RS-02: TOP 5 추천 업종 (이전 t3 → top5로 확장)
  const t3=results?results.slice(0,5):[];
  const myType=getType(scores);

  const futureY=new Date().getFullYear()+10;
  const rev=Math.floor(Math.random()*8+3);
  const shops=Math.floor(Math.random()*5+2);
  const awards=["소상공인진흥공단 선정","MBC 생방송 오늘저녁","백종원의 골목식당 성공사례","KBS 생생정보통","SBS 모닝와이드"];
  const award=awards[Math.floor(Math.random()*awards.length)];

  const wrap={minHeight:"100vh",background:C.bg,color:C.w,fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",maxWidth:480,margin:"0 auto"};
  const inner={opacity:fade?1:0,transition:"opacity .2s",minHeight:"100vh"};

  const css=`@keyframes spin{to{transform:rotate(360deg)}} .tab-btn{flex:1;border-radius:10px;padding:7px 4px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid #1E293B;background:#111827;color:#64748B} .tab-btn.on{border-color:currentColor}`;

  // ── LANDING ──
  if(phase==="landing")return(
    <div style={wrap}><style>{css}</style><div style={{...inner,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:12}}>🏪</div>
      <h1 style={{fontSize:26,fontWeight:800,lineHeight:1.3,marginBottom:6,background:"linear-gradient(135deg,#14B8A6,#FCD34D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
        퇴사하면 나는<br/>어떤 가게 사장님?
      </h1>
      <p style={{color:C.g,fontSize:14,marginBottom:28,lineHeight:1.6}}>12개 질문으로 찾는 나의 운명 자영업<br/><span style={{color:C.teal}}>+ 현실 비용 · 수익 · 창업가이드</span></p>
      <Btn primary full onClick={()=>go(()=>setPhase("p"))}>내 운명 가게 찾기 →</Btn>
      <p style={{color:"#475569",fontSize:11,marginTop:14}}>⏱️ 3분 · 로그인 불필요</p>
    </div></div>
  );

  // ── NAME ──
  if(phase==="name")return(
    <div style={wrap}><style>{css}</style><div style={{...inner,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:12}}>✨</div>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:6}}>모든 진단 완료!</h2>
      <p style={{color:C.g,fontSize:13,marginBottom:24}}>이제 결과를 받을 닉네임만 알려주세요</p>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름 또는 닉네임" maxLength={10}
        style={{background:C.card,border:"2px solid #1E293B",borderRadius:12,padding:"14px 18px",fontSize:17,color:C.w,textAlign:"center",width:"100%",maxWidth:260,marginBottom:20,outline:"none"}}/>
      <Btn primary full onClick={()=>{if(!name.trim())setName("도전자");startLoad();}}>분석 결과 보기 →</Btn>
      <button onClick={()=>{if(!name.trim())setName("도전자");startLoad();}} style={{background:"none",border:"none",color:C.gd,fontSize:12,cursor:"pointer",marginTop:10}}>건너뛰기</button>
    </div></div>
  );

  // ── PERSONALITY Q ──
  if(phase==="q"){const q=QS[qi];return(
    <div style={wrap}><style>{css}</style><div style={{...inner,padding:"20px 16px"}}>
      <div style={{display:"flex",gap:3,marginBottom:14}}>
        {Array.from({length:QS.length},(_,i)=>(<div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=qi?"linear-gradient(90deg,#0D9488,#8B5CF6)":"#1E293B"}}/>))}
      </div>
      <p style={{textAlign:"center",color:C.gd,fontSize:12,marginBottom:20}}>STEP 2 / 3 · 역량 진단 ({qi+1}/{QS.length}) · 엑셀 ② 시트 24문항</p>
      <h2 style={{fontSize:18,fontWeight:700,textAlign:"center",lineHeight:1.5,marginBottom:24}}>{q.q}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {q.opts.map((o,i)=><OptBtn key={i} icon={o.i} text={o.t} onClick={()=>pickQ(i)}/>)}
      </div>
    </div></div>
  );}

  // ── PRACTICAL Q ──
  if(phase==="p"){const q=PQS[pi];return(
    <div style={wrap}><style>{css}</style><div style={{...inner,padding:"20px 16px"}}>
      <div style={{display:"flex",gap:3,marginBottom:14}}>
        {Array.from({length:PQS.length},(_,i)=>(<div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=pi?"linear-gradient(90deg,#F59E0B,#EC4899)":"#1E293B"}}/>))}
      </div>
      <p style={{textAlign:"center",color:C.gd,fontSize:12,marginBottom:20}}>STEP 1 / 3 · 현실 조건 ({pi+1}/{PQS.length}) · 엑셀 ③ 시트 8개 하드필터</p>
      <h2 style={{fontSize:18,fontWeight:700,textAlign:"center",lineHeight:1.5,marginBottom:24}}>{q.q}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {q.opts.map((o,i)=><OptBtn key={i} icon={o.i} text={o.t} onClick={()=>pickP(i)}/>)}
      </div>
      <button onClick={skipP} style={{background:"none",border:"none",color:C.gd,fontSize:12,cursor:"pointer",marginTop:14,width:"100%",textAlign:"center"}}>건너뛰기 →</button>
    </div></div>
  );}

  // ── STEP 3: PERSONALITY/VALUES Q (엑셀 ④ 시트 — 이지선다) ──
  if(phase==="pv"){const q=PVQS[pvi];return(
    <div style={wrap}><style>{css}</style><div style={{...inner,padding:"20px 16px"}}>
      <div style={{display:"flex",gap:3,marginBottom:14}}>
        {Array.from({length:PVQS.length},(_,i)=>(<div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=pvi?"linear-gradient(90deg,#8B5CF6,#EC4899)":"#1E293B"}}/>))}
      </div>
      <p style={{textAlign:"center",color:C.gd,fontSize:12,marginBottom:8}}>STEP 3 / 3 · 성향·가치관 ({pvi+1}/{PVQS.length}) · 엑셀 ④ 시트</p>
      <p style={{textAlign:"center",color:C.purple,fontSize:11,marginBottom:18}}>'할 수 있느냐'가 아닌 '하고 싶은가'를 묻습니다</p>
      <h2 style={{fontSize:18,fontWeight:700,textAlign:"center",lineHeight:1.5,marginBottom:24}}>{q.q}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <OptBtn icon={q.a.i} text={q.a.t} onClick={()=>pickPv("a")}/>
        <OptBtn icon={q.b.i} text={q.b.t} onClick={()=>pickPv("b")}/>
      </div>
      <button onClick={skipPv} style={{background:"none",border:"none",color:C.gd,fontSize:12,cursor:"pointer",marginTop:14,width:"100%",textAlign:"center"}}>건너뛰기 →</button>
    </div></div>
  );}

  // ── LOADING ──
  if(phase==="loading")return(
    <div style={wrap}><style>{css}</style><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:28}}>
      <div style={{width:60,height:60,borderRadius:"50%",border:"3px solid #1E293B",borderTopColor:"#0D9488",animation:"spin 1s linear infinite",marginBottom:28}}/>
      <p style={{color:C.tealG,fontSize:15,fontWeight:600}}>{loadTxt}</p>
    </div></div>
  );

  // ── AD ──
  if(phase==="ad")return(
    <div style={wrap}><style>{css}</style><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:28,textAlign:"center"}}>
      <div style={{background:C.card,border:"1px solid #1E293B",borderRadius:16,padding:28,width:"100%",maxWidth:320,marginBottom:20}}>
        <p style={{color:C.gd,fontSize:12,marginBottom:8}}>ADVERTISEMENT</p>
        <div style={{background:"#1E293B",borderRadius:12,height:180,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:C.gd,fontSize:13}}>광고 영역</span>
        </div>
      </div>
      <Btn gold full onClick={()=>go(()=>setPhase("result"))}>📊 분석 결과 확인하기</Btn>
    </div></div>
  );

  // ── RESULTS ──
  if(phase==="result"&&results&&top){
    const tabData=[
      {k:"match",l:"🏆 추천",cl:C.teal},{k:"why",l:"💡 분석근거",cl:C.gold},
      {k:"guide",l:"📋 가이드",cl:C.green},{k:"future",l:"✨ 미래상상",cl:C.purple},
    ];

    return(<div style={wrap}><style>{css}</style><div style={{...inner,padding:"16px 14px"}}>
      <div style={{textAlign:"center",marginBottom:14}}>
        <p style={{color:C.teal,fontSize:12,fontWeight:600}}>{dn}님, 데이터 분석이 끝났어요</p>
        <p style={{color:C.gd,fontSize:10,marginTop:2}}>129개 업종 × 12개 역량 × 현실 조건 교차 분석 결과</p>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {tabData.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{flex:1,borderRadius:10,padding:"7px 4px",fontSize:11,fontWeight:600,cursor:"pointer",
            border:`1.5px solid ${tab===t.k?t.cl:"#1E293B"}`,
            background:tab===t.k?t.cl+"22":"#111827",
            color:tab===t.k?t.cl:"#64748B"}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── MATCH ── */}
      {tab==="match"&&<div>
        <div style={{background:"rgba(13,148,136,0.08)",border:"1px solid rgba(13,148,136,0.25)",borderRadius:14,padding:14,textAlign:"center",marginBottom:14}}>
          <p style={{color:C.g,fontSize:11}}>당신의 진단 결과</p>
          <p style={{fontSize:18,fontWeight:800,background:"linear-gradient(135deg,#14B8A6,#FCD34D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{myType.name}</p>
          <p style={{color:C.gd,fontSize:12,marginTop:4}}>{myType.desc}</p>
        </div>

        <div style={{background:"rgba(13,148,136,0.1)",border:"2px solid #0D9488",borderRadius:16,padding:16,marginBottom:10,position:"relative"}}>
          <div style={{position:"absolute",top:-8,left:14,background:C.gold,color:"#000",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:6}}>🏆 1순위 추천</div>
          <h3 style={{fontSize:19,fontWeight:800,marginTop:6}}>{top.name}</h3>
          <p style={{color:C.teal,fontSize:12}}>{top.cat} · <span style={{color:C.goldL}}>{top.cost}만원</span></p>
        </div>

        {/* 리스크 경고 — 솔직함이 신뢰의 핵심 */}
        <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:11,marginBottom:12}}>
          <p style={{color:"#F87171",fontSize:11,fontWeight:700,marginBottom:3}}>⚠️ 알고 시작하세요</p>
          <p style={{color:C.g,fontSize:11,lineHeight:1.5}}>추천 = 성공 보장 아닙니다. 가이드 탭에서 폐업률·경쟁강도·실제 수익을 꼭 확인하세요.</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {t3.slice(1).map((b,i)=>(
            <div key={i} style={{background:C.card,border:"1px solid #1E293B",borderRadius:12,padding:12}}>
              <span style={{color:C.g,fontSize:10}}>{["🥈 2위","🥉 3위","4위","5위"][i]}</span>
              <h4 style={{fontSize:14,fontWeight:700,marginTop:3}}>{b.name}</h4>
              <p style={{color:C.gd,fontSize:11}}>{b.cost}만원</p>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center",marginBottom:12}}><Radar scores={scores}/></div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {SHORT.map((s,i)=>(
            <div key={i} style={{background:C.card,borderRadius:8,padding:"6px 8px",display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:13}}>{ICONS[i]}</span>
              <span style={{fontSize:10,color:C.gd,flex:1}}>{s}</span>
              <div style={{display:"flex",gap:1.5}}>
                {[1,2,3,4,5].map(v=><div key={v} style={{width:11,height:5,borderRadius:2,background:v<=scores[i]?(scores[i]>=4?"#14B8A6":scores[i]>=3?"#F59E0B":"#EF4444"):"#1E293B"}}/>)}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* ── WHY ── */}
      {tab==="why"&&<div>
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:14,marginBottom:14}}>
          <p style={{color:C.gold,fontSize:13,fontWeight:700}}>왜 이 자영업이 추천되었을까?</p>
          <p style={{color:C.g,fontSize:12,marginTop:4,lineHeight:1.5}}>12가지 역량 + 자금 + 경험을 종합 분석한 결과예요.</p>
        </div>

        {t3.map((b,i)=>{
          const strong=b.sc.map((s,j)=>({req:s,my:scores[j],name:SHORT[j],icon:ICONS[j]})).filter(x=>x.req>=4&&x.my>=4);
          const weak=b.sc.map((s,j)=>({req:s,my:scores[j],name:SHORT[j],icon:ICONS[j]})).filter(x=>x.req>=4&&x.my<=2);
          return(
            <div key={i} style={{background:C.card,border:`1px solid ${i===0?"#0D9488":"#1E293B"}`,borderRadius:14,padding:16,marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{color:C.gold,fontSize:12,fontWeight:700}}>{["🏆 1위","🥈 2위","🥉 3위","4위","5위"][i]}</span>
                <h4 style={{fontSize:16,fontWeight:700}}>{b.name}</h4>
              </div>
              <div style={{background:"rgba(13,148,136,0.06)",borderRadius:10,padding:12,marginBottom:10}}>
                <p style={{color:C.tealG,fontSize:13,lineHeight:1.7}}>{b.why}</p>
              </div>
              {strong.length>0&&<div style={{marginBottom:8}}>
                <p style={{color:C.green,fontSize:11,fontWeight:600,marginBottom:4}}>✅ 딱 맞는 역량</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {strong.map((s,j)=>(
                    <span key={j} style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",color:C.green,fontSize:11,padding:"3px 8px",borderRadius:6}}>
                      {s.icon} {s.name} (내 {s.my} ≥ 필요 {s.req})
                    </span>
                  ))}
                </div>
              </div>}
              {weak.length>0&&<div>
                <p style={{color:C.gold,fontSize:11,fontWeight:600,marginBottom:4}}>⚠️ 보완하면 좋은 점</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {weak.map((s,j)=>(
                    <span key={j} style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",color:C.gold,fontSize:11,padding:"3px 8px",borderRadius:6}}>
                      {s.icon} {s.name} (내 {s.my} &lt; 필요 {s.req})
                    </span>
                  ))}
                </div>
              </div>}
            </div>
          );
        })}
      </div>}

      {/* ── FUTURE (재미 요소 + 공유 트리거 — 자랑 톤 X, 대화 트리거 O) ── */}
      {tab==="future"&&<div>
        <div style={{background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,padding:12,marginBottom:12}}>
          <p style={{color:C.purple,fontSize:11,lineHeight:1.6}}>💭 진지한 분석은 위 탭에서 다 봤죠? 여기서는 잠깐 상상해봐요. {futureY}년의 당신이 이 일을 즐기면서 잘하고 있는 모습을요.</p>
        </div>
        <div style={{background:"linear-gradient(180deg,#0D1117,rgba(13,148,136,0.08),rgba(245,158,11,0.05))",borderRadius:20,padding:24,textAlign:"center",border:"1px solid rgba(13,148,136,0.25)",marginBottom:14}}>
          <p style={{color:C.teal,fontSize:11,fontWeight:600,letterSpacing:3,marginBottom:14}}>— {futureY}년 —</p>
          <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#0D9488,#8B5CF6)",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:"0 0 40px rgba(13,148,136,.3)"}}>👤</div>
          <h2 style={{fontSize:22,fontWeight:800,marginBottom:3}}>{dn} 대표</h2>
          <p style={{color:C.gold,fontSize:13,fontWeight:600,marginBottom:14}}>{top.name} · {top.cat}</p>
          <div style={{background:"rgba(0,0,0,.3)",borderRadius:10,padding:14}}>
            <p style={{color:C.g,fontSize:13,fontStyle:"italic",lineHeight:1.7}}>
              &quot;{top.name} 일이 적성에 맞아서, 매일 매장 나가는 게 즐거워요. 단골손님들과 인사하는 게 하루의 낙입니다.&quot;
            </p>
            <p style={{color:C.gold,fontSize:10,marginTop:8}}>— {futureY}년 {dn} 대표 인터뷰 中</p>
          </div>
        </div>

        <p style={{color:C.gd,fontSize:11,textAlign:"center",marginBottom:10}}>이 결과, 친구 의견도 들어볼까요?</p>
        <Btn style={{background:"linear-gradient(135deg,#EC4899,#8B5CF6)",width:"100%",marginBottom:8}} onClick={()=>alert("공유 링크 복사됨!\n메시지: '나 퇴사하면 "+top.name+"이 딱이래 🤔 너는 뭐 나오는지 해봐'")}>📸 결과 공유하기</Btn>
        <Btn style={{background:C.card,border:"1px solid #1E293B",color:C.gold,width:"100%",marginBottom:14}} onClick={()=>alert("카카오톡 공유 링크 복사됨!")}>💬 카카오톡으로 보내기</Btn>

        {/* 이메일 저장 — 가치 강조 */}
        <div style={{background:C.card,border:"1px solid #1E293B",borderRadius:14,padding:14,marginTop:8}}>
          <p style={{color:C.tealG,fontSize:13,fontWeight:700,marginBottom:4}}>📧 분석 결과 저장하기</p>
          <p style={{color:C.gd,fontSize:11,marginBottom:10,lineHeight:1.5}}>이 페이지를 닫으면 다시 보기 어려워요. 나중에 천천히 다시 보고 싶다면 이메일로 받아두세요.</p>
          <input placeholder="이름" style={{width:"100%",background:"#0A0E1A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 12px",fontSize:13,color:C.w,marginBottom:6,outline:"none",boxSizing:"border-box"}}/>
          <input placeholder="이메일" type="email" style={{width:"100%",background:"#0A0E1A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 12px",fontSize:13,color:C.w,marginBottom:6,outline:"none",boxSizing:"border-box"}}/>
          <input placeholder="전화번호" type="tel" style={{width:"100%",background:"#0A0E1A",border:"1px solid #1E293B",borderRadius:8,padding:"9px 12px",fontSize:13,color:C.w,marginBottom:10,outline:"none",boxSizing:"border-box"}}/>
          <label style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:5,cursor:"pointer"}}>
            <input type="checkbox" style={{marginTop:2}}/>
            <span style={{color:C.g,fontSize:11,lineHeight:1.5}}>(필수) 개인정보 수집 및 이용에 동의합니다</span>
          </label>
          <label style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:10,cursor:"pointer"}}>
            <input type="checkbox" style={{marginTop:2}}/>
            <span style={{color:C.gd,fontSize:11,lineHeight:1.5}}>(선택) 창업 관련 유용한 정보를 받아보겠습니다</span>
          </label>
          <Btn primary full onClick={()=>alert("결과를 이메일로 보내드렸어요!")}>결과 받기</Btn>
        </div>
      </div>}

      {/* ── GUIDE ── */}
      {tab==="guide"&&<div>
        {t3.map((b,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${openIdx===i?"#10B981":"#1E293B"}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}>
            <button onClick={()=>setOpenIdx(openIdx===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{textAlign:"left"}}>
                <span style={{color:C.gold,fontSize:11,fontWeight:600}}>{["🏆 1위","🥈 2위","🥉 3위","4위","5위"][i]}</span>
                <h4 style={{fontSize:15,fontWeight:700,color:C.w,marginTop:2}}>{b.name}</h4>
              </div>
              <div style={{textAlign:"right"}}>
                <span style={{color:C.goldL,fontSize:13,fontWeight:700}}>{b.cost}만원</span>
                <p style={{color:C.gd,fontSize:16,marginTop:2}}>{openIdx===i?"▲":"▼"}</p>
              </div>
            </button>
            {openIdx===i&&<div style={{padding:"0 16px 16px"}}>
              <div style={{background:"rgba(0,0,0,.2)",borderRadius:10,padding:12,marginBottom:8}}>
                <p style={{color:C.tealG,fontSize:12,fontWeight:600,marginBottom:4}}>📊 현실 수익</p>
                <p style={{color:C.g,fontSize:13,lineHeight:1.7}}>{b.real}</p>
              </div>
              <div style={{background:"rgba(0,0,0,.2)",borderRadius:10,padding:12,marginBottom:8}}>
                <p style={{color:C.gold,fontSize:12,fontWeight:600,marginBottom:4}}>🎯 창업 가이드</p>
                <p style={{color:C.g,fontSize:13,lineHeight:1.7}}>{b.guide}</p>
              </div>
              <div style={{background:"rgba(0,0,0,.2)",borderRadius:10,padding:12}}>
                <p style={{color:C.green,fontSize:12,fontWeight:600,marginBottom:6}}>💰 비용 구조</p>
                {[{l:"임대/시설",p:"35~45%",c:"#0D9488"},{l:"인테리어/장비",p:"25~35%",c:"#8B5CF6"},{l:"운영자금",p:"15~25%",c:"#F59E0B"},{l:"마케팅/인허가",p:"5~15%",c:"#EC4899"}].map((x,j)=>(
                  <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:7,height:7,borderRadius:2,background:x.c}}/><span style={{color:C.g,fontSize:12}}>{x.l}</span>
                    </div>
                    <span style={{color:C.g,fontSize:12}}>{x.p}</span>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        ))}

        <div style={{background:C.card,borderRadius:14,padding:14,marginBottom:10}}>
          <p style={{color:C.tealG,fontSize:13,fontWeight:700,marginBottom:8}}>✅ 창업 전 필수 체크리스트</p>
          {["사업자등록증 발급 (세무서, 무료)","업종별 인허가 확인","사업자 통장 개설","간이과세 vs 일반과세 선택","임대차 계약 전 권리금, 상권분석","소상공인 정책자금 확인","화재, 배상책임보험 가입","세무사 선임 (월 10~15만원)"].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<7?"1px solid #1E293B":"none"}}>
              <span style={{color:C.teal,fontSize:12}}>☐</span><span style={{color:C.g,fontSize:12}}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:14,padding:14}}>
          <p style={{color:C.purple,fontSize:13,fontWeight:700,marginBottom:6}}>🏛️ 정부지원</p>
          {[{n:"소상공인 정책자금",d:"최대 7천만원 저금리 대출"},{n:"청년창업사관학교",d:"최대 1억+공간"},{n:"초기창업패키지",d:"최대 1억 사업화자금"},{n:"비수도권 법인세감면",d:"5년간 50% 감면"}].map((s,i)=>(
            <div key={i} style={{padding:"7px 0",borderBottom:i<3?"1px solid #1E293B":"none"}}>
              <span style={{fontSize:13,fontWeight:600}}>{s.n}</span>
              <p style={{color:C.gd,fontSize:11,marginTop:2}}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>}

      <div style={{textAlign:"center",marginTop:20,paddingBottom:28}}>
        <Btn onClick={reset}>🔄 처음부터 다시하기</Btn>
      </div>
    </div></div>);
  }

  return null;
}
