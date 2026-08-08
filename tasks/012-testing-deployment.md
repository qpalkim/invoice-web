# Task 012: 테스트 및 배포

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 011](./011-security-error-handling.md)

## 개요

지금까지 Task 007~010은 전부 Playwright **MCP**로 수동 검증해왔고 자동화 테스트 프레임워크가 전무했다(vitest/jest/`@playwright/test` 모두 미설치). 이 Task는 (1) `vitest`를 신규 도입해 순수 로직(유틸/노션 매퍼/노션 조회/rate limit)에 대한 단위·통합 테스트를 자동화하고, (2) 기존 관행대로 Playwright MCP 기반 E2E 시나리오를 문서화·실행하며, (3) 배포 문서를 Task 011에서 추가된 내용으로 보강한다.

## 1. 단위/통합 테스트 (vitest)

### 도입 결정

- `vitest`만 신규 설치. `@testing-library/react`, `jsdom`은 **설치하지 않음** — 테스트 대상(아래 표)이 전부 React 렌더링이 필요 없는 순수 TypeScript 로직(유틸 함수, 노션 응답 매핑, 노션 API 클라이언트를 mock한 조회 함수, rate limit 계산)이라 DOM 환경이 필요 없다. 추측성으로 미리 설치해두지 않고, 실제로 컴포넌트 렌더링 테스트가 필요해지는 시점에 추가하기로 했다.
- `vitest.config.mts` (신규, `.mts` 확장자 — vitest의 native config loader가 CJS로 로드되는 `.ts`에서 ESM 문법 경고를 냈다) — `@/*` → `src/*` 경로 별칭을 tsconfig와 동일하게 설정, `environment: 'node'`.
- `package.json`에 `"test": "vitest run"`(단발 실행), `"test:watch": "vitest"`(로컬 개발용) 스크립트 추가.

### 테스트 파일

| 파일                             | 대상                                                                  | 종류                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils.test.ts`          | `formatCurrency`                                                      | 단위 테스트                                                                                                                                                                                           |
| `src/lib/notion/mappers.test.ts` | `mapPageToQuote`, `mapPageToQuoteItem`                                | 단위 테스트 (노션 페이지 응답 mock 객체 사용)                                                                                                                                                         |
| `src/lib/notion/quotes.test.ts`  | `fetchQuotesFromNotion`, `fetchQuoteById`, `fetchQuoteItemsByQuoteId` | 통합 테스트 (`@/lib/notion/client`의 `notion` 인스턴스를 `vi.mock`으로 대체. `@notionhq/client`의 `isFullPage`/`collectPaginatedAPI`/`APIResponseError` 등은 실제 구현을 그대로 사용해 신뢰도를 높임) |
| `src/middleware.test.ts`         | `checkRateLimit`(Task 011에서 추가한 rate limit 로직)                 | 단위 테스트                                                                                                                                                                                           |

`fetchQuoteById`는 요구사항대로 `ObjectNotFound`/`ValidationError` 각각에서 `null`을 반환하는 분기, 그 외 에러는 그대로 rethrow하며 로깅되는 분기를 모두 검증한다.

### 결과

```
npm run test
✓ src/lib/utils.test.ts (4)
✓ src/lib/notion/mappers.test.ts (4)
✓ src/lib/notion/quotes.test.ts (7)
✓ src/middleware.test.ts (4)

Test Files  4 passed (4)
     Tests  19 passed (19)
