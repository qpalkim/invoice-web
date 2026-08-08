import type { PageObjectResponse } from '@notionhq/client'

import type { Quote, QuoteItem } from '@/lib/types/quote'

/**
 * 노션 견적서 데이터베이스의 실제 속성명(한글)과 Quote 필드를 매핑합니다.
 * 노션 워크스페이스에서 속성명이 바뀌면 이 상수만 수정하면 됩니다.
 */
const QUOTE_PROPERTY_NAMES = {
  invoiceNumber: '견적서 번호',
  clientName: '클라이언트명',
  issueDate: '발행일',
  expiryDate: '유효기간',
  status: '상태',
  totalAmount: '총 금액',
} as const

/** 노션 품목 데이터 소스의 실제 속성명(한글)과 QuoteItem 필드를 매핑합니다. */
const QUOTE_ITEM_PROPERTY_NAMES = {
  itemName: '항목명',
  quantity: '수량',
  unitPrice: '단가',
} as const

function getTitleText(page: PageObjectResponse, propertyName: string): string {
  const property = page.properties[propertyName]
  if (property?.type !== 'title') return ''
  return property.title.map(text => text.plain_text).join('')
}

function getRichText(page: PageObjectResponse, propertyName: string): string {
  const property = page.properties[propertyName]
  if (property?.type !== 'rich_text') return ''
  return property.rich_text.map(text => text.plain_text).join('')
}

function getDate(page: PageObjectResponse, propertyName: string): string {
  const property = page.properties[propertyName]
  if (property?.type !== 'date') return ''
  return property.date?.start ?? ''
}

function getStatus(page: PageObjectResponse, propertyName: string): string {
  const property = page.properties[propertyName]
  if (property?.type !== 'status') return ''
  return property.status?.name ?? ''
}

function getNumber(page: PageObjectResponse, propertyName: string): number {
  const property = page.properties[propertyName]
  if (property?.type !== 'number') return 0
  return property.number ?? 0
}

/**
 * 노션 견적서 페이지를 Quote 타입으로 변환합니다.
 * shareToken은 별도 저장소 없이 노션 페이지 ID를 그대로 사용한다(2026-08-08 결정).
 * viewedAt은 열람 기록을 저장할 곳이 없어 이번 범위에서는 항상 null이다(Task 008 후속 작업).
 */
export function mapPageToQuote(page: PageObjectResponse): Quote {
  return {
    id: page.id,
    notionPageId: page.id,
    invoiceNumber: getTitleText(page, QUOTE_PROPERTY_NAMES.invoiceNumber),
    clientName: getRichText(page, QUOTE_PROPERTY_NAMES.clientName),
    issueDate: getDate(page, QUOTE_PROPERTY_NAMES.issueDate),
    expiryDate: getDate(page, QUOTE_PROPERTY_NAMES.expiryDate),
    status: getStatus(page, QUOTE_PROPERTY_NAMES.status),
    totalAmount: getNumber(page, QUOTE_PROPERTY_NAMES.totalAmount),
    shareToken: page.id,
    viewedAt: null,
  }
}

/** 노션 품목 페이지를 QuoteItem 타입으로 변환합니다. */
export function mapPageToQuoteItem(
  page: PageObjectResponse,
  quoteId: string
): QuoteItem {
  return {
    id: page.id,
    notionPageId: page.id,
    quoteId,
    itemName: getTitleText(page, QUOTE_ITEM_PROPERTY_NAMES.itemName),
    quantity: getNumber(page, QUOTE_ITEM_PROPERTY_NAMES.quantity),
    unitPrice: getNumber(page, QUOTE_ITEM_PROPERTY_NAMES.unitPrice),
  }
}
