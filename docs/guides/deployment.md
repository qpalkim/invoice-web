# 배포 가이드

이 문서는 견적서 웹 확인 서비스를 Vercel에 배포하기 위한 체크리스트를 제공합니다. 실제 Vercel 계정 연동은 다루지 않으며, 배포 전 준비해야 할 코드베이스/설정 기준만 정리합니다.

## ✅ 배포 전 체크리스트

1. `npm run check-all` (typecheck/lint/format), `npm run build`, `npm run test`가 모두 통과하는지 확인
2. 아래 "환경 변수" 표의 모든 값이 Vercel 프로젝트 설정(Environment Variables)에 등록되어 있는지 확인
3. Notion 통합(Integration)이 견적서/품목 데이터베이스에 실제로 연결(Share)되어 있는지 확인
4. Supabase는 아직 도입 전이므로 `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`는 값이 없어도 빌드/배포에는 지장이 없음(`src/lib/env.ts`에서 모두 `.optional()`)
5. `package.json`의 `engines.node`(`>=20.0.0`)를 벗어나는 Node 버전으로 배포하지 않는지 확인(Vercel 프로젝트 설정의 Node.js Version)

## 🧪 테스트 실행 (Task 012 추가)

`vitest`로 단위/통합 테스트를 실행할 수 있다(컴포넌트 렌더링 테스트는 없어 `jsdom` 등 브라우저 환경 없이 순수 Node 환경에서 동작).

```bash
npm run test         # 전체 테스트 1회 실행 (CI/배포 전 검증용)
npm run test:watch   # 로컬 개발 중 watch 모드
```

대상: `src/lib/utils.ts`의 `formatCurrency`, `src/lib/notion/mappers.ts`의 매핑 함수, `src/lib/notion/quotes.ts`의 노션 조회 함수(`@notionhq/client` mock), `src/middleware.ts`의 rate limit 로직. E2E 플로우는 기존 관행대로 Playwright MCP로 수동 검증한다(`tasks/012-testing-deployment.md`의 "테스트 체크리스트 (Playwright MCP)" 참고).

## 🔑 환경 변수

전체 목록과 설명은 프로젝트 루트의 `.env.example`을 참고하세요. 값은 `src/lib/env.ts`의 Zod 스키마로 런타임에 검증됩니다.

| 키                              | 필수 여부                    | 비고                                               |
| ------------------------------- | ---------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | 선택                         | 미설정 시 Vercel이 자동 주입하는 `VERCEL_URL` 사용 |
| `NEXT_PUBLIC_SUPABASE_URL`      | 선택 (Supabase 도입 후 필수) | -                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 선택 (Supabase 도입 후 필수) | -                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | 선택 (Supabase 도입 후 필수) | 서버 전용, `NEXT_PUBLIC_` 접두사 금지              |
| `NOTION_API_KEY`                | **필수**                     | 노션 통합 토큰                                     |
| `NOTION_DATABASE_ID`            | **필수**                     | 견적서 데이터베이스 ID                             |

## 🏗️ Vercel 프로젝트 설정

- **Root Directory**: 저장소 루트(`invoice-web`)를 그대로 사용. 로컬 개발 환경에는 상위 폴더(`C:\Users\admin`)에 별도 `package-lock.json`이 있어 Turbopack이 workspace root를 잘못 추론하는 경고가 있었으나, `next.config.ts`의 `turbopack.root` 설정으로 해결했으므로 Vercel 빌드에는 영향 없음
- **Build Command**: `next build --turbopack` (기본값, `package.json`의 `build` 스크립트 그대로 사용)
- **Framework Preset**: Next.js (자동 감지)

## 🔄 데이터 캐싱(ISR)

`/invoice`, `/invoice/[id]`, `/q/[shareToken]` 세 페이지는 `export const revalidate = 60`으로 설정되어 있어, 노션 데이터를 60초 주기로 백그라운드 재검증합니다. 관리자가 노션 데이터를 수정한 뒤 최대 1분 내에 반영됩니다. 더 즉각적인 반영이 필요해지면 재검증 주기를 조정하거나 `revalidatePath`를 이용한 수동 재검증 트리거 도입을 검토하세요(현재는 미구현).

## 🛡️ Rate Limiting (Task 011 추가)

`src/middleware.ts`가 `/invoice/*`, `/q/*` 요청에 IP 기준 슬라이딩 윈도우 rate limit(60초당 30회)을 적용합니다. 초과 시 `429` + `Retry-After` 헤더를 응답합니다.

**⚠️ 서버리스 환경에서의 한계**: 카운터를 저장하는 `Map`은 미들웨어를 실행하는 서버리스 인스턴스의 메모리에만 존재합니다. Vercel처럼 요청마다 다른 인스턴스로 라우팅될 수 있는 환경에서는 인스턴스별로 카운터가 분리되어, 같은 IP라도 실제로는 설정값의 N배(활성 인스턴스 수만큼)까지 통과할 수 있습니다 — 즉 정확한 전역 rate limit을 보장하지 않으며, 무작위 UUID 스캔 같은 남용을 "완화"하는 수단이지 완전한 방어책은 아닙니다. 엄격한 보장이 필요해지면 Upstash Redis 등 외부 저장소 기반 rate limit(`@upstash/ratelimit` 등) 도입을 검토하세요. 자세한 배경은 `tasks/011-security-error-handling.md` 참고.

## 🚧 아직 다루지 않는 항목

- 실제 Vercel 프로젝트 생성/도메인 연결/환경 변수 등록(계정 접근 권한이 필요해 이 문서 작성 시점 기준 범위 밖)
- 멀티 인스턴스 환경에서도 정확히 동작하는 rate limit(Redis 등 외부 저장소 기반) — 현재는 인메모리 완화 수단만 적용(Task 011)
- 자동화 CI 파이프라인(GitHub Actions 등)에 `npm run check-all`/`npm run test`/`npm run build` 연결 — 현재는 로컬 실행 + Playwright MCP 수동 검증 관행 유지(Task 012)
