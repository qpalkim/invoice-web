import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

/** 정의되지 않은 경로로 접근했을 때 표시되는 전역 404 페이지입니다. */
export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <EmptyState
          title="페이지를 찾을 수 없습니다"
          description="요청하신 페이지가 존재하지 않거나 삭제되었습니다"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/invoice">견적서 목록으로</Link>
            </Button>
          }
        />
      </div>
    </div>
  )
}
