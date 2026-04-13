'use client';

import { useEffect, useMemo, useState } from 'react';

import { AdBanner } from '@/components/AdBanner';
import { DiagnosisSummary } from '@/components/result/DiagnosisSummary';
import { Top5Cards } from '@/components/result/Top5Cards';
import { RadarChart } from '@/components/result/RadarChart';
import { WhyRecommended } from '@/components/result/WhyRecommended';
import { CompetencyGap } from '@/components/result/CompetencyGap';
import { SupplementGuide } from '@/components/result/SupplementGuide';
import { RiskWarning } from '@/components/result/RiskWarning';
import { ScoreBreakdown } from '@/components/result/ScoreBreakdown';
import { StartupGuide } from '@/components/result/StartupGuide';
import { ChecklistCard } from '@/components/result/ChecklistCard';
import { GovernmentSupport } from '@/components/result/GovernmentSupport';
import { Roadmap } from '@/components/result/Roadmap';
import { FutureVision } from '@/components/result/FutureVision';
import { ShareButtons } from '@/components/result/ShareButtons';
import { EmailCollector } from '@/components/result/EmailCollector';
import { recordEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { useDiagnoseStore } from '@/store/diagnose-store';
import type { PersistedResult, ResultTabKey } from '@/types';

const tabs: { key: ResultTabKey; label: string; color: string }[] = [
  { key: 'match', label: '🏆 추천', color: '#0D9488' },
  { key: 'why', label: '💡 분석근거', color: '#F59E0B' },
  { key: 'guide', label: '📋 가이드', color: '#10B981' },
  { key: 'future', label: '✨ 미래상상', color: '#14B8A6' }
];

export function ResultPageClient({ result }: { result: PersistedResult }) {
  const [activeTab, setActiveTab] = useState<ResultTabKey>('match');
  const resetDiagnose = useDiagnoseStore((state) => state.reset);

  useEffect(() => {
    void recordEvent('result_view', result.sessionId, {
      topItem: result.top5Results[0]?.item.name
    });
  }, [result.sessionId, result.top5Results]);

  const nickname = result.nickname || '도전자';
  const topResult = result.top5Results[0];
  const userScores = result.competencyScores;

  const tabContent = useMemo(() => {
    if (!topResult) return null;
    if (activeTab === 'match') {
      return (
        <div className="space-y-4">
          <DiagnosisSummary scores={userScores} />
          <Top5Cards results={result.top5Results} />
          <RadarChart userScores={userScores} topItem={topResult.item} />
        </div>
      );
    }

    if (activeTab === 'why') {
      return (
        <div className="space-y-4">
          <WhyRecommended results={result.top5Results} userScores={userScores} />
          <CompetencyGap result={topResult} userScores={userScores} />
          <SupplementGuide result={topResult} />
          <RiskWarning results={result.top5Results} />
          <ScoreBreakdown results={result.top5Results} />
        </div>
      );
    }

    if (activeTab === 'guide') {
      return (
        <div className="space-y-4">
          <StartupGuide results={result.top5Results} />
          <ChecklistCard />
          <GovernmentSupport />
          <Roadmap />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <FutureVision name={nickname} topResult={topResult} />
        <ShareButtons sessionId={result.sessionId} topItem={topResult.item.name} />
        <EmailCollector sessionId={result.sessionId} />
      </div>
    );
  }, [activeTab, nickname, result.sessionId, result.top5Results, userScores, topResult]);

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10">
      <SectionCard className="overflow-hidden bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(17,24,39,0.98),rgba(245,158,11,0.06))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold text-quiz-teal-light">{nickname}님, 데이터 분석이 끝났어요</p>
            <h1 className="mt-2 text-[24px] font-extrabold leading-tight sm:text-[30px] lg:text-[38px]">129개 업종 × 12개 역량 × 현실 조건 교차 분석 결과</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-quiz-text-secondary">
              추천은 적합도 기준입니다. 가이드를 함께 보면서 실제 투자·운영 난이도까지 같이 판단하세요.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              resetDiagnose();
              window.location.assign('/diagnose/step-1');
            }}
          >
            다시 진단하기
          </Button>
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div role="tablist" className="grid grid-cols-2 gap-2 rounded-lg border border-quiz-border bg-quiz-card p-2 sm:grid-cols-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 rounded-sm border px-3 py-2 text-[12px] font-semibold"
                style={{
                  borderColor: activeTab === tab.key ? tab.color : '#1E293B',
                  background: activeTab === tab.key ? `${tab.color}22` : '#111827',
                  color: activeTab === tab.key ? tab.color : '#64748B'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {tabContent}
        </div>

        <div className="space-y-4">
          <SectionCard>
            <h2 className="text-lg font-bold">핵심 요약</h2>
            <div className="mt-4 space-y-3 text-sm text-quiz-text-secondary">
              {topResult ? (
                <>
                  <div className="rounded-md bg-quiz-bg/70 p-4">
                    <p className="text-xs text-quiz-text-dim">1위 추천</p>
                    <p className="mt-1 font-semibold text-quiz-text">{topResult.item.name}</p>
                  </div>
                  <div className="rounded-md bg-quiz-bg/70 p-4">
                    <p className="text-xs text-quiz-text-dim">현실 투자비</p>
                    <p className="mt-1 font-semibold text-quiz-text">{topResult.item.investmentRange}</p>
                  </div>
                  <div className="rounded-md bg-quiz-bg/70 p-4">
                    <p className="text-xs text-quiz-text-dim">대표 리스크</p>
                    <p className="mt-1 font-semibold text-quiz-text">{topResult.riskWarnings[0] || '핵심 리스크 낮음'}</p>
                  </div>
                </>
              ) : null}
            </div>
          </SectionCard>
          <AdBanner />
        </div>
      </div>
    </div>
  );
}
