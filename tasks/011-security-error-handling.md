# Task 011: 보안 및 에러 처리 강화

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 010](./010-performance-caching.md)

## 개요

이 서비스는 인증이 없고 `/invoice`, `/invoice/[id]`, `/q/[shareToken]` 전부 공개 라우트다. `shareToken`은 별도 저장 없이 노션 페이지 ID(UUID)를 그대로 사용하므로, 무작위 UUID를 대량으로 시도하면 다른 사람의 견적서에 접근할 수 있는 구조적 특성이 있다(링크만 있으면 누구나 볼 수 있는 것이 의도된 공유 방식이라 완전히 막을 수는 없음). 이 Task는 (1) API 키가 클라이언트로 새고 있지 않은지 검증, (2) 그런 스캔 시도를 늦추기 위한 간단한 rate limit, (3) 구조화된 서버 사이드 에러 로깅, (4) 404/500 에러 페이지 보강을 다룬다. 실제 API 라우트가 없어 CORS는 이번 범위에서 제외했다.

## 1. API 키 보안 검증 (결과 기록)

`grep`으로 민감 키(`NOTION_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)의 실제 사용처를 전수 조사했다.

| 키                              | 사용처                                                                 | 판정                                                                                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NOTION_API_KEY`                | `src/lib/notion/client.ts` (서버 전용 모듈, `'use client'` 없음)       | ✅ 안전 — `NEXT_PUBLIC_` 접두사 없음, 클라이언트 컴포넌트 어디서도 import되지 않음                                                                                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | `src/lib/env.ts`에 스키마만 정의, 실제 사용처 없음(Supabase 미도입)    | ✅ 안전 — 사용되는 곳 자체가 없음                                                                                                                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/client.ts`(브라우저용), `src/lib/supabase/server.ts` | ✅ 의도된 사용 — `NEXT_PUBLIC_` 접두사가 붙은 anon key는 원래 클라이언트에 노출되는 것이 Supabase의 설계이며, RLS(Row Level Security)로 접근을 제한하는 것이 정상적인 패턴. 다만 Supabase 자체가 미도입 상태라 현재는 실제로 사용되지 않음 |

`'use client'`가 붙은 18개 파일 전체를 grep했을 때 `process.env.*` 또는 위 세 키를 직접 참조하는 곳은 없었다(모두 UI 컴포넌트이며 서버에서 props로 데이터를 전달받는 구조). 결론: 현재 코드베이스에서 민감 키의 클라이언트 노출 문제는 발견되지 않았다.

## 2. Rate Limiting

### 구현

- `src/middleware.ts` (신규) — IP 기준 슬라이딩 윈도우 로그 방식 인메모리 rate limit.
  - 대상 경로: `/invoice/:path*`, `/q/:path*` (matcher로 지정, 그 외 정적 자원/홈 경로는 영향 없음)
  - 윈도우: 60초, 허용치: IP당 60초에 30회
  - 초과 시 `429` + `Retry-After` 헤더 + JSON 에러 바디 응답
  - IP는 `x-forwarded-for`(프록시가 설정, 없으면 `x-real-ip`) 헤더로 추출 — Next.js 15에서 `NextRequest.ip`가 제거되어 헤더를 직접 읽는 방식 사용(Context7로 Next.js 15 업그레이드 문서 확인)
  - 메모리 누수 방지: 저장소(Map) 크기가 5000개 IP를 넘으면 윈도우 밖으로 만료된 항목을 정리

### 설계 판단

- **임계값(분당 30회)**: 일반 사용자가 견적서 페이지를 열람하며 새로고침, PDF 재시도 등을 하더라도 충분한 여유를 두되, UUID 무작위 스캔처럼 짧은 시간에 다수 요청을 보내는 패턴은 빠르게 차단되도록 잡은 값. 외부 트래픽 데이터가 없는 초기 서비스 단계라 보수적으로 설정했고, 오탐(false positive)이 잦다고 판단되면 조정 검토.
- **슬라이딩 윈도우 로그 방식**: 고정 윈도우(fixed window) 대비 경계에서 순간적으로 2배 요청이 몰리는 문제가 없고, Redis 없이 `Map<ip, timestamp[]>`만으로 구현 가능해 외부 서비스 도입 없이 요구사항을 만족한다.
- **`/invoice`(목록) 페이지도 matcher에 포함**: `/invoice/:path*` 패턴은 `/invoice` 자체도 포함한다. UUID 스캔 대상은 아니지만, 동일한 정책으로 과도한 자동화 요청을 함께 완화하는 것이 일관적이라고 판단했다.

### ⚠️ 한계 (반드시 인지해야 할 점)

`requestLog` Map은 미들웨어를 실행하는 **서버리스 인스턴스의 메모리에만** 존재한다. Vercel처럼 요청마다 다른 인스턴스로 라우팅될 수 있는 멀티 인스턴스 환경에서는 인스턴스별로 카운터가 분리되어, 같은 IP라도 실제로는 설정값의 N배(콜드 스타트로 생성된 인스턴스 수만큼)까지 통과할 수 있다. 즉 **엄격한 전역 rate limit을 보장하지 않는다** — 무작위 UUID 스캔을 "느리게" 만드는 완화 수단이지 완전한 방어책이 아니다. 향후 엄격한 보장이 필요해지면 Upstash Redis 등 외부 저장소 기반 rate limit(예: `@upstash/ratelimit`) 도입을 검토해야 한다.

## 3. 상세 에러 로깅 시스템

- `src/lib/logger.ts` (신규) — `logInfo`/`logWarn`/`logError` 세 함수를 제공하는 구조화 로깅 유틸.
  - 외부 서비스(Sentry 등) 신규 도입 없이, 레벨/메시지/타임스탬프/컨텍스트를 JSON 한 줄로 `console.*`에 출력한다. Vercel 등 서버리스 환경은 stdout/stderr를 자동 수집하므로 이 방식만으로도 배포 환경에서 로그 조회가 가능하다.
  - Node.js 전용 API를 쓰지 않아 클라이언트 컴포넌트(`error.tsx`)에서도 동일하게 재사용 가능하도록 설계했다.
- 적용 지점:
  - `src/lib/notion/quotes.ts` — `fetchQuotesFromNotion`/`fetchQuoteById`/`fetchQuoteItemsByQuoteId`의 catch 경로에서 `logError` 호출 후 rethrow. `fetchQuoteById`에서 `ObjectNotFound`/`ValidationError`(잘못된 링크로 접근)는 에러가 아니라 `logWarn`으로 남긴다 — 무작위 UUID 스캔 시도를 모니터링하는 데 활용할 수 있다.
  - `src/app/invoice/error.tsx`, `src/app/invoice/[id]/error.tsx`, `src/app/q/[shareToken]/error.tsx` — 기존 `console.error(error)`를 `logError(...)`로 교체.
  - `src/app/global-error.tsx`(아래 4번) — 동일하게 `logError` 사용.
  - `src/middleware.ts` — rate limit 초과 시 `logWarn`으로 IP/경로/재시도 대기 시간 기록.

## 4. 404/500 에러 처리 개선

- `src/app/not-found.tsx` (신규) — 없었던 루트 레벨 404 페이지. 기존 `EmptyState` 컴포넌트를 재사용하고, `/invoice`로 돌아가는 버튼을 제공한다(루트 `page.tsx`가 `/invoice`로 리다이렉트하므로 실질적인 홈).
- `src/app/global-error.tsx` (신규) — 없었던 루트 레벨 전역 에러 바운더리. 루트 레이아웃 자체에서 에러가 나면 렌더링을 대체하므로 관례대로 `html`/`body` 태그와 `globals.css`를 직접 포함했고, 기존 `ErrorState` 컴포넌트를 재사용했다.
- 기존에 이미 있던 라우트별 `error.tsx`(3개), `not-found.tsx`(2개, `/invoice/[id]`·`/q/[shareToken]`)는 그대로 유지하고 로거 연동만 추가했다.

## 5. CORS 정책 — **범위 제외** (2026-08-08)

이 프로젝트에는 `src/app/api` 디렉토리 자체가 없다(모든 데이터 페칭은 Server Component에서 직접 수행). CORS는 브라우저가 다른 오리진에서 API를 호출할 때 적용되는 정책인데, 호출 대상이 될 API 라우트가 존재하지 않으므로 적용 대상이 없다. 사용하지도 않을 CORS 설정 코드(예: `next.config.ts`의 `headers()`에 `Access-Control-Allow-Origin` 추가)를 미리 만들어두지 않기로 했다 — 향후 `/api/*` 라우트가 추가되면 그 시점에 실제 요구사항에 맞춰 설정한다.

## 관련 파일

- `src/lib/logger.ts` (신규)
- `src/middleware.ts` (신규)
- `src/app/not-found.tsx` (신규)
- `src/app/global-error.tsx` (신규)
- `src/lib/notion/quotes.ts` (수정) — catch 경로에 로거 연동
- `src/app/invoice/error.tsx`, `src/app/invoice/[id]/error.tsx`, `src/app/q/[shareToken]/error.tsx` (수정) — 로거 연동

## 수락 기준

- [x] 민감 API 키(`NOTION_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)가 서버 전용 모듈에서만 사용되고 클라이언트 컴포넌트에서 직접 참조되지 않음을 grep으로 확인
- [x] `/invoice/*`, `/q/*`에 60초/30회 슬라이딩 윈도우 rate limit이 적용되고, 초과 시 `429` + `Retry-After` 헤더 응답
- [x] `fetchQuoteById`/`fetchQuotesFromNotion`/`fetchQuoteItemsByQuoteId`와 각 라우트 `error.tsx`가 구조화 로거를 사용
- [x] 루트 `not-found.tsx`, `global-error.tsx` 신규 추가(기존 `EmptyState`/`ErrorState` 재사용)
- [x] CORS는 적용 대상이 없음을 확인하고 범위 제외로 문서화(추측성 코드 미작성)
- [x] `npm run check-all`, `npm run build` 통과

## 테스트 체크리스트 (Playwright MCP)

- [x] `npm run dev` 백그라운드 실행 후 `/q/[유효한 shareToken]`에 짧은 시간 내 40회 연속 `fetch` 요청 → 처음 28회는 `200`, 이후 `429`로 전환됨을 확인(`browser_evaluate`로 검증)
- [x] `429` 응답의 `Retry-After` 헤더(초 단위)와 JSON 바디(`{"error":"요청이 너무 많습니다..."}`) 확인
- [x] 존재하지 않는 경로(`/this-page-does-not-exist`) 접속 → 신규 루트 `not-found.tsx`(`EmptyState` UI, "견적서 목록으로" 버튼) 정상 렌더링 및 HTTP 404 상태 확인
- [x] rate limit이 `/invoice`, `/q/*`에만 적용되고 매칭되지 않는 경로(예: 404 경로)는 영향받지 않음을 확인
- [x] 작업 종료 후 `npm run dev` 프로세스 정리(포트 점유 확인 후 종료)

## 후속 작업

- Task 012: 테스트 및 배포
- 트래픽이 실제로 발생하면 rate limit 임계값(현재 분당 30회)을 실측 데이터 기준으로 재조정
- 필요시 Redis 기반 rate limit(Upstash 등)으로 멀티 인스턴스 환경에서도 정확한 카운팅 보장
