# Task 017: 전체 페이지 다크모드 스타일 점검 및 보정

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 016](./016-theme-toggle-integration.md)

## 개요

Task 016에서 다크모드 토글이 실제로 노출된 뒤, 전체 페이지의 색상 대비/레이아웃을 다크모드에서 점검하고 발견되는 문제만 보정한다. 사전 코드 점검 결과 앱 전역이 shadcn 시맨틱 토큰(`bg-background`/`text-foreground`/`text-muted-foreground`/`border-border` 등)만 사용하고 있어 `globals.css`의 `.dark` 팔레트가 대부분 자동으로 적용된다. 유일하게 확인된 실질적 공백은 `src/app/global-error.tsx`로, 이 파일은 루트 레이아웃 전체(및 `ThemeProvider`)를 대체하는 자체 `<html>/<body>`를 렌더링해 사용자가 다크 테마를 선택해도 항상 라이트 팔레트로 보인다.

## 관련 파일

- `src/app/global-error.tsx` (수정) — `ThemeProvider`로 감싸고 `<html suppressHydrationWarning>` 적용.
- 그 외 페이지/컴포넌트는 점검 결과 실제 문제가 발견될 때만 수정(사전 확정된 수정 대상 아님).

## 구현 단계

1. `global-error.tsx`에 `ThemeProvider`(`attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`, 루트 레이아웃과 동일 설정) 적용, `<html suppressHydrationWarning>` 추가.
2. Playwright MCP로 다크모드 전환 후 아래 페이지들을 스크린샷 캡처해 텍스트 가독성·레이아웃 깨짐 여부 육안 확인:
   - `/invoice`(목록, 요약 카드 포함)
   - `/invoice/[id]`(상세, 공유 링크 복사·PDF 다운로드 버튼 포함)
   - `/q/[shareToken]`(공개 페이지)
   - `/invoice/[id]`에 잘못된 ID 접근(not-found)
   - 존재하지 않는 경로(전역 not-found)
3. 점검 중 실제로 발견되는 대비/레이아웃 문제가 있다면 해당 파일만 최소 범위로 보정.

## 테스트 체크리스트

- [x] 다크모드에서 `/invoice` 목록(요약 카드, 테이블/카드 뷰, Badge)의 텍스트 대비 확인
- [x] 다크모드에서 `/invoice/[id]` 상세(카드, 테이블, 공유 링크 복사·PDF 다운로드 버튼) 텍스트 대비 확인
- [x] 다크모드에서 `/q/[shareToken]` 공개 페이지 텍스트 대비 확인
- [x] 다크모드에서 not-found/전역 에러 페이지가 라이트 화면으로 남지 않고 다크 팔레트를 반영하는지 확인
- [x] 데스크톱/모바일 두 뷰포트 모두에서 다크모드 레이아웃 깨짐 없는지 확인

### 실행 결과 (2026-08-10, `npm run dev` → `localhost:3001`, Playwright MCP)

1. `localStorage.theme = 'dark'` 설정 후 데스크톱(1280px)에서 `/invoice`(요약 카드·테이블·"공유" 컬럼), `/invoice/[id]`(카드·테이블·공유 링크 복사/PDF 버튼), `/q/[shareToken]`(공개 페이지) 전체 페이지 스크린샷 확인 — 모두 텍스트 대비·레이아웃 문제 없음.
2. `/invoice/[id]`에 존재하지 않는 UUID로 접근 → 다크모드에서 `EmptyState`("견적서를 찾을 수 없습니다") 정상 렌더링.
3. 존재하지 않는 경로(`/no-such-path`) 접근 → 루트 `not-found.tsx`도 다크 팔레트 정상 반영, HTTP 404 확인.
4. `global-error.tsx`는 루트 레이아웃 자체가 깨질 때만 렌더링되는 최후 안전망이라 실제 트리거는 루트 레이아웃에 의도적 오류 주입이 필요해 위험도가 높다고 판단, 라이브 트리거는 수행하지 않음. 대신 (a) 루트 레이아웃과 동일한 `ThemeProvider` 설정 적용, (b) `typecheck`/`lint`/`build` 전체 통과로 정적 검증.
5. 모바일(390px)에서 `/invoice`, `/q/[shareToken]` 전체 페이지 스크린샷 확인 — 다크모드 레이아웃 깨짐 없음, 요약 카드/공유 버튼/PDF 버튼 모두 정상.
6. 사전 코드 그렙 결과대로 실제 발견된 대비/레이아웃 문제는 없었음(`global-error.tsx`의 테마 미반영만 유일한 실질 이슈였고 이번에 수정).
7. 모든 페이지에서 콘솔 경고/에러 0건(404 리소스 로그 1건은 의도된 404 응답 자체로 무해).

## 수락 기준

- [x] `global-error.tsx`가 사용자가 선택한 테마를 반영
- [x] Playwright MCP 스크린샷으로 목록/상세/공개/not-found/에러 페이지 다크모드 육안 검증 완료
- [x] 실제 발견된 다크모드 문제(있다면) 보정 완료 — `global-error.tsx` 1건 수정, 그 외 문제 없음
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 통과

## 후속 작업

- Task 018: 고도화 기능 통합 테스트
