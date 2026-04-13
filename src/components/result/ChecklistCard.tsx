const checklist = [
  '사업자등록증 발급',
  '업종별 인허가 확인',
  '사업자 통장 개설',
  '간이과세 vs 일반과세 선택',
  '임대차 계약 전 권리금·상권 분석',
  '소상공인 정책자금 확인',
  '화재·배상책임보험 가입',
  '세무사 선임 여부 검토'
];

export function ChecklistCard() {
  return (
    <div className="rounded-md border border-quiz-border bg-quiz-card p-5">
      <h3 className="text-lg font-bold">✅ 창업 전 필수 체크리스트</h3>
      <div className="mt-4 space-y-2 text-sm leading-7 text-quiz-text-secondary">
        {checklist.map((item) => (
          <label key={item} className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 accent-quiz-teal" />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
