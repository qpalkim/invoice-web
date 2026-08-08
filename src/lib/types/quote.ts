/**
 * 견적서 상태 (노션 '상태' select 속성 값)
 * 실제 옵션 목록은 Task 006(노션 동기화 구현)에서 확정한다.
 */
export type QuoteStatus = string

/** 견적서 (노션 데이터 캐시) */
export interface Quote {
  id: string
  notionPageId: string
  invoiceNumber: string
  clientName: string
  issueDate: string // ISO 8601 date
  expiryDate: string // ISO 8601 date
  status: QuoteStatus
  totalAmount: number
  shareToken: string | null
  viewedAt: string | null // ISO 8601 datetime, null = 미열람
}

/** 견적서 품목 */
export interface QuoteItem {
  id: string
  notionPageId: string
  quoteId: string
  itemName: string
  quantity: number
  unitPrice: number
}
