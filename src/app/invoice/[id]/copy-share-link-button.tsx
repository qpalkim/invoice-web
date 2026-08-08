'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface CopyShareLinkButtonProps {
  /** 공유 링크에 사용할 견적서 ID(shareToken으로 그대로 사용) */
  quoteId: string
}

/**
 * 공유 링크 복사 버튼입니다. onClick이 필요해 Client Component로 분리했습니다.
 * 별도 저장소 없이 노션 페이지 ID를 shareToken으로 사용하므로,
 * 클릭 시점에 현재 origin과 quoteId로 링크를 조합해 클립보드에 복사한다.
 */
export function CopyShareLinkButton({ quoteId }: CopyShareLinkButtonProps) {
  async function handleCopy() {
    const shareUrl = `${window.location.origin}/q/${quoteId}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('공유 링크를 복사했습니다')
    } catch {
      toast.error('공유 링크 복사에 실패했습니다')
    }
  }

  return (
    <Button onClick={handleCopy}>
      <Copy className="size-4" aria-hidden="true" />
      공유 링크 복사
    </Button>
  )
}
