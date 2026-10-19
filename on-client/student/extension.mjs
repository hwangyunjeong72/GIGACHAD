// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      // 매 호출마다 새로운 DOM을 구성한다. 이전 계정·기기·세션 값은 보관하지 않는다.
      const root = document.createElement('section');
      root.setAttribute('aria-label', '현재 계정·기기·세션 상태');
      const text = value => typeof value === 'string' && value.trim() ? value : '확인 불가';
      const deviceState = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionState = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const modeState = {
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const line = (parent, label, value) => {
        const p = document.createElement('p');
        p.textContent = `${label}: ${value}`;
        parent.appendChild(p);
      };
      const stateText = (value, dictionary) =>
        Object.hasOwn(dictionary, value) ? dictionary[value] : dictionary.unknown;

      const resources = [
        { title: '현재 계정 및 로그인 정보', name: 'me', resource: me },
        { title: '본인 기기 목록', name: 'devices', resource: devices },
        { title: '로그인 세션 목록', name: 'sessions', resource: sessions },
      ];
      for (const { title, name, resource } of resources) {
        const section = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);

        const mode = modeState[resource?.mode];
        if (mode) line(section, '연결 모드', mode);
        if (resource?.status === 'loading') {
          line(section, '상태', '불러오는 중');
        } else if (resource?.status === 'error') {
          const message = text(resource.error?.message);
          line(section, '상태', `연결 실패: ${message}`);
        } else if (resource?.status !== 'ok' || !resource.data) {
          line(section, '상태', '확인 불가');
        } else if (name === 'me') {
          const { user, device, session } = resource.data;
          if (!user || !device || !session) {
            line(section, '상태', '확인 불가');
          } else {
            line(section, '사용자', text(user.label));
            line(section, '사용자 ID', text(user.id));
            line(section, '현재 기기', text(device.label));
            line(section, '기기 ID', text(device.id));
            line(section, '기기 보안 상태', stateText(device.status, deviceState));
            line(section, '세션 ID', text(session.id));
            line(section, '로그인 세션 상태', stateText(session.status, sessionState));
          }
        } else if (!Array.isArray(resource.data)) {
          line(section, '상태', '확인 불가');
        } else if (resource.data.length === 0) {
          line(section, '상태', name === 'devices' ? '표시할 기기 없음' : '표시할 세션 없음');
        } else {
          const list = document.createElement('ul');
          for (const item of resource.data) {
            const li = document.createElement('li');
            if (name === 'devices') {
              li.textContent = `기기 ${text(item?.label)} (ID: ${text(item?.id)}) · ${stateText(item?.status, deviceState)}`;
            } else {
              li.textContent = `세션 ID: ${text(item?.id)} · ${stateText(item?.status, sessionState)}`;
            }
            list.appendChild(li);
          }
          section.appendChild(list);
        }
        root.appendChild(section);
      }
      return root;
    },
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
