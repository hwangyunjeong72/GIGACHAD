# 내 보안 Agent 시작 틀 0.2.11

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 켜기

검수 환경은 Node.js 24.19.0이며 외부 npm 의존성이 없습니다. 이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

npm start도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. npm run demo는 예제 자료로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. npm run check는 student/extension.mjs의 문법만 확인합니다.

## 학생 추가 로컬 조회 (2일차·3일차)

`보호 현황` 맨 위의 CPU·메모리·디스크는 **앱의 Node.js 서버가 실행 중인 기기**에서 측정합니다. 그 옆의 `SDP 서버 연결`은 PC 측정 결과와 별도이며, 서버 설정이 없는 기본 실행은 `SDP 미연결`입니다. 설정·어댑터만으로는 실제 SDP 응답 확인이 아니므로 `확인 불가`로 남습니다. 직전 측정 비교는 최근 두 표본만 화면 메모리에 보존합니다.

Windows 3일차 조회는 **관리자 권한 없이** 네트워크 어댑터/IP, 방화벽 프로필, System·Application 로그의 최근 24시간 경고/오류 **건수만 읽습니다**. 침해·공격 탐지 건수가 아니며, 보안 설정·방화벽·이벤트 원본을 바꾸지 않습니다. 미지원 OS·권한 부족·조회 실패는 0이나 예제 값 대신 `확인 불가`와 이유로 표시합니다. Windows PowerShell 실행 정책 때문에 읽기 도구가 거부되면 설정을 바꾸지 않고 확인 불가로 남깁니다. 자세한 범위는 [docs/PC_OBSERVATION_DAY3.md](docs/PC_OBSERVATION_DAY3.md)에 있습니다.

기본 포장이 필요하면 **Git 커밋까지 끝낸 뒤**, 같은 `on-client` 폴더에서 아래 명령을 실행합니다.

    npm run package-app

소스 Git 작업 폴더 밖의 새 `GIGACHAD-packages/GIGACHAD-release-…` 폴더에 Git 추적 소스·실행 CMD·포장 기록을 복사합니다. Windows에서만 `GIGACHAD-launch.lnk` 바로가기 생성도 시도합니다. 기존 패키지와 제출물은 삭제·덮어쓰기하지 않으며, 실제 개인 SDP·AI 인증 파일과 로컬 데이터는 넣지 않습니다. Node.js는 별도로 설치해야 합니다. 포장 성공은 사용자 PC 실행·SDP 연결 성공을 의미하지 않습니다.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- .env.example에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: docs/STUDENT_PROMPTS.md
- 단계별 확인 항목: docs/CURRICULUM.json, docs/IMPLEMENTATION_CONTRACT.md
- 오류 코드별 해결: docs/CONNECTION_TROUBLESHOOT.md
- 17단계 AI 사건 설명 호출의 **제공 서버·HTTP 전송 원문 증거(정적 검토)**: [docs/STAGE17_AI_MODEL_CALL_REVIEW.md](docs/STAGE17_AI_MODEL_CALL_REVIEW.md). 실제 계정·모델 연결 성공을 뜻하지 않습니다.
- 시작 틀 업데이트(내 파일 보존): docs/STARTER_UPDATE.md
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: docs/SDP_HOST_CONNECTION.md, docs/AI_SETUP_GUIDE.md. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.
