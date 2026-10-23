# 기가차드(GIGACHAD) · 학생용 실행 설명서와 시스템 구성도

> 21단계 학생 작성 문서. 작성 기준: 2026-10-23, 저장소 `hwangyunjeong72/GIGACHAD`의 현재 소스 정적 검토와 사용자에게서 전달받은 로컬 데모 관측.
> **문서 작성은 앱 실행·운영 연결·ALEPH 공식 통과가 아니다.** 실제 실행하지 않은 항목은 미확인 또는 기다림(UNV)으로 구분한다.

## 1. 목적과 확인 범위

**기가차드**는 회사 업무 앱의 접속 판정, 본인 기기·세션, 접속/XDR 기록, AI 사건 설명, 보안 조치 요청 상태, 공개 설치 패키지의 OSV 취약점 조회 상태를 *보여 주는* 로컬 보안 Agent 프로젝트다. 판정·탐지·집행을 학생 표시 함수가 직접 수행하는 앱이 아니다.

- GitHub 저장소: https://github.com/hwangyunjeong72/GIGACHAD
- 실제 실행 소스의 Git 최상위 상대 위치: `on-client/`.
- 프로젝트에서 정한 이름: **기가차드**. 제공된 `on-client/public/index.html`의 화면 제목과 `tools/start-alekov.ps1` 실행 메시지에는 기본 이름 **케셰브**가 남아 있다. 서로 다른 앱이 아니라 제공 시작 틀의 표시 이름 차이이며, 이 문서 작성을 위해 제공 화면을 임의 수정하지 않았다.
- 주요 메뉴: **보호 현황**, **업무 앱**, **보안 기록** (`public/index.html`).
- 기본 실행은 `disconnected`이고 실제 SDP·AI 연결이 자동으로 생기지 않는다. `demo`는 예제 자료이며 실제 접속 성공이나 보안 조치 성공의 증거가 아니다.

## 2. 지원 환경과 현재 파일 사실

| 항목 | 소스에서 확인한 내용 | 실제 PC 확인 수준 |
|---|---|---|
| 운영체제 | `tools/start-alekov.ps1`은 Windows PowerShell 실행 도구이며 Windows 경로·PowerShell API를 사용 | 사용자가 Windows PowerShell에서 로컬 앱 실행·종료·데모 화면을 확인했다고 전달함. 새 환경 재현은 **미확인** |
| Node.js | `package.json`의 `engines.node`는 **24.19.0**. 실행 도구는 Node.js **22~24**를 받아들이며 24.19.0을 수업 권장 기준으로 출력 | 사용자의 실제 `node --version` 출력은 **미확인**. 24.19.0 설치 완료라고 쓰지 않음 |
| npm | Node.js와 함께 쓰는 npm; `package.json`에 `start`·`demo`·`check` 스크립트만 선언 | 사용자 로컬에서 `npm run demo`로 예제 화면을 열었다고 전달함. npm의 실제 버전은 **미확인** |
| 외부 npm 의존성 | `on-client/package.json`에 `dependencies`·`devDependencies` 선언이 없음. Node.js 표준 라이브러리 중심 | 버전 설치 결과를 추측하지 않음 |
| 잠금 파일 | 이 GitHub 버전의 `on-client/`에는 `package-lock.json`이 **없음**(저장소 폴더 목록 대조). `node_modules/`도 Git에 제공되지 않음 | 사용자 PC의 다른 조회 대상 프로젝트에는 있을 수 있으므로 별도 확인 필요 |
| 개발 및 브라우저 | 로컬 `127.0.0.1`, 기본 포트 `5189`, 브라우저에서 `http://127.0.0.1:5189/` | 사용자가 기존 로컬 URL의 보호 현황·보안 기록·예제 사건 화면 표시를 확인했다고 전달함. 전체 지원 브라우저 목록은 **미확인** |

