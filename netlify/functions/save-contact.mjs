const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'POST only.' });

  try {
    const payload = JSON.parse(event.body || '{}');
    const endpoint = String(payload.endpoint || '').trim();
    const contact = payload.contact;

    if (!endpoint) return json(400, { ok: false, error: 'Apps Script Web App URL이 필요합니다.' });
    if (!contact || typeof contact !== 'object') return json(400, { ok: false, error: '저장할 연락처 데이터가 없습니다.' });

    assertAppsScriptUrl(endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ ...contact, userAgent: payload.userAgent || '' }),
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

    return json(200, { ok: true, id: result.id, createdAt: result.createdAt });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
