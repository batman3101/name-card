# Card Leader

명함 사진을 브라우저에서 OCR 처리하고, 연락처를 Google Sheets에 저장하는 무료 Android 설치형 PWA입니다.

## 기능

- 모바일 카메라 또는 이미지 업로드
- Tesseract.js 기반 로컬 OCR
- OCR 전 이미지 흑백/대비 보정
- 이름, 회사, 직책, 전화, 이메일, 주소 룰 기반 자동 파싱
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
3. 설치 후 홈 화면의 `Card Leader` 아이콘으로 실행합니다.

설치 조건은 앱에 반영되어 있습니다.

- `manifest.webmanifest`
- 192px/512px PNG 아이콘
- maskable 아이콘
- standalone 표시 모드
- service worker 캐시

로컬 개발 주소는 설치 테스트가 제한될 수 있습니다. 실제 스마트폰 설치 확인은 Netlify 같은 HTTPS 배포 URL에서 진행하세요.

## 배포된 앱 사용법

1. Android Chrome에서 배포된 앱 URL을 엽니다.
2. 처음 사용할 때는 우측 상단 또는 하단의 설정 버튼을 누릅니다.
3. `Google Sheet ID`와 `Apps Script Web App URL`을 입력합니다.
4. `설정 저장`을 눌러 `저장됨` 상태를 확인합니다.
5. `스캔` 또는 `업로드`로 명함 사진을 촬영하거나 기존 사진을 선택합니다.
6. OCR이 끝나면 이름, 회사, 직책, 전화, 이메일, 주소, 태그, 메모를 확인합니다.
7. 인식 결과가 틀리면 필드를 직접 수정합니다.
8. `Sheets 저장`을 누르면 설정한 Google Sheet의 `contacts` 탭에 저장됩니다.
9. 저장된 연락처는 앱의 `최근 연락처` 영역에서 검색할 수 있습니다.

앱은 OCR을 브라우저에서 로컬로 실행합니다. 명함 이미지는 서버로 업로드되지 않고, 저장 버튼을 눌렀을 때 구조화된 연락처 데이터만 Apps Script로 전송됩니다.

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
id | createdAt | name | company | position | phone | email | address | tags | memo | confidence | sourceText | userAgent
```

## 내 Google Sheet로 바꾸는 방법

기본 저장 대상은 프로젝트에 설정된 Sheet입니다. 다른 사용자가 자기 Google Sheet를 쓰려면 아래 순서로 바꾸면 됩니다.

1. 새 Google Sheet를 만듭니다.
2. 브라우저 주소에서 `/d/`와 `/edit` 사이의 값을 복사합니다.

예시:

```text
https://docs.google.com/spreadsheets/d/내_SHEET_ID/edit
```

3. `apps-script/Code.gs`의 `SHEET_ID` 값을 새 Sheet ID로 바꿉니다.

```javascript
const SHEET_ID = '내_SHEET_ID';
```

4. 배포된 Card Leader 앱 설정 화면의 `Google Sheet ID`에도 같은 값을 입력합니다.
5. 앱 설정 화면의 코드 복사 버튼으로 새 Sheet ID가 반영된 `Code.gs`를 복사할 수 있습니다.
6. Apps Script 편집기에 수정한 `Code.gs`를 붙여 넣습니다.
7. Apps Script에서 `setup()`을 한 번 실행해 `contacts` 탭과 헤더를 생성합니다.
8. 웹 앱으로 새 배포를 만들고 배포 URL을 복사합니다.
9. 배포된 Card Leader 앱 설정 화면에 새 Apps Script Web App URL을 붙여 넣습니다.
10. `설정 저장`을 눌러 `저장됨` 상태를 확인합니다.

주의할 점:

- Sheet ID와 Apps Script 배포 URL은 서로 다른 값입니다.
- 앱 설정에는 Sheet URL이 아니라 Apps Script Web App URL을 넣어야 합니다.
- Apps Script를 수정한 뒤에는 새 배포 또는 배포 관리를 통해 최신 버전을 다시 배포해야 앱에서 변경 사항이 반영됩니다.
- 웹 앱 액세스 권한을 제한하면 스마트폰 앱에서 저장이 실패할 수 있습니다. 개인용 MVP는 `모든 사용자` 접근으로 시작하는 것이 가장 단순합니다.

## 배포

Vercel에 올릴 수 있는 정적 Vite 앱입니다. 현재 환경에는 Vercel CLI가 설치되어 있지 않습니다. 배포와 로그 확인까지 자동화하려면 다음 설치가 필요합니다.

```bash
npm i -g vercel
```

설치 후에는 `vercel deploy` 또는 Vercel Git 연동으로 배포할 수 있습니다.
