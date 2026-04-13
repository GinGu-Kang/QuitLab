export function AdBanner({ compact = false }: { compact?: boolean }) {
  if (process.env.NEXT_PUBLIC_ADSENSE_ID) {
    return (
      <div className="rounded-lg border border-quiz-border bg-quiz-card p-4 text-center text-sm text-quiz-text-secondary">
        Google AdSense 슬롯 자리입니다. 배포 환경에서 실제 광고 코드로 교체됩니다.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-dashed border-quiz-border bg-quiz-card/70 p-4 text-center ${compact ? 'text-xs' : 'text-sm'} text-quiz-text-dim`}>
      광고 승인 전까지는 이 플레이스홀더가 표시됩니다.
    </div>
  );
}
