#!/bin/bash
# Heartbeat script — pushes today's status to AgentCanvas
# Usage: ./heartbeat.sh [morning|noon|night]

set -e

TOKEN=$(cat ~/.hermes/.canvas-token)
USER_ID=$(cat ~/.hermes/.canvas-user)
API="https://agent-canvas-eta.vercel.app"

# Title based on time of day
case "${1:-noon}" in
  morning) TITLE="☀️ 早上好 Eric" ;;
  noon)    TITLE="🌤 中午了 Eric" ;;
  night)   TITLE="🌙 晚安 Eric" ;;
esac

# Get battery
BATTERY=$(pmset -g batt | grep -Eo '\d+%' | tr -d '%' || echo "100")

# Get today's tasks from family-os
TASKS=$(python3 ~/family-os/family-os.py task list 1 --today 2>/dev/null | tail -n +4 | while read line; do
  id=$(echo "$line" | awk '{print $1}')
  title=$(echo "$line" | awk '{$1=""; sub(/^ /, ""); print}')
  status=$(echo "$line" | awk '{print $2}')
  priority=$(echo "$line" | awk '{print $3}')
  due=$(echo "$line" | awk '{print $5}')
  prio_str="HIGH"
  [ "$priority" = "URGENT" ] && prio_str="URGENT"
  [ "$priority" = "MEDIUM" ] && prio_str="MEDIUM"
  stat_str="TODO"
  [ "$status" = "DONE" ] && stat_str="DONE"
  printf '{"title":"%s","status":"%s","priority":"%s","due":"%s"},' "$title" "$stat_str" "$prio_str" "$due"
done | sed 's/,$//')

# Build JSON
JSON=$(cat << END
{
  "slides": [{
    "type": "dashboard",
    "title": "${TITLE}",
    "data": {
      "battery": ${BATTERY},
      "tasks": [${TASKS}]
    }
  }]
}
END
)

# Push to AgentCanvas
curl -s -X POST "${API}/api/canvas?userId=${USER_ID}&canvasId=heartbeat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$JSON" > /dev/null

echo "💓 https://agent-canvas-eta.vercel.app/${USER_ID}/heartbeat"
