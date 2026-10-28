# 내 보안 Agent 시작 틀 0.2.21

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 켜기

검수 환경은 Node.js 24.19.0이며 외부 npm 의존성이 없습니다. 이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

npm start도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. npm run demo는 예제 자료로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. npm run check는 student/extension.mjs의 문법만 확인합니다.

## 기가차드 학생 작업 보존 및 0.2.21 업데이트

이번 프로젝트는 **0.2.21 시작 틀의 제공 런타임**을 사용하면서, 기존 기가차드 GitHub에 커밋된 `student/extension.mjs`의 13~22단계 학생 렌더러를 보존합니다. 업로드된 GIGACHAD.zip의 공통 파일은 0.2.21 시작 틀과 동일하지만 학생 확장 파일은 제공용 빈 틀로 바뀐 상태였으므로, 이전 GitHub 학생 코드를 복원했습니다. 자세한 대조·검증 범위는 [0.2.21 마이그레이션 점검 기록](docs/GIGACHAD_UPGRADE_0_2_21.md)을 확인하세요.

- **학생 화면**: 보호 현황 상단의 기가차드 **CPU·메모리·디스크·SDP 별도 상태 4카드**, 수동 `PC 요약 다시 조회`, 직전 두 번 측정 비교를 복원했습니다. 실제 수치는 `/api/pc/status` 새 계약에서만 읽고, 실패하면 `확인 불가`를 표시합니다. SDP 연결 성공을 PC 수치에서 추정하지 않습니다.
- **제공 화면**: 아래의 `내 PC 상태`는 0.2.21 제공 기능이며 CPU·메모리·디스크·네트워크·방화벽·최근 Windows 이벤트를 읽기 전용으로 표시합니다. 현재 버튼은 `내 PC 확인`이고 `10초마다 확인`은 사용자가 직접 켜야 합니다. 이벤트 건수는 침해 판정이 아닙니다.
- **기존 학생 자료**: 이전 `public/pc-status.mjs`, `public/windows-observation.mjs`, `src/windows-observation.mjs` 및 2~5일차 기록·테스트를 삭제하지 않았습니다. 구버전 `/api/pc-status`·`/api/windows-observation`은 새 제공 서버에 없으므로 구형 화면 스크립트는 현재 HTML에서 불러오지 않습니다. 관련 모의 테스트 결과를 새 서버의 실연결 증명으로 사용하지 않습니다.
- **처음 실행**: [0.2.21 기준 한 장 실행 안내](docs/GIGACHAD_DAY5_QUICK_START.md)와 기존 [상세 실행 안내](docs/STUDENT_LAUNCH_GUIDE.md)를 사용합니다.

### 기본 포장 계약 변경 주의

0.2.11의 단순 `npm run package-app` → `GIGACHAD-start.cmd` 방식은 **0.2.21의 기본 포장과 다릅니다.** 최신 기본 포장은 담당자가 제공한 **승인 실행 환경**과 승인된 PNG 아이콘, 소스·출력 폴더 옵션이 필요하며, 결과는 설치용 `app.zip`·manifest·설치 안내입니다. 승인 실행 환경이 없으면 정상적으로 중단되어야 합니다. `--app-only-v1`은 별도의 호환 형식이지 기본 포장 성공이 아닙니다. [최신 제공 포장 안내](docs/PACKAGE_APP.md)를 확인하세요. 실제 Windows 설치·바로가기 생성·SDP·AI 실연결은 미확인입니다.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- .env.example에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: docs/STUDENT_PROMPTS.md
- 단계별 확인 항목: docs/CURRICULUM.json, docs/IMPLEMENTATION_CONTRACT.md
- 오류 코드별 해결: docs/CONNECTION_TROUBLESHOOT.md
- 시작 틀 업데이트(내 파일 보존): docs/STARTER_UPDATE.md
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: docs/SDP_HOST_CONNECTION.md, docs/AI_SETUP_GUIDE.md. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.
