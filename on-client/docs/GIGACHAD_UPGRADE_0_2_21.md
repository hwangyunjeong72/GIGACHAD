# 기가차드 · 0.2.21 시작 틀 업데이트 대조 및 복원 기록

> 작성: 2026-10-28 (KST). **원문/모의/로컬 실행 확인**과 사용자 Windows PC의 실제 검증을 구분한다. 최신 GitHub 제출본의 해시는 새 커밋을 만든 뒤 GitHub에서 확인한다.

## 1. 비교 기준과 보존 범위

| 입력 자료 | 확인된 상태 |
|---|---|
| `alekov-starter-0.2.21.zip` | 제공 버전 `0.2.21`. ZIP 무결성 검사 통과. SHA-256 `289a109cfc38e7963b9f973a381cf81aec552c0f1ffca59c9a354585e7c511da` |
| 사용자가 업로드한 `GIGACHAD.zip` | **스타터와 공통 경로의 파일 바이트가 모두 같음.** 그 밖에 이전 2~5일차 코드/문서/테스트 등 학생 고유 경로 14건이 있음. ZIP SHA-256 `69e5913326296b3c9dc67f1cdb22097f03b7558f9eb218d4ccf19c6602da1773` |
| 이전 GitHub `main` | 커밋 `c926ed23f02d71feda12a7d820728e4dfcd677b0`, 스타터 `0.2.11` 기반. 학생 `extension.mjs` 8개 렌더러와 2~5일차 로컬 조회·안내가 커밋돼 있음. |

업로드 ZIP 속 `.git` 디렉터리는 추출/복사하지 않았다. GitHub 이력과 이전 작업 폴더는 그대로 두고, **별도 Git 복제본**에서 변경을 만들었다. 이전 학생 파일을 ZIP의 제공용 빈 틀로 덮지 않는다. 이번 작업은 제공 ZIP을 비교한 수동 병합이며, 공식 업데이트 도구의 신뢰된 `baseline-manifest-sha256` 영수증을 검증해 적용한 것으로 주장하지 않는다.

## 2. 파일·기능별 대조

| 영역 | 0.2.11/GitHub 이전 상태 | 0.2.21 결과와 한계 |
|---|---|---|
| 학생 13~22단계 | `student/extension.mjs` 약 60KB, `renderIdentity`·`renderDecision`·`renderEvents`·`renderStatus`·`renderVulnerabilities`·`renderAiConnection`·`renderExplanation`·`renderAction` | 업로드 ZIP에는 1.3KB의 구현 대기 틀만 있었으나 **GitHub 학생 구현을 복구/보존**. 제공 데이터 계약의 새 실연결은 아직 검증하지 않음. |
| 제공 서버·공통 UI | 0.2.11 실행 경로 | 0.2.21의 `src/**`, `public/app.js` 등 제공 코드를 사용. 원래 학생용 함수·버튼 이름을 바꾸거나 실제 보안 조치를 추가하지 않음. |
| 2일차 PC 측정 | 학생 `/api/pc-status`, CPU·메모리·디스크·직전 비교 | 새 제공 `/api/pc/status` (`aleph.on.pc-status.v1`)에서 CPU·메모리·디스크·시간을 읽음. **학생 상단 4카드와 최근 두 측정 비교**를 새 `student/extension.mjs`로 복원. |
| 3일차 네트워크·Windows | 학생 `/api/windows-observation`, 어댑터/IP·방화벽·System/Application 개별 집계 | 새 제공 조회에서 인터페이스/IPv4 **개수**, 방화벽 프로필, **두 로그 합산** 경고·오류를 읽음. 이전 개별 어댑터/IP·로그별 건수를 새 서버가 제공한다고 주장하지 않음. 구형 학생 소스 파일은 보존하되 실행 화면에는 중복 연결하지 않음. |
| 4일차 다시 조회·오류 | `PC 상태 다시 조회`·`Windows 상태 다시 조회` | 학생 `PC 요약 다시 조회`: 대기/확인 불가/부분 성공/직전 비교. 제공 `내 PC 확인`·`10초마다 확인`: 읽기 전용 6항목/미확인 이유. 구버전 버튼·API가 계속 존재한다고 쓰지 않음. |
| 5일차 인수인계 | 단순 포장본의 `START-HERE.txt`와 `.cmd`·`.lnk` 안내 | [0.2.21 한 장 안내](GIGACHAD_DAY5_QUICK_START.md)를 **소스 실행 기준**으로 수정. 다른 사람이 직접 실행한 결과는 아직 미확인. |
| 선택 꾸밈 | `student/appearance.json` 없음 | 0.2.21에서 선택적 제공 경로가 생김. 승인된 꾸밈 자료가 없으므로 생성하지 않음. |

