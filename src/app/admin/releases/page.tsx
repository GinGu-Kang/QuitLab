import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import {
  createMasterDataRelease,
  getPublishedReleaseDetail,
  listAdminAuditLogs,
  listMasterDataReleases,
  publishMasterDataRelease,
  rollbackMasterDataRelease,
  validateMasterDataRelease
} from '@/lib/master-data-admin';

function badgeClass(status: string) {
  if (status === 'published') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'archived') return 'bg-slate-500/15 text-slate-300';
  return 'bg-amber-500/15 text-amber-300';
}

export default async function AdminReleasesPage({
  searchParams
}: {
  searchParams?: { releaseId?: string; success?: string; error?: string };
}) {
  const releases = await listMasterDataReleases();
  const published = await getPublishedReleaseDetail();
  const selectedReleaseId = searchParams?.releaseId ?? releases[0]?.id;
  const validation = selectedReleaseId ? await validateMasterDataRelease(selectedReleaseId) : null;
  const auditLogs = await listAdminAuditLogs(12);

  async function createReleaseAction(formData: FormData) {
    'use server';

    try {
      const version = String(formData.get('version') ?? '').trim();
      const notes = String(formData.get('notes') ?? '').trim();
      const baseReleaseId = String(formData.get('baseReleaseId') ?? '').trim() || undefined;
      const created = await createMasterDataRelease({ version, notes, baseReleaseId });
      redirect(`/admin/releases?success=${encodeURIComponent(`release ${created.version} 생성 완료`)}&releaseId=${created.id}`);
    } catch (error) {
      redirect(`/admin/releases?error=${encodeURIComponent(error instanceof Error ? error.message : 'release 생성 실패')}`);
    }
  }

  async function publishAction(formData: FormData) {
    'use server';

    const releaseId = String(formData.get('releaseId') ?? '');
    try {
      const publishedRelease = await publishMasterDataRelease(releaseId);
      redirect(`/admin/releases?success=${encodeURIComponent(`${publishedRelease?.release?.version ?? 'release'} publish 완료`)}&releaseId=${releaseId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'publish 실패';
      redirect(`/admin/releases?error=${encodeURIComponent(message)}&releaseId=${releaseId}`);
    }
  }

  async function rollbackAction(formData: FormData) {
    'use server';

    const releaseId = String(formData.get('releaseId') ?? '');
    try {
      const rolledBack = await rollbackMasterDataRelease(releaseId);
      redirect(`/admin/releases?success=${encodeURIComponent(`${rolledBack?.version ?? 'release'} rollback 완료`)}&releaseId=${releaseId}`);
    } catch (error) {
      redirect(`/admin/releases?error=${encodeURIComponent(error instanceof Error ? error.message : 'rollback 실패')}&releaseId=${releaseId}`);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">마스터 데이터 릴리스</h2>
            <p className="mt-2 text-sm text-quiz-text-secondary">
              published snapshot만 공개 앱이 읽습니다. draft는 관리자에서만 보이고, publish 시에만 진단 결과에 반영됩니다.
            </p>
          </div>
          {published ? (
            <div className="rounded-[18px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm">
              <div className="text-quiz-text-dim">현재 published</div>
              <div className="mt-1 font-semibold text-quiz-text">{published.release.version}</div>
            </div>
          ) : null}
        </div>

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

        <form action={createReleaseAction} className="mt-6 grid gap-3 rounded-[20px] border border-quiz-border bg-quiz-bg/40 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
          <input name="version" placeholder="예: v2-catalog-adjustment" className="rounded-[14px] border border-quiz-border bg-quiz-card px-4 py-3 text-sm" />
          <input name="notes" placeholder="release notes" className="rounded-[14px] border border-quiz-border bg-quiz-card px-4 py-3 text-sm" />
          <select name="baseReleaseId" defaultValue={published?.release.id ?? ''} className="rounded-[14px] border border-quiz-border bg-quiz-card px-4 py-3 text-sm">
            <option value="">현재 published 기준 복제</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.version}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary">
            draft 생성
          </Button>
        </form>
      </section>

      <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-quiz-text-dim">
              <tr>
                <th className="border-b border-quiz-border px-3 py-3">version</th>
                <th className="border-b border-quiz-border px-3 py-3">status</th>
                <th className="border-b border-quiz-border px-3 py-3">items</th>
                <th className="border-b border-quiz-border px-3 py-3">publishedAt</th>
                <th className="border-b border-quiz-border px-3 py-3">actions</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <tr key={release.id} className="align-top text-quiz-text-secondary">
                  <td className="border-b border-quiz-border px-3 py-4">
                    <Link href={`/admin/releases?releaseId=${release.id}`} className="font-semibold text-quiz-text hover:underline">
                      {release.version}
                    </Link>
                    <div className="mt-1 text-xs text-quiz-text-dim">{release.notes || '메모 없음'}</div>
                  </td>
                  <td className="border-b border-quiz-border px-3 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(release.status)}`}>
                      {release.status}
                    </span>
                  </td>
                  <td className="border-b border-quiz-border px-3 py-4 text-xs">
                    전체 {release.itemCount}개 / active {release.activeItemCount}개
                  </td>
                  <td className="border-b border-quiz-border px-3 py-4 text-xs">
                    {release.publishedAt ? release.publishedAt.slice(0, 16).replace('T', ' ') : '-'}
                  </td>
                  <td className="border-b border-quiz-border px-3 py-4">
                    <div className="flex flex-col gap-2">
                      <Link href={`/admin/catalog?releaseId=${release.id}`} className="text-xs text-quiz-teal-light hover:underline">
                        업종 CMS 열기
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        {(release.status === 'draft' || release.status === 'archived') ? (
                          <form action={publishAction}>
                            <input type="hidden" name="releaseId" value={release.id} />
                            <Button type="submit" variant="gold" className="px-3 py-2 text-xs">
                              publish
                            </Button>
                          </form>
                        ) : null}
                        {release.status === 'archived' ? (
                          <form action={rollbackAction}>
                            <input type="hidden" name="releaseId" value={release.id} />
                            <Button type="submit" variant="default" className="px-3 py-2 text-xs">
                              rollback
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
          <h3 className="text-xl font-bold">선택 릴리스 검증</h3>
          {validation ? (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[18px] border border-quiz-border bg-quiz-bg px-4 py-4">
                  <div className="text-xs text-quiz-text-dim">issue 수</div>
                  <div className="mt-2 text-3xl font-black">{validation.issueCount}</div>
                </div>
                <div className="rounded-[18px] border border-quiz-border bg-quiz-bg px-4 py-4">
                  <div className="text-xs text-quiz-text-dim">distinct top1</div>
                  <div className="mt-2 text-3xl font-black">{validation.distinctTop1Count}</div>
                </div>
                <div className="rounded-[18px] border border-quiz-border bg-quiz-bg px-4 py-4">
                  <div className="text-xs text-quiz-text-dim">결과 변경 시나리오</div>
                  <div className="mt-2 text-3xl font-black">{validation.sampleDiff.filter((item) => item.changed).length}</div>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {validation.issues.length ? validation.issues.map((issue, index) => (
                  <div key={`${issue.code}_${index}`} className="rounded-[16px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm">
                    <div className="font-semibold text-quiz-text">
                      [{issue.severity}] {issue.code}
                    </div>
                    <div className="mt-1 text-quiz-text-secondary">{issue.message}</div>
                  </div>
                )) : (
                  <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    오류 없이 publish 가능한 상태입니다.
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-quiz-text-secondary">선택된 릴리스가 없습니다.</p>
          )}
        </section>

        <section className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
          <h3 className="text-xl font-bold">최근 감사 로그</h3>
          <div className="mt-4 space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-[16px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm">
                <div className="font-semibold text-quiz-text">{log.action}</div>
                <div className="mt-1 text-quiz-text-secondary">
                  {log.targetType} · {log.targetId ?? '-'}
                </div>
                <div className="mt-1 text-xs text-quiz-text-dim">{log.createdAt.slice(0, 16).replace('T', ' ')}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
