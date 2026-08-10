# 견적서 웹 확인 서비스 개발 로드맵

노션에 입력한 견적서를 클라이언트가 로그인 없이 웹에서 확인하고 PDF로 다운로드할 수 있게 한다.

## 개요

**견적서 웹 확인 서비스**는 노션으로 견적서를 작성하는 1인 사업자/프리랜서(관리자)와 공유 링크로 견적서를 확인하는 클라이언트를 위한 서비스로 다음 기능을 제공합니다:

- **노션 견적서 동기화**: 노션에 입력된 견적서 데이터를 가져와 목록으로 표시 (F001)
- **견적서 상세 확인 및 공유 링크 생성**: 관리자가 항목·금액을 검토하고 클라이언트용 링크를 생성 (F002, F003)
- **견적서 웹 열람 및 PDF 다운로드**: 클라이언트가 비로그인 상태로 견적서를 확인하고 PDF로 저장 (F004, F005)
- **열람 여부 확인**: 클라이언트 열람 여부 추적 (F011) — 인증 기능(F010)은 제외 결정 (2026-08-07, 1인 관리자 전용 서비스)

관련 문서: [PRD](./PRD.md)

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - `/tasks` 디렉토리에 새 작업 파일 생성
   - 명명 형식: `XXX-description.md` (예: `001-routing-skeleton.md`)
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)

3. **작업 구현**
   - 작업 파일의 명세서를 따름
   - API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수
   - 각 단계 후 작업 파일 내 진행 상황 업데이트
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 ✅로 표시

## 개발 단계

### Phase 1: 애플리케이션 골격 구축 ✅

- **Task 001: 라우팅 구조 및 페이지 골격 완성** ✅ - 완료
  - ✅ 견적서 목록 페이지 라우트 생성 (`/invoice`)
  - ✅ 견적서 상세 페이지 라우트 생성 (`/invoice/[id]`)
  - ✅ 견적서 공개 페이지 라우트 생성 (`/q/[shareToken]`, 비로그인)
  - ~~`/login`, `/signup` 기존 페이지와의 라우트 일관성 정리~~ → 인증 기능 제외 결정으로 `/login`, `/signup` 페이지 삭제 (2026-08-07)
  - ~~인증 필요 라우트 그룹(`/invoice/*`)과 공개 라우트 분리 구조 설계~~ → 인증 제외로 `/invoice/*`도 공개 라우트로 전환, `(protected)` 그룹 제거 (2026-08-07)

- **Task 002: 타입 정의 및 인프라 클라이언트 골격** ✅ - 완료
  - ✅ `Quote`, `QuoteItem` TypeScript 타입 정의 (PRD 데이터 모델 기준, 실제 노션 구조 반영해 확장. `User`는 인증 제외 결정으로 미정의)
  - ✅ Supabase 클라이언트 설정 골격 (`src/lib/supabase/client.ts`, `server.ts`)
  - ✅ Notion API 클라이언트 설정 골격 (`src/lib/notion/client.ts`)
  - ✅ Supabase 테이블 스키마 SQL 설계 (User, Quote, QuoteItem, 실제 마이그레이션 실행 제외)
  - ✅ `src/lib/env.ts`에 Supabase/Notion 관련 환경 변수 스키마 추가 (Task 001에서 선반영)

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅

- **Task 003: 관리자 레이아웃 완성** ✅ - 완료
  - ✅ 관리자 공통 레이아웃 골격 구현 (`src/components/layout/admin-header.tsx`, 상단 네비게이션: 견적서 목록)
  - ✅ 로딩/에러/빈 상태 UI 컴포넌트 정의 (`src/components/empty-state.tsx`, `src/components/error-state.tsx`; 로딩은 Phase 1에서 라우트별 `loading.tsx`로 기구현)

- **Task 004: 견적서 목록/상세/공개 페이지 UI 완성** ✅ - 완료
  - ✅ 견적서 목록 페이지: 더미 데이터로 클라이언트명·금액·열람 여부 테이블 UI 구현 (데스크톱 테이블 / 모바일 카드 뷰)
  - ✅ 견적서 상세 페이지: 품목별 상세 내역 표, "공유 링크 복사" 버튼 UI 구현
  - ✅ 견적서 공개 페이지: 항목·금액 표시, "PDF 다운로드" 버튼 UI 구현
  - ✅ 반응형 디자인 적용 (모바일/태블릿/데스크톱, Playwright MCP로 390px/1280px 뷰포트 검증)
  - 참고: 상호작용 버튼(공유 링크 복사, PDF 다운로드)은 Server Component 페이지에 이벤트 핸들러를 직접 넘길 수 없어 각각 `copy-share-link-button.tsx`, `pdf-download-button.tsx` Client Component로 분리