이전 `public/pc-status.mjs`, `public/windows-observation.mjs`, `src/windows-observation.mjs`는 **히스토리/학생 작성 근거로 보존**한다. 새 제공 서버는 `/api/pc-status`와 `/api/windows-observation`을 제공하지 않으므로 그 경로의 구형 화면·모의 테스트를 현재 실연결 성공으로 표시하지 않는다.

## 3. 실행 및 검사 기록

| 분류 | 검사·관찰 결과 | 한계 |
|---|---|---|
| 원문 대조 | 두 ZIP 무결성 확인; 업로드한 GIGACHAD의 공통 파일과 0.2.21 스타터가 동일 | ZIP 해시는 배포 주체를 인증하는 서명이 아님 |
| 실행 문법 | `npm run check` 및 `node --check` 확인 | 브라우저 전체 사용자 시나리오는 별개 |
| 모의 단위 검사 | `tests/pc-status.test.mjs`, `tests/windows-observation.test.mjs`: 0.2.21 응답 계약/실패 상태와 학생 기존 로직 검사 | 실제 Windows 권한·이벤트 읽기 검증 아님 |
| 로컬 서버 HTTP | `/`, `/student/extension.mjs`, `/pc-status-view.mjs`, `/student/appearance.css`, `/api/pc/status` 모두 200 | 실행은 Linux 격리 환경. 사용자 PC의 측정값이 아님 |
| 구형 API 확인 | `/api/pc-status`와 `/api/windows-observation`은 **404** | 기존 단위 테스트 통과와 이 API의 실제 사용 가능성은 구분 |
| 실제 보안 조치·SDP·AI | **미확인**, 승인/운영 집행을 실행하지 않음 | 공식 판정/운영 인증/v1.0 자동 인증 아님 |

## 4. 기본 포장 계약은 이전 버전과 다르다

0.2.11의 `npm run package-app`은 새 폴더에 Git 추적 소스와 `GIGACHAD-start.cmd`를 복사했다. **0.2.21의 기본 포장**은 `--source`·`--out`과 승인된 256×256 PNG 아이콘 또는 유효한 `student/appearance.json`을 요구한다. 기본 `alekov.install-package.v2` 전체 앱 구성에는 담당자가 제공한 **승인 실행 환경**도 필요하며, 준비되지 않으면 `PROVIDED_RUNTIME_NOT_INSTALLED` 등으로 멈춘다. 임의 `runtime.zip`이나 서명 파일을 만들어 우회하지 않는다.

실행형 패키지의 실제 Windows 설치·바로가기·서명 검증을 이 환경에서 확인하지 않았다. `--app-only-v1`은 다른 호환 포장 형식으로, 기본 포장의 성공을 대체하지 않는다. [제공 포장 안내](PACKAGE_APP.md)를 따른다.

## 5. Windows 사용자가 직접 확인할 순서

1. Git 저장소에서 현재 작업이 보존돼 있는지 `git status --short`로 확인한 후 새 커밋을 받고, `on-client`에서 `node --version`, `npm run check`를 실행한다.
2. `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1`로 실행해 `http://127.0.0.1:5189/`을 연다.
3. 학생 **4카드** 및 **제공 내 PC 상태**를 구분하고, 각각 수동 조회한다. 실제 조회 시각/단위와 `확인 불가` 이유를 확인한다. SDP는 별도 상태다.
4. Windows 방화벽·최근 경고/오류는 **읽기 전용**이며 침해 판정이 아님을 확인한다. Ctrl+C로 종료한 뒤 다시 실행한다.
5. 다른 사용자에게 안내만 주고 막힌 단계·정확한 오류 문구·수정 후 재시도 결과를 받는다. **현재 학생 진술/실기록은 미확인**이다.

기존 13~22단계 제출/판정 기록은 이 업데이트로 바뀌지 않는다. 이전 커밋의 통과 결과와 이번 커밋의 소스 검사 결과를 합쳐 전 항목 검증 성공이라고 주장하지 않는다.
