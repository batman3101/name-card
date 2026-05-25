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
    const row = [
      payload.id || Utilities.getUuid(),
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

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

    return json_({ ok: true, id: row[0], createdAt: row[1] });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    lock.releaseLock();
  }
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
  if (!endpoint.trim()) {
    throw new Error('Apps Script endpoint is required.');
  }

  await fetch(endpoint.trim(), {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ ...contact, userAgent: navigator.userAgent }),
  });
}
