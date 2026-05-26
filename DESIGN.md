---
name: Card Leader
description: 현장에서 받은 명함을 그 자리에서 확실하게 정리하는 무료 OCR 명함첩 PWA
colors:
  pine-teal: "#0c6671"
  pine-teal-deep: "#12343c"
  ink: "#17202a"
  canvas: "#f7f9fb"
  surface: "#ffffff"
  field: "#fbfcfd"
  border: "#dce4ec"
  border-strong: "#cdd8e2"
  muted-text: "#566472"
  success-bg: "#e8f6f1"
  success-text: "#117457"
  warning-bg: "#fff6e3"
  warning-text: "#926514"
  error-bg: "#fff1ec"
  error-text: "#a13d21"
  teal-tint: "#dff1f3"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "clamp(25px, 3vw, 42px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0"
rounded:
  md: "8px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "18px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.pine-teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "42px"
  button-ai:
    backgroundColor: "{colors.pine-teal-deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.pine-teal-deep}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "42px"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "43px"
  contact-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px"
---

# Design System: Card Leader

## 1. Overview

**Creative North Star: "현장의 명함첩 (The Field Cardholder)"**

Card Leader는 책상이 아니라 모임 직후, 명함을 손에 쥔 그 순간을 위해 설계된 도구입니다. 인터페이스는 잘 만든 가죽 명함첩처럼 작동해야 합니다. 펼치면 바로 쓸 수 있고, 닫으면 안에 든 것이 안전하다는 확신을 줍니다. 그래서 시스템 전체가 "조용한 신뢰"를 향합니다. 차분한 흰 표면 위에 깊은 청록 하나가 작업의 무게중심을 잡고, 나머지는 모두 사용자가 명함 한 장을 확실히 저장하도록 비켜섭니다.

이 시스템이 명시적으로 거부하는 것: **복잡한 엔터프라이즈 도구**의 메뉴 미로, **차가운 다크 테크**의 네온과 터미널 정서, 그리고 **일반적인 SaaS 슬롭**(그라디언트 텍스트, 글래스모피즘, 히어로 메트릭, 똑같은 카드 그리드). 이것은 한 사람이 한 가지 일을 빠르고 확실하게 끝내는 단일 작업 앱이며, 그렇게 보여야 합니다.

밀도는 중간입니다. 폰 한 손 조작을 우선하되 정보를 숨기지 않습니다. 촉각적이고 단호한 컴포넌트가 "눌렀다"와 "저장됐다"를 분명히 알려줍니다.

**Key Characteristics:**
- 흰 표면 + 깊은 청록 단일 강조. 색은 의미가 있을 때만 등장한다.
- 촉각적이고 단호한 컨트롤: 누르는 느낌과 상태 피드백이 분명하다.
- 은은한 주변광 입체감: 패널은 배경에서 살짝 떠 있고, 강조는 그림자가 아니라 색으로 한다.
- 폰 우선, WCAG AA 기준. 보이는 포커스와 충분한 터치 타깃이 기본값이다.
- 정직한 상태: "저장 완료"는 확인됐을 때만 말한다.

## 2. Colors

흰 캔버스 위에 깊은 청록 하나가 작업을 이끌고, 의미색 4종이 상태를 정직하게 전한다.

### Primary
- **깊은 소나무 청록 / Deep Pine Teal** (`#0c6671`): 기본 저장 버튼, 활성 내비, 링크, 아바타 글자, 편집 중 행 테두리. 화면에서 "지금 중요한 행동"을 가리키는 단 하나의 목소리. AI 스캔 버튼은 더 깊은 변형(`#12343c`)으로 1차 행동과 구분한다.

### Neutral
- **잉크 / Ink** (`#17202a`): 본문과 입력 텍스트, 코드 미리보기 배경. 순흑(`#000`) 대신 청록 쪽으로 살짝 기운 짙은 색.
- **캔버스 / Canvas** (`#f7f9fb`): 페이지 배경. 순백이 아닌 차분한 한 톤.
- **표면 / Surface** (`#ffffff`): 패널·카드·버튼 표면. 캔버스 위에 떠 있는 작업면.
- **필드 / Field** (`#fbfcfd`): 입력·검색·원문 영역 배경. 표면과 미세하게 구분되는 입력 가능 영역.
- **보더 / Border** (`#dce4ec`), **강한 보더 / Border Strong** (`#cdd8e2`): 패널 경계와 컨트롤 외곽.
- **흐린 텍스트 / Muted Text** (`#566472`): 보조 라벨, 날짜, 회사 부제목. 흰 표면에서 5.97:1로 AA를 통과한다.

### Tertiary
- **청록 틴트 / Teal Tint** (`#dff1f3`): 아바타 배경, 시트 연결 안내 박스. 1차 청록의 옅은 메아리.

