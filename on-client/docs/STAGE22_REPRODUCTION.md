# 기가차드 · 22단계 새 환경 재현 기록

> **후속 0.2.21 업데이트:** 아래 커밋·버전은 22단계 당시 원문을 검증한 역사적 기록이다. 현재 최신 버전을 이 기록에 소급하지 않으며, 2026-10-28 새 환경 검사는 [0.2.21 대조 기록](GIGACHAD_UPGRADE_0_2_21.md)에서 별도로 구분한다.

> 상태: **검증 중인 버전**. 이 기록은 학생/AI의 로컬 관찰 및 원문 확인 기록이며, ALEPH 서버가 새 환경에서 앱을 실행했다는 증명이 아니다. 22단계 원문 검토 통과, 운영 인증 또는 v1.0 인증으로 표시하지 않는다.

## 1. 기준 원문과 보존 확인

| 항목 | 기록 |
|---|---|
| 저장소 | `https://github.com/hwangyunjeong72/GIGACHAD` |
| 브랜치 | `main` |
| 문서 작성 전 기준 커밋(40자리) | `985ba7a33a1ffc9de05ee38902dee36ccf5d3966` |
| 그 커밋의 변경 요약 | `docs: add GIGACHAD stage 21 student runbook and architecture` |
| 앱 위치 | 저장소 최상위 기준 `on-client/` |
| 코드 버전 | `on-client/package.json`: `0.2.11` (시작 틀 버전). **v1.0 아님** |
| 최종 제출 커밋 | **제출 직전** GitHub에 올라간 `main`의 `git rev-parse HEAD` 출력(40자리)을 과제 화면에 입력. 이전 기준 커밋을 최종 제출 SHA로 사용하지 않음 |
| 기준 확인 시각 | 2026-10-23 16:49~16:53 KST (UTC+09:00) |

재현 준비를 위해 별도 `GIGACHAD-stage22` 폴더에 위 커밋의 GitHub `main`을 복제했다. 복제 당시 `git status --porcelain=v1`은 빈 출력이었고 `main...origin/main`이 표시됐다. 이 환경에는 이전 사용자의 실제 Windows 작업 폴더가 없으므로 **그 PC의 원본 폴더 상태는 원격 Git 기록만으로 확인할 수 없다.** 원본을 삭제·덮어쓰기·리셋하지 않았다. 기존 13~21단계 기록과 커밋은 보존하고 새 학생 문서만 추가한다.

**자기 참조에 주의:** 커밋 내용에 그 커밋 자신의 SHA를 미리 써 넣을 수 없다. 이 문서는 작업 전 기준 SHA를 고정하고, 최종 제출 SHA는 커밋·업로드가 끝난 시점에 Git에서 읽도록 한다. 제출 화면의 40자리 SHA와 새 복제본의 `git rev-parse HEAD`가 같은지 반드시 대조한다. 다른 커밋에서 얻은 검사 결과를 합치지 않는다.

## 2. 원문/함수/입력 계약 확인

**이번 단계는 화면 기능 구현이 아니라 실행 기록·버전 문서 작성이다.** 기존 `student/extension.mjs`의 `createStudentView()`에 있는 `renderIdentity`, `renderDecision`, `renderEvents`, `renderStatus`, `renderAiConnection`, `renderExplanation`, `renderAction`, `renderVulnerabilities`는 변경하지 않는다. 화면은 제공 `public/index.html`, `public/app.js`와 학생 렌더링의 구분을 유지한다. 제공 `src/server.mjs`, 실제 엔진, 판정 코드, 보안 설정 및 인증 경계도 변경하지 않는다.

