'use client';

import { useState } from 'react';

import type { MatchResult } from '@/types';

const costStructure = [
  { label: '임대/시설', width: '42%', color: '#14B8A6' },
  { label: '인테리어/장비', width: '30%', color: '#8B5CF6' },
  { label: '운영자금', width: '18%', color: '#F59E0B' },
  { label: '마케팅/인허가', width: '10%', color: '#EC4899' }
];

export function StartupGuide({ results }: { results: MatchResult[] }) {
  const [openId, setOpenId] = useState<number>(results[0]?.item.id ?? 0);

  return (
    <div className="space-y-3">
      {results.map((result, index) => {
        const open = openId === result.item.id;
        return (
          <div
            key={result.item.id}
            className={`rounded-[18px] border bg-quiz-card ${open ? 'border-quiz-green' : 'border-quiz-border'}`}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              onClick={() => setOpenId(open ? 0 : result.item.id)}
            >
              <div>
                <p className="text-sm font-semibold text-quiz-text-secondary">{index + 1}위 추천</p>
                <h3 className="mt-1 text-lg font-bold">{result.item.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-quiz-text-dim">{result.item.investmentRange}</p>
                <span className="mt-2 inline-block text-sm text-quiz-text-secondary">{open ? '▲' : '▼'}</span>
              </div>
            </button>

            {open ? (
              <div className="space-y-4 border-t border-quiz-border px-5 py-5">
                <div className="rounded-[14px] bg-quiz-bg/70 p-4">
                  <p className="text-xs font-semibold text-quiz-green">📊 현실 수익</p>
                  <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">{result.marketSummary}</p>
                </div>

                <div className="rounded-[14px] bg-quiz-bg/70 p-4">
                  <p className="text-xs font-semibold text-quiz-gold-light">🎯 창업 가이드</p>
                  <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">{result.preparationGuide}</p>
                </div>

                <div className="rounded-[14px] bg-quiz-bg/70 p-4">
                  <p className="text-xs font-semibold text-quiz-pink">💰 비용 구조</p>
                  <div className="mt-3 space-y-3">
                    {costStructure.map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex justify-between text-xs text-quiz-text-secondary">
                          <span>{item.label}</span>
                          <span>{item.width}</span>
                        </div>
                        <div className="h-2 rounded-full bg-quiz-border">
                          <div className="h-full rounded-full" style={{ width: item.width, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
