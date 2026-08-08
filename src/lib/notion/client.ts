import { Client } from '@notionhq/client'

import { env } from '@/lib/env'

/** 노션 API 클라이언트 (실제 조회 로직은 Task 006에서 구현) */
export const notion = new Client({
  auth: env.NOTION_API_KEY,
})