### Named Rules
**단일 목소리 규칙 (The One Voice Rule).** 깊은 청록은 한 화면에서 "다음에 할 한 가지 행동"에만 쓴다. 흔하지 않다는 것이 핵심이다. 청록 버튼이 두 개 이상 동등하게 경쟁하면 규칙 위반이다.

**정직한 상태색 규칙 (The Honest Status Rule).** 성공(`#e8f6f1`/`#117457`)은 백엔드가 확인했을 때만, 경고(`#fff6e3`/`#926514`)는 중복·검토 필요일 때만, 오류(`#fff1ec`/`#a13d21`)는 실제 실패일 때만. 상태색으로 분위기를 내지 않는다.

## 3. Typography

**Font:** OS 네이티브 산세리프 스택 (`system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic`). 웹폰트를 로드하지 않는다. Android는 Roboto/Noto, iOS는 Apple SD Gothic Neo, Windows는 Malgun Gothic으로 한국어까지 네이티브 렌더링하며 다운로드 비용과 FOUT가 0이다.

**Character:** 한 패밀리로 UI 전체를 운용한다. 위계는 크기 + 무게 3단으로 만든다. Inter 같은 "AI 기본 폰트"를 일부러 쓰지 않는다(PRODUCT.md 안티레퍼런스).

### Weight Scale
- **Regular** (400): 본문, 입력값, 연락처 부제목.
- **Semibold** (600): 라벨, 버튼, 내비, 상태 텍스트. 기능 텍스트의 기본 강조.
- **Bold** (700): 헤딩(h1/h2), 강조 `<strong>`, 아바타 이니셜.

### Hierarchy
- **Display** (700, `clamp(25px, 3vw, 42px)`, line-height 1.04, letter-spacing -0.01em): 캡처 패널의 단일 h1. 화면당 하나.
- **Title** (700, 15px, line-height 1.2): 사이드 패널 섹션 제목(h2).
- **Body** (400, 14px, line-height 1.55): 설명 문단, 입력값. 본문 길이는 65~75ch를 넘기지 않는다.
- **Label** (600, 12px): 필드 라벨, 상태 알약, 내비 텍스트.

### Named Rules
**무게 절약 규칙 (The Weight Discipline Rule).** 무게는 400/600/700 세 단계만 쓴다. 본문은 400, 기능 텍스트(라벨·버튼·내비·상태)는 600, 헤딩·강조는 700. 800/900은 금지한다. "전부 굵게"는 강조의 부재와 같다.

## 4. Elevation

은은한 주변광 방식이다. 패널과 카드는 흰 표면으로서 캔버스 위에 부드럽고 넓게 퍼지는 그림자로 살짝 떠 있다. 깊이는 어둡고 좁은 그림자가 아니라 넓고 옅은 확산으로 표현한다. 강조와 활성 상태는 그림자를 키우는 대신 청록 색과 링으로 처리한다.

### Shadow Vocabulary
- **패널 주변광 / Panel Ambient** (`box-shadow: 0 18px 42px rgba(20, 32, 43, 0.07)`): 캡처 패널과 사이드 박스가 캔버스에서 떠오르는 기본 깊이.
- **호버 리프트 / Hover Lift** (`box-shadow: 0 8px 20px rgba(16, 45, 60, 0.1)` + `translateY(-1px)`): 버튼에 마우스를 올렸을 때의 짧은 반응.
- **편집 포커스 링 / Editing Ring** (`box-shadow: 0 0 0 2px rgba(12, 102, 113, 0.12)`): 편집 중인 연락처 행을 청록 링으로 표시.

### Named Rules
**색으로 강조, 그림자로 떠받침 규칙 (The Color-Lifts Rule).** 그림자는 표면을 배경에서 떼어내는 데만 쓴다. "지금 중요함"은 그림자를 진하게 하는 대신 청록 색·테두리·포커스 링으로 말한다. 2014년 앱처럼 진하고 좁은 그림자가 보이면 잘못된 것이다.

## 5. Components

촉각적이고 단호하게. 누르는 느낌과 상태가 분명하고, 장식은 없다.

### Buttons
- **Shape:** 부드럽게 둥근 모서리(8px). 높이 42px로 손가락에 맞춘다.
- **Primary (Sheets 저장):** 깊은 청록 채움(`#0c6671`) + 흰 글자, 패딩 `0 16px`. 화면의 단일 1차 행동.
- **AI (AI 스캔):** 더 깊은 청록(`#12343c`) 채움 + 흰 글자. 1차 저장과 색으로 구분되는 보조 강조 행동.
- **Secondary (업로드·회전·재파싱):** 흰 배경 + 강한 보더(`#cdd8e2`) + 잉크 계열 글자.
- **Hover:** `translateY(-1px)` + 호버 리프트 그림자, 150ms ease.
- **Focus:** 모든 버튼에 보이는 포커스 링(청록 `box-shadow: 0 0 0 3px rgba(12,102,113,0.35)`)을 둔다. 포커스를 지우지 않는다.

