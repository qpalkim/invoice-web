import { Metadata } from 'next'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Quote } from '@/lib/types/quote'

export const metadata: Metadata = {
  title: '견적서 목록',
  description: '노션에 등록된 견적서 목록을 확인하고 관리합니다',
}

/**
 * 더미 견적서 목록입니다.
 * TODO: Task 006에서 fetchPages() 기반 노션 동기화 데이터로 교체합니다.
 */
const dummyQuotes: Quote[] = [
  {
    id: '1',
    notionPageId: 'notion-1',
    invoiceNumber: 'QT-2026-001',
    clientName: '㈜테크노바',
    issueDate: '2026-08-01',
    expiryDate: '2026-08-31',
    status: '발송됨',
    totalAmount: 4800000,
    shareToken: 'share-token-1',
    viewedAt: '2026-08-03T10:12:00+09:00',
  },
  {
    id: '2',
    notionPageId: 'notion-2',
    invoiceNumber: 'QT-2026-002',
    clientName: '김민수 프리랜서',
    issueDate: '2026-08-04',
    expiryDate: '2026-09-03',
    status: '검토중',
    totalAmount: 1200000,
    shareToken: null,
    viewedAt: null,
  },
  {
    id: '3',
    notionPageId: 'notion-3',
    invoiceNumber: 'QT-2026-003',
    clientName: '㈜브라이트스튜디오',
    issueDate: '2026-07-20',
    expiryDate: '2026-08-19',
    status: '승인됨',
    totalAmount: 9500000,
    shareToken: 'share-token-3',
    viewedAt: '2026-07-25T14:40:00+09:00',
  },
]

/** 금액을 "1,200,000원" 형식으로 표시합니다. */
function formatAmount(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

/**
 * 견적서 목록 페이지 (/quotes)
 * TODO: Task 006/007에서 노션 API 연동 및 데이터 페칭 로직을 연결합니다.
 */
export default function QuotesPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">견적서 목록</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          노션에 등록된 견적서를 확인하고 상세 내용을 검토하세요
        </p>
      </div>

      {/* 데스크톱/태블릿: 테이블 뷰 */}
      <Card className="hidden md:block">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">견적서 번호</TableHead>
                <TableHead>클라이언트</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>금액</TableHead>
                <TableHead className="pr-6">열람 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyQuotes.map(quote => (
                <TableRow key={quote.id}>
                  <TableCell className="pl-6">
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="font-medium hover:underline"
                    >
                      {quote.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{quote.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{quote.status}</Badge>
                  </TableCell>
                  <TableCell>{formatAmount(quote.totalAmount)}</TableCell>
                  <TableCell className="pr-6">
                    {quote.viewedAt ? (
                      <Badge variant="outline">열람함</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        미열람
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 모바일: 카드 뷰 */}
      <div className="grid gap-3 md:hidden">
        {dummyQuotes.map(quote => (
          <Link key={quote.id} href={`/quotes/${quote.id}`}>
            <Card>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{quote.invoiceNumber}</span>
                  <Badge variant="secondary">{quote.status}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {quote.clientName}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {formatAmount(quote.totalAmount)}
                  </span>
                  {quote.viewedAt ? (
                    <Badge variant="outline">열람함</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      미열람
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
