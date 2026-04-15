import { redirect } from 'next/navigation';

import { CatalogItemForm } from '@/components/admin/CatalogItemForm';
import { buildEmptyCatalogItem, parseCatalogItemFormData } from '@/lib/admin-catalog-form';
import { createCatalogItem, getReleaseCategories, listMasterDataReleases } from '@/lib/master-data-admin';
import { catalogItemSchema } from '@/lib/validation';

export default async function AdminCatalogNewPage({
  searchParams
}: {
  searchParams?: { releaseId?: string; error?: string; category?: string };
}) {
  const releases = await listMasterDataReleases();
  const releaseId = searchParams?.releaseId ?? releases.find((release) => release.status === 'draft')?.id ?? releases[0]?.id;
  if (!releaseId) {
    return <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-6 text-sm text-quiz-text-secondary">사용 가능한 release가 없습니다.</div>;
  }

  const categories = await getReleaseCategories(releaseId);

  async function createAction(formData: FormData) {
    'use server';

    const releaseId = String(formData.get('releaseId') ?? '');
    try {
      const parsed = catalogItemSchema.parse(parseCatalogItemFormData(formData));
      const created = await createCatalogItem(releaseId, parsed);
      redirect(`/admin/catalog/${created.draftId}`);
    } catch (error) {
      redirect(`/admin/catalog/new?releaseId=${releaseId}&error=${encodeURIComponent(error instanceof Error ? error.message : '업종 생성 실패')}`);
    }
  }

  return (
    <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
      <h2 className="text-2xl font-bold">새 업종 추가</h2>
      <p className="mt-2 text-sm text-quiz-text-secondary">기존 카테고리 안에서만 추가할 수 있습니다.</p>
      {searchParams?.error ? (
        <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {searchParams.error}
        </div>
      ) : null}
      <form action={createAction} className="mt-6">
        <CatalogItemForm
          releaseId={releaseId}
          categories={categories}
          item={buildEmptyCatalogItem(searchParams?.category)}
          submitLabel="업종 저장"
        />
      </form>
    </div>
  );
}
