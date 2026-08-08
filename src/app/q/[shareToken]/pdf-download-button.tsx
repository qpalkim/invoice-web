'use client'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * PDF 다운로드 버튼입니다. onClick이 필요해 Client Component로 분리했습니다.
 * TODO: @react-pdf/renderer 기반 PDF 생성 및 다운로드 로직 구현 (Task 009)
 */
export function PdfDownloadButton() {
  return (
    <Button size="lg" onClick={() => {}}>
      <Download className="size-4" aria-hidden="true" />
      PDF 다운로드
    </Button>
  )
}
