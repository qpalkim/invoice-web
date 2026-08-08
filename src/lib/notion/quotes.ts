import {
  APIErrorCode,
  collectPaginatedAPI,
  isFullDatabase,
  isFullPage,
  isNotionClientError,
} from '@notionhq/client'

import { env } from '@/lib/env'
import { logError, logWarn } from '@/lib/logger'
import { mapPageToQuote, mapPageToQuoteItem } from '@/lib/notion/mappers'
import { notion } from '@/lib/notion/client'
import type { Quote, QuoteItem } from '@/lib/types/quote'

/** 견적서 데이터베이스에 연결된 데이터 소스 ID를 조회합니다. */
async function getQuotesDataSourceId(): Promise<string> {
  if (!env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID 환경변수가 설정되어 있지 않습니다.')
  }

  const database = await notion.databases.retrieve({
    database_id: env.NOTION_DATABASE_ID,
  })

  if (!isFullDatabase(database)) {
    throw new Error('견적서 데이터베이스 정보를 조회할 권한이 없습니다.')
  }

  const dataSourceId = database.data_sources[0]?.id
  if (!dataSourceId) {
    throw new Error('견적서 데이터베이스에서 데이터 소스를 찾을 수 없습니다.')
  }

  return dataSourceId
}

/** 견적서 데이터베이스의 '항목' 관계형 속성이 가리키는 품목 데이터 소스 ID를 조회합니다. */
async function getQuoteItemsDataSourceId(): Promise<string> {
  const quotesDataSourceId = await getQuotesDataSourceId()
  const quotesDataSource = await notion.dataSources.retrieve({
    data_source_id: quotesDataSourceId,
  })

  const relationProperty = quotesDataSource.properties?.['항목']
  if (relationProperty?.type !== 'relation') {
    throw new Error(
      "견적서 데이터베이스에서 '항목' 관계형 속성을 찾을 수 없습니다."
    )
  }

  return relationProperty.relation.data_source_id
}

/** 노션 견적서 데이터베이스에서 전체 견적서 목록을 조회합니다. */
export async function fetchQuotesFromNotion(): Promise<Quote[]> {
  try {
    const dataSourceId = await getQuotesDataSourceId()

    const pages = await collectPaginatedAPI(notion.dataSources.query, {
      data_source_id: dataSourceId,
    })

    return pages.filter(isFullPage).map(mapPageToQuote)
  } catch (error) {
    logError('견적서 목록 조회 실패', error)
    throw error
  }
}

/** 노션 페이지 ID로 견적서 하나를 조회합니다. 존재하지 않으면 null을 반환합니다. */
export async function fetchQuoteById(id: string): Promise<Quote | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id })
    return isFullPage(page) ? mapPageToQuote(page) : null
  } catch (error) {
    // ObjectNotFound: 존재하지 않는 페이지 ID. ValidationError: UUID 형식이 아닌 잘못된 ID.
    // 사용자 입장에서는 둘 다 "유효하지 않은 링크"이므로 동일하게 not-found로 처리한다.
    if (
      isNotionClientError(error) &&
      (error.code === APIErrorCode.ObjectNotFound ||
        error.code === APIErrorCode.ValidationError)
    ) {
      // 에러는 아니지만, 무작위 UUID로 다른 사람의 견적서를 스캔하려는 시도를 모니터링할 수 있도록 warn으로 남긴다.
      logWarn('존재하지 않거나 유효하지 않은 견적서 ID로 접근', {
        quoteId: id,
        code: error.code,
      })
      return null
    }
    logError('견적서 단건 조회 실패', error, { quoteId: id })
    throw error
  }
}

/** 특정 견적서에 속한 품목 목록을 조회합니다. */
export async function fetchQuoteItemsByQuoteId(
  quoteId: string
): Promise<QuoteItem[]> {
  try {
    const itemsDataSourceId = await getQuoteItemsDataSourceId()

    const pages = await collectPaginatedAPI(notion.dataSources.query, {
      data_source_id: itemsDataSourceId,
      filter: {
        property: 'invoices',
        relation: { contains: quoteId },
      },
    })

    return pages
      .filter(isFullPage)
      .map(page => mapPageToQuoteItem(page, quoteId))
  } catch (error) {
    logError('견적서 품목 조회 실패', error, { quoteId })
    throw error
  }
}
