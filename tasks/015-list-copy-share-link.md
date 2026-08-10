# Task 015: 견적서 목록에서 공유 링크 즉시 복사 기능 구현

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md) · [Task 014](./014-quotes-list-dashboard-layout.md)

## 개요

상세 페이지(`/invoice/[id]`)에만 있던 "공유 링크 복사" 기능을 목록(`/invoice`)의 각 행/카드에서도 바로 사용할 수 있도록 확장한다. 기존 `CopyShareLinkButton`을 공용 위치로 이동하고 아이콘 전용 variant를 추가해 재사용한다.

## 관련 파일

- `src/components/copy-share-link-button.tsx` (이동, 수정) — `src/app/invoice/[id]/copy-share-link-button.tsx`에서 이동. `variant?: 'default' | 'icon'`, `className?: string` prop 추가.
- `src/app/invoice/[id]/page.tsx` (수정) — import 경로만 갱신.
- `src/app/invoice/page.tsx` (수정) — 데스크톱 테이블에 "공유" 컬럼 추가, 모바일 카드에 아이콘 버튼 배치(Link와 형제 구조로 재구성).

## 구현 단계

1. `copy-share-link-button.tsx`를 `src/components/`로 이동하고 `src/app/invoice/[id]/page.tsx`의 import 경로 수정.
2. `variant` prop 추가: `default`(기존 UI 그대로) / `icon`(`variant="outline" size="icon"`, `aria-label="공유 링크 복사"`, 텍스트 없이 `Copy` 아이콘만).
3. 데스크톱 테이블(`src/app/invoice/page.tsx`)에 "공유" 컬럼 헤더 추가, 각 행에 `CopyShareLinkButton variant="icon"` 배치. 기존 `TableRow`에는 클릭 핸들러가 없어(`invoiceNumber` 셀의 `Link`만 상세 이동) 이벤트 충돌 없음.
4. 모바일 카드를 감싸던 `<Link>`를 카드 전체가 아닌 `Link`+버튼 형제 구조로 재구성:
   ```tsx
   <div key={quote.id} className="relative">
     <Link href={`/invoice/${quote.id}`} className="block">
       <Card>...</Card>
     </Link>
     <CopyShareLinkButton
       quoteId={quote.id}
       variant="icon"
       className="absolute top-4 right-4"
     />
   </div>
   ```
   버튼을 `<a>` 안에 중첩시키지 않아 유효하지 않은 마크업과 클릭 버블링 문제를 원천적으로 피한다. 카드 상단 상태 `Badge`와 겹치지 않도록 `CardContent` 우측 여백 조정.
5. Playwright MCP로 데스크톱/모바일 각각에서 복사 버튼 동작 검증(클립보드 API는 `browser_evaluate`로 모킹).

## 테스트 체크리스트

- [x] 데스크톱 목록에서 각 행의 복사 버튼 클릭 시 상세 페이지로 이동하지 않고 토스트("공유 링크를 복사했습니다")가 노출되는지 확인
- [x] 모바일 카드에서 복사 버튼 클릭 시 상세 페이지로 이동하지 않고 토스트가 노출되는지 확인
- [x] 모바일에서 카드의 다른 영역(복사 버튼 제외) 클릭 시 정상적으로 상세 페이지로 이동하는지 확인(회귀 없음)
- [x] `navigator.clipboard.writeText`를 모킹해 복사된 URL이 `/q/{quoteId}` 형식인지 검증
- [x] 상세 페이지의 기존 "공유 링크 복사" 버튼(`default` variant)이 기존과 동일하게 동작하는지 확인(회귀 없음)

### 실행 결과 (2026-08-10, `npm run dev` → `localhost:3001`, Playwright MCP)

1. 데스크톱(1280px) `/invoice` 접속 → 테이블에 "공유" 컬럼 추가 확인, 각 행 아이콘 버튼 클릭 시 URL 이동 없이 토스트("공유 링크를 복사했습니다") 노출.
2. `navigator.clipboard.writeText`를 `browser_evaluate`로 모킹해 캡처한 값이 `http://localhost:3001/q/{quoteId}` 형식으로 정확함을 두 건(INV-2026-0001, INV-2026-0002) 모두 확인.
3. 상세 페이지(`/invoice/[id]`)의 기존 "공유 링크 복사"(`default` variant) 버튼도 동일하게 정상 동작(회귀 없음).
4. 모바일(390px) `/invoice` 접속 → 카드 우측 상단에 아이콘 버튼이 상태 Badge와 겹치지 않고 배치됨(`CardContent`에 `pr-12` 적용).
5. 모바일 카드의 복사 버튼 클릭 → 상세 이동 없이 클립보드 URL만 캡처됨(접근성 스냅샷으로 버튼이 `<Link>`의 자식이 아닌 형제 요소임을 확인).
6. 모바일 카드의 본문(복사 버튼 제외 영역) 클릭 → `/invoice/[id]` 상세로 정상 이동(회귀 없음).
7. 콘솔 경고/에러 0건.

## 수락 기준

- [x] `CopyShareLinkButton`이 `src/components/`로 이동, `variant` prop으로 목록/상세 양쪽에서 재사용됨
- [x] 데스크톱 테이블 각 행 / 모바일 각 카드에 복사 버튼 배치, 상세 이동과 이벤트 충돌 없음
- [x] 클립보드 복사 URL이 `/q/{quoteId}` 형식으로 정확함
- [x] Playwright MCP로 데스크톱/모바일 동작 검증
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 통과

## 후속 작업

- Task 016: 다크모드 테마 토글 UI 노출
