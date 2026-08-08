import { NextResponse, type NextRequest } from 'next/server'

import { logWarn } from '@/lib/logger'

/**
 * 공개 라우트(/invoice/*, /q/[shareToken]) IP 기준 슬라이딩 윈도우 rate limit 미들웨어.
 *
 * 이 서비스는 인증이 없고 shareToken이 노션 페이지 ID(UUID)를 그대로 사용하므로,
 * 무작위 UUID를 대량으로 시도하면 다른 사람의 견적서에 접근할 수 있는 구조적 특성이 있다.
 * (링크만 있으면 누구나 볼 수 있는 것이 이 서비스의 의도된 공유 방식이라 완전히 막을 수는 없다.)
 * 완전한 방어책은 아니지만, 짧은 시간에 대량 요청을 보내는 스캔 시도를 늦추기 위해
 * 외부 서비스(Upstash 등) 없이 간단한 인메모리 rate limit을 둔다.
 *
 * ⚠️ 한계: 아래 `requestLog` Map은 이 미들웨어를 실행하는 서버리스 인스턴스의 메모리에만 존재한다.
 * Vercel처럼 요청마다 다른 인스턴스로 라우팅될 수 있는 멀티 인스턴스 환경에서는 인스턴스별로
 * 카운터가 분리되어 전역적으로 정확한 rate limit이 보장되지 않는다(같은 IP라도 실제로는
 * 설정값의 N배까지 통과할 수 있음). 엄격한 보장이 필요해지면 Redis 등 외부 저장소 기반
 * rate limit 도입을 검토해야 한다. 자세한 배경은 tasks/011-security-error-handling.md 참고.
 */

/** 슬라이딩 윈도우 길이 (1분) */
const WINDOW_MS = 60_000

/**
 * 윈도우당 허용 요청 수.
 * 일반 사용자가 견적서를 열람하며 새로고침, PDF 재시도 등을 하더라도 분당 30회면 충분하되,
 * UUID 무작위 스캔처럼 짧은 시간에 다수 요청을 보내는 패턴은 빠르게 차단되도록 잡은 값.
 */
const MAX_REQUESTS_PER_WINDOW = 30

/** 저장소 메모리 누수 방지를 위한 최대 IP 항목 수. 초과 시 만료된 항목을 정리한다. */
const MAX_STORE_SIZE = 5000

/** IP별 최근 요청 타임스탬프 목록 (슬라이딩 윈도우 로그 방식) */
const requestLog = new Map<string, number[]>()

/** 저장소가 너무 커지면 윈도우 밖으로 만료된 IP 항목을 정리합니다. */
function cleanupExpiredEntries(now: number): void {
  if (requestLog.size < MAX_STORE_SIZE) return

  const windowStart = now - WINDOW_MS
  for (const [ip, timestamps] of requestLog) {
    const recent = timestamps.filter(timestamp => timestamp > windowStart)
    if (recent.length === 0) {
      requestLog.delete(ip)
    } else {
      requestLog.set(ip, recent)
    }
  }
}

/**
 * 요청 헤더에서 클라이언트 IP를 추출합니다.
 * Next.js 15부터 `NextRequest.ip`가 제거되어 프록시가 설정하는 헤더를 직접 읽는다.
 * (Vercel 등 프록시 뒤에서는 `x-forwarded-for`의 첫 번째 값이 실제 클라이언트 IP)
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

interface RateLimitResult {
  isLimited: boolean
  /** 제한에 걸렸을 때, 다음 요청이 허용되기까지 남은 시간(초) */
  retryAfterSeconds: number
}

/** 슬라이딩 윈도우 방식으로 IP의 rate limit 초과 여부를 판단합니다. */
export function checkRateLimit(
  ip: string,
  now: number = Date.now()
): RateLimitResult {
  cleanupExpiredEntries(now)

  const windowStart = now - WINDOW_MS
  const timestamps = (requestLog.get(ip) ?? []).filter(
    timestamp => timestamp > windowStart
  )

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = timestamps[0] ?? now
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000)
    )
    requestLog.set(ip, timestamps)
    return { isLimited: true, retryAfterSeconds }
  }

  timestamps.push(now)
  requestLog.set(ip, timestamps)
  return { isLimited: false, retryAfterSeconds: 0 }
}

/** 테스트 등에서 모듈 간 상태가 새어나가지 않도록 저장소를 초기화합니다. */
export function resetRateLimitStore(): void {
  requestLog.clear()
}

export function middleware(request: NextRequest) {
  const ip = getClientIp(request)
  const { isLimited, retryAfterSeconds } = checkRateLimit(ip)

  if (isLimited) {
    logWarn('Rate limit 초과', {
      ip,
      path: request.nextUrl.pathname,
      retryAfterSeconds,
    })

    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/invoice/:path*', '/q/:path*'],
}
