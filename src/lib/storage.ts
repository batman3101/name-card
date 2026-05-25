import type { Contact } from '../types';

const CONTACTS_KEY = 'card-leader.contacts.v1';
const ENDPOINT_KEY = 'card-leader.apps-script-endpoint.v1';
const SHEET_ID_KEY = 'card-leader.sheet-id.v1';
const LEGACY_CONTACTS_KEY = 'card-ledger.contacts.v1';
const LEGACY_ENDPOINT_KEY = 'card-ledger.apps-script-endpoint.v1';

export function loadContacts() {
  try {
    const saved = localStorage.getItem(CONTACTS_KEY) ?? localStorage.getItem(LEGACY_CONTACTS_KEY);
    const parsed = JSON.parse(saved ?? '[]');
    return Array.isArray(parsed)
      ? parsed.map((contact) => {
          const item = contact as Contact;
          return { ...item, address: item.address ?? '' };
        })
      : [];
  } catch {
    return [];
  }
}

export function storeContacts(contacts: Contact[]) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts.slice(0, 200)));
}

export function loadEndpoint() {
  return localStorage.getItem(ENDPOINT_KEY) ?? localStorage.getItem(LEGACY_ENDPOINT_KEY) ?? '';
}

export function storeEndpoint(endpoint: string) {
  localStorage.setItem(ENDPOINT_KEY, endpoint);
}

export function loadSheetId(defaultSheetId: string) {
  return localStorage.getItem(SHEET_ID_KEY) ?? defaultSheetId;
}

export function storeSheetId(sheetId: string) {
  localStorage.setItem(SHEET_ID_KEY, sheetId);
}
