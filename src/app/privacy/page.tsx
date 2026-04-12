import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[860px] px-4 py-10">
      <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-8">
        <h1 className="text-3xl font-bold">개인정보 처리방침</h1>
        <div className="mt-6 space-y-5 text-sm leading-8 text-quiz-text-secondary">
          <p>수집 항목: 이름, 이메일, 전화번호, 진단 결과 요약, 동의 여부</p>
          <p>수집 목적: 진단 결과 발송, 창업 정보 안내, 서비스 운영 분석</p>
          <p>보유 기간: 결과 저장 후 1년 또는 동의 철회 시 지체 없이 파기</p>
          <p>제3자 제공: 없음</p>
          <p>권리: 열람, 정정, 삭제, 처리정지 요구 가능</p>
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-quiz-teal-light underline">
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
