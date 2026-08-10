# Task 016: 다크모드 테마 토글 UI 노출 (관리자/공개 페이지)

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 013](./013-admin-sidebar-layout.md)

## 개요

이미 구현된 `ThemeToggle`(`src/components/theme-toggle.tsx`)을 관리자 레이아웃 상단 바(Task 013에서 자리만 확보해 둔 위치)와 공개 페이지(`/q/[shareToken]`)에 실제로 연결한다. `ThemeProvider`(`src/components/providers/theme-provider.tsx`)와 루트 레이아웃(`src/app/layout.tsx`)은 이미 `attribute="class"`/`defaultTheme="system"`/`enableSystem`/`disableTransitionOnChange`/`suppressHydrationWarning`이 올바르게 설정돼 있어 별도 설정 변경은 필요 없다.

## 관련 파일

- `src/components/layout/admin-sidebar.tsx` (수정) — 상단바의 자리 확보용 빈 `<div>`를 `<ThemeToggle />`로 교체.
- `src/app/q/[shareToken]/page.tsx` (수정) — 기존 상단 안내 영역을 `flex items-center justify-between`으로 감싸 우측에 `<ThemeToggle />` 배치.

## 구현 단계

1. `admin-sidebar.tsx`에서 `{/* TODO(Task 016): ThemeToggle 연동 */}` 주석과 빈 `<div className="ml-auto size-9" />`를 `ThemeToggle` import + `<ThemeToggle />`로 교체.
2. `q/[shareToken]/page.tsx`의 `<h1>견적서 확인</h1>` + 안내문 블록을 `flex items-center justify-between` 컨테이너로 감싸고 우측에 `<ThemeToggle />` 배치(별도 헤더 컴포넌트 신설 없이 최소 UI로 추가).
3. Playwright MCP로 관리자 레이아웃(데스크톱/모바일)과 공개 페이지에서 테마 토글이 정상 노출·동작하는지 확인.

## 테스트 체크리스트

- [x] 관리자 레이아웃(`/invoice`) 상단바에서 라이트/다크/시스템 옵션 클릭 시 `html` 요소의 `class`(`dark`) 변경 확인
- [x] 공개 페이지(`/q/[shareToken]`)에서도 동일하게 테마 전환 동작 확인
- [x] 새로고침 후 선택한 테마가 유지되는지 확인(로컬스토리지 기반 persist)
- [x] 모바일(390px) 뷰포트에서도 테마 토글 버튼이 정상 노출·클릭되는지 확인
- [x] 다크모드 전환 시 페이지 전환 애니메이션 없이 즉시 적용되는지 확인(`disableTransitionOnChange` 정상 동작)

### 실행 결과 (2026-08-10, `npm run dev` → `localhost:3001`, Playwright MCP)

1. 데스크톱(1280px) `/invoice` 상단바에서 테마 토글 클릭 → "다크" 선택 시 `document.documentElement.className`이 `dark`로 변경, `localStorage.theme`도 `dark`로 저장됨을 `browser_evaluate`로 확인.
2. `/invoice`를 재방문(새로고침 성격의 `goto`)해도 `dark` 클래스가 그대로 유지됨을 확인(persist 정상).
3. 공개 페이지(`/q/[shareToken]`)에서도 이미 저장된 다크 테마가 그대로 반영되고, 토글로 "라이트" 전환 시 `document.documentElement.className`이 `light`로 즉시 바뀜을 확인(공개 페이지 자체 토글 동작 검증).
4. 모바일(390px) `/invoice`에서 햄버거 버튼 옆에 테마 토글 아이콘이 겹침 없이 정상 노출, 다크모드 스크린샷으로 레이아웃 확인.
5. 전환 시 별도 트랜지션 애니메이션 없이 즉시 적용됨(`disableTransitionOnChange` 정상 동작), 각 페이지 콘솔 경고/에러 0건.

## 수락 기준

- [x] 관리자 레이아웃 상단바에 `ThemeToggle` 연동 완료
- [x] 공개 페이지 상단에 `ThemeToggle` 연동 완료
- [x] 라이트/다크/시스템 전환 및 새로고침 후 유지 확인
- [x] Playwright MCP로 데스크톱/모바일 동작 검증
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 통과

## 후속 작업

- Task 017: 전체 페이지 다크모드 스타일 점검 및 보정
