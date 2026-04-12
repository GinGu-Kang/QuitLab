import { AdPageClient } from '@/components/ad/AdPageClient';

export default function AdPage({ searchParams }: { searchParams?: { sid?: string } }) {
  return <AdPageClient sid={searchParams?.sid} />;
}
