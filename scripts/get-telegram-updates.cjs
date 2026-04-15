const { loadOptionalEnvFiles } = require('./send-imessage.cjs');

loadOptionalEnvFiles();

async function getTelegramUpdates(token) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN이 비어 있습니다.');
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || `Telegram updates 조회 실패 (${response.status})`);
  }

  return payload.result.map((entry) => {
    const chat = entry.message?.chat || entry.edited_message?.chat || entry.channel_post?.chat;
    const text = entry.message?.text || entry.edited_message?.text || entry.channel_post?.text || '';

    return {
      update_id: entry.update_id,
      chat_id: chat ? String(chat.id) : '',
      chat_type: chat?.type || '',
      title: chat?.title || '',
      username: chat?.username || '',
      text,
    };
  });
}

getTelegramUpdates()
  .then((updates) => {
    console.log(JSON.stringify(updates, null, 2));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
