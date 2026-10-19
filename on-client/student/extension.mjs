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
        // 이 단계는 아직 조치를 실행하지 않는다. 입력된 항목만 비활성 안내한다.
        if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
          const unsupported = document.createElement('section');
          addText(unsupported, 'p', '조치 실행 연결은 준비 중입니다. 아래 조치는 아직 지원하지 않으며 어떤 요청도 보내지 않습니다.');
          for (const action of event.supportedActions) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `${action} 미지원`;
            button.disabled = true;
            unsupported.appendChild(button);
          }
          detail.appendChild(unsupported);
        }
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

    renderStatus({ devices, sessions, notifications = [], diagnostics, mode } = {}) {
      // 제공 UI의 데이터를 표시하기만 한다. 학생 코드에서 조회·재시도 요청은 하지 않는다.
      const root = document.createElement('section');
      root.setAttribute('aria-label', '기기·세션·알림과 진단 상태');
      const safeText = value => typeof value === 'string' && value.trim() ? value : '확인 불가';
      const add = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.appendChild(node);
        return node;
      };
      const labels = {
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' },
        session: { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' },
      };
      const stateText = (kind, status) => {
        const code = typeof status === 'string' && Object.hasOwn(labels[kind], status) ? status : 'unknown';
        return `${labels[kind][code]}(${code})`;
      };
      const retry = '다시 시도하려면 화면 위쪽의 「다시 불러오기」 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.';
      const errorText = resource => `${resource?.error?.code === 'TIMEOUT' ? '시간 초과 · ' : ''}${safeText(resource?.error?.message)}`;
      if (mode === 'demo') add(root, 'p', '예제 자료(demo) · 실제 연결 아님');
      if (mode === 'disconnected') add(root, 'p', '연결 없음(disconnected)');
      if (mode === 'unknown') add(root, 'p', '연결 상태 확인 불가(unknown)');
      const showList = (resource, heading, kind, emptyMessage) => {
        const section = document.createElement('section');
        add(section, 'h3', heading);
        if (resource?.status === 'loading') {
          add(section, 'p', `${heading} 불러오는 중`);
        } else if (resource?.status === 'error') {
          add(section, 'p', `${heading} 불러오지 못했습니다: ${errorText(resource)}`);
          add(section, 'p', retry);
        } else if (resource?.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) add(section, 'p', emptyMessage);
          else {
            const list = document.createElement('ul');
            for (const item of resource.data) {
              if (kind === 'device') {
                add(list, 'li', `기기: ${safeText(item?.label)} · ID: ${safeText(item?.id)} · 상태: ${stateText(kind, item?.status)}`);
              } else {
                add(list, 'li', `세션 ID: ${safeText(item?.id)} · 상태: ${stateText(kind, item?.status)}`);
              }
            }
            section.appendChild(list);
          }
        } else {
          add(section, 'p', `${heading} 확인 불가`);
        }
        root.appendChild(section);
      };
      showList(devices, '등록 기기', 'device', '등록된 기기가 없습니다.');
      add(root, 'p', '등록 기기는 현재 계정에 속한 회수되지 않은 기기 중 최대 100개까지 조회됩니다.');
      showList(sessions, '현재 세션', 'session', '현재 연결이 없습니다.');
      add(root, 'p', '세션은 현재 검증된 연결 한 개만 조회합니다. 과거 세션 전체 목록이 아닙니다.');

      const notices = document.createElement('section');
      add(notices, 'h3', '주의 알림');
      if (!Array.isArray(notifications) || notifications.length === 0) {
        add(notices, 'p', '주의할 알림이 없습니다.');
      } else {
        const list = document.createElement('ul');
        for (const item of notifications) {
          add(list, 'li', `자료(resource): ${safeText(item?.resource)} · 코드(code): ${safeText(item?.code)} · 내용(message): ${safeText(item?.message)}`);
        }
        notices.appendChild(list);
      }
      root.appendChild(notices);

      const section = document.createElement('section');
      add(section, 'h3', '연결 진단 정보');
      let clipboardText = '';
      if (diagnostics?.status === 'loading') {
        add(section, 'p', '진단 정보를 불러오는 중');
      } else if (diagnostics?.status === 'error') {
        add(section, 'p', `진단 정보를 불러오지 못했습니다: ${errorText(diagnostics)}`);
        add(section, 'p', retry);
      } else if (diagnostics?.status === 'ok' && diagnostics.data
        && typeof diagnostics.data === 'object' && !Array.isArray(diagnostics.data)
        && Object.keys(diagnostics.data).length > 0) {
        // 진단 객체의 다른 필드(설정·열쇠 등)는 사용하지 않는다.
        const d = diagnostics.data;
        const help = {
          requestId: safeText(d.requestId),
          component: safeText(d.component),
          version: safeText(d.version),
          checkedAt: safeText(d.checkedAt),
          engine: { mode: safeText(d.engine?.mode), code: safeText(d.engine?.code) },
        };
        clipboardText = JSON.stringify(help, null, 2);
        add(section, 'p', `requestId: ${help.requestId}`);
        add(section, 'p', `component: ${help.component}`);
        add(section, 'p', `version: ${help.version}`);
        add(section, 'p', `checkedAt: ${help.checkedAt}`);
        add(section, 'p', `engine.mode: ${help.engine.mode}`);
        add(section, 'p', `engine.code: ${help.engine.code}`);
      } else if (diagnostics?.status === 'ok') {
        add(section, 'p', '표시할 진단 정보가 없습니다.');
      } else {
        add(section, 'p', '진단 정보 조회 전입니다. 제공 화면의 도움정보 조회를 직접 눌러 주세요.');
      }
      add(section, 'p', '이 버튼은 위의 안전한 진단 항목만 도움 요청용으로 복사합니다. 자동 전송하지 않습니다.');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '도움정보 복사';
      button.disabled = !clipboardText;
      const copyStatus = add(section, 'p', '');
      copyStatus.setAttribute('role', 'status');
      button.addEventListener('click', async () => {
        if (!clipboardText) return;
        try {
          await navigator.clipboard.writeText(clipboardText);
          copyStatus.textContent = '도움정보를 클립보드에 복사했습니다.';
        } catch {
          copyStatus.textContent = '자동 복사를 사용할 수 없습니다. 위의 진단 정보를 직접 확인하세요.';
        }
      });
      section.appendChild(button);
      root.appendChild(section);
      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
