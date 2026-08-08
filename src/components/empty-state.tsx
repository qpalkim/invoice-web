import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** 상태를 나타내는 아이콘 (기본값: Inbox) */
  icon?: ReactNode
  /** 주요 안내 문구 */
  title: string
  /** 보조 설명 문구 */
  description?: string
  /** 안내 하단에 배치할 액션 버튼 등 (선택) */
  action?: ReactNode
  className?: string
}

/** 목록/데이터가 비어있을 때 사용하는 재사용 안내 컴포넌트입니다. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'border-border flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center',
        className
      )}
    >
      <div className="text-muted-foreground">
        {icon ?? <Inbox className="size-10" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
