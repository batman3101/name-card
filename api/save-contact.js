// Vercel serverless function: relays contact upsert/delete to the Apps Script web app.
// Keeps the Apps Script URL handling server-side and verifies the response.

function assertAppsScriptUrl(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Apps Script Web App URL 형식이 올바르지 않습니다.');
  }

  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.includes('/macros/s/')) {
    throw new Error('Apps Script Web App URL을 입력해야 합니다.');
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only.' });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const endpoint = String(payload.endpoint || '').trim();
    const action = String(payload.action || 'upsert');
    const contact = payload.contact;
    const id = String(payload.id || contact?.id || '').trim();

    if (!endpoint) return res.status(400).json({ ok: false, error: 'Apps Script Web App URL이 필요합니다.' });
    if (action === 'delete' && !id) return res.status(400).json({ ok: false, error: '삭제할 연락처 ID가 없습니다.' });
    if (action !== 'delete' && (!contact || typeof contact !== 'object')) {
      return res.status(400).json({ ok: false, error: '저장할 연락처 데이터가 없습니다.' });
    }

    assertAppsScriptUrl(endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(
        action === 'delete'
          ? { action, id }
          : { action, ...contact, userAgent: payload.userAgent || '' },
      ),
    });

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        'Apps Script가 JSON 응답을 반환하지 않았습니다. 웹 앱 배포 권한과 최신 배포 버전을 확인하세요.',
      );
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.error || `Apps Script 저장 실패: HTTP ${response.status}`);
    }

    return res.status(200).json({
      ok: true,
      action: result.action || action,
      id: result.id,
      createdAt: result.createdAt,
      deleted: Boolean(result.deleted),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
