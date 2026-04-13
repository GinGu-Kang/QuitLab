const supports = [
  '소상공인 정책자금: 최대 7천만원 저금리 대출',
  '청년창업사관학교: 최대 1억 + 공간 지원',
  '초기창업패키지: 최대 1억 사업화 자금',
  '비수도권 법인세 감면: 5년간 50% 감면'
];

export function GovernmentSupport() {
  return (
    <div className="rounded-md border border-quiz-border bg-quiz-card p-5">
      <h3 className="text-lg font-bold">🏛️ 정부지원</h3>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-quiz-text-secondary">
        {supports.map((support) => (
          <li key={support}>{support}</li>
        ))}
      </ul>
    </div>
  );
}
