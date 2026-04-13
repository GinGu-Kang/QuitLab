'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as BaseRadarChart,
  ResponsiveContainer
} from 'recharts';

import { CHART_COLORS } from '@/lib/chart-colors';
import { COMPETENCY_ICONS, COMPETENCY_LABELS, type StartupItem } from '@/types';

export function RadarChart({ userScores, topItem }: { userScores: number[]; topItem: StartupItem }) {
  const data = COMPETENCY_LABELS.map((label, index) => ({
    label,
    user: userScores[index],
    required: topItem.competencyScores[
      ['analytical', 'creativity', 'interpersonal', 'tech', 'sales', 'selfManagement', 'risk', 'trend', 'stamina', 'finance', 'leadership', 'content'][index] as keyof StartupItem['competencyScores']
    ]
  }));

  return (
    <div className="space-y-4 rounded-lg border border-quiz-border bg-quiz-card p-4">
      <div className="h-[220px] w-full sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BaseRadarChart data={data}>
            <PolarGrid stroke={CHART_COLORS.grid} />
            <PolarAngleAxis dataKey="label" tick={{ fill: CHART_COLORS.tickText, fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: CHART_COLORS.tickDim, fontSize: 9 }} />
            <Radar dataKey="user" stroke={CHART_COLORS.primary} fill="rgba(20, 184, 166, 0.22)" />
            <Radar dataKey="required" stroke={CHART_COLORS.secondary} fill="rgba(245, 158, 11, 0.12)" />
          </BaseRadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.map((entry, index) => (
          <div key={entry.label} className="flex items-center gap-2 rounded-lg bg-quiz-bg/70 px-2 py-1.5">
            <span className="text-[13px]">{COMPETENCY_ICONS[index]}</span>
            <span className="flex-1 text-[10px] text-quiz-text-secondary">{entry.label}</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, step) => {
                const score = step + 1;
                const filled = score <= entry.user;
                const color = entry.user >= 4 ? CHART_COLORS.primary : entry.user >= 3 ? CHART_COLORS.secondary : CHART_COLORS.danger;
                return (
                  <span
                    key={`${entry.label}_${score}`}
                    className="h-[5px] w-[11px] rounded-sm"
                    style={{ background: filled ? color : CHART_COLORS.muted }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
