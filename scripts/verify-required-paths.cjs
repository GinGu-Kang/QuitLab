const fs = require('fs');
const path = require('path');

const root = process.cwd();

const mirroredPhaseFiles = [
  'PHASE-1-setup-and-seeding.md',
  'PHASE-2-matching-algorithm.md',
  'PHASE-3-database.md',
  'PHASE-4-quiz-flow-ui.md',
  'PHASE-5-results-core.md',
  'PHASE-6-results-extended.md',
  'PHASE-7-seo-admin-deploy.md'
];

const requiredLegacyFiles = [
  'plans/README.md',
  ...mirroredPhaseFiles.map((file) => `plans/${file}`)
];

function readUtf8(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function ensureExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required path: ${relativePath}`);
  }
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n').trimEnd();
}

try {
  requiredLegacyFiles.forEach(ensureExists);

  mirroredPhaseFiles.forEach((file) => {
    const legacyPath = `plans/${file}`;
    const docsPath = `docs/plan/${file}`;

    ensureExists(docsPath);

    const legacyContent = normalize(readUtf8(legacyPath));
    const docsContent = normalize(readUtf8(docsPath));

    if (legacyContent !== docsContent) {
      throw new Error(`Legacy plan mirror is out of sync: ${legacyPath} != ${docsPath}`);
    }
  });

  console.log('Required public paths verified.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
