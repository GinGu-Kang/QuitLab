'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { CHART_COLORS } from '@/lib/chart-colors';
import type { MatchResult } from '@/types';

export function CompetencyGap({ result, userScores }: { result: MatchResult; userScores: number[] }) {
  const data = result.competencyGap.map((gap) => ({
    name: gap.label,
    user: gap.userScore,
    required: gap.requiredScore
  }));

  if (!data.length) {
    return (
      <div className="rounded-lg border border-quiz-border bg-quiz-card p-5 text-sm text-quiz-text-secondary">
        핵심 역량 기준으로 큰 갭이 없습니다. 대신 운영 루틴과 시장 이해를 다듬는 데 집중하면 좋아요.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
      <h3 className="mb-4 text-lg font-bold">역량 GAP 분석</h3>
      <div className="h-[260px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 5]} tick={{ fill: CHART_COLORS.tickText }} />
            <YAxis type="category" dataKey="name" width={72} tick={{ fill: CHART_COLORS.tickText, fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="user" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
            <Bar dataKey="required" fill={CHART_COLORS.secondary} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
