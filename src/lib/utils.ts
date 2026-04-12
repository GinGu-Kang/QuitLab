import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatScore(value: number) {
  return value.toFixed(1);
}

export function extractFirstNumber(text: string) {
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function parsePercentageRange(text: string) {
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)%/g)].map((match) => Number(match[1]));
  if (!matches.length) return null;
  return {
    min: Math.min(...matches),
    max: Math.max(...matches)
  };
}

export function parseMonthlyRevenueRange(text: string) {
  const normalized = text.replace(/\s/g, '');
  const matches = [...normalized.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(만|천|억)?/g)]
    .map((match) => convertKoreanAmount(match[1], match[2] ?? ''))
    .filter((value) => value !== null) as number[];

  if (!matches.length) return null;
  return {
    min: Math.min(...matches),
    max: Math.max(...matches)
  };
}

export function convertKoreanAmount(raw: string, unit: string) {
  const numeric = Number(raw.replace(/,/g, ''));
  if (Number.isNaN(numeric)) return null;
  if (unit === '억') return numeric * 10000;
  if (unit === '천') return numeric * 1000;
  if (unit === '만' || unit === '') return numeric;
  return numeric;
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

export function toAbsoluteUrl(pathname: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return new URL(pathname, base).toString();
}

export function groupByDate(items: { createdAt: string }[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item.createdAt.slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
