'use client'

import { Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * 공유 링크 복사 버튼입니다. onClick이 필요해 Client Component로 분리했습니다.
 * TODO: shareToken 생성 및 클립보드 복사 로직 구현 (Task 007)
 */
export function CopyShareLinkButton() {
  return (
    <Button onClick={() => {}}>
      <Copy className="size-4" aria-hidden="true" />
      공유 링크 복사
    </Button>
  )
}
