import { APIErrorCode, APIResponseError } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock 팩토리는 파일 최상단으로 호이스팅되므로, 참조하는 mock 함수는 vi.hoisted로 미리 만들어야 한다.
const mocks = vi.hoisted(() => ({
  retrieveDatabase: vi.fn(),
  retrieveDataSource: vi.fn(),
  queryDataSource: vi.fn(),
  retrievePage: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  env: { NOTION_DATABASE_ID: 'db-id-1', NOTION_API_KEY: 'secret-key' },
}))

vi.mock('@/lib/logger', () => ({
  logError: mocks.logError,
  logWarn: mocks.logWarn,
}))

vi.mock('@/lib/notion/client', () => ({
  notion: {
    databases: { retrieve: mocks.retrieveDatabase },
    dataSources: {
      retrieve: mocks.retrieveDataSource,
      query: mocks.queryDataSource,
    },
    pages: { retrieve: mocks.retrievePage },
  },
}))

// 모킹 설정 이후에 테스트 대상을 import 해야 모킹된 의존성이 적용된다.
const { fetchQuoteById, fetchQuoteItemsByQuoteId, fetchQuotesFromNotion } =
  await import('@/lib/notion/quotes')

/** 테스트용 최소 노션 페이지 mock. */
function createMockPage(
  properties: Record<string, unknown>,
  id: string
): PageObjectResponse {
  return {
    object: 'page',
    id,
    url: `https://notion.so/${id}`,
    properties,
  } as unknown as PageObjectResponse
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchQuotesFromNotion', () => {
  it('데이터베이스 → 데이터 소스 → 페이지 목록을 조회해 Quote 배열로 반환한다', async () => {
    mocks.retrieveDatabase.mockResolvedValue({
      object: 'database',
      data_sources: [{ id: 'ds-1' }],
    })
    const page1 = createMockPage(
      { '견적서 번호': { type: 'title', title: [{ plain_text: 'INV-0001' }] } },
      'page-1'
    )
    const page2 = createMockPage(
      { '견적서 번호': { type: 'title', title: [{ plain_text: 'INV-0002' }] } },
      'page-2'
    )
    mocks.queryDataSource.mockResolvedValue({
      results: [page1, page2],
      has_more: false,
      next_cursor: null,
    })

    const quotes = await fetchQuotesFromNotion()

    expect(quotes).toHaveLength(2)
    expect(quotes.map(q => q.invoiceNumber)).toEqual(['INV-0001', 'INV-0002'])
    expect(mocks.retrieveDatabase).toHaveBeenCalledWith({
      database_id: 'db-id-1',
    })
    expect(mocks.queryDataSource).toHaveBeenCalledWith({
      data_source_id: 'ds-1',
    })
  })

  it('조회 중 에러가 발생하면 로깅 후 그대로 다시 던진다', async () => {
    mocks.retrieveDatabase.mockRejectedValue(new Error('network error'))

    await expect(fetchQuotesFromNotion()).rejects.toThrow('network error')
    expect(mocks.logError).toHaveBeenCalledWith(
      '견적서 목록 조회 실패',
      expect.any(Error)
    )
  })
})

describe('fetchQuoteById', () => {
  it('존재하는 페이지는 Quote로 매핑해 반환한다', async () => {
    const page = createMockPage(
      { '견적서 번호': { type: 'title', title: [{ plain_text: 'INV-0001' }] } },
      'page-1'
    )
    mocks.retrievePage.mockResolvedValue(page)

    const quote = await fetchQuoteById('page-1')

    expect(quote?.invoiceNumber).toBe('INV-0001')
    expect(mocks.retrievePage).toHaveBeenCalledWith({ page_id: 'page-1' })
  })

  it('ObjectNotFound 에러가 발생하면 null을 반환한다', async () => {
    mocks.retrievePage.mockRejectedValue(
      new APIResponseError({
        code: APIErrorCode.ObjectNotFound,
        message: '페이지를 찾을 수 없습니다',
        headers: {},
        status: 404,
        rawBodyText: '',
        additional_data: undefined,
        request_id: undefined,
      })
    )

    const quote = await fetchQuoteById('missing-id')

    expect(quote).toBeNull()
    expect(mocks.logWarn).toHaveBeenCalledWith(
      '존재하지 않거나 유효하지 않은 견적서 ID로 접근',
      { quoteId: 'missing-id', code: APIErrorCode.ObjectNotFound }
    )
  })

  it('ValidationError(잘못된 UUID 형식) 에러가 발생하면 null을 반환한다', async () => {
    mocks.retrievePage.mockRejectedValue(
      new APIResponseError({
        code: APIErrorCode.ValidationError,
        message: 'UUID 형식이 아닙니다',
        headers: {},
        status: 400,
        rawBodyText: '',
        additional_data: undefined,
        request_id: undefined,
      })
    )

    const quote = await fetchQuoteById('not-a-uuid')

    expect(quote).toBeNull()
  })

  it('그 외 예상치 못한 에러는 로깅 후 다시 던진다', async () => {
    mocks.retrievePage.mockRejectedValue(new Error('unexpected failure'))

    await expect(fetchQuoteById('page-1')).rejects.toThrow('unexpected failure')
    expect(mocks.logError).toHaveBeenCalledWith(
      '견적서 단건 조회 실패',
      expect.any(Error),
      { quoteId: 'page-1' }
    )
  })
})

describe('fetchQuoteItemsByQuoteId', () => {
  it('견적서에 속한 품목 목록을 조회해 QuoteItem 배열로 반환한다', async () => {
    mocks.retrieveDatabase.mockResolvedValue({
      object: 'database',
      data_sources: [{ id: 'ds-1' }],
    })
    mocks.retrieveDataSource.mockResolvedValue({
      properties: {
        항목: { type: 'relation', relation: { data_source_id: 'items-ds-1' } },
      },
    })
    const itemPage = createMockPage(
      {
        항목명: { type: 'title', title: [{ plain_text: '디자인 시안' }] },
        수량: { type: 'number', number: 2 },
        단가: { type: 'number', number: 500000 },
      },
      'item-1'
    )
    mocks.queryDataSource.mockResolvedValue({
      results: [itemPage],
      has_more: false,
      next_cursor: null,
    })

    const items = await fetchQuoteItemsByQuoteId('quote-1')

    expect(items).toEqual([
      {
        id: 'item-1',
        notionPageId: 'item-1',
        quoteId: 'quote-1',
        itemName: '디자인 시안',
        quantity: 2,
        unitPrice: 500000,
      },
    ])
    expect(mocks.queryDataSource).toHaveBeenCalledWith({
      data_source_id: 'items-ds-1',
      filter: { property: 'invoices', relation: { contains: 'quote-1' } },
    })
  })
})
