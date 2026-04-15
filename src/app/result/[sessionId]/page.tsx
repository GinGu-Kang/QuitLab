import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ResultPageClient } from '@/components/result/ResultPageClient';
import { getMasterDataByReleaseId } from '@/lib/master-data';
import { getResultBySession } from '@/lib/repository';

export async function generateMetadata({
  params
}: {
  params: { sessionId: string };
}): Promise<Metadata> {
  const result = await getResultBySession(params.sessionId);
  if (!result) return {};

  const topItem = result.top5Results[0]?.item.name || '맞춤 업종';
  return {
    title: `나의 창업 적합 업종: ${topItem} | 퇴사하면 나는`,
    description: `129개 업종 분석 결과, 가장 적합한 창업 아이템은 "${topItem}"입니다.`,
    openGraph: {
      title: `퇴사하면 나는 ${topItem}이 딱이래 🤔`,
      description: '너는 뭐 나오는지 해봐! 3분 무료 창업 진단'
    }
  };
}

export default async function ResultPage({ params }: { params: { sessionId: string } }) {
  const result = await getResultBySession(params.sessionId);

  if (!result) {
    notFound();
  }

  const masterData = await getMasterDataByReleaseId(result.masterDataReleaseId);

  return <ResultPageClient result={result} competencyGuide={masterData.competencyGuide} />;
}
