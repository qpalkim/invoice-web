# 배포 가이드

이 문서는 견적서 웹 확인 서비스를 Vercel에 배포하기 위한 체크리스트를 제공합니다. 실제 Vercel 계정 연동은 다루지 않으며, 배포 전 준비해야 할 코드베이스/설정 기준만 정리합니다.

## ✅ 배포 전 체크리스트

1. `npm run check-all` (typecheck/lint/format), `npm run build`가 모두 통과하는지 확인
2. 아래 "환경 변수" 표의 모든 값이 Vercel 프로젝트 설정(Environment Variables)에 등록되어 있는지 확인
3. Notion 통합(Integration)이 견적서/품목 데이터베이스에 실제로 연결(Share)되어 있는지 확인
4. Supabase는 아직 도입 전이므로 `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`는 값이 없어도 빌드/배포에는 지장이 없음(`src/lib/env.ts`에서 모두 `.optional()`)

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

## 🚧 아직 다루지 않는 항목

- 실제 Vercel 프로젝트 생성/도메인 연결/환경 변수 등록(계정 접근 권한이 필요해 이 문서 작성 시점 기준 범위 밖)
- Rate limiting, 상세 에러 로깅 등 보안 강화 (Task 011)
- 자동화 테스트, CI 파이프라인 (Task 012)