**주의:** 20단계 OSV는 `src/vulnerabilities/project-scan.mjs`이 운영자가 지정한 `ON_PROJECT_DIRECTORY`의 실제 `package-lock.json`과 설치 메타데이터를 검증하고, 승인된 공개 패키지만 조회하는 경로다. 이 저장소에 lock 파일이 없다는 사실만으로 다른 프로젝트의 검사 결과를 만들어 내거나 의존성을 추가·다운그레이드하지 않는다. `.env.example`의 `ON_PROJECT_DIRECTORY`는 비어 있고 `ON_APPROVED_PUBLIC_PACKAGES=[]`이므로 운영자가 별도 승인 설정을 하지 않은 기본 실행에서는 `not_configured` 또는 관련 미조회 상태가 정상일 수 있다.

## 3. 폴더 구조와 작업 위치

이 저장소에서 확인한 주요 경로:

~~~text
GIGACHAD/                             ← Git 최상위(커밋·git pull 위치)
└── on-client/                         ← 앱 폴더(실행 명령 위치)
    ├── README.md                     ← 제공된 시작 틀 안내(보존)
    ├── package.json                  ← Node.js 24.19.0 기준; start/demo/check
    ├── .env.example                  ← 비밀 없는 예시(실제 .env가 아님)
    ├── .on-starter-manifest.json     ← 제공 파일 목록·경계 참고
    ├── tools/
    │   └── start-alekov.ps1          ← Windows 실행/포트 검사
    ├── public/
    │   ├── index.html                ← 제공 화면/실제 메뉴와 버튼 이름
    │   ├── app.js                    ← 제공 UI·요청·취소·새로고침 연결
    │   ├── vulnerabilities-view.mjs  ← 제공 OSV 응답 검증/표
    │   └── ai-connect.mjs            ← 제공 앱 승인 표시
    ├── student/
    │   ├── extension.mjs             ← 학생 작성 표시 함수 8개
    │   └── engine-adapter.mjs        ← 제공 연동 경계
    ├── src/
    │   ├── server.mjs                ← 127.0.0.1 앱 HTTP 서버·API
    │   ├── engine.mjs                ← disconnected / demo / adapter
    │   ├── engine/                   ← SDP 연결 구현
    │   ├── ai/                       ← AI 연결/권한/설명 서비스
    │   ├── connection/               ← 계정·승인 연결
    │   ├── actions/                  ← 조치 처리 경계(학생이 수정 안 함)
    │   └── vulnerabilities/          ← 설치 패키지 검증·OSV 조회
    ├── vendor/
    │   └── clco-http.mjs             ← 제공 AI 게이트 HTTP 전송
    └── docs/
        ├── STUDENT_PROMPTS.md        ← 공식 13~22단계 계약
        ├── STUDENT_LAUNCH_GUIDE.md   ← 제공 실행 안내
        ├── CONNECTION_TROUBLESHOOT.md← 제공 오류 안내
        └── STUDENT_RUNBOOK.md        ← **이 21단계 학생 문서**
~~~

**Git 명령은 `GIGACHAD`에서**, **Node/npm/앱 실행 명령은 `GIGACHAD\on-client`에서** 수행한다. 폴더 전체를 삭제하거나 제공 파일을 덮어쓰지 않는다.

## 4. Windows PowerShell에서 실행·종료·재실행

### 4-1. 준비와 현재 위치 확인

1. 탐색기에서 `C:\Users\Administrator\Downloads\GIGACHAD\on-client`를 연다. 이 경로는 사용자가 앞 단계에서 사용한 **로컬 경로**이며 다른 PC에서는 실제 저장 위치로 바꾼다.
2. 탐색기 주소 표시줄에 `powershell`을 입력하고 Enter를 누른다. 아래 명령을 **한 줄씩** 입력한다.

~~~powershell
Get-Location
node --version
npm --version
Get-Content .\package.json
~~~

`Get-Location`에 현재 `...\GIGACHAD\on-client` 폴더가 표시되고, `node --version`이 표시되면 설치된 버전을 기록한다. 수업 기준은 `v24.19.0`이지만 실제 출력은 아직 수집하지 않았다. 다른 주요 버전에서의 동작은 확인되지 않았다.

### 4-2. 기본 실행: 기존 시스템 연결 없음

`on-client` 폴더의 PowerShell에서 다음 **소스에 존재하는 실행 명령**을 사용한다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
~~~

