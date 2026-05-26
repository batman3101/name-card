import type { Contact } from '../types';

export const DEFAULT_SHEET_ID = '1UE9t1sLfPVIy5HEQ1mHsXYgwp2-UHNDuo5VyQk7KQVk';

export function getSheetUrl(sheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId.trim() || DEFAULT_SHEET_ID}/edit`;
}

export function createAppsScriptTemplate(sheetId: string) {
  return `const SHEET_ID = '${sheetId.trim() || DEFAULT_SHEET_ID}';
const SHEET_NAME = 'contacts';
const HEADERS = [
  'id',
  'createdAt',
  'name',
  'company',
  'position',
  'phone',
  'email',
  'address',
  'tags',
  'memo',
  'confidence',
  'sourceText',
  'userAgent',
];

function doGet() {
  const sheet = ensureContactsSheet_();
  return json_({
    ok: true,
    sheetName: sheet.getName(),
    rows: Math.max(0, sheet.getLastRow() - 1),
    headers: HEADERS,
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const payload = parsePayload_(e);
    const sheet = ensureContactsSheet_();
    const now = new Date();
    const action = payload.action || 'upsert';

    if (action === 'delete') {
      const deleted = deleteRowById_(sheet, payload.id);
      return json_({ ok: true, action: 'deleted', id: payload.id || '', deleted });
    }

    const id = payload.id || Utilities.getUuid();
    const row = [
      id,
      payload.createdAt || now.toISOString(),
      payload.name || '',
      payload.company || '',
      payload.position || '',
      payload.phone || '',
      payload.email || '',
      payload.address || '',
      payload.tags || '',
      payload.memo || '',
      Number(payload.confidence || 0),
      payload.sourceText || '',
      payload.userAgent || '',
    ];

    const rowIndex = findRowById_(sheet, id);
    const actionResult = rowIndex > 0 ? 'updated' : 'created';
    sheet.getRange(rowIndex > 0 ? rowIndex : sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

    return json_({ ok: true, action: actionResult, id: row[0], createdAt: row[1] });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    lock.releaseLock();
  }
}

function findRowById_(sheet, id) {
  if (!id) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const target = String(id);
  const index = values.findIndex((row) => String(row[0]) === target);
  return index >= 0 ? index + 2 : 0;
}

function deleteRowById_(sheet, id) {
  const rowIndex = findRowById_(sheet, id);
  if (rowIndex <= 0) return false;

  sheet.deleteRow(rowIndex);
  return true;
}

function setup() {
  const sheet = ensureContactsSheet_();
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  return \`Ready: \${sheet.getName()} in \${SHEET_ID}\`;
}

function ensureContactsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    migrateRows_(sheet, currentHeaders);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }

  return sheet;
}

function migrateRows_(sheet, currentHeaders) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1 || currentHeaders.filter(String).length === 0) return;

  const headerIndex = {};
  currentHeaders.forEach((header, index) => {
    if (header) headerIndex[header] = index;
  });

  const oldValues = sheet.getRange(2, 1, lastRow - 1, currentHeaders.length).getValues();
  const newValues = oldValues.map((row) =>
    HEADERS.map((header) => (headerIndex[header] === undefined ? '' : row[headerIndex[header]] || '')),
  );

  sheet.getRange(2, 1, newValues.length, HEADERS.length).setValues(newValues);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body.');
  }

  return JSON.parse(e.postData.contents);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}`;
}

export async function saveToGoogleSheet(endpoint: string, contact: Contact) {
  return requestSheetAction(endpoint, {
    action: 'upsert',
    contact,
    userAgent: navigator.userAgent,
  });
}

export async function deleteFromGoogleSheet(endpoint: string, id: string) {
  return requestSheetAction(endpoint, {
    action: 'delete',
    id,
  });
}

async function requestSheetAction(endpoint: string, body: Record<string, unknown>) {
  if (!endpoint.trim()) {
    throw new Error('설정에서 Apps Script Web App URL을 입력하고 `설정 저장`을 누르세요.');
  }

  const response = await fetch('/api/save-contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...body,
      endpoint: endpoint.trim(),
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Google Sheets 저장 확인에 실패했습니다.');
  }

  return payload as { ok: true; action: string; id: string; createdAt?: string; deleted?: boolean };
}
