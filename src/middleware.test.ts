import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  logWarn: vi.fn(),
}))

const { checkRateLimit, resetRateLimitStore } = await import('@/middleware')

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('윈도우 내 허용치(30회) 이하 요청은 제한되지 않는다', () => {
    const now = Date.now()
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit('1.2.3.4', now).isLimited).toBe(false)
    }
  })

  it('윈도우 내 허용치를 초과하면 제한되고 재시도 대기 시간을 반환한다', () => {
    const now = Date.now()
    for (let i = 0; i < 30; i++) {
      checkRateLimit('1.2.3.4', now)
    }

    const result = checkRateLimit('1.2.3.4', now)

    expect(result.isLimited).toBe(true)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('IP가 다르면 카운터가 서로 영향을 주지 않는다', () => {
    const now = Date.now()
    for (let i = 0; i < 30; i++) {
      checkRateLimit('1.1.1.1', now)
    }

    expect(checkRateLimit('2.2.2.2', now).isLimited).toBe(false)
  })

  it('윈도우(60초)가 지나면 다시 요청이 허용된다', () => {
    const now = Date.now()
    for (let i = 0; i < 30; i++) {
      checkRateLimit('3.3.3.3', now)
    }
    expect(checkRateLimit('3.3.3.3', now).isLimited).toBe(true)

    const afterWindow = checkRateLimit('3.3.3.3', now + 60_000 + 1)

    expect(afterWindow.isLimited).toBe(false)
  })
})
