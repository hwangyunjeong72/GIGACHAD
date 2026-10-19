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
    renderEvents({ status, mode, data, error } = {}) {
      // 제공 UI가 전달한 현재 사용자 범위의 기록만 사용한다. 원본은 변경하지 않는다.
      const root = document.createElement('section');
      root.setAttribute('aria-label', '내 접속 기록과 XDR 경보');
      const addText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.appendChild(node);
        return node;
      };
      const safeText = value => typeof value === 'string' && value.trim() ? value : '확인 불가';
      const names = {
        kind: { access: '접속 기록', xdr: 'XDR 경보' },
        access: { allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' },
        session: { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' },
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' },
      };
      const stateText = (group, code) => {
        const value = typeof code === 'string' && Object.hasOwn(names[group], code) ? code : 'unknown';
        return `${names[group][value] || '확인 불가'}(${value})`;
      };
      addText(root, 'p', '현재 계정에 제공된 최근 보안 기록(최대 40건)입니다. 전체 직원 기록이나 실시간 전체 탐지가 아닙니다.');
      if (mode === 'demo') addText(root, 'p', '예제 자료(demo) · 실제 연결 아님');
      if (mode === 'disconnected') addText(root, 'p', '연결 없음(disconnected)');
      if (mode === 'unknown') addText(root, 'p', '연결 상태 확인 불가(unknown)');

      if (status === 'loading') {
        addText(root, 'p', '보안 기록을 불러오는 중');
        return root;
      }
      if (status === 'error') {
        if (error?.code === 'CONTRACT_MISMATCH') addText(root, 'p', '응답 형식 확인 불가(CONTRACT_MISMATCH)');
        addText(root, 'p', `기록을 불러오지 못했습니다: ${safeText(error?.message)}`);
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        addText(root, 'p', '보안 기록을 확인할 수 없습니다.');
        return root;
      }
      if (data.length === 0) {
        addText(root, 'p', '표시할 기록이 없습니다.');
        return root;
      }

      // 날짜는 입력 그대로 표시하고, 배열만 복사해 최근순으로 정렬한다.
      const ordered = [...data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      const filters = document.createElement('div');
      const createFilter = (title, values, nameForValue) => {
        const label = document.createElement('label');
        label.textContent = title;
        const select = document.createElement('select');
        select.setAttribute('aria-label', title);
        const option = document.createElement('option');
        option.value = 'all';
        option.textContent = '전체';
        select.appendChild(option);
        for (const code of values) {
          const item = document.createElement('option');
          item.value = code;
          item.textContent = nameForValue(code);
          select.appendChild(item);
        }
        select.value = 'all';
        label.appendChild(select);
        filters.appendChild(label);
        return select;
      };
      const kindFilter = createFilter('기록 종류', [...new Set(ordered.map(item => item.kind))],
        code => `${names.kind[code] || '확인 불가'}(${code})`);
      // appId가 없는 옛 기록은 전체 필터에서 보여 주되, 가짜 앱 ID를 만들지 않는다.
      const appFilter = createFilter('업무 앱',
        [...new Set(ordered.map(item => item.appId).filter(id => id != null))],
        code => code);
      const accessFilter = createFilter('접속 상태',
        [...new Set(ordered.map(item => item.state.access))],
        code => stateText('access', code));
      root.appendChild(filters);

      const count = addText(root, 'p', '');
      const list = document.createElement('ul');
      root.appendChild(list);
      const detailHost = document.createElement('div');
      detailHost.setAttribute('aria-live', 'polite');
      root.appendChild(detailHost);

      const appendItems = (parent, heading, items) => {
        const section = document.createElement('section');
        addText(section, 'h4', heading);
        if (items.length === 0) addText(section, 'p', '없음');
        else {
          const ul = document.createElement('ul');
          for (const item of items) addText(ul, 'li', `ID: ${safeText(item.id)} · 내용: ${safeText(item.text)}`);
          section.appendChild(ul);
        }
        parent.appendChild(section);
      };
      const showDetail = event => {
        const detail = document.createElement('section');
        detail.setAttribute('data-student-event-detail', event.id);
        addText(detail, 'h3', `기록 ${event.id} 상세`);
        addText(detail, 'p', `기록 ID: ${event.id}`);
        addText(detail, 'p', `업무 앱 ID: ${event.appId ?? '앱 확인 불가'}`);
        addText(detail, 'p', `발생 시각: ${safeText(event.at)}`);
        appendItems(detail, '근거(evidence)', event.evidence);
        appendItems(detail, '규칙(rules)', event.rules);
        addText(detail, 'p', `접속 상태(access): ${stateText('access', event.state.access)}`);
        addText(detail, 'p', `세션 상태(session): ${stateText('session', event.state.session)}`);
        addText(detail, 'p', `기기 상태(device): ${stateText('device', event.state.device)}`);
        // 지원하지 않는 원천 조치에 대한 동작 버튼은 생성하지 않는다.
        detailHost.replaceChildren(detail);
      };
      const renderList = () => {
        const selected = ordered.filter(event =>
          (kindFilter.value === 'all' || event.kind === kindFilter.value) &&
          (appFilter.value === 'all' || event.appId === appFilter.value) &&
          (accessFilter.value === 'all' || event.state.access === accessFilter.value));
        list.replaceChildren();
        detailHost.replaceChildren();
        count.textContent = `표시 기록: ${selected.length}건 / 받은 기록: ${ordered.length}건`;
        if (selected.length === 0) {
          addText(list, 'li', '필터 조건에 맞는 기록이 없습니다.');
          return;
        }
        for (const event of selected) {
          const row = document.createElement('li');
          row.setAttribute('data-student-event-id', event.id);
          addText(row, 'p', `기록 ID: ${event.id} · 시각: ${safeText(event.at)} · 종류: ${names.kind[event.kind] || '확인 불가'}(${event.kind}) · 업무 앱: ${event.appId ?? '앱 확인 불가'} · 요약: ${safeText(event.summary)}`);
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `${event.id} 상세`;
          button.addEventListener('click', () => showDetail(event));
          row.appendChild(button);
          list.appendChild(row);
        }
      };
      kindFilter.addEventListener('change', renderList);
      appFilter.addEventListener('change', renderList);
      accessFilter.addEventListener('change', renderList);
      renderList();
      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
