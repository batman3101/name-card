# Card Ledger

명함 사진을 브라우저에서 OCR 처리하고, 연락처를 Google Sheets에 저장하는 무료 Android 설치형 PWA입니다.

## 기능

- 모바일 카메라 또는 이미지 업로드
- Tesseract.js 기반 로컬 OCR
- OCR 전 이미지 흑백/대비 보정
- 이름, 회사, 직책, 전화, 이메일 룰 기반 자동 파싱
- 중복 가능 연락처 표시
- Google Apps Script Web App으로 Sheets 저장
- 최근 연락처 로컬 검색
- Android Chrome 홈 화면 설치 지원

## 연결된 Google Sheet

저장 대상:

https://docs.google.com/spreadsheets/d/1UE9t1sLfPVIy5HEQ1mHsXYgwp2-UHNDuo5VyQk7KQVk/edit

## 실행

```bash
npm install
npm run dev
```

운영 빌드 확인:

```bash
npm run build
npm run preview
```

## Android 설치

배포된 HTTPS 주소를 Android Chrome에서 열면 설치할 수 있습니다.

1. Chrome에서 앱 URL을 엽니다.
2. 메뉴 > 홈 화면에 추가 또는 앱 설치를 선택합니다.
3. 설치 후 홈 화면의 `Card Ledger` 아이콘으로 실행합니다.

설치 조건은 앱에 반영되어 있습니다.

- `manifest.webmanifest`
- 192px/512px PNG 아이콘
- maskable 아이콘
- standalone 표시 모드
- service worker 캐시

로컬 개발 주소는 설치 테스트가 제한될 수 있습니다. 실제 스마트폰 설치 확인은 Vercel 같은 HTTPS 배포 URL에서 진행하세요.

## Google Sheets 백엔드 배포

이 프로젝트에는 `apps-script/Code.gs`가 포함되어 있습니다. 이 코드는 아래 Google Sheet에 `contacts` 탭과 헤더를 자동 생성하고, 앱에서 보낸 연락처를 행으로 추가합니다.

1. Google Sheet를 엽니다.
2. 확장 프로그램 > Apps Script를 엽니다.
3. `apps-script/Code.gs` 내용을 Apps Script 편집기에 붙입니다.
4. 프로젝트 설정에서 매니페스트 표시를 켠 뒤 `apps-script/appsscript.json` 내용도 반영합니다.
5. `setup()` 함수를 한 번 실행해 권한을 승인합니다.
6. 배포 > 새 배포 > 웹 앱을 선택합니다.
7. 실행 권한은 `나`, 액세스 권한은 `모든 사용자`로 설정합니다.
8. 배포 URL을 앱 우측 상단 설정의 `Apps Script Web App URL`에 붙입니다.

백엔드가 생성하는 헤더:

```text
id | createdAt | name | company | position | phone | email | tags | memo | confidence | sourceText | userAgent
```

## 배포

Vercel에 올릴 수 있는 정적 Vite 앱입니다. 현재 환경에는 Vercel CLI가 설치되어 있지 않습니다. 배포와 로그 확인까지 자동화하려면 다음 설치가 필요합니다.

```bash
npm i -g vercel
```

설치 후에는 `vercel deploy` 또는 Vercel Git 연동으로 배포할 수 있습니다.
