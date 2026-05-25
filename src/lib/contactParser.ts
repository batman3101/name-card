import type { Contact } from '../types';

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s:]*)?(?:\(?\d{2,4}\)?[-.\s:]*)?\d{3,4}[-.\s:]?\d{3,4}/g;

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

const NOISE_WORDS = [
  'since',
  'contact',
  'liên hệ',
  'lien he',
  'address',
  '주소',
  '본사',
  '사무소',
  'website',
  'www.',
  'tel',
  'fax',
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

const ADDRESS_WORDS = [
  'address',
  '주소',
  '본사',
  '사무소',
  'office',
  'factory',
  'plant',
  'địa chỉ',
  'dia chi',
  'đường',
  'duong',
  'phường',
  'phuong',
  'quận',
  'quan',
  'tỉnh',
  'thành phố',
];

function cleanLine(line: string) {
  return line.replace(/\s+/g, ' ').replace(/[|•·]+/g, ' ').trim();
}

function hasPhone(line: string) {
  PHONE_PATTERN.lastIndex = 0;
  const matched = PHONE_PATTERN.test(line);
  PHONE_PATTERN.lastIndex = 0;
  return matched;
}

function normalizePhone(value: string) {
  const hasPlus = value.includes('+');
  let digits = value.replace(/\D/g, '');

  if (hasPlus && digits.startsWith('82') && digits.length >= 11) {
    const local = digits.slice(2);
    if (local.startsWith('10') && local.length === 10) return `+82 10-${local.slice(2, 6)}-${local.slice(6)}`;
    return `+82 ${local}`;
  }

  if (hasPlus && digits.startsWith('84') && digits.length >= 10) {
    const local = digits.slice(2);
    return `+84 ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }

  if (!hasPlus && digits.startsWith('82') && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.startsWith('010') && digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.startsWith('02') && digits.length >= 9) {
    return `02-${digits.slice(2, -4)}-${digits.slice(-4)}`;
  }

  if (digits.startsWith('0') && digits.length >= 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`;
  }

  return value.trim().replace(/\s+/g, ' ');
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

  if (isNoiseLine(line)) return false;

  return COMPANY_WORDS.some((word) => lower.includes(word)) || upperRatio > 0.7;
}

function isNoiseLine(line: string) {
  const lower = line.toLowerCase();
  return NOISE_WORDS.some((word) => lower.includes(word)) || /\b\d{4}\b/.test(line);
}

function extractDomainCompany(email: string) {
  const domain = email.split('@')[1]?.split('.')[0] ?? '';
  const cleaned = domain
    .replace(/[-_.]+/g, ' ')
    .replace(/\b(co|com|kr|vn|net|global)\b/gi, '')
    .trim();

  return cleaned ? cleaned.toUpperCase() : '';
}

function normalizeCompany(line: string) {
  return line
    .replace(/^the\s+the\s+smart\s+tech\s*/i, '')
    .replace(/^the\s+smart\s+tech\s*/i, '')
    .replace(/^[^A-Za-z가-힣À-ỹ(]+/, '')
    .replace(/\bsince\s+\d{4}\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function looksLikeAddress(line: string) {
  const lower = line.toLowerCase();
  if (EMAIL_PATTERN.test(line) || hasPhone(line)) return false;
  if (ADDRESS_WORDS.some((word) => lower.includes(word))) return true;

  const hasKoreanPlace = /[가-힣]+(도|시|군|구|읍|면|동|리)\b/.test(line);
  const hasRoad = /(로|길|번길)\s*\d|산본로|갈주로|안남로/.test(line);
  const hasPostal = /\(\s?\d{5}\s?,/.test(line) || /\b\d{5}\b/.test(line);
  const hasVietnamPlace = /\b(duong|quan|phuong|tp|thanh pho|tinh)\b/i.test(line);

  return line.length >= 10 && (hasKoreanPlace || hasRoad || hasPostal || hasVietnamPlace);
}

function normalizeAddress(line: string) {
  return line
    .replace(/^(address|addr|주소|소재지)\s*[:：-]?\s*/i, '')
    .replace(/^(검사기|smt|vd\/로봇|rf파워)\s*자동화\s*/i, '')
    .replace(/^(본사|사무소|공장|office|factory|plant)\s*[:：-]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAddress(lines: string[]) {
  const addresses = lines
    .filter(looksLikeAddress)
    .map(normalizeAddress)
    .filter(Boolean);

  return [...new Set(addresses)].slice(0, 4).join('\n');
}

function scoreCompanyLine(line: string, email: string) {
  const normalized = normalizeCompany(line);
  const lower = normalized.toLowerCase();
  let score = 0;

  if (!normalized || isNoiseLine(normalized)) return -20;
  if (COMPANY_WORDS.some((word) => lower.includes(word))) score += 6;
  if (/[A-Z]{2,}/.test(normalized)) score += 3;
  if (/\btech\b/i.test(normalized)) score += 4;
  if (email) {
    const domainCompany = extractDomainCompany(email).toLowerCase().replace(/\s+/g, '');
    const compact = normalized.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    if (domainCompany && compact.includes(domainCompany)) score += 8;
  }
  if (looksLikePosition(normalized)) score -= 6;
  if (hasPhone(normalized) || EMAIL_PATTERN.test(normalized)) score -= 10;

  return score;
}

function extractNameFromLine(line: string) {
  const englishNames = [...line.matchAll(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g)].map((match) => match[0]);
  const englishName = englishNames.find(
    (candidate) => !looksLikePosition(candidate) && !looksLikeCompany(candidate) && !isNoiseLine(candidate),
  );

  if (englishName) {
    return englishName;
  }

  const koreanName = line.match(/[가-힣]\s*[가-힣]\s*[가-힣]/)?.[0];
  if (koreanName) return koreanName.replace(/\s+/g, '');

  return line;
}

function normalizePosition(line: string) {
  const candidates = [
    'General Director',
    'Technical Manager',
    'Sales Manager',
    'Manager',
    'Director',
    'Engineer',
    'CEO',
    'CTO',
    'Founder',
  ];
  const found = candidates.find((candidate) => new RegExp(candidate, 'i').test(line));
  if (found) return found;

  return line
    .replace(/[^A-Za-z가-힣À-ỹ\s/.-]/g, ' ')
    .replace(/\s+[가-힣]$/, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function extractPhoneCandidates(lines: string[]) {
  return lines.flatMap((line, lineIndex) => {
    const matches = [...line.matchAll(PHONE_PATTERN)];
    PHONE_PATTERN.lastIndex = 0;

    return matches.map((match) => {
      const value = match[0];
      const lower = line.toLowerCase();
      let score = 0;

      if (/\bkor\b|korea|한국/.test(lower)) score += 8;
      if (/\bviet\b|vietnam|việt|viet\s*\+84/.test(lower)) score += 3;
      if (/\+?\s*82/.test(value)) score += 5;
      if (/\+?\s*84/.test(value)) score += 2;
      if (/010|10[-.\s:]?\d{4}/.test(value)) score += 4;
      if (/fax/.test(lower)) score -= 8;
      if (/contact|liên hệ|lien he/.test(lower)) score += 1;

      return { value: normalizePhone(value), score, lineIndex };
    });
  });
}

function scoreNameLine(line: string, email?: string) {
  let score = 0;
  const candidate = extractNameFromLine(line);
  const words = candidate.split(' ').filter(Boolean);

  if (words.length >= 2 && words.length <= 4) score += 3;
  if (/^[A-Za-z가-힣À-ỹ\s.'-]+$/.test(candidate)) score += 2;
  if (/[A-Z][a-z]+\s+[A-Z][a-z]+/.test(candidate)) score += 4;
  if (/[가-힣]{2,4}/.test(candidate)) score += 2;
  if (candidate !== line) score += 2;
  if (line === line.toUpperCase() && /[A-Z]{2,}/.test(line)) score -= 6;
  if (looksLikeCompany(line)) score -= 3;
  if (looksLikePosition(line)) score -= 2;
  if (isNoiseLine(line)) score -= 5;
  if (hasPhone(line) || EMAIL_PATTERN.test(line)) score -= 5;

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
  const phone = extractPhoneCandidates(lines).sort((a, b) => b.score - a.score || a.lineIndex - b.lineIndex)[0]?.value ?? '';
  const address = extractAddress(lines);
  const nonContactLines = lines.filter(
    (line) => !EMAIL_PATTERN.test(line) && !hasPhone(line) && !looksLikeAddress(line),
  );

  const companyCandidates = [
    ...nonContactLines.map((line) => ({
      value: normalizeCompany(line),
      score: scoreCompanyLine(line, email),
    })),
    { value: extractDomainCompany(email), score: email ? 5 : -20 },
  ].filter((candidate) => candidate.value);

  const company = companyCandidates.sort((a, b) => b.score - a.score)[0]?.value ?? '';

  const positionLine = nonContactLines.find((line) => looksLikePosition(line) && normalizeCompany(line) !== company) ?? '';
  const position = positionLine ? normalizePosition(positionLine) : '';

  const name =
    nonContactLines
      .filter((line) => normalizeCompany(line) !== company)
      .map((line) => ({ line: extractNameFromLine(line), score: scoreNameLine(line, email) }))
      .sort((a, b) => b.score - a.score)[0]?.line ?? '';

  const filled = [name, company, position, phone, email, address].filter(Boolean).length;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    company,
    position,
    phone,
    email,
    address,
    tags: '',
    memo: '',
    sourceText: text.trim(),
    confidence: Math.round((filled / 6) * 100),
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
