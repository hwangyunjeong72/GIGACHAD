# 기가차드 · 릴리스/지원 범위 기록 (22단계)

| 항목 | 현재 상태 |
|---|---|
| 프로젝트 이름 | 기가차드(GIGACHAD); 제공 화면/런처의 기본 표시는 `케셰브`로 남음 |
| 소스 저장소·브랜치 | `https://github.com/hwangyunjeong72/GIGACHAD` · `main` |
| 22단계 작업 시작 기준 SHA | `985ba7a33a1ffc9de05ee38902dee36ccf5d3966` |
| 패키지 버전 | `on-client/package.json`의 `0.2.11` (시작 틀; v1.0 아님) |
| 릴리스 단계 | **검증 중인 버전** — 최종 수료/운영 인증 미확정 |
| 최종 제출 SHA | 22단계 문서 변경을 포함한 커밋을 GitHub에 올린 뒤 `git rev-parse HEAD`로 추출. 제출 화면의 SHA와 일치해야 함 |
| 예비 점검 환경 | 2026-10-23, Linux/Node `v24.19.0`/npm `11.9.0`, 포트 `5192`의 로컬 HTTP |
| 제한적으로 확인한 내용 | 학생 JS 구문 검사 통과, 기본 정적 화면 HTTP 200, 기본 API `ENGINE_NOT_CONNECTED`, 예제 API `demo`, OSV `not_configured`, 종료·재실행 뒤 동일 미연결 응답 |
| 미확인 | Windows PowerShell/브라우저 전체 조작, 실제 SDP·XDR·AI·조치 효과·OSV 조회, 운영 DB 백업/복원, 21·22단계 공식 접수/통과 |

13~21단계별 시각·근거·미확인 사유, 새 환경 Git 복제 절차, 데이터 보존/복원 한계는 [STAGE22_REPRODUCTION.md](STAGE22_REPRODUCTION.md)에 기록했다. 이 문서의 점검 결과는 **작업 시작 기준 SHA의 예비 관찰**이며, 최종 SHA의 별도 복제·검증 기록과 혼동하면 안 된다.

`src/server.mjs`의 API 응답이 표시하는 `meta.starterVersion="0.1.0"`과 `package.json`의 `version="0.2.11"`은 현재 원문에 함께 존재한다. 이 과제에서 제공 서버/버전 코드를 수정하지 않으며, 두 표시값을 같은 버전이라고 가정하지 않는다.

v1.0 완료를 선언하려면 동일 최종 커밋의 누적 재현과 운영 준비(특히 19단계 실제 집행 연결) 및 공식 수용이 별도로 확인돼야 한다. AI 원문 검토는 코드를 실행한 증빙이 아니다.
