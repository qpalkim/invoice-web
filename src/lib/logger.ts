/**
 * 서버 사이드 구조화 로깅 유틸리티.
 *
 * 외부 로깅 서비스(Sentry 등)를 신규로 도입하지 않고, 콘솔에 구조화된 JSON 한 줄로
 * 로그를 출력한다. Vercel 등 서버리스 환경은 stdout/stderr로 출력된 로그를 자동으로
 * 수집·검색 가능하게 해주므로, 별도 전송 로직 없이도 실제 배포 환경에서 로그 조회가 가능하다.
 *
 * 브라우저(클라이언트 컴포넌트)에서도 동일하게 동작하도록 Node.js 전용 API는 사용하지 않는다
 * (error.tsx 에러 바운더리는 클라이언트 컴포넌트이므로 이 로거를 그대로 재사용한다).
 */

type LogLevel = 'info' | 'warn' | 'error'

/** 로그에 함께 남길 부가 정보. 민감한 값(API 키 등)은 절대 담지 않는다. */
type LogContext = Record<string, unknown>

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
}

/** Error 인스턴스에서 로그에 담을 안전한 정보만 추출합니다. */
function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { message: String(error) }
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  }

  const serialized = JSON.stringify(entry)

  if (level === 'error') {
    console.error(serialized)
  } else if (level === 'warn') {
    console.warn(serialized)
  } else {
    console.info(serialized)
  }
}

/** 일반 정보성 로그를 기록합니다. */
export function logInfo(message: string, context?: LogContext): void {
  writeLog('info', message, context)
}

/**
 * 경고성 로그를 기록합니다.
 * 존재하지 않는 견적서 ID 접근처럼 "에러는 아니지만 모니터링이 필요한" 상황에 사용한다.
 */
export function logWarn(message: string, context?: LogContext): void {
  writeLog('warn', message, context)
}

/** 에러 로그를 기록합니다. error 객체는 stack까지 포함해 직렬화합니다. */
export function logError(
  message: string,
  error: unknown,
  context?: LogContext
): void {
  writeLog('error', message, { ...context, error: serializeError(error) })
}
