'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyShareLinkButtonProps {
  /** 공유 링크에 사용할 견적서 ID(shareToken으로 그대로 사용) */
  quoteId: string
  /** 버튼 모양 (기본값: default — 텍스트 포함 전체 버튼, icon — 목록 행/카드용 아이콘 전용 버튼) */
  variant?: 'default' | 'icon'
  className?: string
}

/**
 * 공유 링크 복사 버튼입니다. onClick이 필요해 Client Component로 분리했습니다.
 * 별도 저장소 없이 노션 페이지 ID를 shareToken으로 사용하므로,
 * 클릭 시점에 현재 origin과 quoteId로 링크를 조합해 클립보드에 복사한다.
 * 상세 페이지(default)와 목록 행/카드(icon) 양쪽에서 공용으로 사용한다.
 */
export function CopyShareLinkButton({
  quoteId,
  variant = 'default',
  className,
}: CopyShareLinkButtonProps) {
  async function handleCopy() {
    const shareUrl = `${window.location.origin}/q/${quoteId}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('공유 링크를 복사했습니다')
    } catch {
      toast.error('공유 링크 복사에 실패했습니다')
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        aria-label="공유 링크 복사"
        className={cn(className)}
      >
        <Copy className="size-4" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <Button onClick={handleCopy} className={cn(className)}>
      <Copy className="size-4" aria-hidden="true" />
      공유 링크 복사
    </Button>
  )
}
