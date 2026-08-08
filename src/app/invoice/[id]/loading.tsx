import { Skeleton } from '@/components/ui/skeleton'

/**
 * 견적서 상세 페이지의 로딩 UI입니다.
 */
export default function QuoteDetailLoading() {
  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
