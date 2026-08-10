import { Metadata } from 'next'
import { notFound } from 'next/navigation'

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
import { ThemeToggle } from '@/components/theme-toggle'

interface PublicQuotePageProps {
  params: Promise<{ shareToken: string }>
}

export async function generateMetadata({
  params,
}: PublicQuotePageProps): Promise<Metadata> {
  // shareToken은 메타데이터에는 노출하지 않고 데이터 조회 키로만 사용합니다.
  await params

  return {
    title: '견적서 확인',
    description: '공유받은 견적서를 확인하고 PDF로 다운로드하세요',
  }
}

// 60초 주기로 노션 데이터를 백그라운드 재검증한다(ISR). 실시간성이 중요하지 않은 서비스 특성상 충분한 주기.
export const revalidate = 60

/**
 * 견적서 공개 열람 페이지 (/q/[shareToken])
 * 로그인 없이 공유 링크(shareToken)만으로 접근 가능한 공개 라우트입니다.
 * shareToken은 별도 저장소 없이 견적서 ID를 그대로 사용한다(2026-08-08 결정).
 * TODO: 열람 여부(viewedAt) 기록은 저장소가 없어 이번 범위에서 제외됨(Task 008 후속 작업).
 */
export default async function PublicQuotePage({
  params,
}: PublicQuotePageProps) {
  const { shareToken } = await params
  const quote = await fetchQuoteById(shareToken)

  if (!quote) {
    notFound()
  }

  const quoteItems = await fetchQuoteItemsByQuoteId(quote.id)

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">견적서 확인</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {quote.invoiceNumber}
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* 견적서 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">견적 정보</CardTitle>
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

        {/* PDF 다운로드 액션 */}
        <div className="flex justify-end">
          <PdfDownloadButton quote={quote} items={quoteItems} />
        </div>
      </div>
    </div>
  )
}