- 학생 렌더링의 입력: 제공 앱이 로컬 서버의 현재 계정·기기·세션, 앱 판정, 사건·근거, AI 연결/설명, 조치 영수증, OSV 조회 상태를 읽은 **검증된 응답 스냅샷**. 학생 코드가 원천 로그인, 탐지, 허용 판정, 조치 집행 또는 취약점 패키지 변경을 수행하지 않는다.
- 기본 모드: `src/engine.mjs`의 `disconnected` 상태. `/api/me`의 `ENGINE_NOT_CONNECTED`는 서버 실행 실패나 접근 거부(`deny`) 판정이 아니다.
- 예제 모드: `npm run demo` → `src/server.mjs --demo`에서 `event-01`, `e-01`, `rule-01` 등 합성 자료를 제공. 실제 연결·조치·OSV 조회의 근거로 사용하지 않는다.
- `GET /api/vulnerabilities`: 기본 설정에 승인 공개 패키지 목록과 프로젝트 경로가 없으므로 `not_configured`일 수 있다. 이 결과는 조회 성공 또는 취약점 없음(`none_found`)과 다르다.
- 실제 연결·인증·집행 설정은 `docs/STUDENT_RUNBOOK.md`, `docs/SDP_HOST_CONNECTION.md`, `src/actions/README.md`의 기존 조건을 따른다. 설정이나 자격 파일은 Git/이전 폴더에서 자동 복제하지 않는다.

## 3. 빈 새 폴더에서 **동일 최종 커밋** 받기 (Windows PowerShell)

아래는 사용자가 실행할 **절차**이며 Windows PC에서 이 명령을 실행했다는 뜻은 아니다. 프로젝트 경로는 각자 실제 빈 위치로 선택한다. 기존 `GIGACHAD` 폴더와 혼동되지 않는 새 폴더 이름을 사용한다.

1. 원래 Git 작업 폴더에서 `git status --short --branch`, `git remote -v`, `git rev-parse HEAD`를 확인하고 원본 위치·변경 사항을 보존한다. 의도하지 않은 미커밋 수정은 덮어쓰지 않는다.
2. 원본 프로젝트 **밖**의 새 빈 상위 폴더에서 PowerShell을 연 다음 다음 명령을 한 줄씩 실행한다.

```powershell
git clone https://github.com/hwangyunjeong72/GIGACHAD.git GIGACHAD-stage22-repro
Set-Location .\GIGACHAD-stage22-repro
git status --short --branch
git rev-parse HEAD
```

3. 브랜치 최신 HEAD와 제출 대상이 다르면 **제출할 실제 40자리 SHA를 확인한 뒤** 해당 커밋만 체크아웃한다. 아래의 `<제출한_40자리_SHA>`는 문자 그대로 실행하는 값이 아니다.

```powershell
git checkout --detach <제출한_40자리_SHA>
git rev-parse HEAD
git status --porcelain=v1
```

4. `git rev-parse HEAD`의 40자리 값이 제출 화면의 값과 같고 `git status --porcelain=v1`이 비어 있는지 확인한다. 다르면 **그 환경의 시험을 최종 커밋의 증거로 쓰지 않는다.** 브랜치 변경·업데이트로 다른 커밋을 섞지 않는다.
5. `Set-Location .\on-client` 뒤 `node --version`, `npm --version`, `Get-Content .\package.json`으로 런타임을 확인한다. 21단계 Windows 안내대로 `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1`를 실행한다. 이 프로젝트에는 외부 npm 의존성이 없어 별도 `npm install`은 기본 실행의 필수 명령이 아니다.
6. 브라우저에서 `http://127.0.0.1:5189/`의 **보호 현황 / 업무 앱 / 보안 기록**을 열어 화면에 표시되는 상태·오류를 기록한다. 서버 시작 메시지만으로 AI·SDP 연결 성공이라고 쓰지 않는다.
7. 실행 PowerShell에서 `Ctrl+C`로 종료하고 **같은 커밋/같은 실행 방법**으로 다시 실행해 화면·상태를 비교한다. 예제 시험이 필요하면 먼저 종료한 뒤 `npm run demo`; 이 경우 기록에 반드시 **예제 자료**라고 적는다.

