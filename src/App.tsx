import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  Loader2,
  Pencil,
  Phone,
  RotateCw,
  Save,
  Search,
  Settings,
  Sheet,
  Sparkles,
  Users,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { isPossibleDuplicate, parseBusinessCard } from './lib/contactParser';
import { analyzeBusinessCardWithGemini } from './lib/gemini';
import { createPreviewImage, preprocessImage } from './lib/imageProcessing';
import { DEFAULT_SHEET_ID, createAppsScriptTemplate, deleteFromGoogleSheet, getSheetUrl, saveToGoogleSheet } from './lib/sheets';
import { loadContacts, loadEndpoint, loadSheetId, storeContacts, storeEndpoint, storeSheetId } from './lib/storage';
import type { Contact, OcrStatus } from './types';

const DEMO_TEXT = `ALMUS TECH
Bruce Wayne
Technical Manager
010-1234-5678
bruce@almus.com
경기도 부천시 원미구 길주로431번길 17`;

const SAMPLE_CONTACTS: Contact[] = [
  {
    id: 'sample-1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    name: '박지훈',
    company: '미래솔루션',
    position: '대표이사',
    phone: '010-9876-5432',
    email: 'jihoon.park@mirae.co.kr',
    address: '서울특별시 강남구 테헤란로 123',
    tags: '고객, 영업',
    memo: '샘플 연락처',
    sourceText: '',
    confidence: 96,
  },
  {
    id: 'sample-2',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    name: 'Nguyen Van Anh',
    company: 'ABC Solutions',
    position: 'Giám đốc Kinh doanh',
    phone: '+84 90 123 4567',
    email: 'anh.nguyen@abc.vn',
    address: 'Ho Chi Minh City, Vietnam',
    tags: '베트남, 파트너',
    memo: '샘플 연락처',
    sourceText: '',
    confidence: 94,
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function emptyDraft(): Contact {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    tags: '',
    memo: '',
    sourceText: '',
    confidence: 0,
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function StatusPill({ contact, duplicate }: { contact: Contact; duplicate: boolean }) {
  if (duplicate) {
    return (
      <span className="pill warning">
        <AlertTriangle size={14} />
        중복 가능
      </span>
    );
  }

  if (contact.confidence >= 80) {
    return (
      <span className="pill success">
        <CheckCircle2 size={14} />
        신뢰도 높음
      </span>
    );
  }

  return (
    <span className="pill">
      <Sparkles size={14} />
      검토 필요
    </span>
  );
}

export default function App() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const contactsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const imageUrlRef = useRef('');
  const previewRequestRef = useRef(0);
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = loadContacts();
    return saved.length > 0 ? saved : SAMPLE_CONTACTS;
  });
  const [draft, setDraft] = useState<Contact>(() => parseBusinessCard(DEMO_TEXT));
  const [sourceText, setSourceText] = useState(DEMO_TEXT);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [endpoint, setEndpoint] = useState(() => loadEndpoint());
  const [endpointDraft, setEndpointDraft] = useState(() => loadEndpoint());
  const [sheetId, setSheetId] = useState(() => loadSheetId(DEFAULT_SHEET_ID));
  const [sheetIdDraft, setSheetIdDraft] = useState(() => loadSheetId(DEFAULT_SHEET_ID));
  const [settingsState, setSettingsState] = useState<'idle' | 'dirty' | 'saved'>('idle');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>({ label: '대기 중', progress: 0 });
  const [isReading, setIsReading] = useState(false);
  const [isAiReading, setIsAiReading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  const duplicate = useMemo(() => isPossibleDuplicate(draft, contacts), [draft, contacts]);
  const isEditingExisting = useMemo(() => contacts.some((contact) => contact.id === draft.id), [contacts, draft.id]);
  const scriptTemplate = useMemo(() => createAppsScriptTemplate(sheetIdDraft), [sheetIdDraft]);
  const sheetUrl = useMemo(() => getSheetUrl(sheetId), [sheetId]);
  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;

    return contacts.filter((contact) =>
      [contact.name, contact.company, contact.phone, contact.email, contact.address, contact.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [contacts, query]);

  function updateDraft<Key extends keyof Contact>(key: Key, value: Contact[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function triggerCamera() {
    cameraInputRef.current?.click();
  }

  function triggerUpload() {
    uploadInputRef.current?.click();
  }

  function showContacts() {
    contactsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showEditor() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showSettings() {
    setSettingsOpen(true);
    window.setTimeout(() => settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function handleSelectedFile(file: File | undefined) {
    if (file) {
      setImageFile(file);
      setRotation(0);
      void refreshPreview(file, 0);
      void readBusinessCard(file, 0);
    }
  }

  function rotateImage() {
    if (!imageFile) return;
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    setOcrStatus({ label: '회전 적용됨', progress: 0 });
    void refreshPreview(imageFile, nextRotation);
  }

  function rereadRotatedImage() {
    if (imageFile) void readBusinessCard(imageFile, rotation);
  }

  async function readBusinessCardWithAi() {
    if (!imageFile) {
      setAiMessage('먼저 명함 사진을 선택하세요.');
      return;
    }

    setIsAiReading(true);
    setSaveState('idle');
    setAiMessage('Gemini 2.5 Flash 분석 중');
    setOcrStatus({ label: 'AI 스캔 중', progress: 55 });

    try {
      const result = await analyzeBusinessCardWithGemini(imageFile, rotation);
      setDraft((current) => ({
        ...current,
        name: result.name,
        company: result.company,
        position: result.position,
        phone: result.phone,
        email: result.email,
        address: result.address,
        tags: result.tags,
        memo: result.memo || current.memo,
        sourceText: result.rawText,
        confidence: result.confidence,
      }));
      setSourceText(result.rawText);
      setOcrStatus({ label: 'AI 스캔 완료', progress: 100 });
      setAiMessage('AI 스캔 결과가 입력칸에 적용됨');
    } catch (error) {
      console.error(error);
      setOcrStatus({ label: 'AI 스캔 실패', progress: 0 });
      setAiMessage(error instanceof Error ? error.message : 'AI 스캔 실패');
    } finally {
      setIsAiReading(false);
    }
  }

  async function readBusinessCard(file: File, imageRotation = rotation) {
    setIsReading(true);
    setSaveState('idle');
    setOcrStatus({ label: '이미지 보정 중', progress: 8 });

    try {
      const processedImage = await preprocessImage(file, imageRotation);
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['eng', 'kor', 'vie'], 1, {
        logger: (message) => {
          if ('progress' in message && typeof message.progress === 'number') {
            setOcrStatus({
              label: message.status || 'OCR 처리 중',
              progress: Math.max(10, Math.round(message.progress * 100)),
            });
          }
        },
      });

      const result = await worker.recognize(processedImage);
      await worker.terminate();

      const text = result.data.text.trim();
      const parsed = parseBusinessCard(text);
      setSourceText(text);
      setDraft(parsed);
      setOcrStatus({ label: 'OCR 완료', progress: 100 });
    } catch (error) {
      console.error(error);
      setOcrStatus({ label: 'OCR 실패', progress: 0 });
    } finally {
      setIsReading(false);
    }
  }

  async function refreshPreview(file: File, imageRotation: number) {
    const requestId = ++previewRequestRef.current;
    const previewImage = await createPreviewImage(file, imageRotation);
    const nextUrl = URL.createObjectURL(previewImage);

    if (requestId !== previewRequestRef.current) {
      URL.revokeObjectURL(nextUrl);
      return;
    }

    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }

    imageUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
  }

  async function saveDraft() {
    const contact = { ...draft, sourceText, createdAt: draft.createdAt || new Date().toISOString() };
    setSaveState('saving');
    setSaveMessage(isEditingExisting ? 'Google Sheets 수정 확인 중' : 'Google Sheets 저장 확인 중');

    try {
      await saveToGoogleSheet(endpoint, contact);
      const nextContacts = [contact, ...contacts.filter((item) => item.id !== contact.id)];
      setContacts(nextContacts);
      storeContacts(nextContacts);
      storeEndpoint(endpoint);
      setSaveState('saved');
      setSaveMessage(isEditingExisting ? 'Google Sheets 수정 확인됨' : 'Google Sheets 저장 확인됨');
      setDraft(emptyDraft());
      setSourceText('');
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Google Sheets 저장 실패');
    }
  }

  async function editContact(contact: Contact) {
    setDraft(contact);
    setSourceText(contact.sourceText || '');
    setSaveState('idle');
    setSaveMessage('편집 모드입니다. 수정 후 `수정 저장`을 누르세요.');
    showEditor();
  }

  async function deleteContact(contact: Contact) {
    const confirmed = window.confirm(`${contact.name || contact.company || '이 연락처'}를 삭제할까요?`);
    if (!confirmed) return;

    setDeletingId(contact.id);
    setSaveState('saving');
    setSaveMessage('Google Sheets 삭제 확인 중');

    try {
      await deleteFromGoogleSheet(endpoint, contact.id);
      const nextContacts = contacts.filter((item) => item.id !== contact.id);
      setContacts(nextContacts);
      storeContacts(nextContacts);
      if (draft.id === contact.id) {
        setDraft(emptyDraft());
        setSourceText('');
      }
      setSaveState('saved');
      setSaveMessage('Google Sheets 삭제 확인됨');
    } catch (error) {
      console.error(error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Google Sheets 삭제 실패');
    } finally {
      setDeletingId('');
    }
  }

  function parseEditedText() {
    const parsed = parseBusinessCard(sourceText);
    setDraft((current) => ({
      ...parsed,
      id: current.id,
      tags: current.tags,
      memo: current.memo,
    }));
  }

  function copyScript() {
    void navigator.clipboard.writeText(scriptTemplate);
  }

  function updateEndpointDraft(value: string) {
    setEndpointDraft(value);
    setSettingsState('dirty');
  }

  function updateSheetIdDraft(value: string) {
    setSheetIdDraft(value);
    setSettingsState('dirty');
  }

  function saveSettings() {
    const nextEndpoint = endpointDraft.trim();
    const nextSheetId = sheetIdDraft.trim() || DEFAULT_SHEET_ID;

    setEndpoint(nextEndpoint);
    setSheetId(nextSheetId);
    setEndpointDraft(nextEndpoint);
    setSheetIdDraft(nextSheetId);
    storeEndpoint(nextEndpoint);
    storeSheetId(nextSheetId);
    setSettingsState('saved');
  }

  return (
    <main className="app-shell">
      <input
        ref={cameraInputRef}
        className="file-input"
        accept="image/*"
        capture="environment"
        type="file"
        onChange={(event) => {
          handleSelectedFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <input
        ref={uploadInputRef}
        className="file-input"
        accept="image/*"
        type="file"
        onChange={(event) => {
          handleSelectedFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <img src="/profile-icon-64.png" alt="" />
          </span>
          <div>
            <strong>Card Leader</strong>
            <small>무료 OCR 명함 관리 PWA</small>
          </div>
        </div>
        <button className="icon-button" type="button" onClick={showSettings} aria-label="설정">
          <Settings size={20} />
        </button>
      </header>

      <nav className="mode-tabs" aria-label="주요 기능">
        <button className="active" type="button" onClick={triggerCamera}>
          <Camera size={17} />
          스캔
        </button>
        <button type="button" onClick={triggerUpload}>
          <Upload size={17} />
          업로드
        </button>
        <button type="button" onClick={showContacts}>
          <Users size={17} />
          최근
        </button>
      </nav>

      <section className="workspace">
        <div className="capture-panel">
          <div className="panel-heading">
            <div>
              <h1>명함 촬영 후 Sheets에 저장</h1>
              <p>사진을 넣으면 로컬 OCR로 텍스트를 읽고 이름, 회사, 연락처를 자동 분리합니다.</p>
            </div>
            <StatusPill contact={draft} duplicate={duplicate} />
          </div>

          <div className="dropzone">
            <div className="preview-frame">
              {imageUrl ? (
                <img src={imageUrl} alt="업로드된 명함" />
              ) : (
                <FileImage size={52} />
              )}
            </div>
            <div className="dropzone-copy">
              <strong>명함 사진 선택 또는 촬영</strong>
              <span>한국어, 영어, 베트남어 OCR 언어팩을 사용합니다.</span>
            </div>
            <div className="dropzone-actions">
              <button className="button-like" type="button" onClick={triggerCamera}>
                <Camera size={16} />
                스캔
              </button>
              <button className="secondary-button compact-button" type="button" onClick={triggerUpload}>
                <Upload size={16} />
                업로드
              </button>
              {imageFile && (
                <>
                  <button className="secondary-button compact-button" type="button" onClick={rotateImage}>
                    <RotateCw size={16} />
                    90도 회전
                  </button>
                  <button className="secondary-button compact-button" type="button" onClick={rereadRotatedImage} disabled={isReading}>
                    {isReading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                    회전 후 OCR
                  </button>
                  <button className="ai-button compact-button" type="button" onClick={readBusinessCardWithAi} disabled={isAiReading}>
                    {isAiReading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                    AI 스캔
                  </button>
                </>
              )}
            </div>
          </div>

          {aiMessage && <p className={`ai-message ${isAiReading ? 'loading' : ''}`}>{aiMessage}</p>}

          <div className="ocr-meter">
            <div>
              {isReading ? <Loader2 className="spin" size={18} /> : <Camera size={18} />}
              <span>{ocrStatus.label}</span>
            </div>
            <progress value={ocrStatus.progress} max="100" />
          </div>

          <div className="form-grid">
            <Field label="이름" value={draft.name} onChange={(value) => updateDraft('name', value)} placeholder="Bruce Wayne" />
            <Field label="회사" value={draft.company} onChange={(value) => updateDraft('company', value)} placeholder="ALMUS TECH" />
            <Field label="직책" value={draft.position} onChange={(value) => updateDraft('position', value)} placeholder="Manager" />
            <Field label="전화" value={draft.phone} onChange={(value) => updateDraft('phone', value)} placeholder="010-1234-5678" />
            <Field label="이메일" value={draft.email} onChange={(value) => updateDraft('email', value)} placeholder="name@company.com" />
            <Field label="태그" value={draft.tags} onChange={(value) => updateDraft('tags', value)} placeholder="전시회, 구매, 베트남" />
          </div>

          <label className="field address-field">
            <span>주소</span>
            <textarea
              value={draft.address}
              onChange={(event) => updateDraft('address', event.target.value)}
              placeholder="회사 주소"
            />
          </label>

          <label className="field memo-field">
            <span>메모</span>
            <textarea value={draft.memo} onChange={(event) => updateDraft('memo', event.target.value)} placeholder="미팅 내용, 후속 조치" />
          </label>

          <div className="actions">
            <button className="secondary-button" type="button" onClick={parseEditedText}>
              <Sparkles size={16} />
              텍스트 재파싱
            </button>
            <button className="primary-button" type="button" onClick={saveDraft} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
              {saveState === 'saved' ? '저장 완료' : isEditingExisting ? '수정 저장' : 'Sheets 저장'}
            </button>
          </div>

          {saveMessage && (
            <p className={`save-message ${saveState === 'error' ? 'error' : saveState === 'saved' ? 'success' : ''}`}>
              {saveMessage}
            </p>
          )}
        </div>

        <aside className="side-panel">
          {settingsOpen && (
            <div className="settings-box" ref={settingsRef}>
              <div className="panel-heading compact">
                <h2>Google Sheets 연결</h2>
                <button className="icon-button muted" type="button" onClick={copyScript} aria-label="Apps Script 복사">
                  <Copy size={16} />
                </button>
              </div>
              <div className="sheet-target">
                <span>저장 대상</span>
                <strong>{sheetId}</strong>
                <a href={sheetUrl} target="_blank" rel="noreferrer">
                  시트 열기
                  <ExternalLink size={14} />
                </a>
              </div>
              <label className="field">
                <span>Google Sheet ID</span>
                <textarea
                  className="settings-textarea"
                  value={sheetIdDraft}
                  onChange={(event) => updateSheetIdDraft(event.target.value)}
                  placeholder="Google Sheet ID"
                  spellCheck={false}
                />
              </label>
              <label className="field">
                <span>Apps Script Web App URL</span>
                <textarea
                  className="settings-textarea"
                  value={endpointDraft}
                  onChange={(event) => updateEndpointDraft(event.target.value)}
                  placeholder="https://script.google.com/macros/s/..."
                  spellCheck={false}
                />
              </label>
              <div className="settings-actions">
                <button className="primary-button" type="button" onClick={saveSettings}>
                  <Save size={16} />
                  설정 저장
                </button>
                <span className={`settings-status ${settingsState}`}>
                  {settingsState === 'saved' ? '저장됨' : settingsState === 'dirty' ? '저장 필요' : '대기 중'}
                </span>
              </div>
              <pre className="code-preview">{scriptTemplate}</pre>
            </div>
          )}

          <div className="raw-text-box">
            <div className="panel-heading compact">
              <h2>OCR 원문</h2>
              <span>{draft.confidence}%</span>
            </div>
            <textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} />
          </div>

          <div className="contacts-box" ref={contactsRef}>
            <div className="panel-heading compact">
              <h2>최근 연락처</h2>
              <span>{contacts.length}</span>
            </div>
            <label className="search-box">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 회사, 전화, 주소, 태그 검색" />
            </label>
            <div className="contact-list">
              {filteredContacts.length === 0 ? (
                <div className="empty-state">
                  <Download size={22} />
                  <strong>저장된 연락처가 없습니다</strong>
                  <span>첫 명함을 저장하면 여기에 표시됩니다.</span>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <article className={`contact-row ${contact.id === draft.id ? 'editing' : ''}`} key={contact.id}>
                    <span className="avatar">{contact.name.slice(0, 1) || '?'}</span>
                    <button className="contact-main" type="button" onClick={() => editContact(contact)}>
                      <strong>{contact.name || '이름 없음'}</strong>
                      <small>{contact.company || contact.email || '회사 정보 없음'}</small>
                    </button>
                    <span className="contact-meta">
                      <small>{formatDate(contact.createdAt)}</small>
                      {contact.phone && <Phone size={14} />}
                      {contact.tags && <Tag size={14} />}
                    </span>
                    <span className="contact-actions">
                      <button type="button" onClick={() => editContact(contact)} aria-label={`${contact.name || '연락처'} 편집`}>
                        <Pencil size={15} />
                        편집
                      </button>
                      <button type="button" onClick={() => deleteContact(contact)} disabled={deletingId === contact.id} aria-label={`${contact.name || '연락처'} 삭제`}>
                        {deletingId === contact.id ? <Loader2 className="spin" size={15} /> : <Trash2 size={15} />}
                        삭제
                      </button>
                    </span>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>

      <nav className="bottom-nav" aria-label="모바일 하단 메뉴">
        <button className="active" type="button" onClick={triggerCamera}>
          <Camera size={20} />
          스캔
        </button>
        <button type="button" onClick={showContacts}>
          <Users size={20} />
          연락처
        </button>
        <button type="button" onClick={showSettings}>
          <Sheet size={20} />
          Sheets
        </button>
        <button type="button" onClick={showSettings}>
          <Settings size={20} />
          설정
        </button>
      </nav>
    </main>
  );
}
