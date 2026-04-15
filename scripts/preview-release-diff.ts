import { buildPublishedMasterData, previewReleaseDiff } from '../src/lib/master-data-validation';
import {
  findMasterDataReleaseByVersion,
  getMasterDataReleaseDetail,
  getPublishedReleaseDetail
} from '../src/lib/master-data-admin';

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function resolveReleaseId(value?: string | null) {
  if (!value) return null;
  const byVersion = await findMasterDataReleaseByVersion(value);
  return byVersion?.id ?? value;
}

async function main() {
  const targetInput = getArg('--release');
  const baselineInput = getArg('--baseline');
  const targetId = await resolveReleaseId(targetInput);

  if (!targetId) {
    throw new Error('--release <id|version> 가 필요합니다.');
  }

  const target = await getMasterDataReleaseDetail(targetId);
  if (!target) {
    throw new Error(`release not found: ${targetId}`);
  }

  const baselineId = await resolveReleaseId(baselineInput);
  const baseline = baselineId
    ? await getMasterDataReleaseDetail(baselineId)
    : await getPublishedReleaseDetail();

  const targetSnapshot = buildPublishedMasterData({
    releaseId: target.release.id,
    version: target.release.version,
    draftData: target.draftData
  });
  const baselineSnapshot = baseline
    ? buildPublishedMasterData({
        releaseId: baseline.release.id,
        version: baseline.release.version,
        draftData: baseline.draftData
      })
    : null;

  const diff = previewReleaseDiff(targetSnapshot, baselineSnapshot);
  const changed = diff.filter((entry) => entry.changed);

  console.log(`release=${target.release.version}`);
  console.log(`baseline=${baseline?.release.version ?? 'none'}`);
  console.log(`changed_scenarios=${changed.length}`);
  changed.slice(0, 20).forEach((entry) => {
    console.log(`${entry.scenarioIndex}: ${entry.previousTop1 ?? '-'} -> ${entry.nextTop1 ?? '-'}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
