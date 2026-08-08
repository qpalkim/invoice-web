# Task 010: 성능 최적화 및 캐싱

관련 문서: [ROADMAP](../docs/ROADMAP.md) · [PRD](../docs/PRD.md)

## 개요

`/invoice`, `/invoice/[id]`, `/q/[shareToken]`가 매 요청마다 노션 API를 직접 호출하던 것(`force-dynamic`)을 Next.js ISR(`revalidate`)로 전환해 노션 API 호출량과 응답 속도를 개선한다. 부수적으로 워크스페이스 루트 경고 제거, 로딩 스켈레톤 폭 정합, 배포 문서화를 함께 진행한다.

## 범위 결정 (2026-08-08)

- **캐싱 전략**: 일정 주기(60초) 자동 재검증(ISR) 선택. 수동 "새로고침" 버튼은 이번 범위에서 제외.
- **이미지 최적화**: 앱에 `next/image`/이미지 사용이 전혀 없어 완전히 제외.
- **Vercel 배포**: 실제 계정 연동 없이 문서화·설정 파일 준비까지만 진행.

## 관련 파일

- `src/app/invoice/page.tsx`, `src/app/invoice/[id]/page.tsx`, `src/app/q/[shareToken]/page.tsx` (수정) — `export const dynamic = 'force-dynamic'` → `export const revalidate = 60`
- `src/app/invoice/loading.tsx`, `src/app/invoice/[id]/loading.tsx`, `src/app/q/[shareToken]/loading.tsx` (수정) — 컨테이너에 `max-w-3xl` 추가해 실제 페이지와 폭 정합
- `next.config.ts` (수정) — `turbopack: { root: __dirname }` 추가
- `.env.example` (신규) — 배포/로컬 개발에 필요한 환경 변수 목록과 설명
- `docs/guides/deployment.md` (신규) — Vercel 배포 체크리스트, 환경 변수 표, ISR 설명
- `CLAUDE.md` (수정) — "📚 개발 가이드" 목록에 배포 가이드 링크 추가

## 수락 기준

- [x] `/invoice`, `/invoice/[id]`, `/q/[shareToken]`가 `force-dynamic` 대신 60초 ISR로 동작한다
- [x] `npm run build` 결과에서 `/invoice`가 정적 프리렌더링 + `Revalidate: 1m`으로 표시된다(`[id]`/`[shareToken]`는 동적 세그먼트라 빌드 시점엔 `ƒ`로 표시되지만 런타임에는 첫 요청 후 동일하게 60초 ISR 적용)
- [x] `dev`/`build` 로그에서 "workspace root 추론" 경고가 사라진다
- [x] 로딩 스켈레톤이 실제 콘텐츠와 동일한 폭(`max-w-3xl`)으로 표시된다
- [x] `.env.example`에 실제 필요한 모든 키가 값 없이 문서화되어 있다
- [x] `npm run check-all`, `npm run build` 통과

## 테스트 체크리스트 (Playwright MCP)

- [x] `npm run build` 로그에서 워크스페이스 루트 경고 부재 및 `/invoice` 라우트의 `Revalidate 1m` 표시 확인
- [x] `/invoice`, `/invoice/[id]`, `/q/[shareToken]` 접속 → ISR 전환 후에도 실제 노션 데이터가 정상 렌더링되는지 확인(캐싱 전환으로 인한 회귀 없음)
- [x] 로딩 스켈레톤과 실제 콘텐츠의 폭이 시각적으로 일치하는지 스크린샷 비교

## 후속 작업

- Task 011: 보안 및 에러 처리 강화
- Task 012: 테스트 및 배포 준비
- 필요시 `revalidatePath` 기반 수동 재검증(관리자 "새로고침" 버튼) 추가 검토