### Phase 3: 핵심 기능 구현

- ~~**Task 005: Supabase 인증 시스템 구현 (F010)**~~ → **제외** (2026-08-07): 1인 관리자 전용 서비스라 인증 기능 자체를 도입하지 않기로 결정. `/invoice/*`는 공개 라우트로 운영.

- **Task 006: 노션 견적서 동기화 구현 (F001)** — 부분 완료 (`/tasks/006-notion-quote-sync.md` 참고)
  - ✅ Notion API로 견적서 데이터베이스 조회 및 파싱 (`src/lib/notion/quotes.ts`, `mappers.ts`)
  - ⏳ 조회 결과를 `Quote`/`QuoteItem`으로 Supabase에 캐싱 → **범위 제외** (2026-08-08): 이번 작업에서는 노션 API를 목록 페이지에서 직접 조회하는 방식으로 구현. Supabase 캐싱은 별도 후속 작업에서 진행
  - ✅ 견적서 목록 페이지를 실제 노션 데이터로 연동 (`src/app/invoice/page.tsx`, `force-dynamic`으로 매 요청마다 재조회)
  - ✅ Playwright MCP로 목록 페이지 데이터 표시 검증 (실제 노션 워크스페이스 데이터 확인)
  - 품목(QuoteItem) 조회/연동은 상세 페이지 작업인 Task 007 범위로 이관

- **Task 007: 견적서 상세 확인 및 공유 링크 생성 (F002, F003)** ✅ - 완료 (`/tasks/007-quote-detail-share-link.md` 참고)
  - ✅ 견적서 상세 페이지를 실제 데이터(견적서 + 품목)로 연동
  - ✅ `shareToken`은 별도 저장 없이 노션 페이지 ID를 그대로 사용(2026-08-08 결정, Supabase 미도입 상태 반영)
  - ✅ "공유 링크 복사" 버튼 클립보드 복사 기능 구현(`sonner` 토스트 피드백)
  - ✅ Playwright MCP로 상세 조회(실제 품목 데이터·합계 일치) 검증. 클립보드 내용 자체 자동 검증은 헤드리스 환경 제약으로 생략

- **Task 008: 견적서 공개 열람 및 열람 여부 기록 (F004, F011)** — 부분 완료 (`/tasks/008-public-view.md` 참고)
  - ✅ `shareToken`(=견적서 ID) 기반 비로그인 공개 페이지 데이터 조회
  - ⏳ 최초 열람 시 `viewedAt` 기록 로직 → **범위 제외** (2026-08-08): 영구 저장소(노션 속성/Supabase) 부재로 후속 작업으로 이관
  - ⏳ 견적서 목록 페이지에 열람 여부 표시 반영 → 위 항목에 종속, 후속 작업
  - ✅ Playwright MCP로 공유 링크 접속 및 잘못된 토큰 not-found 처리 검증

- **Task 008-1: 핵심 기능 통합 테스트**
  - Playwright MCP로 목록 → 상세 → 공유 링크 → 공개 페이지 전체 플로우 테스트
  - 잘못된/만료된 공유 링크 접근 등 에러 케이스 테스트

- **Task 009: 견적서 PDF 다운로드 구현 (F005)** ✅ - 완료 (`/tasks/009-pdf-download.md` 참고)
  - ✅ `@react-pdf/renderer`로 견적서 PDF 문서 템플릿 구현(브라우저에서 직접 생성, 동적 import로 번들 최적화)
  - ✅ 공개 페이지 "PDF 다운로드" 버튼과 실제 생성 로직 연동
  - ✅ Noto Sans KR 한글 폰트(Google Fonts CDN) 및 금액 포맷 적용
  - ✅ Playwright MCP로 PDF 다운로드 트리거, 파일 시그니처·내용(한글 포함) 검증
  - ✅ (2026-08-08 추가) 관리자/공개 페이지를 구분하지 않기로 결정 — `PdfDownloadButton`을 `src/components/`로 공용화해 `/invoice/[id]` 상세 페이지에도 노출(기존엔 `/q/[shareToken]` 공개 페이지에만 있었음)

### Phase 4: 고급 기능 및 최적화

