# 기가차드 · 3일차 「네트워크·방화벽·Windows 기록」 읽기 전용 조회

> 코드 작성·모의 검사 환경: 2026-10-27. 실제 사용자 Windows PC에서의 권한·로그 조회 및 SDP 접속은 **미확인**이다. 이 기록은 이미 낸 13~22단계 제출/판정과 별개다.

## 1. 제공 기능과 학생 변경

| 구분 | 경로 | 동작 |
|---|---|---|
| 제공·보존 | `public/app.js`, `student/extension.mjs`, 기존 `/api/events`·`/api/diagnostics` | 13~22단계 SDP/예제/미연결 상태 및 앱 사건 기록. **Windows 로그와 다른 데이터** |
| 2일차 학생 측정 재사용 | `src/pc-status.mjs`, `public/pc-status.mjs`, `/api/pc-status` | 실제 로컬 CPU(%), 메모리(GiB), 앱 드라이브 사용 가능 공간(GiB), 시각 및 직전 2표본 비교 |
| 3일차 학생 추가 | `tools/read-windows-observation.ps1`, `src/windows-observation.mjs` | Windows 일반 권한으로 네트워크·방화벽·System/Application 이벤트 합계 조회. 네 가지를 독립 실패 처리 |
| 3일차 표시 | `public/windows-observation.mjs`, `public/index.html`, `public/style.css` | 상단 네 상태 카드, 아래 PC 측정 비교와 Windows 조회·기록. createElement/textContent, 텍스트 상태 포함 |
| 최소 서버 연결 | `src/server.mjs` | 별도 `GET /api/windows-observation` 및 정적 UI 모듈 제공. SDP 현재 구성/응답 검증 여부를 PC 결과와 분리 |
| 검증 | `tests/windows-observation.test.mjs` | 입력 모의 테스트: 정상 0건, 권한 거부, 미지원 OS, 형식 오류/예외 |
| 포장 | `package.json`, `tools/package-app.mjs`, `tools/create-shortcut.ps1` | 커밋된 Git 추적 소스만 새 외부 폴더로 복사하고 CMD·Windows .lnk 바로가기 생성 |

## 2. 수집 계약·단위·시각

| 항목 | 근거·정확한 의미 | 상태와 단위 |
|---|---|---|
| 네트워크 | `Get-NetAdapter` 상태 및 `Get-NetIPConfiguration -All` IPv4·기본 게이트웨이. 화면에는 인터페이스 최대 32개 및 전체 개수 | 실제 조회/확인 불가; 어댑터 `개`, 연결됨·연결 안 됨 등 원 상태, `measuredAt` |
| 방화벽 | `Get-NetFirewallProfile -PolicyStore ActiveStore` Domain/Private/Public `Enabled`, 기본 수신/송신 동작. 규칙 자체의 안전성이나 차단 효과는 판단하지 않음 | 실제 조회/확인 불가; 켜짐·꺼짐과 기본 동작, `measuredAt` |
| Windows 이벤트 | `Get-WinEvent -ListLog`, `Get-WinEvent -FilterHashtable`로 System·Application 두 로그에서 **지난 24시간** Level 2(오류), Level 3(경고) 합계만 계산. 원문 메시지·개별 이벤트는 전송/저장하지 않음 | 각각 `건 / 24시간`; `windowStart`, `windowEnd`, `measuredAt` |
| SDP 서버 | 설정/어댑터의 존재와 실제 인증된 원격 응답을 구분한다. 기본/예제 실행에서 SDP host가 없으면 `SDP 미연결`; host가 있어도 조회 성공을 입증하지 않으면 `확인 불가` | PC 측정과 다른 상태, `checkedAt` |

- 조회 API의 원천은 **앱을 구동한 PC**다. 샌드박스·리눅스에서 실행했을 때 Windows 값이나 사용자 개인 PC 수치를 지어내지 않는다.
- 각 항목이 실패하거나 권한이 없으면 `status: unavailable`, `measuredAt: null`, 안전한 `reason` 코드를 반환한다. 0을 대신 반환하지 않는다. 실제 정상 조회 중 0건이면 0건으로 표시한다.
- Windows 조회 실패 이유는 접근 권한 부족, 읽기 명령 미지원, 비활성 로그, 조회 오류, 시간 초과, 형식 검증 실패 등으로 구분한다. 관리자 권한 요청, PowerShell 정책/방화벽 변경, 설정 수정, 이벤트 삭제, 공격·침투 시뮬레이션을 하지 않는다.
- 화면에는 항목별 측정 완료 시각을 **KST**로 표시한다. `checkedAt`은 서버가 응답을 구성한 시각이다. 장기간 이벤트 추세·침해 여부·PC 보안 적합성은 판정하지 않는다.
- **System·Application의 Windows 경고/오류 건수는 침해·공격 탐지 결과가 아니다.** 기존 SDP 보안 기록(/api/events)은 범위·출처·검증 방법이 달라서 합산하지 않는다.
- `npm run demo`에서 원래 예제 XDR 신원/사건이 표시될 수 있어도 이 API는 예제값을 반환하지 않는다. Windows가 아니면 각 Windows 항목을 `확인 불가 · Windows 운영체제 아님`으로 표기한다.

