'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { Quote, QuoteItem } from '@/lib/types/quote'

interface PdfDownloadButtonProps {
  quote: Quote
  items: QuoteItem[]
  /** 버튼 크기 (기본값: lg — 공개 페이지의 단독 CTA용). 상세 페이지 헤더처럼 다른 버튼과 나란히 둘 때는 'default' 사용. */
  size?: 'default' | 'lg'
}

/**
 * PDF 다운로드 버튼입니다. onClick과 브라우저 API(Blob, URL)가 필요해 Client Component로 분리했습니다.
 * @react-pdf/renderer의 pdf() API로 브라우저에서 직접 PDF를 생성해 다운로드한다(서버 왕복 없음).
 * @react-pdf/renderer는 번들 용량이 커서 초기 페이지 로드에 포함하지 않고,
 * 버튼 클릭 시점에 동적 import로 불러온다.
 * 관리자 상세 페이지(/invoice/[id])와 공개 페이지(/q/[shareToken]) 양쪽에서 공용으로 사용한다.
 */
export function PdfDownloadButton({
  quote,
  items,
  size = 'lg',
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleDownload() {
    setIsGenerating(true)

    try {
      const [{ pdf }, { QuotePdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf/quote-pdf-document'),
      ])

      const blob = await pdf(
        <QuotePdfDocument quote={quote} items={items} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${quote.invoiceNumber}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF 생성에 실패했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button size={size} onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-4" aria-hidden="true" />
      )}
      PDF 다운로드
    </Button>
  )
}
