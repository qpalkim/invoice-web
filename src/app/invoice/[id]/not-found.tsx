import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

/** 존재하지 않는 견적서 ID로 접근했을 때 표시되는 페이지입니다. */
export default function QuoteNotFound() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <EmptyState
        title="견적서를 찾을 수 없습니다"
        description="삭제되었거나 존재하지 않는 견적서입니다"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/invoice">목록으로</Link>
          </Button>
        }
      />
    </div>
  )
}