- 실행 도구가 Node 존재·버전·폴더·포트 사용 여부를 확인한다.
- **정상 시작 신호(스크립트 원문):** `케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요.`
- 뒤이어 `서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.`가 출력된다.
- 브라우저에서 **http://127.0.0.1:5189/** 를 열면 `보호 현황`, `업무 앱`, `보안 기록` 메뉴가 있다.
- **서버의 HTTP 응답 확인 ≠ 회사 계정 인증·SDP 연결·AI 게이트 연결 완료.** 기본 `ENGINE_NOT_CONNECTED`는 정상적인 미연결 상태일 수 있다.

동일한 프로젝트의 `package.json`에는 `npm start`(`node src/server.mjs`)도 있다. 실행 도구가 존재할 때는 포트와 Node 버전을 먼저 점검하는 위 PowerShell 명령을 우선 사용한다. `npm run check`는 `node --check student/extension.mjs`의 **문법 검사만** 실행하며 실제 로그인·API·OSV·AI 조치 검사가 아니다.

### 4-3. 연습 데모: 실제 회사 시스템이 아님

같은 앱 폴더에서 기본 서버를 먼저 종료한 다음 실행한다.

~~~powershell
npm run demo
~~~

- `package.json`에서 `node src/server.mjs --demo`로 정의됐다. 예제 접속 사건 `event-01`, 근거 `e-01`, 규칙 `rule-01` 등은 `src/engine.mjs`의 **합성 자료**이다.
- 사용자는 `npm run demo` 뒤 브라우저 `보안 기록`에서 예제 사건 ID와 상세 근거·규칙, `access=denied`·`session=active`·`device=unknown` 표시를 확인했다고 전달했다.
- 데모에서 `supportedActions`는 빈 배열이므로 **조치 준비 버튼이 표시되지 않는 것이 정상**이며 실제 보안 조치를 요청하지 않는다.
- 데모 결과를 실제 SDP·AI 모델·OSV 성공으로 기록하지 않는다.

### 4-4. 종료와 재실행

1. 앱을 **실행한 PowerShell 창**으로 돌아간다.
2. `Ctrl+C`를 눌러 종료한다. 사용자는 이전 로컬 실행에서 명령 입력 화면으로 돌아온 것을 확인했다.
3. 같은 `on-client` 폴더에서 `4-2` 명령을 다시 실행한다. 데모를 재시험하려면 `4-3` 명령을 사용한다.
4. 이전 서버가 계속 켜져 `5189` 포트를 점유했다면 **다른 프로그램을 임의 종료하지 않고**, 먼저 어떤 창에서 서버를 실행했는지 확인한다. 포트를 의도적으로 바꿀 때는 아래처럼 실행하고 브라우저 주소도 바꾼다.

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5190
~~~

브라우저 주소: **http://127.0.0.1:5190/**. `-Background` 실행은 별도 프로세스 종료 절차가 필요하므로 초보자 기본 절차에서는 쓰지 않는다. `npm install` 또는 의존성 버전을 낮추는 명령은 현재 기본 실행의 필수 단계가 아니다.

## 5. 시스템 구성도: 현재 소스에 근거한 데이터 흐름

아래는 **텍스트 구성도**다. 화살표는 가능한 코드 경로이며, ①을 실행했다고 ③·④의 실제 접속이 확인된 것은 아니다.

~~~text
┌─────────────────────────────────────────────────────────────────────┐
│ ① 브라우저 / 제공 UI + 학생 렌더링                                │
│ http://127.0.0.1:5189/                                             │
│ on-client/public/index.html, public/app.js, student/extension.mjs │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP 같은 로컬 주소, API JSON
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ② 로컬 보안 Agent 앱 서버                                         │
│ on-client/src/server.mjs, src/engine.mjs                            │
│ 127.0.0.1:5189, 기본 disconnected, 선택 시 demo                    │
└───────────────┬────────────────────────────────────┬────────────────┘
                │ 허가된 SDP 설정/어댑터 있을 때만  │ 인증·앱 승인·
                │                                    │ AI 서비스 준비 때만
                ▼                                    ▼
