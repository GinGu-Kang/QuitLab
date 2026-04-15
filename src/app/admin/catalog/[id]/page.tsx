import { redirect } from 'next/navigation';

import { CatalogItemForm } from '@/components/admin/CatalogItemForm';
import { parseCatalogItemFormData } from '@/lib/admin-catalog-form';
import { getCatalogItem, getPublishedReleaseDetail, getReleaseCategories, updateCatalogItem } from '@/lib/master-data-admin';
import { catalogItemSchema } from '@/lib/validation';

function buildDiffFields(current: Record<string, unknown>, baseline: Record<string, unknown> | null) {
  if (!baseline) return [];
  return Object.keys(current)
    .filter((key) => !['draftId', 'releaseId', 'sourceItemId', 'rowStatus'].includes(key))
    .filter((key) => JSON.stringify(current[key]) !== JSON.stringify(baseline[key]));
}

export default async function AdminCatalogEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { success?: string; error?: string };
}) {
  const target = await getCatalogItem(params.id);
  if (!target) {
    return <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-6 text-sm text-quiz-text-secondary">업종을 찾을 수 없습니다.</div>;
  }

  const categories = await getReleaseCategories(target.release.id);
  const published = await getPublishedReleaseDetail();
  const baselineItem = published?.release.snapshotJson?.startupItems.find((item) => item.id === target.item.id) ?? null;
  const diffFields = buildDiffFields(target.item as unknown as Record<string, unknown>, baselineItem as Record<string, unknown> | null);

  async function updateAction(formData: FormData) {
    'use server';

    try {
      const parsed = catalogItemSchema.parse(parseCatalogItemFormData(formData));
      await updateCatalogItem(params.id, parsed);
      redirect(`/admin/catalog/${params.id}?success=${encodeURIComponent('업종 저장 완료')}`);
    } catch (error) {
      redirect(`/admin/catalog/${params.id}?error=${encodeURIComponent(error instanceof Error ? error.message : '업종 저장 실패')}`);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
        <h2 className="text-2xl font-bold">{target.item.name}</h2>
        <p className="mt-2 text-sm text-quiz-text-secondary">
          release: {target.release.version} · status: {target.release.status}
        </p>
        {searchParams?.success ? (
          <div className="mt-4 rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {searchParams.success}
          </div>
        ) : null}
        {searchParams?.error ? (
          <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {searchParams.error}
          </div>
        ) : null}

        <form action={updateAction} className="mt-6">
          <CatalogItemForm
            releaseId={target.release.id}
            categories={categories}
            item={target.item}
            submitLabel="변경 저장"
          />
        </form>
      </section>

      <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
        <h3 className="text-xl font-bold">before / after diff</h3>
        {baselineItem ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-quiz-border bg-quiz-bg p-4">
              <div className="text-sm font-semibold text-quiz-text">published 기준</div>
              <div className="mt-2 text-sm text-quiz-text-secondary">{baselineItem.name}</div>
              <div className="mt-2 text-xs text-quiz-text-dim">{baselineItem.category} · {baselineItem.investmentRange}</div>
            </div>
            <div className="rounded-[18px] border border-quiz-border bg-quiz-bg p-4">
              <div className="text-sm font-semibold text-quiz-text">현재 draft</div>
              <div className="mt-2 text-sm text-quiz-text-secondary">{target.item.name}</div>
              <div className="mt-2 text-xs text-quiz-text-dim">{target.item.category} · {target.item.investmentRange}</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[16px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm text-quiz-text-secondary">
            published 기준 비교 대상이 없는 신규 업종입니다.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {diffFields.length ? diffFields.map((field) => (
            <span key={field} className="rounded-full bg-quiz-teal/15 px-3 py-1 text-xs font-semibold text-quiz-teal-light">
              {field}
            </span>
          )) : (
            <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-300">변경 필드 없음</span>
          )}
        </div>
      </section>
    </div>
  );
}
