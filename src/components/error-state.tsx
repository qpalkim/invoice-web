import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  /** 에러 제목 (기본값: "문제가 발생했습니다") */
  title?: string
  /** 에러 상세 설명 */
  description?: string
  /** 재시도 버튼 표시 여부 (기본값: true) */
  showRetry?: boolean
  className?: string
}

/** 데이터 조회 실패 등 에러 상황에서 사용하는 재사용 안내 컴포넌트입니다. */
export function ErrorState({
  title = '문제가 발생했습니다',
  description,
  showRetry = true,
  className,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description && <p>{description}</p>}
        {showRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {}}
          >
            {/* TODO: 재조회/재시도 로직 구현 필요 */}
            다시 시도
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
