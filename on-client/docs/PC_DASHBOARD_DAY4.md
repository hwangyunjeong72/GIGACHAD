# 기가차드 · 4일차 관제 대시보드와 다시 조회·오류 안내

> 2026-10-27 학생 작업 기록. 이 문서는 로컬 소스/모의 검증과 사용자 Windows PC의 직접 관찰을 구분한다. 실제 Windows PC 검사와 SDP 실연결은 별개이며 미확인이다.

## 1. 먼저 확인한 학생·제공 경계

- `student/extension.mjs`의 `createStudentView()`는 제공 `public/app.js`가 넘기는 **기존 학생 함수의 입력만** 처리한다. 이번에는 `renderStatus({devices,sessions,notifications,diagnostics,mode})`에서 기기·세션, 주의 알림, 연결 진단 세 가지를 학생 카드로 먼저 요약하고, 기존 목록·도움정보 복사·오류 지침은 보존했다. 입력에 없는 CPU·방화벽·Windows 로그 값을 상상하지 않는다.
- `student/appearance.json`은 기존 저장소에 없으며 현재 `public/app.js`와 구성 문서에 이 파일을 읽는 계약도 없다. 단순히 추가해 적용되었다고 주장하지 않는다.
- 제공 파일 `public/app.js`는 변경하지 않았다. 학생이 추가한 `public/pc-status.mjs`와 `public/windows-observation.mjs`, 해당 HTML/CSS만 기존 관제 화면에서 개선했다. **공식 별도 설치 도구**에 공통 화면 변경이 자동 반영된다고 주장하지 않는다.
- 이 저장소의 **기본 포장** `npm run package-app`은 Git 추적 `public`, `student`, `src` 등을 새 폴더에 포함하므로 이 소스 기반 실행에서는 두 범위의 변경이 함께 동작한다. 이는 다른 설치 도구의 지원 계약이나 사용자 Windows PC 동작 검증을 대신하지 않는다.

## 2. 상단 우선 기능 세 가지와 SDP 네 번째 카드

1. **PC 자원**: CPU(%, 500ms 간격의 두 표본), 메모리 사용량(GiB), 앱 드라이브의 사용 가능 공간(GiB) 및 항목별 측정 시각. 예시 값 대신 실제 로컬 조회만 표시한다.
2. **네트워크·방화벽**: 어댑터 연결/IP/게이트웨이와 방화벽 프로필의 읽기 전용 설정. 권한·미지원·시간 초과는 확인 불가로 둔다.
3. **Windows 기록**: System·Application의 최근 24시간 경고·오류 건수(건), 집계 구간과 조회 시각. **침해·공격 탐지 결과가 아니다.**

상단 네 번째 카드는 독립된 **SDP 서버 연결**로 유지한다. 기본/예제 모드에 SDP 설정이 없으면 `SDP 미연결`이고, 설정이 있으나 실제 응답을 확인하지 못했다면 `확인 불가`다. PC 조회 성공으로 SDP 연결 성공을 주장하지 않는다.

## 3. 다시 조회와 오류 화면

| 버튼 | 실제 요청 | 대기 상태 | 실패 시 다음 행동 |
|---|---|---|---|
| `PC 상태 다시 조회` | GET `/api/pc-status` | 버튼 잠금·`PC 상태 조회 중…`·aria-busy | 실패한 CPU/메모리/디스크 이름, 값·시각 확인 불가 원인 및 로컬 앱 확인·재조회 안내 |
| `Windows 상태 다시 조회` | GET `/api/windows-observation` | 버튼 잠금·`Windows 상태 조회 중…`·aria-busy | 네트워크/방화벽/System/Application 각각의 실패 이유와 **일반 사용자 권한 범위 내** 다음 행동 |
| 기존 `다시 불러오기` | 제공 앱 데이터 API | 기존 제공 UI 동작 유지 | 제공 함수 계약대로 별도 실패 처리. 이번에 수정하지 않음 |

