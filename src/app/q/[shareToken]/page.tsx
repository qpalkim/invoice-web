import { Metadata } from 'next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Quote, QuoteItem } from '@/lib/types/quote'

import { PdfDownloadButton } from './pdf-download-button'

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

/**
 * 더미 견적서 공개 조회 데이터입니다.
 * TODO: Task 006/008에서 shareToken 기반 실제 견적서 조회 로직으로 교체합니다.
 */
const dummyQuote: Quote = {
  id: '1',
  notionPageId: 'notion-1',
  invoiceNumber: 'QT-2026-001',
  clientName: '㈜테크노바',
  issueDate: '2026-08-01',
  expiryDate: '2026-08-31',
  status: '발송됨',
  totalAmount: 4800000,
  shareToken: 'share-token-1',
  viewedAt: null,
}

const dummyQuoteItems: QuoteItem[] = [
  {
    id: 'item-1',
    notionPageId: 'notion-item-1',
    quoteId: '1',
    itemName: '웹사이트 기획 및 설계',
    quantity: 1,
    unitPrice: 1500000,
  },
  {
    id: 'item-2',
    notionPageId: 'notion-item-2',
    quoteId: '1',
    itemName: '프론트엔드 개발',
    quantity: 1,
    unitPrice: 2500000,
  },
  {
    id: 'item-3',
    notionPageId: 'notion-item-3',
    quoteId: '1',
    itemName: '유지보수 (1개월)',
    quantity: 1,
    unitPrice: 800000,
  },
]

/** 금액을 "1,200,000원" 형식으로 표시합니다. */
function formatAmount(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 견적서 공개 열람 페이지 (/q/[shareToken])
 * 로그인 없이 공유 링크(shareToken)만으로 접근 가능한 공개 라우트입니다.
 * TODO: Task 006/008에서 shareToken 기반 견적서 조회 및 열람 여부 기록 로직을 연결합니다.
 */
export default async function PublicQuotePage({
  params,
}: PublicQuotePageProps) {
  const { shareToken } = await params

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold">견적서 확인</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {dummyQuote.invoiceNumber}
          </p>
          {/* TODO: shareToken으로 실제 견적서를 조회해 표시 (Task 008). 조회 키 확인용으로만 노출합니다. */}
          <span className="sr-only">공유 토큰: {shareToken}</span>
        </div>

        {/* 견적서 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">견적 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">클라이언트</p>
              <p className="font-medium">{dummyQuote.clientName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">발행일 / 유효기간</p>
              <p className="font-medium">
                {dummyQuote.issueDate} ~ {dummyQuote.expiryDate}
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
                {dummyQuoteItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="py-4 pl-6">{item.itemName}</TableCell>
                    <TableCell className="px-2 py-4">{item.quantity}</TableCell>
                    <TableCell className="px-2 py-4">
                      {formatAmount(item.unitPrice)}
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      {formatAmount(item.quantity * item.unitPrice)}
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
                {formatAmount(dummyQuote.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PDF 다운로드 액션 */}
        <div className="flex justify-end">
          <PdfDownloadButton />
        </div>
      </div>
    </div>
  )
}
