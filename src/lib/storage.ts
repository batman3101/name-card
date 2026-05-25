import type { Contact } from '../types';

const CONTACTS_KEY = 'card-ledger.contacts.v1';
const ENDPOINT_KEY = 'card-ledger.apps-script-endpoint.v1';

export function loadContacts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONTACTS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Contact[]) : [];
  } catch {
    return [];
  }
}

export function storeContacts(contacts: Contact[]) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts.slice(0, 200)));
}

export function loadEndpoint() {
  return localStorage.getItem(ENDPOINT_KEY) ?? '';
}

export function storeEndpoint(endpoint: string) {
  localStorage.setItem(ENDPOINT_KEY, endpoint);
}
