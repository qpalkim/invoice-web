import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/utils'

describe('formatCurrency', () => {
  it('금액을 천 단위 콤마와 "원" 접미사로 포맷한다', () => {
    expect(formatCurrency(1200000)).toBe('1,200,000원')
  })

  it('0원도 정상적으로 포맷한다', () => {
    expect(formatCurrency(0)).toBe('0원')
  })

  it('천 단위 미만 금액은 콤마 없이 표시한다', () => {
    expect(formatCurrency(999)).toBe('999원')
  })

  it('음수 금액도 부호를 유지한 채 포맷한다', () => {
    expect(formatCurrency(-1000)).toBe('-1,000원')
  })
})
