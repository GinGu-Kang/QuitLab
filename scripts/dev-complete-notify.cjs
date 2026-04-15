const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadOptionalEnvFiles, sendIMessage } = require('./send-imessage.cjs');
const { sendTelegram } = require('./send-telegram.cjs');

loadOptionalEnvFiles();

function readCliArgs(argv) {
  const args = {
    summary: '',
    message: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--summary') {
      args.summary = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (token === '--message') {
      args.message = argv[index + 1] || '';
      index += 1;
    }
  }

  return args;
}

function buildSuccessMessage({ summary, overrideMessage }) {
  if (overrideMessage) {
    return overrideMessage;
  }

  const repoName = path.basename(process.cwd());
  const lines = [
    `✅ ${repoName} 개발 작업 완료`,
    '',
    '검증:',
    '- lint 통과',
    '- test 통과',
    '- build 통과',
  ];

  if (summary) {
    lines.push('', '작업 내용:', summary);
  }

  return lines.join('\n');
}

async function sendCompletionNotice(message) {
  if (process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_CHAT_ID) {
    return sendTelegram({ message });
  }

  return sendIMessage({ message });
}

async function main() {
  const cliArgs = readCliArgs(process.argv.slice(2));
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const steps = [
    ['lint', ['run', 'lint']],
    ['test', ['run', 'test']],
    ['build', ['run', 'build']],
  ];

  for (const [label, args] of steps) {
    console.log(`\n> ${label}`);

    const result = spawnSync(npmCommand, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    if (result.status !== 0) {
      if (
        process.env.TELEGRAM_NOTIFY_ON_FAILURE === 'true' ||
        process.env.IMESSAGE_NOTIFY_ON_FAILURE === 'true'
      ) {
        try {
          await sendCompletionNotice(
            process.env.TELEGRAM_FAILURE_MESSAGE ||
              process.env.IMESSAGE_FAILURE_MESSAGE ||
              `${path.basename(process.cwd())} 검증이 ${label} 단계에서 실패했습니다.`,
          );
        } catch (error) {
          console.error(error instanceof Error ? error.message : String(error));
        }
      }

      process.exit(result.status || 1);
    }
  }

  const successMessage =
    cliArgs.message ||
    process.env.TELEGRAM_SUCCESS_MESSAGE ||
    process.env.IMESSAGE_SUCCESS_MESSAGE ||
    buildSuccessMessage({ summary: cliArgs.summary, overrideMessage: cliArgs.message });

  await sendCompletionNotice(successMessage);
  console.log('\nCompletion notification sent');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
