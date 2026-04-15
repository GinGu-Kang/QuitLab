import { Step3Client } from '@/components/diagnose/Step3Client';
import { getPublishedMasterData } from '@/lib/master-data';

export default async function Step3Page() {
  const masterData = await getPublishedMasterData();

  return <Step3Client questions={masterData.personalityQuestions} />;
}