## 3. 읽기 전용·권한 범위

- `tools/read-windows-observation.ps1`은 네 가지 고정 Section만 받고 값/설정을 바꾸는 명령을 포함하지 않는다. 외부 주소·인증서를 입력받거나 관리자 권한으로 다시 시작하지 않는다.
- Node.js는 로컬 PowerShell을 셸 없이 실행하고 8초 제한 및 크기 제한을 둔다. 각 조회의 실패가 다른 조회의 성공을 0건으로 바꾸지 않는다.
- 원시 이벤트/이벤트 메시지, 토큰, 암호, MAC 주소, 프로세스 목록, 개인 SDP 자격 파일, PowerShell 예외의 원문을 브라우저 응답이나 콘솔에 넣지 않는다.
- PowerShell 실행 정책이 스크립트를 막으면 억지로 우회하거나 전역 설정을 바꾸지 않는다. 기존 앱 시작용 PowerShell 명령의 `-ExecutionPolicy Bypass`는 기존 학생 실행 도구의 한 프로세스에만 한정되며 새로운 관측 스크립트에는 사용하지 않는다.
- SDP `connected`라는 기존 어댑터 표시는 **실제 SDP 인증 응답 성공과 동일하지 않다**. 추가 상태 카드는 증거가 없으면 미확인이라고 적는다.

## 4. Windows PC에서 재현하는 순서 (일반 권한)

기존 `GIGACHAD\on-client` 폴더에서 PowerShell을 열고 순서대로 실행한다. `관리자 권한으로 실행`을 선택하지 않는다.

```powershell
node --version
npm run check
node --test tests/pc-status.test.mjs tests/windows-observation.test.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

브라우저에서 `http://127.0.0.1:5189/` → `보호 현황`을 연다.

1. 맨 위 CPU(%), 메모리(GiB), 디스크(GiB), **SDP 연결** 네 카드를 확인한다. 전자의 성공과 SDP 접속을 혼동하지 않는다.
2. `Windows 상태 다시 조회`를 눌러 네트워크 상태, 방화벽 프로필, System·Application 각각의 경고·오류 건수와 조회 시각·단위를 확인한다.
3. 권한/OS/명령/로그가 막힌 경우 해당 칸의 `확인 불가`와 사유를 기록한다. 0건은 실제 성공 응답에서만 인정한다.
4. Windows 기록 위의 ‘침해·공격 탐지 결과가 아님’ 문구와 예제 데이터 분리 안내를 확인한다.
5. 앱 실행 PowerShell 창에서 `Ctrl+C`로 종료한다. 재실행 후 동일하게 조회한다.

기본 포장은 **변경 커밋 이후** 다음 명령 한 줄로 만든다.

```powershell
npm run package-app
```

출력에 표시되는 새 `GIGACHAD-packages\GIGACHAD-release-...` 폴더를 연다. Windows라면 `GIGACHAD-launch.lnk` 바로가기를, 없으면 `GIGACHAD-start.cmd`를 사용한다. 설치 프로그램은 아니다. Node.js와 필요한 개인 접속 설정은 별도로 준비해야 한다. 패키지/예전 제출물/인증 파일은 삭제·이동·수정하지 않는다.

## 5. 점검 기록 및 미확인

| 범위 | 방법 | 결과 | 한계 |
|---|---|---|---|
| 코드 구문 | Node.js v24.22.1에서 `npm run check`, 신규 모듈 `node --check` | **PASS (2026-10-27)** | Windows PowerShell 구문은 실제 Windows에서 미실행 |
| 성공/권한 거부/미지원/잘못된 응답 | `node --test tests/pc-status.test.mjs tests/windows-observation.test.mjs` (**모의 입력**) | **PASS (2026-10-27)** | 실제 Windows 로그가 아님 |
| HTTP 응답·UI 소스 제공 | Linux 실습 환경의 `127.0.0.1:5189`에서 `GET /`, 새 JS, `/api/pc-status`, `/api/diagnostics`, `/api/windows-observation` | **HTTP 200 (2026-10-27)** | Windows 4항목 `WINDOWS_ONLY`·SDP `NO_SDP_CONFIG`를 검증했으며 사용자 PC 실측 아님 |
| 실제 Windows 네트워크·방화벽·System·Application | 사용자 PC 일반 권한 | **미확인** | 학생 PC에서 직접 재현·관찰 필요 |
| 실제 SDP 원격 인증/운영 보안 조치 | 실환경 | **미확인/미실행** | PC 조회나 앱 시작이 연결/집행 증명 아님 |

마지막 커밋 해시는 최종 GitHub 반영 후 재현 기록에서 직접 확인한다. 이 문서·원문 검토와 실제 Windows PC 실행 검증은 별개다.
