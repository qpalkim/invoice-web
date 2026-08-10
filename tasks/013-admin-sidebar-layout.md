# Task 013: 관리자 사이드바/대시보드 레이아웃 구조 구축

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 012](./012-testing-deployment.md)

## 개요

현재 `src/app/invoice/layout.tsx`가 감싸는 관리자 영역(`/invoice`, `/invoice/[id]`)은 로고 + 메뉴 링크 1개짜리 단순 헤더(`AdminHeader`)만 갖고 있다. 이 Task는 이를 사이드바형 관리자 레이아웃(`AdminSidebar`)으로 대체해, 데스크톱에서는 고정 사이드바, 모바일에서는 `Sheet` 기반 드로어로 접었다 펼 수 있는 반응형 구조를 만든다. PRD 기준 관리자 메뉴는 "견적서 목록" 단일 항목이며 인증 기능은 없다(1인 관리자 서비스).

상단 바에는 서비스 타이틀/로고와 함께 Task 016(다크모드 테마 토글)에서 연동할 자리를 확보만 해 둔다 — 이 Task에서는 `ThemeToggle`을 실제로 연결하지 않는다.

## 관련 파일

- `src/components/layout/admin-sidebar.tsx` (신규) — 데스크톱 고정 사이드바 + 모바일 `Sheet` 드로어 + 상단바를 포함하는 관리자 레이아웃 셸. Client component (`usePathname`으로 활성 라우트 판단).
- `src/app/invoice/layout.tsx` (수정) — `AdminHeader` → `AdminSidebar`로 교체.
- `src/components/layout/admin-header.tsx` (삭제) — `AdminSidebar`로 완전히 대체, 다른 참조처 없음.

## 구현 단계

1. `NAV_ITEMS` 정의(`[{ href: '/invoice', label: '견적서 목록', icon: FileText }]`) 및 활성 라우트 판단 로직(`pathname === href || pathname.startsWith(href + '/')`) 작성.
2. 데스크톱용 고정 사이드바(`md:` 이상에서 노출, `w-60`, `border-r`) — 상단 로고/서비스명("견적서 확인") + 내비게이션.
3. 모바일용 상단바(햄버거 트리거) + `Sheet`(`side="left"`) 드로어 — 사이드바와 동일한 내비게이션 콘텐츠. `open`/`onOpenChange`로 controlled 처리해 메뉴 클릭 시 드로어 자동 닫힘 구현 (레이아웃이 라우트 전환 간 언마운트되지 않으므로 uncontrolled Sheet는 자동으로 닫히지 않음에 주의).
4. 상단바 우측에 테마 토글 자리 확보용 빈 요소 배치(`ThemeToggle` import 없이 자리만, `TODO(Task 016)` 주석).
5. 콘텐츠 래퍼(`md:pl-60`)로 데스크톱 사이드바와 메인 콘텐츠 겹침 방지.
6. `layout.tsx`에서 `AdminHeader` → `AdminSidebar` 교체, `admin-header.tsx` 삭제.
7. `/invoice`, `/invoice/[id]` 양쪽에서 정상 렌더링 확인.

## 테스트 체크리스트

- [x] 데스크톱(1280px)에서 좌측 고정 사이드바 렌더링, "견적서 목록" 메뉴 노출 확인
- [x] 모바일(390px)에서 사이드바가 숨겨지고 햄버거 트리거로 드로어가 열리는지 확인
- [x] 모바일 드로어에서 "견적서 목록" 클릭 → `/invoice`로 이동하며 드로어가 자동으로 닫히는지 확인
- [x] `/invoice/[id]` 상세 페이지 접속 시에도 "견적서 목록" 메뉴가 활성 스타일로 표시되는지 확인
- [x] 데스크톱/모바일 각 뷰포트에서 레이아웃 깨짐 없이 기존 페이지 콘텐츠(목록/상세)가 정상 표시되는지 확인

### 실행 결과 (2026-08-10, `npm run dev` → `localhost:3001`, Playwright MCP)

1. 데스크톱(1280px) `/invoice` 접속 → 좌측 고정 사이드바("견적서 확인" 로고 + "견적서 목록" 메뉴, 활성 배경 스타일) 정상 렌더링, 우측 목록 테이블 정상 표시.
2. `INV-2026-0001` 클릭 → `/invoice/[id]` 상세 페이지 이동, 사이드바의 "견적서 목록" 메뉴가 계속 활성 스타일 유지되는 것 확인.
3. 모바일(390px) `/invoice` 접속 → 데스크톱 사이드바는 숨겨지고 상단바(햄버거 버튼 + "견적서 확인" 로고)만 노출, 목록은 카드 뷰로 정상 표시.
4. 햄버거 버튼 클릭 → 좌측에서 `Sheet` 드로어가 열리며 "견적서 확인" 타이틀 + "견적서 목록" 메뉴 노출.
5. 드로어 내 "견적서 목록" 클릭 → `/invoice`로 이동(정상)하며 드로어가 자동으로 닫힘(controlled `open` state로 구현한 대로 동작) 확인.
6. 최초 구현 시 브라우저 콘솔에 `Missing Description or aria-describedby for {DialogContent}` 경고 발견 → `SheetContent`에 `SheetDescription`(`sr-only`) 추가로 해결, 재검증 시 경고 0건 확인.

## 수락 기준

- [x] `AdminSidebar` 신규 작성, `AdminHeader` 대체 및 삭제
- [x] 데스크톱 고정 사이드바 / 모바일 `Sheet` 드로어 반응형 구조 구현
- [x] `usePathname` 기반 활성 라우트 스타일 적용
- [x] 테마 토글 자리 확보(연동은 Task 016에서 진행)
- [x] Playwright MCP로 데스크톱/모바일 렌더링 및 드로어 동작 검증
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 통과 (`npm run check-all`의 `format:check` 단계는 이번 변경과 무관한 기존 파일들의 사전 존재 포맷 이슈로 실패 — 변경 파일 자체는 `prettier --check` 개별 통과 확인)

## 후속 작업

- Task 014: 목록 페이지를 신규 레이아웃에 맞게 대시보드 UI로 고도화
- Task 016: 상단바에 확보한 자리에 `ThemeToggle` 실제 연동
