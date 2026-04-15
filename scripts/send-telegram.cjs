const path = require('node:path');
const { loadOptionalEnvFiles } = require('./send-imessage.cjs');

loadOptionalEnvFiles();

async function sendTelegram({ token, chatId, message }) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  const recipient = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN이 비어 있습니다.');
  }

  if (!recipient) {
    throw new Error('TELEGRAM_CHAT_ID가 비어 있습니다. 봇과 대화를 시작한 뒤 값을 설정해야 합니다.');
  }

  const text =
    message ||
    process.env.TELEGRAM_SUCCESS_MESSAGE ||
    `${path.basename(process.cwd())} 개발 검증이 완료되었습니다.`;

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
  const args = { token: undefined, chatId: undefined, message: undefined };

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
  const args = readCliArgs(process.argv.slice(2));

  sendTelegram(args)
    .then((result) => {
      console.log(`Telegram sent to chat ${result.chatId}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
