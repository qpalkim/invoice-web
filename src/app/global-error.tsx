'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { logError } from '@/lib/logger'

import './globals.css'

/**
 * 전역 에러 바운더리.
 * 루트 레이아웃(layout.tsx) 자체에서 발생한 에러까지 처리하는 마지막 안전망이며,
 * 렌더링될 때 루트 레이아웃을 완전히 대체하므로 html/body 태그와 전역 스타일을 직접 포함해야 한다.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError('전역 에러 발생', error, { digest: error.digest })
  }, [error])

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="bg-background flex min-h-screen items-center justify-center">
            <div className="container mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
              <ErrorState
                title="문제가 발생했습니다"
                description="예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
                showRetry={false}
              />
              <Button variant="outline" size="sm" onClick={reset}>
                다시 시도
              </Button>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
