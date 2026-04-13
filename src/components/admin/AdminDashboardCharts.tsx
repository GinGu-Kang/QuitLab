'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { CHART_COLORS } from '@/lib/chart-colors';
import type { AdminStats } from '@/types';

export function AdminDashboardCharts({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
          <p className="text-sm text-quiz-text-secondary">전체 참여자</p>
          <h2 className="mt-3 text-4xl font-black">{stats.totalParticipants}</h2>
        </div>
        <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
          <p className="text-sm text-quiz-text-secondary">이메일 수집률</p>
          <h2 className="mt-3 text-4xl font-black">{stats.emailCollectionRate}%</h2>
        </div>
        <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
          <p className="text-sm text-quiz-text-secondary">기록된 퍼널 이벤트</p>
          <h2 className="mt-3 text-4xl font-black">{stats.funnel.reduce((sum, item) => sum + item.count, 0)}</h2>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
          <h3 className="text-lg font-bold">일별 참여 추이</h3>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyTrend}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#14B8A6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
          <h3 className="text-lg font-bold">인기 추천 업종 TOP 10</h3>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topItems} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: '#94A3B8' }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-quiz-border bg-quiz-card p-5">
        <h3 className="text-lg font-bold">전환 퍼널</h3>
        <div className="mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="count" data={stats.funnel} isAnimationActive fill={CHART_COLORS.primary} />
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
