---
on:
  issues:
    types: [opened]

permissions:
  contents: read

engine: claude

safe-outputs:
  add-labels:
    max: 3
  add-comment:
    max: 1
---

# Auto Issue Triage

이슈가 열리면 자동으로 분류하고 봇 파이프라인 라벨을 붙입니다.

## Instructions

1. 새 이슈의 제목과 본문을 읽어라
2. 이슈 유형을 판단해라:
   - **기획이 필요한 기능 요청** → `bot:needs-spec` 라벨 추가
   - **이미 구체적인 스펙이 있는 작업/버그** → `bot:spec-ready` 라벨 추가
   - **버그 리포트** → `bug` 라벨 + `bot:spec-ready` 라벨 추가
   - **질문/논의** → `question` 라벨만 추가 (봇 파이프라인 제외)
3. 이슈에 코멘트를 달아 분류 결과를 알려라:
   ```
   🤖 자동 분류: [분류 결과]
   
   담당 봇: [PlanClaw/WorkClaw]가 [기획/구현]을 진행합니다.
   ```
4. 이슈를 Projects 보드에 자동 등록해라 (프로젝트 번호: 1)