```

## 2. 통합 테스트 — Rate Limit 로직

`src/middleware.test.ts`에서 `checkRateLimit`을 직접 단위 테스트했다(가상 시간(`now` 인자)을 주입해 실제 대기 없이 윈도우 만료를 검증). `middleware()` 함수 자체(HTTP 요청/응답 객체를 다루는 부분)는 vitest로 단위 테스트하지 않고, 아래 3번 Playwright MCP 섹션에서 실제 dev 서버에 대해 종단 간(end-to-end)으로 검증했다 — `NextRequest`/`NextResponse`를 신뢰할 수 있게 흉내 내는 것보다 실제 HTTP 응답(상태 코드, `Retry-After` 헤더)을 검증하는 편이 더 정확하다고 판단했다.

## 3. E2E 테스트 시나리오 (Playwright MCP)

이 프로젝트의 기존 관행(자동화 CI 스위트가 아닌 Playwright MCP 수동 검증)을 그대로 따른다. 아래는 전체 플로우와 에러 케이스 시나리오이며, Rate limiting 등 Task 011에서 신규 추가된 기능은 실제로 실행해 검증했다(하단 "실행 결과" 참고).

### 테스트 체크리스트

**핵심 플로우 (목록 → 상세 → 공유 링크 → 공개 페이지 → PDF)**

- [ ] `/invoice` 접속 → 견적서 목록(클라이언트명·금액·상태) 정상 표시
- [ ] 목록에서 견적서 클릭 → `/invoice/[id]` 상세 페이지로 이동, 품목별 내역·합계 확인
- [ ] "공유 링크 복사" 클릭 → 클립보드 복사 토스트 확인
- [ ] 복사된 링크(`/q/[shareToken]`)로 새 탭 접속 → 로그인 없이 견적 정보 정상 표시
- [ ] "PDF 다운로드" 클릭 → PDF 파일 다운로드, 파일명/내용 확인

  (위 플로우는 Task 007~009에서 이미 개별 검증 완료된 항목이라 이번 Task에서 재검증하지 않고, 아래 "신규/변경 기능" 위주로 실제 실행했다.)

**에러 케이스**

- [x] 잘못된/존재하지 않는 공유 토큰(`/q/00000000-0000-0000-0000-000000000000`)으로 접근 → `not-found.tsx` 렌더링(EmptyState, "공유 링크가 만료되었거나 잘못되었습니다") 확인
- [x] 정의되지 않은 임의 경로(`/this-page-does-not-exist`) 접근 → 신규 루트 `not-found.tsx` 렌더링, HTTP 404 상태 확인
- [x] **Rate limit 초과** — `/q/[shareToken]`에 짧은 시간 내 40회 연속 요청 → 앞쪽 요청은 `200`, 이후 `429`로 전환되는지 확인

### 실행 결과 (2026-08-08, `npm run dev` → `localhost:3001`, Playwright MCP)

1. `/invoice` 접속 → 실제 노션 데이터(`INV-2026-0001`, ABC 회사, 5,000,000원, 미열람) 정상 표시.
2. `/q/3b5c7c2a-060a-80fa-80c0-f2fa2348f74f` 접속 → 정상 렌더링(기존 Task 008 검증 항목 재확인).
3. 브라우저 콘솔에서 동일 경로에 `fetch`를 40회 연속 호출 → **28회 `200`, 이후 12회 `429`**로 전환(직전 페이지 로드에서 이미 소모된 요청 수를 감안하면 "60초당 30회" 설정값과 일치).
4. 마지막 `429` 응답 상세: `Retry-After: "21"`, `Content-Type: application/json`, 바디 `{"error":"요청이 너무 많습니다. 잠시 후 다시 시도해주세요."}`.
5. 서버 로그에 구조화된 `logWarn` 출력 확인: `{"level":"warn","message":"Rate limit 초과","context":{"ip":"::1","path":"/q/...","retryAfterSeconds":34}}`.
6. `/this-page-does-not-exist` 접속(rate limit 미적용 경로) → 신규 `not-found.tsx` 정상 렌더링, HTTP 404. matcher에 포함되지 않은 경로는 rate limit 대상 IP라도 즉시 통과함을 확인.
7. Rate limit 윈도우(60초) 경과 후 `/q/00000000-0000-0000-0000-000000000000`(잘못된 UUID) 재접속 → `200`(페이지 자체는 정상 응답하고 내부적으로 not-found 렌더링)과 함께 서버 로그에 `{"level":"warn","message":"존재하지 않거나 유효하지 않은 견적서 ID로 접근","context":{"quoteId":"00000000-...","code":"object_not_found"}}` 기록 확인 — Task 011의 로거 연동이 실제로 동작함을 확인.
8. 검증 종료 후 `netstat -ano`로 포트 3001 점유 PID 확인 → `taskkill //F //T //PID <pid>`로 dev 서버 프로세스 종료, 포트 재확인으로 정리 완료 검증.

## 4. Vercel 배포 설정

실제 Vercel 계정 연동은 Task 010과 동일하게 범위 밖으로 유지한다. `docs/guides/deployment.md`에 아래 내용을 보강했다.

- Rate limiting의 서버리스/멀티 인스턴스 한계(인스턴스별로 카운터가 분리되어 완벽한 보장이 아님) 명시
- 테스트 실행 방법(`npm run test`) 및 배포 전 체크리스트에 추가
- `package.json`에 `engines.node: ">=20.0.0"` 추가 — 기존에 `engines` 필드가 없었고, `@types/node`가 `^20`을 타깃하고 있어 로컬/배포 환경의 Node 버전 기준을 명시적으로 고정

## 관련 파일

- `vitest.config.mts` (신규)
- `src/lib/utils.test.ts`, `src/lib/notion/mappers.test.ts`, `src/lib/notion/quotes.test.ts`, `src/middleware.test.ts` (신규)
- `package.json` (수정) — `test`/`test:watch` 스크립트, `vitest` devDependency, `engines.node` 추가
- `tsconfig.json` (수정) — `include`에 `**/*.mts` 추가(vitest 설정 파일 타입체크 대상 포함)
- `docs/guides/deployment.md` (수정) — 테스트 실행 방법, rate limiting 한계 보강

## 수락 기준

- [x] `vitest` 신규 설치, `npm run test`로 전체 스위트 실행 가능
- [x] `formatCurrency`, `mapPageToQuote`, `mapPageToQuoteItem` 단위 테스트 작성 및 통과
- [x] `fetchQuoteById`(ObjectNotFound/ValidationError 분기 포함)/`fetchQuotesFromNotion`/`fetchQuoteItemsByQuoteId` 통합 테스트 작성 및 통과(`@notionhq/client` mock)
- [x] Task 011의 rate limit 로직(`checkRateLimit`) 단위 테스트 작성 및 통과
- [x] `tasks/012-testing-deployment.md`에 Playwright MCP 테스트 체크리스트 문서화, 신규 기능(rate limit, 404 페이지)은 실제로 실행해 검증
- [x] `docs/guides/deployment.md` 보강, `package.json`에 `engines.node` 추가
- [x] `npm run check-all`, `npm run build`, `npm run test` 모두 통과
- [x] 검증에 사용한 dev 서버 프로세스 정리 확인

## 후속 작업

- 실제 CI(GitHub Actions 등) 파이프라인에 `npm run check-all`/`npm run test`/`npm run build`를 연결하는 것은 이번 범위 밖(로컬/Playwright MCP 수동 검증 관행 유지 결정에 따름) — 필요해지면 별도 Task로 진행
- 컴포넌트 렌더링 테스트가 필요해지면 그 시점에 `@testing-library/react` + `jsdom` 도입 검토
- Task 008 후속(열람 여부 기록)이 구현되면 관련 로직에 대한 테스트도 추가