┌────────────────────────────────┐    ┌──────────────────────────────┐
│ ③ 기존 접근 제어·XDR 시스템     │    │ ④ CLCO 수업용 AI 게이트      │
│ src/engine/sdp-host.mjs         │    │ src/ai/service.mjs           │
│ src/engine/sdp-host-config.mjs  │    │ src/ai/vault-service.mjs     │
│ student/engine-adapter.mjs      │    │ vendor/clco-http.mjs         │
│ 실제 SDP relay 주소: 미제공    │    │ 실제 게이트 주소: 미제공     │
│ 실제 학생 계정 연결: 미확인    │    │ 실제 모델 호출: 미확인      │
└────────────────────────────────┘    └──────────────────────────────┘
~~~

**흐름 설명:**

1. 브라우저는 제공 `public/app.js`가 API를 요청하고, 응답 스냅샷을 `student/extension.mjs`의 표시 함수에 넘긴다. 학생 함수는 화면 표시 담당이며 브라우저 인증 티켓이나 원천 집행 권한을 얻지 않는다.
2. `src/server.mjs`는 localhost만 수신한다. 예: `GET /api/me`, `GET /api/events`, `POST /api/access`, `GET /api/vulnerabilities`. 기본 실행 `src/engine.mjs`는 미연결이고, `--demo`는 합성 자료를 반환한다.
3. 실제 SDP 연결은 담당자가 준비한 별도 승인 설정에 의존한다. 연결이 있을 때만 `src/engine/sdp-host.mjs`와 `student/engine-adapter.mjs` 경계를 통해 원천의 신원·업무 앱 판정·사건 등을 받아올 수 있다. 이 문서에는 내부 원격 주소나 개인 자격 경로를 넣지 않는다.
4. AI 게이트는 별도 계정 확인·AI 앱 승인·모델 이용 권한이 필요하다. `src/ai/`와 `vendor/clco-http.mjs`의 **코드 경로**를 읽은 것과 실제 유료 모델 응답을 받은 것은 다르다.
5. 선택적 공개 취약점 조회는 `src/vulnerabilities/project-scan.mjs` → `src/vulnerabilities/osv.mjs` → **https://api.osv.dev/v1/querybatch** 경로로 운영자가 승인한 패키지에 한한다. 기본 설정만으로 조회를 임의 수행하거나 비공개 이름을 외부로 보내지 않는다.
6. ALEPH 공식 단계 제출은 **이 앱 화면의 별도 원천**이다. 이 문서는 ALEPH 평가 서버, 제출 API 또는 AI 평가 실행 성공을 주장하지 않는다.

## 6. 제공 코드와 학생 구현의 경계

`on-client/.on-starter-manifest.json`에는 제공 파일의 목록이 있고, `public/index.html`은 제공 카드와 학생 카드를 구분한다. 학생이 작성한 표시 코드의 현재 위치는 `student/extension.mjs`이다. 제공 파일의 과거 manifest 해시는 최신 학생 변경 후의 commit SHA를 대신하지 않는다.

| 영역 | 실제 위치 / 함수 | 책임 및 경계 |
|---|---|---|
| 제공 UI·메뉴 | `public/index.html`, `public/app.js` | **보호 현황/업무 앱/보안 기록**, 메뉴, 새로고침, 요청, 취소, 제공 버튼의 상태 관리 |
| 제공 서버 | `src/server.mjs`, `src/engine.mjs` | HTTP API, 연결·데모·미연결 전환, 접근 권한 및 오류 응답 |
| SDP / XDR | `src/engine/sdp-host.mjs`, `student/engine-adapter.mjs` | 기존 원천 연결 경계. 원천에서 확인하지 못한 결과를 학생 코드가 만들어 내면 안 됨 |
| AI / 조치 / OSV 원천 | `src/ai/`, `src/actions/`, `src/vulnerabilities/` | 서버 권한·호출·집행/조회/OSV 검증. 학생 표시 함수에서 직접 수정하지 않음 |
| 학생: 13단계 | `renderIdentity` | 내 계정·기기·세션의 연결·조회 상태를 따로 표시 |
| 학생: 14단계 | `renderDecision` | 앱 접속 판정 `allow/deny/challenge/unknown`과 요청 실패를 구분 |
| 학생: 15단계 | `renderEvents` | 내 접속/XDR 사건 ID, 시간, 근거·규칙, 상세·빈 목록·오류 표시 |
| 학생: 16단계 | `renderStatus` | 기기·세션 상태, 알림, 비밀 없는 진단·오류 정보 표시 |
| 학생: 17단계 | `renderAiConnection` | AI 점검 상태·모델 목록·권한 및 연결 실패 표시. 모델 추론 성공과 구분 |
| 학생: 18단계 | `renderExplanation` | 사건 원근거 ID와 AI 설명·제안의 연결 검증, 취소·오류·실행 불가 구분 |
| 학생: 19단계 | `renderAction` | `prepared/executing/pending/succeeded/unknown` 등을 구분. **ACK ≠ 효과 확인**, 실제 집행 버튼·토큰 없음 |
| 학생: 20단계 | `renderVulnerabilities` | 정확한 버전·OSV ID/수정 시각·일부 실패·미조회/미설정 구분. 학생 코드에서 패키지 변경 없음 |

