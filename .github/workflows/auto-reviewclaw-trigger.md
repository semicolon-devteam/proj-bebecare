---
on:
  pull_request:
    types: [opened, ready_for_review]

permissions:
  contents: read

engine: claude

safe-outputs:
  add-comment:
    max: 1
---

# Auto ReviewClaw Trigger

PR이 열리거나 ready_for_review 상태가 되면 ReviewClaw에게 즉시 알립니다.

## Instructions

1. PR이 draft 상태인지 확인해라
2. draft이면 아무것도 하지 마라
3. ready_for_review이면 PR에 다음 코멘트를 달아라:
   ```
   🤖 **ReviewClaw Trigger**
   
   @semicolon-devteam/reviewclaw PR이 리뷰 대기 상태입니다. 코드 리뷰를 시작해주세요.
   
   - 작성자: @{{ pull_request.user.login }}
   - 담당: ReviewClaw
   - 액션: 코드 리뷰 시작
   ```
