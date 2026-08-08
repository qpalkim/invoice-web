#!/bin/bash
# Claude Code Stop 훅 - 작업 완료 알림
#
# 이 스크립트는 Claude Code가 Stop 이벤트를 발생시킬 때 실행됩니다.
# Claude가 응답을 완료했을 때 Slack 알림을 보냅니다.

# .env 파일에서 Slack 웹훅 URL 로드
if [ -f "$CLAUDE_PROJECT_DIR/.env" ]; then
    source "$CLAUDE_PROJECT_DIR/.env"
else
    echo "오류: .env 파일을 찾을 수 없습니다: $CLAUDE_PROJECT_DIR/.env" >&2
    exit 1
fi

# Slack 웹훅 URL 확인
if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "오류: SLACK_WEBHOOK_URL이 설정되지 않았습니다." >&2
    exit 1
fi

# 프로젝트명 추출
PROJECT_NAME=$(basename "$CLAUDE_PROJECT_DIR")

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# JSON 입력에서 정보 추출 (있는 경우)
REASON=$(jq -r '.hook_event_name')

# 디버깅을 위한 변수 출력 (stderr로 출력)
echo "DEBUG: REASON = '$REASON'" >&2
echo "DEBUG: PROJECT_NAME = '$PROJECT_NAME'" >&2
echo "DEBUG: TIMESTAMP = '$TIMESTAMP'" >&2

# JSON payload 생성
PAYLOAD=$(printf '{"channel": "#claude-code", "username": "Claude Code", "text": "✅ 작업 완료 알림\n\n프로젝트: %s\n상태: %s\n시간: %s\n\nClaude Code 작업이 완료되었습니다.", "icon_emoji": ":white_check_mark:"}' "$PROJECT_NAME" "$REASON" "$TIMESTAMP")

echo "DEBUG: PAYLOAD = '$PAYLOAD'" >&2

# 한글이 포함된 payload를 curl 커맨드라인 인자로 직접 넘기면 Git Bash(MSYS)가
# 네이티브 실행파일(curl.exe) 호출 시 인자를 시스템 ANSI 코드페이지로 변환하면서
# UTF-8 문자가 깨지므로, 임시 파일에 써서 파일 경로만 인자로 전달한다.
PAYLOAD_FILE=$(mktemp)
printf '%s' "$PAYLOAD" > "$PAYLOAD_FILE"

# Slack으로 알림 전송
curl -X POST \
  --data-urlencode "payload@$PAYLOAD_FILE" \
  "$SLACK_WEBHOOK_URL" > /dev/null 2>&1

rm -f "$PAYLOAD_FILE"

# 성공 여부 확인
if [ $? -eq 0 ]; then
    echo "Slack 알림이 성공적으로 전송되었습니다." >&2
else
    echo "Slack 알림 전송에 실패했습니다." >&2
    exit 1
fi