19단계의 `succeeded`는 실제 원천 `observation.effectApplied===true`처럼 관측된 증거가 있을 때만 **효과 확인**이라고 표시한다. 기본 예제에서는 조치 제안/집행을 실행할 수 없다. **「조치 화면 취소」는 이미 서버에 전달된 집행 효과를 되돌리는 기능이 아니다.**

20단계의 `none_found`는 *OSV가 조회한 범위에서 알려진 항목이 없음*이라는 뜻이며, 패키지·앱 전체가 안전하다는 보장이 아니다. `partial/unverifiable/not_checked/not_configured`는 각각 별도 상태로 본다. 서버가 확인한 정확한 `version`, `source`, `checkedAt`, `lockfileHash`만 전달된 경우에 표시한다.

## 7. 직접 확인한 기록과 기다림(UNV)

| 범주 | 실제로 확인한 내용 | 증거 수준 |
|---|---|---|
| 소스/명령 정합성 | 저장소의 `package.json`, PowerShell 실행 도구, `src/server.mjs`, `public/index.html`, 학생 함수 이름, 폴더 구조 | **GitHub 원문 정적 검토** |
| 기본 화면 | 로컬 브라우저에 `보호 현황`·`보안 기록` 표시, 미연결 안내 | **사용자의 이전 실제 브라우저 관찰 보고** |
| 예제 기록 | `npm run demo`에서 사건 `event-01`, 근거·규칙·세 상태 표시, 사건 선택 시 표시 교체, AI 설명 초기 안내 | **사용자의 데모 브라우저 관찰 보고**. 실제 SDP가 아님 |
| 학생 함수 자체 | 19단계 및 20단계 구현 후 상태별 데이터를 만든 모의 DOM 테스트가 수행됐다는 작업 기록 | **모의 데이터 검사**. 실제 브라우저·원천 연동·ALEPH 판정으로 간주 안 함 |
| 20단계 정밀 검토 | 이전 20단계 제출에서 `exact_lock_version` 피드백이 있었고, 이후 최신 커밋에 SemVer 검사 수정이 있음 | **제출 피드백 + GitHub 수정 커밋 확인**. 최신 재제출 통과는 **미확인** |
| 새 PowerShell에서 이 문서 재실행 | 이번 21단계 문서 작성 후 사용자의 새 창 검증 | **미확인** — 사용자가 직접 확인해야 함 |
| Node 버전·실제 SDP 운영 계정 | 학생 PC `node --version`, 실제 SDP 인증·업무 앱 판정·XDR, 계정 연결 | **기다림(UNV)** 또는 미확인 |
| AI 실제 사용 | 현재 사용자·프로젝트의 게이트 권한, 모델 추론, 18단계 실제 AI 사건 설명 성공 | **기다림(UNV)**. 소스의 호출 경로는 실행 증거가 아님 |
| 조치 효과 | 같은 학생·프로젝트·대상에 대한 실제 조치 집행·원천 재조회 | **기다림(UNV)**. 모의 `succeeded` 표시가 실제 효과를 입증하지 않음 |
| OSV 온라인 실제 결과 | 현재 허용 패키지·실제 `node_modules`/lock 일치와 공개 OSV 결과 | **미확인**. 취약점을 시험 목적으로 만들지 않음 |
| 21단계 ALEPH 승인 | 이번 문서와 같은 커밋의 제출·서버 검토 통과 | **미확인**. 제출 전 성공이라고 기록하지 않음 |

