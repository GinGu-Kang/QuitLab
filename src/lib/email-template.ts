import type { PersistedContact, PersistedResult } from '@/types';
import { toAbsoluteUrl } from '@/lib/utils';

export function createResultEmail(contact: Pick<PersistedContact, 'name' | 'unsubscribeToken'>, result: PersistedResult) {
  const topItems = result.top5Results.slice(0, 5);
  const top1 = topItems[0];
  const titleName = result.nickname || contact.name || '도전자';
  const resultUrl = toAbsoluteUrl(`/result/${result.sessionId}`);
  const unsubscribeUrl = toAbsoluteUrl(`/unsubscribe/${contact.unsubscribeToken}`);

  const rows = topItems
    .map(
      (entry, index) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
            <strong>${index + 1}위. ${entry.item.name}</strong>
            <div style="color:#64748b;font-size:13px;">${entry.item.category} · 적합도 ${Math.round(entry.finalScore)}점</div>
          </td>
        </tr>
      `
    )
    .join('');

  return {
    subject: `${titleName}님의 창업 적합도 진단 결과`,
    html: `
      <div style="font-family:Pretendard,'Apple SD Gothic Neo',sans-serif;max-width:680px;margin:0 auto;padding:32px;background:#f8fafc;color:#0f172a;">
        <div style="background:#0f172a;border-radius:24px;padding:32px;color:#f8fafc;">
          <p style="margin:0 0 12px;color:#14b8a6;font-weight:700;">퇴사하고 뭐하지?</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.3;">${titleName}님의 맞춤 창업 결과가 도착했어요.</h1>
          <p style="margin:0;color:#94a3b8;line-height:1.7;">129개 업종과 12개 역량, 현실 조건을 교차 분석한 결과입니다.</p>
        </div>
        <div style="background:#ffffff;border-radius:24px;padding:28px;margin-top:20px;">
          <h2 style="margin:0 0 12px;font-size:20px;">TOP 5 추천 업종</h2>
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
        </div>
        ${
          top1
            ? `
              <div style="background:#ffffff;border-radius:24px;padding:28px;margin-top:20px;">
                <h2 style="margin:0 0 12px;font-size:20px;">1위 추천: ${top1.item.name}</h2>
                <p style="margin:0 0 12px;color:#334155;line-height:1.7;">${top1.reason}</p>
                <p style="margin:0 0 12px;color:#334155;line-height:1.7;">${top1.marketSummary}</p>
                <p style="margin:0;color:#334155;line-height:1.7;">${top1.preparationGuide}</p>
              </div>
            `
            : ''
        }
        <div style="padding:28px 0 12px;text-align:center;">
          <a href="${resultUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0d9488;color:#ffffff;text-decoration:none;font-weight:700;">자세한 결과 다시 보기</a>
        </div>
        <p style="margin:16px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;text-align:center;">
          마케팅 수신을 원치 않으시면 <a href="${unsubscribeUrl}" style="color:#0d9488;">수신거부</a>를 눌러주세요.
        </p>
      </div>
    `
  };
}