- 처음 화면이 뜨기 전에는 `조회 중` 또는 `조회 전`으로 표시하고, 가짜 수치·정상 0·성공 아이콘을 만들어 두지 않는다.
- 요청마다 새로 `fetch`하며 오류 응답/타임아웃/형식 실패는 `확인 불가`와 오류 영역(`role=alert`)으로 안내한다. 부분 실패는 다른 정상 측정값을 0으로 바꾸지 않는다.
- 오류 영역은 **항목명 → 확인 불가 이유 → 다음 행동**을 텍스트로 표시한다. 단지 빨간색으로만 오류를 전달하지 않는다.
- DOM은 `createElement`와 `textContent`로 구성한다. 버튼은 `<button type="button">`이며 Tab으로 포커스, Enter/Space로 작동한다. 앱의 기존 포커스 표시를 보존한다.
- 방화벽·Windows 이벤트는 조회만 한다. Windows 권한·방화벽 설정을 바꾸거나 관리자 권한을 요청하지 않는다. 모의 API 실패 검사는 실제 침투/보안 조치를 호출하지 않는다.
- 로컬 Linux/VM에서 읽힌 값은 사용자 Windows PC 실측이 아니다. 실제 측정과 예제/모의 데이터는 별개이며 시간·단위를 함께 기록한다.

## 4. 재현 명령 (기존 앱 폴더 유지)

이미 원본 폴더에서 작업 중이라면 먼저 `git status --short`를 실행하고 예상하지 못한 변경이 있으면 pull을 중단한다. 원본·제출물·인증 파일은 지우거나 옮기지 않는다.

```powershell
git status --short
git pull --ff-only origin main
cd on-client
node --version
npm run check
node tests/pc-status.test.mjs
node tests/windows-observation.test.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

브라우저 `http://127.0.0.1:5189/` → `보호 현황`:

1. 상단 네 카드의 CPU/메모리/디스크와 별도 SDP 상태를 확인한다. 측정된 값에는 단위와 KST 측정 시각이 나온다.
2. Tab으로 `PC 상태 다시 조회`에 이동하여 Enter로 실행하고, 대기 문구 → 결과·시각 갱신을 확인한다.
3. Tab으로 `Windows 상태 다시 조회`에 이동하여 Enter로 실행하고, 네트워크·방화벽·로그 결과와 시각을 확인한다.
4. 조회 오류가 나타나면 실패 항목과 `다음 행동`을 확인한다. 실제 Windows 권한 거부는 0건 성공으로 보이지 않는다. 테스트의 가상 실패값을 실제 오류로 기록하지 않는다.
5. 실행 PowerShell 창에서 Ctrl+C로 종료한다. 포장은 앱 폴더에서 `npm run package-app` 한 줄로 만든다. Windows의 `.lnk` 생성과 실행 여부는 내 Windows PC에서 직접 확인한다.

## 5. 확인 결과와 미확인 사항

| 구분 | 확인 | 미확인/한계 |
|---|---|---|
| 코드·문법 | Node.js 소스 검사 | 실제 Windows UI 시연 아님 |
| PC·Windows 정상/부분 실패/재조회 | `tests/pc-status.test.mjs`, `tests/windows-observation.test.mjs`에서 **모의 응답/DOM** | 실측 Windows PowerShell·사용자 장비 검증 아님 |
| 기존 앱/API와 기본 포장 | 로컬 서버와 커밋 기준 포장 검사 | 공식 설치 도구·운영 SDP 인증 연결 검증 아님 |
| 이벤트 경고·오류 및 권한 실패 | 화면의 의미 구분 구현 | 실제 사용자 System·Application 로그 직접 조회는 미확인 |

최종 GitHub 커밋과 검사 시각·포장 결과는 실제 커밋 반영 뒤 확인해야 한다. 원문 검토를 설치형 앱·운영 인증 성공이라고 표현하지 않는다.
