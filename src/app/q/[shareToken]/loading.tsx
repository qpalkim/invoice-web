import { Skeleton } from '@/components/ui/skeleton'

/**
 * 견적서 공개 열람 페이지의 로딩 UI입니다.
 */
export default function PublicQuoteLoading() {
  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
