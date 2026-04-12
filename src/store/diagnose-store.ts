'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CareerKey, DiagnoseInput, PersonalityChoice } from '@/types';

type HardFilterState = DiagnoseInput['hardFilter'];

interface DiagnoseState {
  trackingId: string;
  lastSessionId?: string;
  hardFilter: Partial<HardFilterState>;
  competencyAnswers: (number | null)[];
  personalityAnswers: (PersonalityChoice | null)[];
  name: string;
  currentStep: number;
  hardFilterIndex: number;
  competencyIndex: number;
  personalityIndex: number;
  setHardFilter: (key: keyof HardFilterState, value: HardFilterState[keyof HardFilterState]) => void;
  setCompetencyAnswer: (index: number, score: number) => void;
  setPersonalityAnswer: (index: number, choice: PersonalityChoice) => void;
  setName: (name: string) => void;
  setCurrentStep: (step: number) => void;
  setLastSessionId: (sessionId: string) => void;
  nextHardFilter: () => void;
  nextCompetency: () => void;
  nextPersonality: () => void;
  setHardFilterIndex: (index: number) => void;
  setCompetencyIndex: (index: number) => void;
  setPersonalityIndex: (index: number) => void;
  getCompetencyScores: () => number[];
  getDiagnoseInput: () => DiagnoseInput | null;
  reset: () => void;
}

const DEFAULT_HARD_FILTER: HardFilterState = {
  capital: 3000,
  region: 'metro',
  license: 'none',
  timing: '3m',
  family: 'single',
  income: 300,
  career: 'office' as CareerKey,
  loan: false
};

function buildTrackingId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `visitor_${Math.random().toString(36).slice(2, 11)}`;
}

export const useDiagnoseStore = create<DiagnoseState>()(
  persist(
    (set, get) => ({
      trackingId: buildTrackingId(),
      lastSessionId: undefined,
      hardFilter: {},
      competencyAnswers: Array(24).fill(null),
      personalityAnswers: Array(10).fill(null),
      name: '',
      currentStep: 1,
      hardFilterIndex: 0,
      competencyIndex: 0,
      personalityIndex: 0,
      setHardFilter: (key, value) =>
        set((state) => ({
          hardFilter: {
            ...state.hardFilter,
            [key]: value
          }
        })),
      setCompetencyAnswer: (index, score) =>
        set((state) => {
          const answers = [...state.competencyAnswers];
          answers[index] = score;
          return { competencyAnswers: answers };
        }),
      setPersonalityAnswer: (index, choice) =>
        set((state) => {
          const answers = [...state.personalityAnswers];
          answers[index] = choice;
          return { personalityAnswers: answers };
        }),
      setName: (name) => set({ name }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setLastSessionId: (lastSessionId) => set({ lastSessionId }),
      nextHardFilter: () => set((state) => ({ hardFilterIndex: state.hardFilterIndex + 1 })),
      nextCompetency: () => set((state) => ({ competencyIndex: state.competencyIndex + 1 })),
      nextPersonality: () => set((state) => ({ personalityIndex: state.personalityIndex + 1 })),
      setHardFilterIndex: (hardFilterIndex) => set({ hardFilterIndex }),
      setCompetencyIndex: (competencyIndex) => set({ competencyIndex }),
      setPersonalityIndex: (personalityIndex) => set({ personalityIndex }),
      getCompetencyScores: () => {
        const answers = get().competencyAnswers;
        return Array.from({ length: 12 }, (_, index) => {
          const first = answers[index * 2];
          const second = answers[index * 2 + 1];
          if (first != null && second != null) return Number(((first + second) / 2).toFixed(1));
          if (first != null) return first;
          if (second != null) return second;
          return 3;
        });
      },
      getDiagnoseInput: () => {
        const state = get();
        const hardFilter = {
          ...DEFAULT_HARD_FILTER,
          ...state.hardFilter
        };
        if (state.personalityAnswers.some((entry) => entry == null)) return null;
        return {
          hardFilter,
          competencyScores: state.getCompetencyScores(),
          personalityAnswers: state.personalityAnswers.filter(Boolean) as PersonalityChoice[],
          nickname: state.name || '도전자'
        };
      },
      reset: () =>
        set({
          trackingId: buildTrackingId(),
          lastSessionId: undefined,
          hardFilter: {},
          competencyAnswers: Array(24).fill(null),
          personalityAnswers: Array(10).fill(null),
          name: '',
          currentStep: 1,
          hardFilterIndex: 0,
          competencyIndex: 0,
          personalityIndex: 0
        })
    }),
    {
      name: 'quit-diagnose-storage'
    }
  )
);