설정 예시: `on-client/.env.example`은 비밀 없는 예시일 뿐 자동으로 로드되는 실설정이 아니다. `-SdpHostConfig`, Native Host 및 조치 설정은 운영 담당자가 **별도 환경에서 승인·준비한 경우에만** 사용한다. 기존 PC의 자격·인증·토큰 파일을 새 폴더로 복사하지 않는다. 실행/종료 문제는 [21단계 학생 설명서](STUDENT_RUNBOOK.md)와 [제공 시작 안내](STUDENT_LAUNCH_GUIDE.md)를 따른다.

## 4. 관찰된 실행 환경 및 범위

| 구분 | 기록 |
|---|---|
| 관찰 환경 | 별도 Linux 실행 컨테이너, Node.js `v24.19.0`, npm `11.9.0` (사용자 Windows PC와 다름) |
| 소스 기준 | 문서 작성 전 `main` `985ba7a33a1ffc9de05ee38902dee36ccf5d3966` 복제본의 코드. **최종 문서 커밋으로 복제 재시험 필요** |
| 정적 검사 | `on-client`에서 `npm run check`: 정상 종료(종료 코드 0). **학생 모듈 구문 검사만** |
| 설치 | 외부 의존성 미선언으로 `npm install`을 실행하지 않음(21단계 설명서와 일치). 설치 성공을 별도로 주장하지 않음 |
| 서버 실행 | 이 Linux 환경은 PowerShell이 없어 `ON_PORT=5192 npm start`로 실행. 처음 제한 환경에서는 `listen EPERM`으로 실패하여 허용된 로컬 실행 환경에서 재시도 |
| 기본 HTTP | `GET /` → 200 `text/html`; `GET /student/extension.mjs` → 200 `text/javascript`; `GET /api/me` → 503 `ENGINE_NOT_CONNECTED`, `meta.mode=disconnected` (2026-10-23 16:51 KST) |
| 예제 HTTP | `ON_PORT=5192 npm run demo`: `/api/me`는 `practice-user`, `/api/events`는 `event-01` 및 `e-01`·`rule-01`, `/api/apps`는 예제 3개. 모두 `meta.mode=demo` (16:52 KST) |
| OSV 상태 | 예제 실행의 `GET /api/vulnerabilities` → HTTP 200이나 내용은 `status=not_configured`, `code=PROJECT_NOT_CONFIGURED`, 패키지 빈 배열. 실제 OSV 네트워크 조회 없음 (16:52 KST) |
| 종료·재시작 | `Ctrl+C`로 예제를 종료한 뒤 기본 실행을 재시작: `GET /` → 200, `/api/me` → 503 `ENGINE_NOT_CONNECTED`, `meta.mode=disconnected` (16:52 KST). 테스트 프로세스 종료 |
| 브라우저 GUI | 이 컨테이너에 Chrome/Firefox/PowerShell이 없어 **브라우저 버튼 조작 및 Windows 런처는 미확인**. HTTP 응답을 브라우저 관찰로 표현하지 않음 |
| 실제 시스템 | 실제 SDP 로그인·접근 판정·XDR·CLCO 유료 모델·19단계 집행·OSV 온라인 조회 **실행하지 않음** |

위 결과는 **기준 소스에서 얻은 예비 관찰**이다. 문서가 포함된 최종 커밋의 새 복제본에서 동일한 순서로 재시험하고 그 SHA와 각 관찰 시각을 따로 남겨야 한다. 최종 커밋과 일치하지 않는 관찰을 최종 통과로 승격하지 않는다.

## 5. 13~21단계 누적 대조표

결과 표기의 의미: **재현됨**은 적힌 제한적 동작을 같은 커밋에서 실제 관찰했을 때만, **연결 없음**은 연결이 없어 동작을 시험하지 못했을 때, **확인 불가**는 해당 동작을 직접 검사하지 않았을 때 사용한다. 일부 HTTP 예제 응답을 보았다는 이유만으로 해당 단계 전체를 재현됨으로 기록하지 않는다.