- **Task 010: 성능 최적화 및 캐싱** ✅ - 완료 (`/tasks/010-performance-caching.md` 참고)
  - ✅ Next.js 캐싱 전략 구현 — `/invoice`, `/invoice/[id]`, `/q/[shareToken]`를 `force-dynamic`에서 `revalidate = 60`(ISR)로 전환
  - ⏭️ 이미지 최적화 설정 → **제외** (2026-08-08): 앱에 `next/image`/이미지 사용이 전혀 없어 해당 없음
  - ✅ 노션 동기화 캐싱 전략 및 재검증 주기 설정 — 60초 주기 자동 재검증(수동 새로고침 버튼은 범위 밖)
  - ✅ 에러 바운더리, 로딩 스켈레톤 등 사용자 경험 보강 — 로딩 스켈레톤 컨테이너 폭을 실제 페이지(`max-w-3xl`)와 정합(에러 바운더리는 Task 006~008에서 이미 구현)
  - ✅ 환경 변수 문서화 (`.env.example`) 및 Vercel 배포 설정 — `.env.example`, `docs/guides/deployment.md` 신규 작성(실제 Vercel 계정 연동은 범위 밖)
  - ✅ 프로덕션 빌드 검증 (`npm run check-all`, `npm run build`) — `turbopack.root` 설정으로 workspace root 경고도 제거

- **Task 011: 보안 및 에러 처리 강화** ✅ - 완료 (`/tasks/011-security-error-handling.md` 참고)
  - ✅ API 키 보안 검증 — `NOTION_API_KEY`/`SUPABASE_SERVICE_ROLE_KEY`가 서버 전용 모듈에서만 사용되고 클라이언트 컴포넌트에서 참조되지 않음을 grep으로 확인(문제 없음)
  - ✅ Rate limiting 구현 — `src/middleware.ts` 신규 작성, `/invoice/*`·`/q/*`에 IP 기준 슬라이딩 윈도우(60초/30회) 적용, 초과 시 429 응답(서버리스 멀티 인스턴스 환경에서 완벽한 보장이 아니라는 한계 문서화)
  - ✅ 상세 에러 로깅 시스템 — `src/lib/logger.ts` 신규 작성(구조화 JSON 콘솔 로깅), 노션 조회 함수 3종과 각 라우트 `error.tsx`에 연동
  - ✅ 404/500 에러 처리 개선 — 루트 `not-found.tsx`, `global-error.tsx` 신규 추가(기존 `EmptyState`/`ErrorState` 재사용)
  - ⏭️ CORS 정책 설정 → **범위 제외** (2026-08-08): 실제 API 라우트(`src/app/api`)가 없어 적용 대상이 없음. 향후 API 라우트 추가 시 진행

- **Task 012: 테스트 및 배포** ✅ - 완료 (`/tasks/012-testing-deployment.md` 참고)
  - ✅ 단위 테스트 작성 — `vitest` 신규 도입, `formatCurrency`/`mapPageToQuote`/`mapPageToQuoteItem`/rate limit 로직 테스트
  - ✅ 통합 테스트 — `fetchQuoteById`(ObjectNotFound/ValidationError 분기 포함)·`fetchQuotesFromNotion`·`fetchQuoteItemsByQuoteId`를 `@notionhq/client` mock으로 테스트(총 19개 테스트 통과)
  - ✅ E2E 테스트 시나리오 구현(Playwright MCP 사용) — 핵심 플로우는 Task 007~009에서 이미 검증 완료라 재검증하지 않고, 신규 기능(rate limit 429 전환, 신규 404 페이지)을 실제 dev 서버로 검증
  - ✅ Vercel 배포 설정 — `docs/guides/deployment.md`에 rate limiting 한계·테스트 실행법 보강, `package.json`에 `engines.node` 추가(실제 계정 연동은 Task 010과 동일하게 범위 밖 유지)

---

**📅 최종 업데이트**: 2026-08-08
**📊 진행 상황**: Phase 1~2 완료. Phase 3: Task 006(부분, Supabase 캐싱 제외)·007·009 완료, Task 008 부분 완료(열람 기록 제외), Task 005는 인증 제외 결정으로 범위에서 제외, Task 008-1 착수 전. Phase 4: Task 010·011·012 완료 — 로드맵상 계획된 모든 Task 완료(Task 008-1 통합 테스트, Task 008 열람 기록은 별도 후속 작업으로 남음)
