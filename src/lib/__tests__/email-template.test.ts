import { describe, expect, it } from 'vitest';

import { createResultEmail } from '@/lib/email-template';
import type { PersistedResult } from '@/types';

const mockResult = {
  sessionId: 'session-1',
  nickname: '<b>닉네임</b>',
  step1Answers: {
    capitalRange: 'under-30m',
    workStyle: 'solo',
    workHours: 'weekday',
    weekendWork: 'no',
    experience: 'office',
    license: 'none',
    locationFlexibility: 'high',
    incomeUrgency: 'high'
  },
  competencyScores: {
    sales: 7,
    marketing: 7,
    customerService: 7,
    productSourcing: 7,
    spaceOperation: 7,
    branding: 7,
    digitalTools: 7,
    numbers: 7,
    leadership: 7,
    endurance: 7,
    trendSense: 7,
    contentCreation: 7
  },
  personalityAnswers: Array.from({ length: 10 }, () => 3),
  top5Results: [
    {
      item: {
        id: 'item-1',
        category: '카테고리<script>',
        name: '업종<img src=x onerror=alert(1)>',
        summary: '',
        coreCompetencies: [],
        minCapital: 0,
        maxCapital: 0,
        requiredStaff: 'solo',
        operationalIntensity: 'medium',
        requiresWeekend: false,
        worklifeBalance: 'medium',
        seasonality: 'low',
        requiredLicense: false,
        riskLevel: 'medium',
        monthlyRevenue: 0,
        operatingMargin: 0,
        breakEvenMonths: 0,
        competitionLevel: 'medium',
        differentiationPotential: 'medium',
        closureRate: 0,
        growthPotential: 0,
        entryBarrier: 0,
        competencyVector: {
          sales: 7,
          marketing: 7,
          customerService: 7,
          productSourcing: 7,
          spaceOperation: 7,
          branding: 7,
          digitalTools: 7,
          numbers: 7,
          leadership: 7,
          endurance: 7,
          trendSense: 7,
          contentCreation: 7
        }
      },
      finalScore: 91,
      competencyFit: 88,
      personalityFit: 83,
      marketScore: 79,
      careerFit: 75,
      riskPenalty: 0,
      warningTags: [],
      excluded: false,
      reason: '<script>alert(1)</script>\n첫 번째 추천 이유',
      lackingCompetencies: [],
      preparationGuide: '준비 <b>가이드</b>',
      marketSummary: '시장 <i>요약</i>',
      futureScenario: '미래 시나리오'
    }
  ],
  createdAt: new Date().toISOString()
} satisfies PersistedResult;

describe('createResultEmail', () => {
  it('escapes user and result content in HTML', () => {
    const email = createResultEmail(
      {
        name: '<img src=x>',
        unsubscribeToken: 'token-1'
      },
      mockResult
    );

    expect(email.subject).toContain('<b>닉네임</b>');
    expect(email.html).toContain('&lt;b&gt;닉네임&lt;/b&gt;');
    expect(email.html).toContain('업종&lt;img src=x onerror=alert(1)&gt;');
    expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br />첫 번째 추천 이유');
    expect(email.html).not.toContain('<script>alert(1)</script>');
    expect(email.html).not.toContain('<img src=x onerror=alert(1)>');
  });
});