| 단계 | 확인 대상 기능/학생 함수 | 결과 | 확인 시각 (KST) | 근거의 종류와 관찰 | 남은 미확인 원인 |
|---|---|---|---|---|---|
| 13 | 계정·기기·세션 `renderIdentity` | **연결 없음** | 2026-10-23 16:51~16:52 | 원문 확인 + 기본 `/api/me` 503. 예제 자료 `practice-user` HTTP 조회는 별도 확인 | 실제 사용자 인증 및 브라우저 학생 카드 미시험 |
| 14 | 앱 판정 `renderDecision` | **확인 불가** | 미확인 | 원문에 함수 존재. 예제 앱 목록 HTTP 확인뿐, **접속 요청 버튼 미시험** | 실제 정책 판정·브라우저 동작 미시험 |
| 15 | 사건·근거 `renderEvents` | **확인 불가** | 2026-10-23 16:52 (예제 HTTP만) | 원문 확인 + `event-01`, `e-01`, `rule-01` **예제 자료** HTTP 수신 | 실제 XDR 및 사건 선택 브라우저 미시험 |
| 16 | 기기·세션 알림 `renderStatus` | **확인 불가** | 미확인 | 학생 함수 원문만 확인 | 실제 기기·세션 조회/경고 표시 미시험 |
| 17 | AI 연결 `renderAiConnection` | **연결 없음** | 미확인 | 원문에 함수 및 별도 승인 경계 존재 | 계정 승인/CLCO 앱 권한·실제 모델 응답 미제공, 유료 호출 안 함 |
| 18 | 사건 AI 설명 `renderExplanation` | **확인 불가** | 미확인 | 학생 함수와 제공 API 경계 원문 확인 | 실제 근거 결속·AI 설명 응답 미시험 |
| 19 | 조치 `renderAction` | **연결 없음** | 2026-10-23 16:52 (예제 HTTP만) | 예제 `event-01`의 `supportedActions=[]`; 학생 함수 원문 확인 | 실제 집행 연결 준비 전, 사람 승인·효과 원천 재조회 미시험 |
| 20 | OSV `renderVulnerabilities` | **확인 불가** | 2026-10-23 16:52 (기본 설정 HTTP만) | `not_configured` / `PROJECT_NOT_CONFIGURED`; **실제 OSV 미조회** | 승인 패키지·정확한 lock 버전 및 브라우저 표시 미시험; 20단계 최신 공식 재판정 미확인 |
| 21 | 실행 설명서/구성도 | **확인 불가** | 2026-10-23 16:49~16:53 (정적·Linux HTTP 일부) | `docs/STUDENT_RUNBOOK.md`와 현재 경로·명령 대조, Linux `npm start`·종료·재시작 관찰 | 설명서의 Windows PowerShell 새 환경 및 브라우저 전체 재현 미시험, 공식 접수 미확인 |

2026-10-23의 위 표는 **13~21단계 각각의 공식 통과표가 아니다.** 13~21단계 이전 시기의 다른 커밋 기록, 21단계 문서 속 학생 진술 및 본 표의 예제 API 확인을 합산해 22단계 전체 성공이라고 판단하지 않는다. 사용자 PC에서 직접 확인된 새 결과는 별도 시각·최종 커밋·증거 수준을 갖춰 재기록해야 한다.

## 6. 데이터 보존·백업·복원 계획과 한계

