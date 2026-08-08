import { EmptyState } from '@/components/empty-state'

/** 존재하지 않거나 잘못된 공유 링크로 접근했을 때 표시되는 페이지입니다. */
export default function PublicQuoteNotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <EmptyState
          title="견적서를 찾을 수 없습니다"
          description="공유 링크가 만료되었거나 잘못되었습니다. 링크를 다시 확인해주세요"
        />
      </div>
    </div>
  )
}