## 8. 문제별 확인·복구 안내

아래는 **화면·제공 오류 처리에 실제 존재하는 상태와 코드**를 기준으로 정리했다. 요청 자동 반복, 비밀값 공유, 파일 삭제로 해결하지 않는다.

| 화면 또는 코드 | 뜻 | 초보자 확인 순서 |
|---|---|---|
| `Node.js 가 없습니다` 또는 버전 경고 | 설치 또는 버전 문제 | 앱 폴더에서 `node --version`을 확인하고 수업 권장 Node.js 24.19.0 환경을 준비. 새 PowerShell을 연다 |
| `앱 폴더가 아닙니다` | 명령 작업 위치 오류 | `Get-Location`이 `...\GIGACHAD\on-client`인지 확인. `src/server.mjs`·`tools/start-alekov.ps1`이 실제 있는지 확인 |
| `포트 5189 를 다른 프로그램이 쓰고 있습니다` | 포트 충돌 | 이미 켠 앱 PowerShell을 찾아 종료하거나 `-Port 5190`으로 실행하고 브라우저 포트를 맞춘다. 다른 프로그램을 임의 종료하지 않음 |
| 브라우저 연결 실패 | 로컬 서버 미실행·주소/포트 오류 | PowerShell에 `케셰브가 켜졌습니다`가 나왔는지, URL이 `http://127.0.0.1:5189/`인지 확인. HTTP 응답과 AI 연결은 별개 |
| `ENGINE_NOT_CONNECTED` / `연결 없음(disconnected)` | 기존 서버·에이전트 연동 없음 | 정상적인 기본 미연결일 수 있음. 운영자의 `-SdpHostConfig` 준비 여부를 담당자에게 확인. 연결된 척 기록하지 않음 |
| `ENGINE_RESULT_UNVERIFIED` / `CONTRACT_MISMATCH` | 기존 서버 응답 형식·범위 검증 실패 | `다시 불러오기`를 한 번만 사용해 관측. 계속 실패하면 `도움정보 불러오기`로 안전한 오류 코드를 확인해 담당자에게 전달 |
| `SUBJECT_SCOPE_UNVERIFIED` | 사용자·프로젝트·세션 결속 미확인 | 실제 사용자·프로젝트 연결 담당자에게 문의. 접근 허용이나 빈 목록으로 간주하지 않음 |
| `NATIVE_HOST_DISABLED` / `ON_AI_PROVISIONING_PENDING` | 실제 계정·AI 승인 설정 미준비 | `AI 연결`과 `계정 연결 확인`의 제공 안내 읽기. 개인 설정/승인 권한은 담당자가 준비. 자격 원문 요청·노출 금지 |
| `WB_CLCO_TIMEOUT` / `WB_CLCO_RATE_LIMITED` | AI 게이트 응답 지연·요청 제한 | 사용량/연결 상태 확인 후 필요 시 사용자가 직접 다시 점검. 반복 호출하지 않음 |
| `ACTION_UNSUPPORTED` 또는 조치 준비 버튼 없음 | 현재 원천에서 조치 미지원 | `supportedActions=[]`일 수 있으므로 정상. 시험용으로 실제 집행을 강제로 호출하지 않음 |
| `pending` / `unknown` (조치) | 접수됐거나 처리 결과 불명 | ACK를 성공으로 판단 금지. 지원·승인된 상황에서만 `원천 결과만 재조회`. 화면 취소는 원천 집행 취소가 아님 |
| `not_configured` / `not_checked` (OSV) | 프로젝트 설정 부재 / 승인 패키지 없음 | `설치 패키지 조회`에서 미조회 설명 확인. 프로젝트 경로·승인 패키지는 담당자가 준비 |
| `partial` / `unverifiable` / `REQUEST_TIMEOUT` (OSV) | 일부 결과만 받음 / 조회 결과 확인 불가 | 확인된 취약점 ID를 보존하고 미확인과 구분. 직접 재조회가 필요하면 `설치 패키지 조회`; `패키지 조회 취소` 후의 늦은 응답은 제공 코드에서 차단 |

