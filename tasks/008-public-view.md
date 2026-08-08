# Task 008: 견적서 공개 열람 및 열람 여부 기록 (F004, F011)

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 007](./007-quote-detail-share-link.md)

## 개요

`/q/[shareToken]` 공개 페이지가 shareToken(= 견적서 ID)으로 실제 견적서·품목 데이터를 비로그인 상태로 조회해 표시한다.

## 범위 결정 (2026-08-08)

- **열람 여부(viewedAt) 기록은 이번 라운드에서 제외**한다. 노션 DB에 열람 시각을 저장할 속성이 없고, Supabase도 제외 상태라 영구 저장소가 없다. F011(열람 여부 확인)은 공개 페이지 표시 기능만 우선 구현하고, 실제 기록/목록 반영은 후속 작업으로 이관한다.
- shareToken은 Task 007 결정대로 노션 페이지 ID를 그대로 사용하므로, 공개 페이지 조회 로직은 상세 페이지(Task 007)의 `fetchQuoteById`/`fetchQuoteItemsByQuoteId`를 그대로 재사용한다(중복 구현 없음).

## 관련 파일

- `src/app/q/[shareToken]/page.tsx` (수정) — 더미 데이터 제거, `fetchQuoteById`/`fetchQuoteItemsByQuoteId`로 교체, `force-dynamic` 적용, 없는/잘못된 토큰은 `notFound()`
- `src/app/q/[shareToken]/not-found.tsx`, `error.tsx` (신규) — 잘못된 공유 링크, 노션 API 실패 UI

## 수락 기준

- [x] `/q/{quoteId}` 접속 시 실제 노션 견적서·품목 데이터가 비로그인으로 표시된다
- [x] 존재하지 않거나 잘못된 형식의 토큰으로 접근하면 not-found UI가 표시된다
- [ ] (제외) 최초 열람 시 `viewedAt` 기록 — 저장소 부재로 후속 작업
- [ ] (제외) 견적서 목록 페이지에 열람 여부 표시 반영 — 위 항목에 종속, 후속 작업
- [x] `npm run check-all`, `npm run build` 통과

## 테스트 체크리스트 (Playwright MCP)

- [x] `/q/3b5c7c2a-060a-80fa-80c0-f2fa2348f74f`(실제 워크스페이스 데이터) 접속 → 견적 정보·품목·합계 정상 표시 확인
- [x] `/q/invalid-share-token` 접속 → "견적서를 찾을 수 없습니다" not-found UI 확인

## 후속 작업 (열람 기록, F011 완성)

열람 기록을 영구 저장하려면 다음 중 하나가 필요하다 — 결정 시 아래 정보 참고:

- **옵션 A**: 노션 DB에 "열람일시" 속성을 새로 추가하고, 공개 페이지 최초 접속 시 Notion API(`pages.update`)로 기록. 실제 워크스페이스 스키마를 변경하는 작업이라 사용자 승인 필요.
- **옵션 B**: Supabase를 열람 기록 전용으로 재도입(quotes 테이블 없이 `quote_views(quote_id, viewed_at)` 같은 최소 테이블만). Task 006에서 보류한 Supabase 캐싱과는 별개로 검토 가능.

## 후속 작업 (다음 Task)

- Task 008-1: 목록 → 상세 → 공유 → 공개 페이지 전체 플로우 통합 테스트, 에러 케이스 테스트
- Task 009: PDF 다운로드 구현
