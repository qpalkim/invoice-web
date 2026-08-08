# Task 006: 노션 견적서 동기화 구현 (F001)

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md)

## 개요

`/invoice` 견적서 목록 페이지가 하드코딩된 더미 데이터 대신 실제 노션 견적서 데이터베이스 데이터를 표시하도록 연동한다.

## 범위 결정 (2026-08-08)

- 이번 작업은 **Supabase 캐싱을 제외**한다. `/invoice`는 페이지 로드마다 노션 API를 서버에서 직접 조회해 렌더링한다(`shrimp-rules.md`의 "Notion 원본 직접 fetch 금지, Supabase 경유" 규칙에 대한 이번 작업 한정 예외).
- 품목(QuoteItem) 조회/연동은 이번 범위에 포함하지 않는다. 목록 페이지는 `Quote` 필드만 필요하므로 상세 페이지 연동인 **Task 007**에서 품목 데이터를 다룬다.
- Supabase upsert/서비스 롤 클라이언트 도입은 별도 후속 작업에서 진행한다.

## 노션 데이터베이스 실제 스키마 (확인 완료)

견적서 DB(`NOTION_DATABASE_ID`)는 데이터 소스 방식(2025-09 노션 API)이며 속성은 다음과 같다:

| 노션 속성명  | 타입                                                                | 매핑 필드 (`Quote`) |
| ------------ | ------------------------------------------------------------------- | ------------------- |
| 견적서 번호  | title                                                               | `invoiceNumber`     |
| 클라이언트명 | rich_text                                                           | `clientName`        |
| 발행일       | date                                                                | `issueDate`         |
| 유효기간     | date                                                                | `expiryDate`        |
| 상태         | status (옵션: 대기/거절/승인)                                       | `status`            |
| 총 금액      | number                                                              | `totalAmount`       |
| 항목         | relation → 품목 데이터 소스(`3b5c7c2a-060a-8080-973b-000b3b914715`) | (Task 007에서 사용) |

`shareToken`, `viewedAt`은 노션에 없는 필드라 매퍼에서 `null`로 채운다(Task 007/008에서 실제 로직 연동).

## 관련 파일

- `src/lib/notion/mappers.ts` (신규) — `mapPageToQuote()`
- `src/lib/notion/quotes.ts` (신규) — `fetchQuotesFromNotion()`
- `src/app/invoice/page.tsx` (수정) — 더미 데이터 제거, 노션 조회로 교체, `force-dynamic` 적용, 빈 목록 시 `EmptyState` 처리
- `src/app/invoice/error.tsx` (신규) — 노션 API 실패 시 라우트 에러 바운더리(`ErrorState` 재사용)
- `src/lib/utils.ts` (수정) — `formatCurrency()` 추가(3개 페이지에 중복되어 있던 금액 포맷 함수를 목록 페이지 작업 중 공용으로 추출)

## 수락 기준

- [x] `/invoice` 접속 시 더미 데이터가 아닌 실제 노션 워크스페이스 데이터가 표시된다
- [x] 노션 API 조회 실패 시 페이지가 크래시하지 않고 에러 안내 UI가 표시된다(라우트 에러 바운더리)
- [x] 견적서가 0건일 때 빈 상태 UI가 표시된다(코드 리뷰로 확인, 실제 워크스페이스는 데이터가 있어 Playwright로는 미검증)
- [x] `npm run check-all`, `npm run build` 통과
- [x] `/invoice` 라우트가 정적 프리렌더링되지 않고 매 요청마다 동적으로 렌더링된다(`force-dynamic`)

## 테스트 체크리스트 (Playwright MCP)

- [x] `http://localhost:3000/invoice` 접속 → 페이지 타이틀 "견적서 목록" 확인
- [x] 테이블에 실제 노션 데이터(`INV-2026-0001`, `ABC 회사`, `대기`, `5,000,000원`, `미열람`) 표시 확인 — 더미 데이터(`QT-2026-001`, `㈜테크노바` 등)가 아님을 확인
- [x] `npm run build` 결과 `/invoice`가 `ƒ (Dynamic)`으로 표시됨을 확인(정적 프리렌더링 방지)
- [ ] (후속) 노션 API 키 오류 등 실패 케이스에서 에러 바운더리 UI 확인 — 실제 자격증명 오류 재현이 필요해 이번 세션에서는 코드 리뷰로만 검증

## 후속 작업

- Task 007: 견적서 상세 확인 및 공유 링크 생성 — 품목(QuoteItem) 조회, `shareToken` 발급 로직 포함
- Supabase 캐싱 도입: `quotes`/`quote_items` upsert, 서비스 롤 클라이언트, 재검증 주기 설정(Task 010과 함께 검토)
