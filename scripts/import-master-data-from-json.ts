import {
  createMasterDataRelease,
  findMasterDataReleaseByVersion,
  publishMasterDataRelease
} from '../src/lib/master-data-admin';

function getArg(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main() {
  const version = getArg('--version') ?? 'v1-from-excel';
  const notes = getArg('--notes') ?? 'Imported from src/data JSON snapshot';
  const existing = await findMasterDataReleaseByVersion(version);

  if (existing) {
    console.log(`release_exists version=${existing.version} status=${existing.status}`);
    return;
  }

  const created = await createMasterDataRelease({ version, notes });
  const published = await publishMasterDataRelease(created.id);

  console.log(`release_created version=${created.version} id=${created.id}`);
  console.log(`release_published version=${published?.release?.version ?? created.version}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
