import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[860px] px-4 py-10">
      <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-8">
        <h1 className="text-3xl font-bold">이용약관</h1>
        <div className="mt-6 space-y-5 text-sm leading-8 text-quiz-text-secondary">
          <p>본 서비스는 창업 아이템 적합도를 진단하는 정보 제공 서비스입니다.</p>
          <p>진단 결과는 투자 자문이 아니며, 실제 창업 의사결정은 사용자 책임 하에 진행됩니다.</p>
          <p>서비스는 예고 없이 기능이 변경될 수 있으며, 운영자는 서비스 이용으로 인한 직접적 손해를 보증하지 않습니다.</p>
          <p>콘텐츠와 데이터 구성에 관한 지식재산권은 서비스 제공자에게 있습니다.</p>
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-quiz-teal-light underline">
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
