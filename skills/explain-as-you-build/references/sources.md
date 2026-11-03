# 설계 참고

공개 자료의 역할 분리와 기록 방식을 검토한 뒤, 작업 중 설명 시점·근거 유효성·사람의 판단 구별을 중심으로 지침과 양식을 새로 작성했다. 외부 자료를 실행 시 읽거나 설치할 필요는 없다. 아래 파일을 그대로 번들하거나 외부 실행 코드를 복사하지 않았다.

- [cofa-toolkit — explain-artifact](https://github.com/B0neh3ad/cofa-toolkit/blob/main/skills/explain-artifact/SKILL.md): 실제 산출물에 근거한 설명.
- [cofa-toolkit — evidence-check](https://github.com/B0neh3ad/cofa-toolkit/blob/main/skills/evidence-check/SKILL.md): 기대·관찰·코드 상태를 연결하는 검증.
- [cofa-skills — decision-log](https://github.com/ColdTbrew/cofa-skills/blob/main/skills/decision-log/SKILL.md): 결정 시점의 이유·근거 기록.
- [설명 준비 참고 — explain-prep](https://github.com/leeyeonho95/hynix-hackathon-kit/blob/main/skills/explain-prep/SKILL.md): AI 제안과 사람의 판단 구별.

## 보완한 부분

- 기본을 작업 동행으로 지정하고 설명·기록은 중요한 사건에 제한했다.
- 중요한 설계는 실행 가능한 대안의 장단점·추천 이유를 먼저 비교하고 사용자 선택 후 구현한다. 선택과 추천의 주체, 실제 선택 이유를 구분한다.
- 작은 입력 추적, 동점·종료·실행 불가능성, 최적성 보장 한계를 구체화했다.
- 취소 시점·중복 부작용·이전 결과의 덮어쓰기를 구별했다.
- 옛 검증을 최신 코드의 근거로 쓰지 않도록 판본·관찰을 연결했다.
- 특정 시험·프레임워크·MCP·hook 없이 파일을 직접 읽어 적용하도록 했다.

공개 자료의 작성자 설명은 공식 시험 규정이나 채점표가 아니다. 실제 조건은 제공된 안내를 우선한다.
