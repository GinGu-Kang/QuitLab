# 텔레그램 완료 알림 설치 가이드

이 문서는 다른 Node.js 프로젝트에 텔레그램 완료 알림을 붙일 때 에이전트에게 그대로 넘기기 위한 가이드다.

목표:

- 에이전트가 질문 없이 직접 설치한다.
- 내가 직접 넣는 값은 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 두 개뿐이다.
- 작업 완료 시 에이전트는 `notify:done`만 실행하면 된다.

## 내가 직접 준비할 값

아래 두 값만 준비하면 된다.

```bash
TELEGRAM_BOT_TOKEN=여기에_봇토큰
TELEGRAM_CHAT_ID=여기에_채팅ID
```

## 에이전트에게 보낼 지시문

아래 문구를 다른 프로젝트의 에이전트에게 그대로 보내면 된다.

```md
이 저장소에 텔레그램 완료 알림을 추가해.

내가 직접 넣을 값은 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 뿐이다.
질문하지 말고 바로 수정해.

요구사항:

1. `scripts/send-telegram.cjs`를 추가해.
2. `scripts/dev-complete-notify.cjs`를 추가해.
3. `package.json`에 아래 스크립트를 추가해.
   - `notify:telegram:send`
   - `notify:done`
4. `.env.example`가 있으면 아래 두 값을 예시로 추가해.
   - `TELEGRAM_BOT_TOKEN=`
   - `TELEGRAM_CHAT_ID=`
5. `.gitignore`에 `.env.local`이 없으면 추가해.
6. `AGENTS.md`, `CLAUDE.md`, Cursor rules 같은 에이전트 지침 파일이 있으면 작업 완료 전 아래 명령을 실행하라고 적어.
   - `npm run notify:done -- --summary "무엇을 바꿨는지, 사용자 영향, 검증 결과"`
7. `notify:done`은 프로젝트의 `package.json`을 읽어서 `lint`, `test`, `build` 중 실제로 존재하는 스크립트만 실행하게 만들어.
8. `lint`, `test`, `build`가 하나도 없으면 실패하지 말고 텔레그램만 보낼 수 있게 만들어.
9. 완료 메시지에는 최소한 아래 정보가 들어가게 해.
   - 프로젝트명
   - 어떤 검증이 통과했는지
   - `--summary`로 넘긴 작업 요약
10. 구현 후 사용 방법을 짧게 정리해.

완료 기준:

- `npm run notify:telegram:send -- --message "test"`로 텔레그램 발송 가능
- `npm run notify:done -- --summary "..."`로 검증 후 완료 메시지 발송 가능
- 내가 나중에 `.env.local`에 토큰과 채팅 ID만 넣으면 바로 쓸 수 있어야 함
```

## 에이전트가 만들어야 하는 최종 구조

필수 파일 2개:

- `scripts/send-telegram.cjs`
- `scripts/dev-complete-notify.cjs`

필수 수정 3군데:

- `package.json`
- `.env.example`가 있으면 예시 변수 추가
- 에이전트 지침 파일이 있으면 완료 명령 규칙 추가

## 참고 구현

아래 구현을 그대로 써도 된다.

### `scripts/send-telegram.cjs`

```js
const fs = require('node:fs');
const path = require('node:path');

function loadEnv(baseDir = process.cwd()) {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/u);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
      if (!match) continue;

      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;

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

loadEnv();

async function sendTelegram({ token, chatId, message }) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  const recipient = chatId || process.env.TELEGRAM_CHAT_ID;
  const text = message || `${path.basename(process.cwd())} 작업이 완료되었습니다.`;

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN이 비어 있습니다.');
  }

  if (!recipient) {
    throw new Error('TELEGRAM_CHAT_ID가 비어 있습니다.');
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: recipient,
      text,
      disable_web_page_preview: true,
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || `Telegram 발송 실패 (${response.status})`);
  }

  return {
    chatId: String(payload.result.chat.id),
    messageId: payload.result.message_id,
  };
}

function readCliArgs(argv) {
  const args = {
    token: undefined,
    chatId: undefined,
    message: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--token') {
      args.token = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === '--chat-id') {
      args.chatId = argv[index + 1];
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
  sendTelegram,
};

if (require.main === module) {
  sendTelegram(readCliArgs(process.argv.slice(2)))
    .then((result) => {
      console.log(`Telegram sent to chat ${result.chatId}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
