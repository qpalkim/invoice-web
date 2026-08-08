# Task 009: 견적서 PDF 다운로드 구현 (F005)

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 008](./008-public-view.md)

## 개요

공개 페이지(`/q/[shareToken]`)의 "PDF 다운로드" 버튼이 실제 견적서 데이터를 담은 PDF 파일을 생성해 다운로드한다.

## 구현 방식

- `@react-pdf/renderer`(v4.5.1) 신규 설치.
- 브라우저에서 직접 PDF를 생성하는 `pdf(<Doc/>).toBlob()` API 사용 — 서버 왕복(API 라우트) 없이 클라이언트에서 완결.
- `@react-pdf/renderer`는 번들 용량이 커서(정적 import 시 First Load JS가 약 496KB 증가) 버튼 클릭 시점에 동적 `import()`로 지연 로드.
- **한글 폰트**: 기본 PDF 내장 폰트는 한글을 지원하지 않아 Noto Sans KR을 `Font.register()`로 등록. Google Fonts CDN(`fonts.gstatic.com`)의 정적 TTF 파일 URL을 직접 지정해 런타임에 불러온다(400/700 두 굵기).

## 관련 파일

- `src/lib/pdf/quote-pdf-document.tsx` (신규) — `QuotePdfDocument` PDF 문서 템플릿(견적 정보, 품목 표, 합계)
- `src/app/q/[shareToken]/pdf-download-button.tsx` (수정) — `quote`/`items` prop 수신, 클릭 시 동적 import 후 PDF 생성·다운로드, 로딩 스피너 상태 추가
- `src/app/q/[shareToken]/page.tsx` (수정) — `PdfDownloadButton`에 실제 `quote`/`items` 전달

## 수락 기준

- [x] "PDF 다운로드" 클릭 시 실제 견적서 데이터가 담긴 PDF 파일이 다운로드된다
- [x] PDF 내 한글(품목명, 클라이언트명 등)이 깨지지 않고 정상 렌더링된다
- [x] 금액은 목록/상세 페이지와 동일한 형식(`1,000,000원`)으로 표시된다
- [x] PDF 생성 로직 도입으로 `/q/[shareToken]` 초기 페이지 로드 번들이 불필요하게 커지지 않는다(동적 import로 확인)
- [x] `npm run check-all`, `npm run build` 통과

## 테스트 체크리스트 (Playwright MCP)

- [x] `/q/3b5c7c2a-060a-80fa-80c0-f2fa2348f74f` 접속 → "PDF 다운로드" 클릭 → 파일(`INV-2026-0001.pdf`) 다운로드 확인
- [x] 다운로드된 PDF 파일 시그니처(`%PDF-1.3`) 및 크기(12KB) 확인
- [x] 다운로드된 PDF 내용 확인 — 견적서 번호, 클라이언트명, 발행일/유효기간, 상태, 품목 3건, 총 견적 금액이 화면 표시 값과 정확히 일치, 한글 정상 렌더링
- [x] `npm run build` 결과 `/q/[shareToken]` First Load JS가 약 140KB로 유지됨(동적 import 전 629KB였던 것을 수정 후 재확인)

## 후속 작업

- Task 008-1: 전체 플로우 통합 테스트
- Task 010: PDF 파일명 규칙, 다운로드 실패 시 재시도 UX 등 최적화 여지 검토
