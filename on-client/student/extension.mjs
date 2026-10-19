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
      const stateText = (value, dictionary) => {
        const code = typeof value === 'string' ? value : 'unknown';
        const label = Object.hasOwn(dictionary, code) ? dictionary[code] : dictionary.unknown;
        return `${label}(${code})`;
      };

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
    renderDecision({ status = 'idle', mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '업무 앱 접근 판정 결과');
      const addLine = (label, value) => {
        const line = document.createElement('p');
        line.textContent = label ? `${label}: ${value}` : value;
        root.appendChild(line);
      };
      const safeText = value => typeof value === 'string' && value.trim() ? value : '확인 불가';
      const modeNames = {
        connected: '연결됨',
        demo: '예제 자료(demo) · 실제 연결 아님',
        disconnected: '연결 없음(disconnected)',
        unknown: '연결 상태 확인 불가(unknown)',
      };
      if (mode && Object.hasOwn(modeNames, mode)) addLine('연결 상태', modeNames[mode]);

      if (status === 'idle') {
        addLine('', '앱을 골라 접속을 요청하세요.');
        return root;
      }

      const selectedAppId = appId ?? data?.appId;
      if (selectedAppId != null) addLine('업무 앱 ID', safeText(selectedAppId));

      if (status === 'loading') {
        addLine('요청 상태', '판정 확인 중');
        return root;
      }

      if (status === 'error') {
        addLine('요청 상태', `요청 실패: ${safeText(error?.message)}`);
        addLine('안내', '요청 실패는 접근 거부(deny) 판정이 아닙니다. 접근 허용으로 간주하지 마세요.');
        return root;
      }

      if (status !== 'ok' || !data || typeof data !== 'object') {
        addLine('접근 판정', '확인 불가(unknown)');
        addLine('안내', '접근 허용 여부를 확인할 수 없습니다. 허용으로 간주하지 마세요.');
        return root;
      }

      const labels = {
        allow: '접근 허용',
        deny: '접근 거부',
        challenge: '추가 확인 필요',
        unknown: '확인 불가',
      };
      const code = Object.hasOwn(labels, data.decision) ? data.decision : 'unknown';
      addLine('접근 판정', `${labels[code]}(${code})`);
      addLine('판정 이유', safeText(data.reason));
      addLine('판정 시각', safeText(data.checkedAt));

      if (code === 'allow') {
        addLine('안내', '정책상 접근 허용이며 실제 업무 앱 접속 성공을 보장하지 않습니다.');
      } else if (code === 'challenge') {
        addLine('안내', '추가 인증 또는 확인이 필요합니다. 이 앱은 확인 절차를 대신 수행하지 않습니다.');
      } else if (code === 'unknown') {
        addLine('안내', '판정을 확인할 수 없습니다. 접근 허용으로 간주하지 마세요.');
      }
      return root;
    },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
