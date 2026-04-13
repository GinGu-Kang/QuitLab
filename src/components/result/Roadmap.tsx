const roadmap = [
  { label: 'D-90', title: '사업 타당성 조사', desc: '상권 분석과 고객 인터뷰를 시작하세요.' },
  { label: 'D-60', title: '자금·공간 확보', desc: '사업자등록, 인테리어, 자금 조달을 병행합니다.' },
  { label: 'D-30', title: '운영 리허설', desc: '메뉴·상품 확정, 채용, 마케팅 준비를 마칩니다.' },
  { label: '개업일', title: '그랜드 오프닝', desc: '첫 고객 경험과 리뷰 루프를 만드세요.' },
  { label: '+3개월', title: '손익분기 점검', desc: '고객 피드백과 수익 구조를 다시 조정합니다.' },
  { label: '+6개월', title: '확장 전략 수립', desc: '자동화 또는 추가 채널 확장을 검토합니다.' }
];

export function Roadmap() {
  return (
    <div className="rounded-md border border-quiz-border bg-quiz-card p-5">
      <h3 className="text-lg font-bold">실행 로드맵</h3>
      <div className="mt-5 sm:overflow-x-auto">
        <div className="flex flex-col gap-4 sm:min-w-[720px] sm:flex-row sm:items-start">
          {roadmap.map((item, index) => (
            <div key={item.label} className="relative sm:flex-1">
              {index < roadmap.length - 1 ? (
                <div className="absolute left-[calc(100%_-_8px)] top-4 hidden h-[2px] w-8 bg-gradient-to-r from-quiz-teal to-quiz-gold sm:block" />
              ) : null}
              <div className="mb-3 inline-flex rounded-full bg-quiz-bg px-3 py-1 text-xs font-semibold text-quiz-teal-light">{item.label}</div>
              <div className="rounded-md bg-quiz-bg/70 p-4">
                <strong className="text-sm">{item.title}</strong>
                <p className="mt-2 text-xs leading-6 text-quiz-text-secondary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
