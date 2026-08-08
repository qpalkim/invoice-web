import path from 'node:path'

import { defineConfig } from 'vitest/config'

// 테스트 대상(유틸/노션 매퍼·조회 로직/미들웨어)이 전부 순수 TypeScript 모듈이라
// DOM 렌더링이 필요 없어 environment는 'node'로 충분하다(jsdom 미도입).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
