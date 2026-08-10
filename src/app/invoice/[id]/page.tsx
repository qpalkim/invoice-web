import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { fetchQuoteById, fetchQuoteItemsByQuoteId } from '@/lib/notion/quotes'
import { PdfDownloadButton } from '@/components/pdf-download-button'
import { CopyShareLinkButton } from '@/components/copy-share-link-button'

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: QuoteDetailPageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: `견적서 상세 - ${id}`,
    description: '견적서 품목과 금액을 확인하고 공유 링크를 생성합니다',
  }
}

// 60초 주기로 노션 데이터를 백그라운드 재검증한다(ISR). 실시간성이 중요하지 않은 서비스 특성상 충분한 주기.
export const revalidate = 60

/**
 * 견적서 상세 페이지 (/invoice/[id])
 * shareToken은 별도 저장소 없이 견적서 ID를 그대로 사용한다(2026-08-08 결정).
 */
export default async function QuoteDetailPage({
  params,
}: QuoteDetailPageProps) {
  const { id } = await params
  const quote = await fetchQuoteById(id)

  if (!quote) {
    notFound()
  }

  const quoteItems = await fetchQuoteItemsByQuoteId(id)

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/invoice"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        목록으로
      </Link>

      {/* 견적서 기본 정보 */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{quote.invoiceNumber}</CardTitle>
              <Badge variant="secondary">{quote.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <CopyShareLinkButton quoteId={quote.id} />
            <PdfDownloadButton
              quote={quote}
              items={quoteItems}
              size="default"
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">클라이언트</p>
            <p className="font-medium">{quote.clientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">발행일 / 유효기간</p>
            <p className="font-medium">
              {quote.issueDate} ~ {quote.expiryDate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 품목별 상세 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">품목별 상세 내역</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12 py-3 pl-6">품목명</TableHead>
                <TableHead className="h-12 py-3">수량</TableHead>
                <TableHead className="h-12 py-3">단가</TableHead>
                <TableHead className="h-12 py-3 pr-6 text-right">
                  소계
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="py-4 pl-6">{item.itemName}</TableCell>
                  <TableCell className="px-2 py-4">{item.quantity}</TableCell>
                  <TableCell className="px-2 py-4">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="py-4 pr-6 text-right">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardContent className="flex justify-end border-t pt-4">
          <div className="text-right">
            <p className="text-muted-foreground text-sm">총 견적 금액</p>
            <p className="text-xl font-bold">
              {formatCurrency(quote.totalAmount)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
