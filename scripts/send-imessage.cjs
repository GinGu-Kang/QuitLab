const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function loadOptionalEnvFiles(baseDir = process.cwd()) {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(baseDir, fileName);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/u);

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);

      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;

      if (process.env[key] !== undefined) {
        continue;
      }

      let value = rawValue.trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

function normalizeRecipients(recipient) {
  const compact = recipient.replace(/[^\d+]/gu, '');
  const candidates = [];

  if (compact) {
    candidates.push(compact);
  }

  const digitsOnly = compact.replace(/[^\d]/gu, '');

  if (digitsOnly.length === 11 && digitsOnly.startsWith('010')) {
    candidates.push(`${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`);
  }

  if (digitsOnly.startsWith('0')) {
    candidates.push(`+82${digitsOnly.slice(1)}`);
  }

  return [...new Set(candidates)];
}

function buildAppleScriptArgs(recipient, message) {
  const lines = [
    'on run argv',
    '  set recipient to item 1 of argv',
    '  set messageText to item 2 of argv',
    '  tell application "Messages"',
    '    set targetService to 1st service whose service type = iMessage',
    '    try',
    '      set targetBuddy to buddy recipient of targetService',
    '      send messageText to targetBuddy',
    '      return "sent"',
    '    on error',
    '      set targetParticipant to participant recipient of targetService',
    '      send messageText to targetParticipant',
    '      return "sent"',
    '    end try',
    '  end tell',
    'end run',
  ];

  return lines.flatMap((line) => ['-e', line]).concat([recipient, message]);
}

function sendIMessage({ to, message }) {
  loadOptionalEnvFiles();

  if (process.platform !== 'darwin') {
    throw new Error('iMessage 발송은 macOS에서만 지원됩니다.');
  }

  const recipient = to || process.env.IMESSAGE_RECIPIENT;

  if (!recipient) {
    throw new Error('IMESSAGE_RECIPIENT가 비어 있습니다.');
  }

  const text =
    message ||
    process.env.IMESSAGE_SUCCESS_MESSAGE ||
    `${path.basename(process.cwd())} 작업이 완료되었습니다.`;
  const timeoutSeconds = Number(process.env.IMESSAGE_SEND_TIMEOUT_SECONDS || '15');
  const timeoutMs = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 15000;

  const recipients = normalizeRecipients(recipient);
  const failures = [];

  spawnSync('open', ['-ga', 'Messages'], {
    encoding: 'utf8',
  });

  for (const candidate of recipients) {
    const result = spawnSync('osascript', buildAppleScriptArgs(candidate, text), {
      encoding: 'utf8',
      timeout: timeoutMs,
    });

    if (result.error) {
      failures.push(`${candidate}: ${result.error.message}`);
      continue;
    }

    if (result.status === 0) {
      return {
        recipient: candidate,
        message: text,
      };
    }

    failures.push(`${candidate}: ${(result.stderr || result.stdout || 'unknown error').trim()}`);
  }

  throw new Error(`Messages 발송 실패\n${failures.join('\n')}`);
}

function readCliArgs(argv) {
  const args = { to: undefined, message: undefined };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--to') {
      args.to = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === '--message') {
      args.message = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

module.exports = {
  loadOptionalEnvFiles,
  normalizeRecipients,
  sendIMessage,
};

if (require.main === module) {
  const args = readCliArgs(process.argv.slice(2));

  try {
    const result = sendIMessage(args);
    console.log(`iMessage sent to ${result.recipient}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
