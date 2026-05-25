import type { Contact } from '../types';

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN =
  /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}/;

const POSITION_WORDS = [
  'manager',
  'director',
  'engineer',
  'sales',
  'ceo',
  'cto',
  'founder',
  '대표',
  '이사',
  '부장',
  '과장',
  '대리',
  '사원',
  '팀장',
  '기술',
  '영업',
  'trưởng',
  'giám đốc',
  'nhân viên',
];

const COMPANY_WORDS = [
  'co.',
  'ltd',
  'inc',
  'corp',
  'company',
  'tech',
  'systems',
  'solutions',
  '주식회사',
  '(주)',
  '유한',
  '회사',
  'công ty',
];

function cleanLine(line: string) {
  return line.replace(/\s+/g, ' ').replace(/[|•·]+/g, '').trim();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '').replace(/^(\+?\d{1,3})(\d{2,4})(\d{3,4})(\d{4})$/, '$1-$2-$3-$4');
}

function looksLikePosition(line: string) {
  const lower = line.toLowerCase();
  return POSITION_WORDS.some((word) => lower.includes(word));
}

function looksLikeCompany(line: string) {
  const lower = line.toLowerCase();
  const letters = line.replace(/[^A-Za-z]/g, '');
  const upperRatio =
    letters.length > 2 ? letters.replace(/[^A-Z]/g, '').length / letters.length : 0;

  return COMPANY_WORDS.some((word) => lower.includes(word)) || upperRatio > 0.7;
}

function scoreNameLine(line: string, email?: string) {
  let score = 0;
  const words = line.split(' ').filter(Boolean);

  if (words.length >= 2 && words.length <= 4) score += 3;
  if (/^[A-Za-z가-힣À-ỹ\s.'-]+$/.test(line)) score += 2;
  if (looksLikeCompany(line)) score -= 3;
  if (looksLikePosition(line)) score -= 2;
  if (PHONE_PATTERN.test(line) || EMAIL_PATTERN.test(line)) score -= 5;

  if (email) {
    const local = email.split('@')[0].toLowerCase();
    for (const word of words) {
      if (word.length > 2 && local.includes(word.toLowerCase())) score += 2;
    }
  }

  return score;
}

export function parseBusinessCard(text: string): Contact {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length > 1);

  const email = text.match(EMAIL_PATTERN)?.[0] ?? '';
  const phoneMatch = text.match(PHONE_PATTERN)?.[0] ?? '';
  const phone = phoneMatch ? normalizePhone(phoneMatch) : '';
  const nonContactLines = lines.filter(
    (line) => !EMAIL_PATTERN.test(line) && !PHONE_PATTERN.test(line),
  );

  const company =
    nonContactLines.find(looksLikeCompany) ??
    nonContactLines.find((line) => line.length > 4 && line === line.toUpperCase()) ??
    '';

  const position = nonContactLines.find((line) => looksLikePosition(line) && line !== company) ?? '';

  const name =
    nonContactLines
      .filter((line) => line !== company && line !== position)
      .map((line) => ({ line, score: scoreNameLine(line, email) }))
      .sort((a, b) => b.score - a.score)[0]?.line ?? '';

  const filled = [name, company, position, phone, email].filter(Boolean).length;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    company,
    position,
    phone,
    email,
    tags: '',
    memo: '',
    sourceText: text.trim(),
    confidence: Math.round((filled / 5) * 100),
  };
}

export function isPossibleDuplicate(contact: Contact, contacts: Contact[]) {
  return contacts.some((item) => {
    const sameEmail = contact.email && item.email.toLowerCase() === contact.email.toLowerCase();
    const samePhone = contact.phone && item.phone.replace(/\D/g, '') === contact.phone.replace(/\D/g, '');
    const sameNameCompany =
      contact.name &&
      contact.company &&
      item.name.toLowerCase() === contact.name.toLowerCase() &&
      item.company.toLowerCase() === contact.company.toLowerCase();

    return sameEmail || samePhone || sameNameCompany;
  });
}
