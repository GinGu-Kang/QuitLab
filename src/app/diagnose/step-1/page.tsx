import { Step1Client } from '@/components/diagnose/Step1Client';
import { getPublishedMasterData } from '@/lib/master-data';

export default async function Step1Page() {
  const masterData = await getPublishedMasterData();

  return <Step1Client hardFilters={masterData.hardFilters} />;
}
