import Link from 'next/link'

/**
 * 관리자 영역(/quotes, /quotes/[id]) 상단 공통 헤더입니다.
 * PRD 메뉴 구조 기준 "견적서 목록" 단일 메뉴만 제공하며, 인증 기능이 없어
 * 로그인/프로필 등의 UI는 포함하지 않습니다.
 */
export function AdminHeader() {
  return (
    <header className="border-border bg-background sticky top-0 z-10 border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/quotes" className="font-semibold tracking-tight">
          견적서 확인
        </Link>

        <nav aria-label="관리자 메뉴">
          <Link
            href="/quotes"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {/* TODO: usePathname 등으로 현재 라우트 활성 스타일 적용 (기능 구현 범위 아님) */}
            견적서 목록
          </Link>
        </nav>
      </div>
    </header>
  )
}