### Chips (상태 알약)
- **Style:** 둥근 알약(999px), 옅은 의미색 배경 + 같은 계열 텍스트 + 1px 보더. 항상 아이콘 + 텍스트를 함께 둔다.
- **State:** 신뢰도 높음(성공/녹색), 중복 가능(경고/황색), 검토 필요(기본/청). 색만으로 의미를 전하지 않는다.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** 흰 표면(`#ffffff`), 보더 `#dce4ec` 또는 `#dde6ee`.
- **Shadow Strategy:** 패널 주변광(Elevation 참조). 카드 안에 카드를 넣지 않는다.
- **Internal Padding:** 패널 22px(`xl`), 사이드 박스 16px(`md`), 연락처 행 8px(`xs`).

### Inputs / Fields
- **Style:** 필드 배경(`#fbfcfd`) + 보더(`#d4dee7`) + 8px. 라벨은 입력을 감싸는 `<label>`로 연결한다.
- **Focus:** 청록 보더 전환 + 옅은 청록 링. `outline: none`만 두고 대체 링을 비우는 것은 금지.
- **Error:** 오류 메시지는 오류색 박스(`#fff1ec`/`#a13d21`)로, 해당 필드 가까이.

### Navigation
- **Style:** 데스크톱은 우상단 설정 아이콘. 모바일(≤860px)은 상단 모드 탭과 하단 고정 내비가 등장.
- **States:** 기본은 흐린 잉크(`#596a7a`), 활성은 청록(`#0c6671`). 아이콘 + 라벨 동반.
- **Mobile:** 하단 내비 항목 최소 높이 62px. 터치 타깃 ≥44px.

### 명함 미리보기 프레임 (Signature)
1.58 비율의 고정 프레임이 명함의 가로형을 그대로 담는다. 회전 컨트롤이 같은 프레임 안에서 90도 단위로 돈다. 이 프레임은 "지금 다루는 것이 한 장의 명함"이라는 물리적 은유의 핵심이다.

## 6. Do's and Don'ts

### Do:
- **Do** 깊은 청록(`#0c6671`)을 화면당 단 하나의 1차 행동에만 쓴다(단일 목소리 규칙).
- **Do** 모든 인터랙티브 요소에 보이는 포커스 링을 둔다(`box-shadow: 0 0 0 3px rgba(12,102,113,0.35)`).
- **Do** 보조 텍스트는 `#566472` 이상으로 어둡게 해 흰 표면에서 4.5:1을 넘긴다. 현재 코드의 `#6c7b89`·`#687584`(4.3~4.7:1)는 이 값으로 마이그레이션한다.
- **Do** 모바일 터치 타깃을 최소 44×44px로 둔다. 연락처 편집·삭제·복사 아이콘을 포함해서.
- **Do** 깊이는 넓고 옅은 주변광 그림자로만 표현한다(`0 18px 42px rgba(20,32,43,0.07)`).
- **Do** 상태색은 실제 상태일 때만 쓴다. "저장 완료"는 백엔드 확인 후에만.

### Don't:
- **Don't** **복잡한 엔터프라이즈 도구**처럼 메뉴·설정·위젯을 늘리지 않는다. 단일 작업 흐름을 지킨다.
- **Don't** **차가운 다크 테크** 정서(이유 없는 다크모드, 네온, 터미널풍)를 들이지 않는다. 현장·주간 사용 맥락과 어긋난다.
- **Don't** **일반적인 SaaS 슬롭**을 쓰지 않는다: 그라디언트 텍스트(`background-clip: text`), 장식용 글래스모피즘, 히어로 메트릭 템플릿, 똑같은 아이콘+제목+텍스트 카드 그리드.
- **Don't** 1px 넘는 색 사이드 스트라이프 보더(`border-left`)를 카드·알림 강조로 쓰지 않는다.
- **Don't** `outline: none`만 두고 포커스 표시를 비우지 않는다.
- **Don't** weight 800/900을 쓰지 않는다. 무게는 400/600/700 세 단계로 제한하고, 본문은 400을 유지한다.
- **Don't** Inter 등 "AI 기본 폰트"를 도입하지 않는다. OS 네이티브 스택을 쓴다(웹폰트 0).
- **Don't** 파괴적 삭제에 네이티브 `window.confirm`을 쓰지 않는다. 행 내 인라인 확인이나 실행취소 토스트를 쓴다.
- **Don't** 카드 안에 카드를 중첩하지 않는다.