```

### `scripts/dev-complete-notify.cjs`

```js
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { sendTelegram } = require('./send-telegram.cjs');

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

function readPackageScripts() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json을 찾을 수 없습니다.');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.scripts || {};
}

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || '';
  const isWindows = process.platform === 'win32';

  if (userAgent.startsWith('pnpm/')) {
    return isWindows ? 'pnpm.cmd' : 'pnpm';
  }

  if (userAgent.startsWith('yarn/')) {
    return isWindows ? 'yarn.cmd' : 'yarn';
  }

  if (userAgent.startsWith('bun/')) {
    return 'bun';
  }

  if (fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
    return isWindows ? 'pnpm.cmd' : 'pnpm';
  }

  if (fs.existsSync(path.join(process.cwd(), 'yarn.lock'))) {
    return isWindows ? 'yarn.cmd' : 'yarn';
  }

  if (fs.existsSync(path.join(process.cwd(), 'bun.lockb')) || fs.existsSync(path.join(process.cwd(), 'bun.lock'))) {
    return 'bun';
  }

  return isWindows ? 'npm.cmd' : 'npm';
}

function buildRunArgs(packageManager, scriptName) {
  if (packageManager === 'yarn' || packageManager === 'yarn.cmd') {
    return [scriptName];
  }

  return ['run', scriptName];
}

function buildMessage({ overrideMessage, summary, passedSteps, skippedSteps }) {
  if (overrideMessage) {
    return overrideMessage;
  }

  const repoName = path.basename(process.cwd());
  const lines = [`✅ ${repoName} 작업 완료`, ''];

  if (passedSteps.length > 0) {
    lines.push('검증 통과:');

    for (const step of passedSteps) {
      lines.push(`- ${step}`);
    }
  } else {
    lines.push('검증 통과:');
    lines.push('- 실행 가능한 lint/test/build 스크립트 없음');
  }

  if (skippedSteps.length > 0) {
    lines.push('', '건너뜀:');

    for (const step of skippedSteps) {
      lines.push(`- ${step}`);
    }
  }

  if (summary) {
    lines.push('', '작업 내용:', summary);
  }

  return lines.join('\n');
}

async function main() {
  const args = readCliArgs(process.argv.slice(2));
  const scripts = readPackageScripts();
  const packageManager = detectPackageManager();
  const stepOrder = ['lint', 'test', 'build'];
  const passedSteps = [];
  const skippedSteps = [];

  for (const step of stepOrder) {
    if (!scripts[step]) {
      skippedSteps.push(step);
      continue;
    }

    console.log(`\n> ${step}`);

    const result = spawnSync(packageManager, buildRunArgs(packageManager, step), {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    if (result.status !== 0) {
      process.exit(result.status || 1);
    }

    passedSteps.push(step);
  }

  const message = buildMessage({
    overrideMessage: args.message,
    summary: args.summary,
    passedSteps,
    skippedSteps,
  });

  await sendTelegram({ message });
  console.log('\nCompletion notification sent');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
```

### `package.json`

기존 `scripts`에 아래 항목을 추가한다.

```json
{
  "scripts": {
    "notify:telegram:send": "node scripts/send-telegram.cjs",
    "notify:done": "node scripts/dev-complete-notify.cjs"
  }
}
```

### `.env.example`

파일이 있으면 아래 예시를 추가한다.

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 내가 나중에 할 일

에이전트 설치가 끝나면 실제 프로젝트 루트의 `.env.local`에 아래 두 값만 넣으면 된다.

```bash
TELEGRAM_BOT_TOKEN=실제_봇토큰
TELEGRAM_CHAT_ID=실제_채팅ID
```

그 다음 아래 두 명령으로 확인하면 된다.

```bash
npm run notify:telegram:send -- --message "텔레그램 연결 테스트"
npm run notify:done -- --summary "예시: 로그인 오류 수정, 사용자 로그인 정상화, lint/test/build 통과"
```
