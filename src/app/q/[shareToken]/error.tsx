'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/error-state'
import { logError } from '@/lib/logger'

/**
 * 견적서 공개 페이지(/q/[shareToken]) 에러 바운더리.
 * 노션 API 조회 실패 등 실제 I/O 실패를 사용자에게 안내한다.
 */
export default function PublicQuoteError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError('견적서 공개 페이지 렌더링 실패', error, { digest: error.digest })
  }, [error])

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <ErrorState
          title="견적서를 불러오지 못했습니다"
          description="잠시 후 다시 시도해주세요."
        />
      </div>
    </div>
  )
}
