'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Menu } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// PRD 메뉴 구조 기준 현재는 "견적서 목록" 단일 항목이지만, 추후 메뉴 추가를 고려해 배열로 유지한다.
const NAV_ITEMS: NavItem[] = [
  { href: '/invoice', label: '견적서 목록', icon: FileText },
]

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="관리자 메뉴" className="flex flex-col gap-1 p-4">
      {NAV_ITEMS.map(item => {
        const isActive = isNavItemActive(pathname, item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * 관리자 영역(/invoice, /invoice/[id])을 감싸는 사이드바형 레이아웃입니다.
 * 데스크톱은 좌측 고정 사이드바, 모바일은 Sheet 드로어로 동작합니다.
 * 인증 기능은 없어 로그인/프로필 등의 UI는 포함하지 않습니다.
 */
export function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // 레이아웃이 라우트 전환 간 언마운트되지 않아 Sheet를 controlled로 열어야 메뉴 클릭 시 드로어가 자동으로 닫힌다.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="bg-background min-h-screen">
      {/* 데스크톱 고정 사이드바 */}
      <aside className="border-border bg-background fixed inset-y-0 hidden w-60 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/invoice" className="font-semibold tracking-tight">
            견적서 확인
          </Link>
        </div>
        <NavList pathname={pathname} />
      </aside>

      <div className="flex min-h-screen flex-col md:pl-60">
        {/* 상단바 */}
        <header className="border-border bg-background sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4">
          {/* 모바일 드로어 트리거 (데스크톱은 좌측 고정 사이드바로 대체) */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="메뉴 열기"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b">
                <SheetTitle>견적서 확인</SheetTitle>
                <SheetDescription className="sr-only">
                  관리자 메뉴를 선택하세요
                </SheetDescription>
              </SheetHeader>
              <NavList
                pathname={pathname}
                onNavigate={() => setIsDrawerOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link
            href="/invoice"
            className="font-semibold tracking-tight md:hidden"
          >
            견적서 확인
          </Link>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