1. **코드와 학생 문서**: GitHub `main`의 제출 커밋을 기준으로 소스·문서·비밀 없는 `.env.example`을 보존한다. 원래 PC의 작업 폴더는 그대로 둔다. 수정 전 `git status`를 확인하며 미커밋 파일·이전 커밋을 삭제하거나 덮어쓰지 않는다. Git 복제는 **코드 백업**이지 운영 DB/계정 인증 백업이 아니다.
2. **기본 예제 데이터**: `src/engine.mjs`의 `demoEngine()`에서 생성되는 합성 데이터다. 예제 사건은 실제 회사 데이터가 아니며 `npm run demo`로 다시 생성할 수 있다. API 응답 스냅샷 자체를 영구 기록 저장소로 간주하지 않는다.
3. **실제 접속/XDR 원천**: SDP 및 조직 서버 소유 데이터이므로 이 앱의 Git으로 백업·복원하지 않는다. 기존 시스템 담당자의 보존 정책·복원 절차를 따른다. 실제 연동은 아직 확인되지 않았다.
4. **조치 원장**: 현재 기본 실행에는 조치 DB가 연결돼 있지 않다. 향후 승인된 연결에서만 `src/actions/store.mjs`가 운영자가 지정한 **기존 SQLite 파일**에 `alekov_action_intents`, `alekov_action_state`, `alekov_action_audit`를 기록한다. 파일의 실제 위치는 환경별로 다르며 Git에 넣지 않는다. 백업은 DB 소유자의 승인 및 SQLite 일관성 있는 백업/스냅샷 절차를 사용하고, 검증된 보관 위치·접근 권한·복구 시점을 기록한다. 실행 중 파일만 무작정 복사하거나 감사 이력을 삭제·롤백하지 않는다.
5. **설정과 인증**: 실제 SDP 설정·인증서·키·JWT·Native Host/AI 자격은 프로젝트 밖, 운영 담당자의 승인된 보관소에 둔다. 새 환경에는 **새 승인/발급 과정**으로 설정한다. `.env.example`만으로 인증 연결이 복원되지 않는다. 토큰/비밀번호/API 키를 문서·로그·커밋·제출 JSON에 포함하지 않는다.
6. **복원 검증**: (a) 대상 코드 SHA 대조 → (b) 승인된 백업 식별·무결성·권한 확인 → (c) 격리 환경에서 승인된 방법으로 복원 → (d) 앱 기본/연결 모드의 읽기 확인 및 원장/원천 일관성 점검 → (e) 복원 관찰·담당자 승인 기록. 운영 조치의 `unknown/pending`은 자동 재집행하지 않고 원천 결과만 별도로 확인한다. **현재 실제 백업 생성·복원 시험은 미확인**이다.

## 7. 기다림(UNV), 학생 확인 및 제출 경계

- **UNV**: 실제 학생 계정과 SDP/AI 앱 승인, 13~18단계 실제 연결, 19단계 실제 조치 집행·효과 관측, 20단계 운영 허용 공개 패키지 OSV 온라인 조회, Windows PowerShell 및 브라우저에서 같은 최종 SHA 검증, 실데이터 백업·복원, 21·22단계 공식 접수/AI 원문 검토 결과.
- Windows 사용자 확인 **첫 번째 한 가지**: 원래 프로젝트 폴더에서 `git status --short --branch`를 실행해 기존 파일·미커밋 변경이 남아 있는지 확인한다. 그 결과를 확인한 뒤에만 새 복제본 절차로 진행한다.
- 이어서 사용자가 새 폴더에서 실행·브라우저 관찰을 완료했다면 각 단계의 **실제 표시 문자열, KST 시각, 최종 SHA, 예제/실제 연결 구분**을 기록한다. 관찰하지 않은 행은 미확인으로 둔다.
- 21·22단계는 과제 화면에 저장소 URL과 **40자리 최종 커밋 SHA**를 직접 입력한다. 포털 제출 준비 기능(13~20 대상)으로 대신하지 않는다. 공개 저장소의 경우 GitHub 원문을 제출 서버가 읽을 수 있지만, **접수·원문 전달·AI 검토 통과는 서로 별개**다.
- 비공개 저장소라면 과제 화면이 제공하는 `student-source-cli.mjs`/ZIP 절차만 사용한다. 프로젝트 밖의 새 폴더에 도구와 출력 JSON을 두고 `--commit` 뒤의 SHA를 실제 값으로 바꿔 실행한다. 여기서는 도구 옵션을 만들어 내거나 실행했다고 주장하지 않는다.

이 기록에 기술된 예비 점검은 프로그램의 제한된 로컬 관찰이며 **보안 운영 수용 또는 v1.0 자동 인증이 아니다**.
