import { Step2Client } from '@/components/diagnose/Step2Client';
import { getPublishedMasterData } from '@/lib/master-data';

export default async function Step2Page() {
  const masterData = await getPublishedMasterData();

  return <Step2Client questions={masterData.competencyQuestions} />;
}
