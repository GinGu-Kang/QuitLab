import Link from 'next/link';

import { getReleaseCategories, listMasterDataReleases, listCatalogItems } from '@/lib/master-data-admin';

export default async function AdminCatalogPage({
  searchParams
}: {
  searchParams?: { releaseId?: string; category?: string; status?: 'active' | 'inactive' | 'all' };
}) {
  const releases = await listMasterDataReleases();
  const releaseId = searchParams?.releaseId ?? releases[0]?.id;
  const selectedRelease = releases.find((release) => release.id === releaseId) ?? releases[0];
  const rowStatus = searchParams?.status ?? 'all';
  const category = searchParams?.category ?? '';
  const items = selectedRelease
    ? await listCatalogItems({
        releaseId: selectedRelease.id,
        category: category || undefined,
        rowStatus
      })
    : [];
  const categories = selectedRelease ? await getReleaseCategories(selectedRelease.id) : [];

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">업종 CMS</h2>
            <p className="mt-2 text-sm text-quiz-text-secondary">draft release 안에서 업종을 추가, 수정, 비활성화할 수 있습니다.</p>
          </div>
          {selectedRelease ? (
            <Link href={`/admin/catalog/new?releaseId=${selectedRelease.id}`} className="text-sm text-quiz-gold-light underline">
              새 업종 추가
            </Link>
          ) : null}
        </div>

        <form className="mt-6 grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_auto]">
          <select name="releaseId" defaultValue={selectedRelease?.id ?? ''} className="rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm">
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.version} ({release.status})
              </option>
            ))}
          </select>
          <select name="category" defaultValue={category} className="rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm">
            <option value="">전체 카테고리</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={rowStatus} className="rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm">
            <option value="all">전체 상태</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button type="submit" className="rounded-[14px] bg-quiz-teal px-4 py-3 text-sm font-semibold text-white">
            적용
          </button>
        </form>
      </section>

      <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-quiz-text-dim">
              <tr>
                <th className="border-b border-quiz-border px-3 py-3">카테고리</th>
                <th className="border-b border-quiz-border px-3 py-3">업종명</th>
                <th className="border-b border-quiz-border px-3 py-3">상태</th>
                <th className="border-b border-quiz-border px-3 py-3">투자비</th>
                <th className="border-b border-quiz-border px-3 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.draftId} className="text-quiz-text-secondary">
                  <td className="border-b border-quiz-border px-3 py-3">{item.category}</td>
                  <td className="border-b border-quiz-border px-3 py-3">
                    <div className="font-semibold text-quiz-text">{item.name}</div>
                    <div className="mt-1 text-xs text-quiz-text-dim">ID {item.id}</div>
                  </td>
                  <td className="border-b border-quiz-border px-3 py-3">{item.rowStatus}</td>
                  <td className="border-b border-quiz-border px-3 py-3">{item.investmentRange}</td>
                  <td className="border-b border-quiz-border px-3 py-3">
                    <Link href={`/admin/catalog/${item.draftId}`} className="text-quiz-teal-light hover:underline">
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
