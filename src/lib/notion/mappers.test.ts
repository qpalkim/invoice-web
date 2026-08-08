import type { PageObjectResponse } from '@notionhq/client'
import { describe, expect, it } from 'vitest'

import { mapPageToQuote, mapPageToQuoteItem } from '@/lib/notion/mappers'

/** 노션 title/rich_text 속성에 들어가는 최소 텍스트 객체를 생성합니다. */
function createRichText(plainText: string) {
  return { plain_text: plainText }
}

/**
 * 테스트용 노션 페이지 응답 객체를 생성합니다.
 * 실제 응답의 전체 필드를 다 채우지 않고, mappers.ts가 실제로 읽는 필드만 채운 뒤
 * PageObjectResponse로 캐스팅합니다(테스트 목적의 최소 mock).
 */
function createMockPage(
  properties: Record<string, unknown>,
  id = 'page-id-123'
): PageObjectResponse {
  return {
    object: 'page',
    id,
    url: `https://notion.so/${id}`,
    properties,
  } as unknown as PageObjectResponse
}

describe('mapPageToQuote', () => {
  it('노션 페이지 속성을 Quote 필드로 정확히 매핑한다', () => {
    const page = createMockPage({
      '견적서 번호': {
        type: 'title',
        title: [createRichText('INV-2026-0001')],
      },
      클라이언트명: {
        type: 'rich_text',
        rich_text: [createRichText('홍길동')],
      },
      발행일: { type: 'date', date: { start: '2026-01-01' } },
      유효기간: { type: 'date', date: { start: '2026-02-01' } },
      상태: { type: 'status', status: { name: '발송완료' } },
      '총 금액': { type: 'number', number: 1200000 },
    })

    expect(mapPageToQuote(page)).toEqual({
      id: 'page-id-123',
      notionPageId: 'page-id-123',
      invoiceNumber: 'INV-2026-0001',
      clientName: '홍길동',
      issueDate: '2026-01-01',
      expiryDate: '2026-02-01',
      status: '발송완료',
      totalAmount: 1200000,
      shareToken: 'page-id-123',
      viewedAt: null,
    })
  })

  it('속성이 비어있으면 문자열은 빈 값, 숫자는 0으로 매핑한다', () => {
    const page = createMockPage({})
    const quote = mapPageToQuote(page)

    expect(quote.invoiceNumber).toBe('')
    expect(quote.clientName).toBe('')
    expect(quote.issueDate).toBe('')
    expect(quote.status).toBe('')
    expect(quote.totalAmount).toBe(0)
    expect(quote.viewedAt).toBeNull()
  })

  it('타입이 일치하지 않는 속성(예: title에 rich_text 값)은 무시하고 기본값을 반환한다', () => {
    const page = createMockPage({
      '견적서 번호': {
        type: 'rich_text',
        rich_text: [createRichText('잘못된 타입')],
      },
    })

    expect(mapPageToQuote(page).invoiceNumber).toBe('')
  })
})

describe('mapPageToQuoteItem', () => {
  it('노션 품목 페이지 속성을 QuoteItem 필드로 매핑한다', () => {
    const page = createMockPage(
      {
        항목명: { type: 'title', title: [createRichText('디자인 시안 제작')] },
        수량: { type: 'number', number: 2 },
        단가: { type: 'number', number: 500000 },
      },
      'item-id-1'
    )

    expect(mapPageToQuoteItem(page, 'quote-id-1')).toEqual({
      id: 'item-id-1',
      notionPageId: 'item-id-1',
      quoteId: 'quote-id-1',
      itemName: '디자인 시안 제작',
      quantity: 2,
      unitPrice: 500000,
    })
  })
})
