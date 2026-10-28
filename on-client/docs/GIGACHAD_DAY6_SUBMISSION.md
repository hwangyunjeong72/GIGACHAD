# 기가차드 · 6일차 커밋 및 GitHub 제출 안내 (포장하지 않음)

> 기준일: 2026-10-28 (KST) · 프로젝트: `https://github.com/hwangyunjeong72/GIGACHAD` · 브랜치: `main` · 시작 틀: `0.2.21`

## 이번 단계의 결정과 보존 범위

- **`npm run package-app`은 실행하지 않는다.** 수강생 PC에 승인 실행 환경이 아직 준비되지 않았으며, 포장용 파일을 별도로 받거나 설치하지 않는다. 포장 실패나 명령 미표시는 6일차 과제 실패로 판정하지 않는다.
- **기본 실행은 프로젝트 폴더에서 수행한다.** `on-client` 폴더의 `tools/start-alekov.ps1` 또는 `npm start`로 로컬 서버를 켠다. 설치형 바로가기 생성은 이번 단계의 확인 대상이 아니다.
- 기존 Git 이력·학생 코드·2~5일차 실행 기록·기존 제출물은 삭제하거나 이동하지 않는다. 이번 단계에서는 학생 화면과 제공 서버·보안 설정을 바꾸지 않고 **문서만 갱신한다.**
- 관제 대시보드의 학생 상단 네 카드는 CPU·메모리·디스크·SDP 별도 상태를 나타낸다. 아래 제공 PC 상태에서는 네트워크·방화벽·Windows 이벤트도 확인한다. **PC 조회 성공은 SDP 접속 성공을 뜻하지 않는다.**

## 처음 보는 사람의 확인 순서

1. Windows에서 **기존 Git 저장소의 최상위 폴더**를 연다. 탐색기 주소창에 `powershell`을 입력해 일반 권한으로 실행한다.
2. `git status --short`를 실행한다. 이미 수정 중인 파일이 있으면 내용을 먼저 살피고, 다른 사람의 작업을 삭제하거나 덮어쓰지 않는다.
3. 앱을 직접 확인하려면 `cd on-client`, `node --version`, `npm run check`를 차례로 실행한다. **이 단계에서 포장 명령은 사용하지 않는다.**
4. `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1`를 실행한 뒤 `http://127.0.0.1:5189/`을 연다. **PC 요약 다시 조회**와 제공 **내 PC 확인**을 각각 눌러 단위·측정 시각·확인 불가 이유를 확인한다.
5. 실행 창에서 `Ctrl+C`로 종료한다. 다시 시작해 같은 화면과 재조회 동작을 확인한다. 실제 Windows PC에서 진행하지 않았다면 **미확인**으로 남긴다.
6. `cd ..`로 다시 Git 최상위 폴더로 돌아와 아래 제출 명령을 진행한다.

## Git 제출 명령 (Git 최상위 폴더에서 한 줄씩)

변경 목록을 먼저 확인한다. 예상 밖의 파일이 있다면 **커밋하기 전에** 내용을 확인한다.

```powershell
git status --short
git diff -- on-client/README.md on-client/docs/RELEASE_STATUS.md
```

**6일차 문서 세 개만** 준비할 때의 예시다. 다른 날의 미완료 변경은 자동으로 포함하지 않는다.

```powershell
git add on-client/README.md on-client/docs/RELEASE_STATUS.md on-client/docs/GIGACHAD_DAY6_SUBMISSION.md
git diff --cached --name-only
git commit -m "docs: record GIGACHAD day-six no-package submission"
git push origin main
git rev-parse HEAD
```

마지막 명령은 **실제로 커밋한 40자리 해시**를 출력한다. 이 문서 안에 미래의 커밋 SHA를 고정해 적으면 커밋할 때 값이 다시 달라지므로, 제출 직전에 나온 값을 GitHub `main`의 최신 커밋과 비교한다. 제출할 때는 저장소 URL·브랜치·그 40자리 값을 함께 적는다. 이전 단계의 커밋과 이번 단계의 검사를 합쳐 하나의 검증 성공으로 표시하지 않는다.

`git push`가 거부된다면 `--force`를 사용하지 않는다. 먼저 `git status --short`로 미완료 변경을 확인하고, `git fetch origin main` 및 `git log --oneline --left-right HEAD...origin/main`으로 원격 커밋과 차이를 살핀다. 해결 방향이 불명확하면 오류 원문을 담당자에게 공유한다. 권한·승인 오류는 우회하지 않는다.

## 실제 값·예제 및 검증 범위

| 구분 | 이번 단계에 적을 상태 | 근거·한계 |
|---|---|---|
| 코드·문서 | 원문 확인 | `package.json` `0.2.21`, 기존 학생 영역, 실행 안내 확인 |
| 로컬 단위 검사 | **2026-10-28 소스 검사 통과** | 격리 Linux/Node `v24.22.1`/npm `11.9.0`: `npm run check` 성공, PC 조회 테스트 6/6, Windows 관찰 테스트 8/8 통과. 모의·계약 검사이며 실제 Windows 조회가 아님 |
| 실제 사용자 PC 측정 | **미확인** | 이 문서의 예제 수치나 Linux 환경의 수치를 본인 PC 측정으로 제시하지 않음 |
| Windows 방화벽·이벤트 | **사용자 PC 재확인 필요** | 읽기 전용. 권한 거부는 `확인 불가`, 이벤트 건수는 침해·공격 판정 아님 |
| SDP·AI·보안 조치의 실제 연결 | **미확인** | 학생 화면·예제 응답·원문 검토는 실제 운영 검증이 아님 |
| 포장·설치형 앱·바로가기 | **미실행(6일차 과제 범위 밖)** | 승인 실행 환경을 임의로 설치하거나 만들지 않음 |

**검사 결과와 제출 커밋은 해당 명령이 성공한 뒤 실제 출력으로만 확정한다.** 6일차의 GitHub 커밋 확인은 22단계 원문 검토 통과·운영 인증·v1.0 출시와 별개다.
