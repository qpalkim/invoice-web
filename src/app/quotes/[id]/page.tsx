import { Metadata } from 'next'
import Link from 'next/link'
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
import type { Quote, QuoteItem } from '@/lib/types/quote'

import { CopyShareLinkButton } from './copy-share-link-button'

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

/**
 * 더미 견적서 상세 데이터입니다.
 * TODO: Task 006/007에서 id 기반 실제 노션 동기화 데이터로 교체합니다.
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
  viewedAt: '2026-08-03T10:12:00+09:00',
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
 * 견적서 상세 페이지 (/quotes/[id])
 * TODO: Task 006/007/008에서 견적서 상세 데이터 페칭 및 공유 링크 생성 로직을 연결합니다.
 */
export default async function QuoteDetailPage({
  params,
}: QuoteDetailPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/quotes"
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
              <CardTitle className="text-xl">
                {dummyQuote.invoiceNumber}
              </CardTitle>
              <Badge variant="secondary">{dummyQuote.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {/* TODO: id({id})로 실제 견적서를 조회해 표시 (Task 006) */}
              견적서 ID: {id}
            </p>
          </div>
          <CopyShareLinkButton />
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
                <TableHead className="pl-6">품목명</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>단가</TableHead>
                <TableHead className="pr-6 text-right">소계</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyQuoteItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6">{item.itemName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatAmount(item.unitPrice)}</TableCell>
                  <TableCell className="pr-6 text-right">
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
    </div>
  )
}
