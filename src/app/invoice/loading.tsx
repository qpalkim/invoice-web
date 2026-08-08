import { Skeleton } from '@/components/ui/skeleton'

/**
 * 견적서 목록 페이지의 로딩 UI입니다.
 * Suspense 기반 스트리밍 중 표시되는 스켈레톤 화면입니다.
 */
export default function QuotesLoading() {
  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