더 상세한 진단 코드는 [제공 오류 안내](CONNECTION_TROUBLESHOOT.md)를 참고한다. 도움정보는 `보호 현황`의 **「도움정보 불러오기」 → 결과 직접 확인 → 「확인했으며 복사합니다」**를 사용한다. 확인하지 않은 비밀 설정 내용은 공유하지 않는다.

## 9. 21단계 문서 따라 하기 — 사용자 직접 확인 체크

**새 PowerShell 창으로 재현하는 검사는 아직 실행하지 않았다.** 다음 순서에 따라 사용자 PC에서 한 항목씩 확인하고 실제 결과를 기록한다.

1. 원래 프로젝트·실행 창을 보존하고 새 PowerShell 창을 연다. 앱 폴더 위치와 `node --version` 출력 확인.
2. `4-2` 실행 명령을 입력한다. 예상: 런처의 `케셰브가 켜졌습니다`와 localhost 주소. 이미 실행 중인 서버와 포트 충돌이 있다면 기존 서버부터 종료하거나 별도 포트 사용.
3. 브라우저에서 `보호 현황`, `업무 앱`, `보안 기록` **실제 버튼 이름** 확인. 기본 `연결 없음`과 오류를 성공으로 기록하지 않는다.
4. `Ctrl+C`로 종료하고 같은 명령으로 다시 실행해 주소와 메뉴가 동일한지 확인.
5. 재현되지 않은 항목은 **미확인**으로 남기고, 오류 코드를 그대로 적는다. `node --version`, 접속 결과, 버튼/경로 일치는 사용자의 후속 검사로 확정한다.

**코드만 확인한 내용과 모의 검사 및 실제 화면 관측을 한 칸에 합쳐 ‘통과’로 기록하지 않는다.**

## 10. 21·22단계 제출 경계

- 이 문서를 추가한 **Git 커밋의 40자리 SHA**와 저장소 주소를 ALEPH **해당 단계 화면**에서 확인하여 제출한다. `21·22`는 현행 `포털 제출 준비` 지원 범위(13~20)와 다르다.
- Git 커밋 및 원문 제출은 **`GIGACHAD` 최상위**에서 수행한다. 작성·저장만 하고 커밋되지 않은 문서는 제출 대상이 아니다.
- **비공개 저장소라면** 해당 단계 안내의 **「비공개 저장소 원문 준비 방법」 → 「원문 전달 도구 받기」**를 사용한다. ZIP 해제 위치와 결과 JSON 위치는 프로젝트 밖으로 정하며, 도구의 정확한 `student-source-cli.mjs` 명령은 현재 ALEPH 화면에서 제공한 원문을 사용한다. 이 문서에서 실행 옵션이나 경로를 추측해 만들지 않는다.
- 원문 전달 완료와 AI 검토 통과·공식 진도는 다르다. 자동 점검이나 제출은 문서 작성자가 대신 실행하지 않았다.
- 사용자 프로젝트의 실제 집행·유료 모델·재현 기록 미완료 상태에서는 **v1.0 완료**라고 표시하지 않는다. 다음 22단계의 같은 최종 소스 누적 재현과 공식 승인도 별도 확인해야 한다.

## 11. 대조한 주요 저장소 원문

- `on-client/package.json`, `on-client/.env.example`, `on-client/tools/start-alekov.ps1`
- `on-client/public/index.html`, `on-client/public/app.js`, `on-client/student/extension.mjs`
- `on-client/src/server.mjs`, `on-client/src/engine.mjs`, `on-client/src/engine/sdp-host.mjs`
- `on-client/src/vulnerabilities/project-scan.mjs`, `on-client/public/vulnerabilities-view.mjs`
- `on-client/.on-starter-manifest.json`, `on-client/docs/STUDENT_PROMPTS.md`
- `on-client/docs/STUDENT_LAUNCH_GUIDE.md`, `on-client/docs/CONNECTION_TROUBLESHOOT.md`

이 문서는 **실행 위치·구성도·코드 경계·장애 대응·검증 한계**를 기록한 학생 작성 산출물이다. 제공 파일은 수정하지 않았다.
