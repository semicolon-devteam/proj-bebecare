---
on:
  issues:
    types: [labeled]

permissions:
  contents: read

engine: claude

safe-outputs:
  add-comment:
    max: 1
---

# Auto WorkClaw Trigger

`bot:spec-ready` 라벨이 붙으면 WorkClaw에게 즉시 알립니다.

## Instructions

1. 라벨이 `bot:spec-ready`인지 확인해라
2. 다른 라벨이면 아무것도 하지 마라
3. `bot:spec-ready` 라벨이면 이슈에 다음 코멘트를 달아라:
   ```
   🤖 **WorkClaw Trigger**
   
   @semicolon-devteam/workclaw 이슈가 spec-ready 상태입니다. 구현 작업을 시작해주세요.
   
   - 라벨: bot:spec-ready
   - 담당: WorkClaw
   - 액션: 구현 시작
   ```
