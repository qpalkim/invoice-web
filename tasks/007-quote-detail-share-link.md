# Task 007: 견적서 상세 확인 및 공유 링크 생성 (F002, F003)

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 006](./006-notion-quote-sync.md)

## 개요

`/invoice/[id]` 상세 페이지가 실제 노션 데이터(견적서 + 품목)를 표시하고, "공유 링크 복사" 버튼으로 공개 페이지(`/q/[shareToken]`) 링크를 클립보드에 복사한다.

## 범위 결정 (2026-08-08)

- **shareToken = 노션 페이지 ID**: 별도 저장소(Supabase)가 없어 shareToken을 새로 생성·저장하지 않고, 견적서의 노션 페이지 ID를 그대로 공유 토큰으로 사용한다. `/q/{quote.id}`가 곧 공유 링크다. 모든 견적서가 항상 공유 가능 상태이며 별도의 "생성" 단계가 없다.
- 품목(QuoteItem)은 노션의 별도 데이터 소스에 관계형(relation)으로 연결되어 있으며, 품목 데이터 소스의 역방향 관계형 속성명은 `invoices`임을 확인해 필터 쿼리로 조회한다.

## 관련 파일

- `src/lib/notion/mappers.ts` (수정) — `mapPageToQuoteItem()` 추가, `mapPageToQuote()`의 `shareToken`을 `page.id`로 채움
- `src/lib/notion/quotes.ts` (수정) — `fetchQuoteById()`, `fetchQuoteItemsByQuoteId()` 추가
- `src/app/invoice/[id]/page.tsx` (수정) — 더미 데이터 제거, 실제 조회로 교체, `force-dynamic` 적용, 없는 ID는 `notFound()`
- `src/app/invoice/[id]/copy-share-link-button.tsx` (수정) — `quoteId` prop 추가, 클립보드 복사 + `sonner` 토스트 피드백 구현
- `src/app/invoice/[id]/not-found.tsx`, `error.tsx` (신규) — 존재하지 않는 ID, 노션 API 실패 UI

## 수락 기준

- [x] `/invoice/[id]` 접속 시 실제 노션 데이터(견적서 정보 + 품목 목록)가 표시된다
- [x] 존재하지 않거나 형식이 잘못된 ID로 접근하면 not-found UI가 표시된다(정상 오류와 구분)
- [x] "공유 링크 복사" 버튼 클릭 시 `{origin}/q/{quoteId}` 형태의 링크가 클립보드에 복사되고 토스트로 안내된다
- [x] `npm run check-all`, `npm run build` 통과

## 테스트 체크리스트 (Playwright MCP)

- [x] `/invoice/[id]` 접속 → 품목 테이블에 실제 노션 품목 데이터(명함 디자인/로고 제작/웹 사이트 디자인) 및 합계(5,000,000원) 표시 확인
- [x] `/invoice/nonexistent-id-1234` 접속 → "견적서를 찾을 수 없습니다" not-found UI 확인 (노션 API가 UUID 형식 검증 에러를 반환하는 케이스 포함해 처리)
- [x] "공유 링크 복사" 버튼 클릭 동작 확인 — 단, Playwright MCP 헤드리스 환경에서 클립보드 읽기 권한 프롬프트가 자동 처리되지 않아 클립보드 내용 자체의 자동 검증은 생략(코드 리뷰로 `navigator.clipboard.writeText` 호출 경로 확인)

## 후속 작업

- Task 008: 공개 페이지(`/q/[shareToken]`) 실제 데이터 연동
