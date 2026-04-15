import {
  findMasterDataReleaseByVersion,
  listMasterDataReleases,
  validateMasterDataRelease
} from '../src/lib/master-data-admin';

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function resolveReleaseId(value?: string | null) {
  if (!value) {
    const releases = await listMasterDataReleases();
    return releases[0]?.id ?? null;
  }
  const byVersion = await findMasterDataReleaseByVersion(value);
  return byVersion?.id ?? value;
}

async function main() {
  const input = getArg('--release');
  const releaseId = await resolveReleaseId(input);
  if (!releaseId) {
    throw new Error('검증할 release가 없습니다. --release <id|version> 를 지정하세요.');
  }

  const report = await validateMasterDataRelease(releaseId);
  if (!report) {
    throw new Error(`release not found: ${releaseId}`);
  }

  console.log(`release=${report.version}`);
  console.log(`issue_count=${report.issueCount}`);
  console.log(`distinct_top1=${report.distinctTop1Count}`);
  report.issues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.severity}] ${issue.code}: ${issue.message}`);
  });

  if (report.issues.some((issue) => issue.severity === 'error')) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
