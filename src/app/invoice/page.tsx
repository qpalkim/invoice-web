import { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/empty-state'
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
import { formatCurrency } from '@/lib/utils'
import { fetchQuotesFromNotion } from '@/lib/notion/quotes'

export const metadata: Metadata = {
  title: '견적서 목록',
  description: '노션에 등록된 견적서 목록을 확인하고 관리합니다',
}

// 60초 주기로 노션 데이터를 백그라운드 재검증한다(ISR). 실시간성이 중요하지 않은 서비스 특성상 충분한 주기.
export const revalidate = 60

/**
 * 견적서 목록 페이지 (/invoice)
 * 페이지 로드마다 노션 견적서 데이터베이스를 직접 조회해 표시한다.
 * TODO: Task 007/008에서 shareToken 발급, 열람 여부 기록 로직을 연결합니다.
 */
export default async function QuotesPage() {
  const quotes = await fetchQuotesFromNotion()
  const totalCount = quotes.length
  const unviewedCount = quotes.filter(quote => !quote.viewedAt).length

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">견적서 목록</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          노션에 등록된 견적서를 확인하고 상세 내용을 검토하세요
        </p>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          title="등록된 견적서가 없습니다"
          description="노션 견적서 데이터베이스에 새 견적서를 추가하면 이 목록에 표시됩니다"
        />
      ) : (
        <>
          {/* 요약 카드: 전체 견적서 수 / 미열람 건수 */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-sm">
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">전체 견적서</p>
                <p className="text-2xl font-bold">{totalCount}건</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm">미열람</p>
                <p className="text-2xl font-bold">{unviewedCount}건</p>
              </CardContent>
            </Card>
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
                  {quotes.map(quote => (
                    <TableRow key={quote.id}>
                      <TableCell className="pl-6">
                        <Link
                          href={`/invoice/${quote.id}`}
                          className="font-medium hover:underline"
                        >
                          {quote.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quote.status}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
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
            {quotes.map(quote => (
              <Link key={quote.id} href={`/invoice/${quote.id}`}>
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
                        {formatCurrency(quote.totalAmount)}
                      </span>
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
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
