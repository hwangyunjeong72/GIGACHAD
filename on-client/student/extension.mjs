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

      // 기존 renderStatus 입력 계약으로 확인 가능한 세 분야만 학생 요약에 쓴다.
      // CPU·방화벽·Windows 이벤트 값은 이 함수의 인자가 아니므로 추측하지 않는다.
      const overview = document.createElement('section');
      overview.setAttribute('aria-label', '우선 확인할 보안 상태 세 가지');
      overview.className = 'student-priority';
      add(overview, 'h3', '먼저 확인할 보안 상태 3가지');
      const summaries = document.createElement('div');
      summaries.className = 'student-priority-grid';
      const describe = (title, status, detail, action) => {
        const card = document.createElement('section');
        card.className = 'student-priority-card';
        add(card, 'h4', title);
        add(card, 'p', `상태: ${status}`);
        add(card, 'p', detail);
        if (action) add(card, 'p', `다음 행동: ${action}`);
        summaries.appendChild(card);
      };
      const stateLabel = item => item?.status === 'loading' ? '조회 중'
        : item?.status === 'ok' ? '조회 응답 확인'
        : item?.status === 'error' ? '확인 불가' : '조회 전 · 확인 불가';
      const deviceFailure = devices?.status === 'error' || sessions?.status === 'error';
      describe('1. 기기·세션', `${stateLabel(devices)} / ${stateLabel(sessions)}`,
        '현재 계정 범위의 기기 및 세션 조회입니다. PC의 CPU·메모리 수치가 아닙니다.',
        deviceFailure ? retry : '아래의 등록 기기와 현재 세션을 확인하세요.');
      const noticeItems = Array.isArray(notifications) ? notifications : null;
      describe('2. 주의 알림', noticeItems ? `화면 알림 ${noticeItems.length}개 (침해 탐지 건수 아님)` : '확인 불가',
        '제공 UI가 구성한 상태·오류 알림이며 Windows System·Application 로그 집계와 다릅니다.',
        noticeItems === null ? retry : '아래 알림의 원인과 내용을 확인하세요.');
      describe('3. 연결 진단', stateLabel(diagnostics),
        '제공 진단 상태만 요약합니다. 연결 설정만으로 실제 SDP 응답 성공을 뜻하지 않습니다.',
        diagnostics?.status === 'error' ? retry : '아래 연결 진단 정보에서 결과와 시각을 확인하세요.');
      overview.appendChild(summaries);
      root.appendChild(overview);
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
    renderVulnerabilities({ status = 'idle', mode, data, error } = {}) {
      // 20단계: 제공 화면이 검증한 현재 스냅샷만 표시한다. 조회 요청·취소·재시도는 제공 화면이 맡는다.
      const root = document.createElement('section');
      root.setAttribute('aria-label', '학생 패키지 설치 버전 및 OSV 조회 결과');
      const el = (tag, value) => {
        const node = document.createElement(tag);
        if (value !== undefined) node.textContent = String(value);
        return node;
      };
      const add = (label, value, parent = root) => parent.appendChild(el('p', label ? label + ': ' + value : value));
      const safe = value => typeof value === 'string' && value.length > 0 && value.length <= 500
        && !/[\u0000-\u001f\u007f]/.test(value)
        && !/(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|private\s*key|password|-----BEGIN [A-Z ]*KEY-----)/i.test(value);
      const iso = value => safe(value)
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        && Number.isFinite(Date.parse(value));
      const packageName = value => safe(value) && value.length <= 214
        && /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value);
      const exactVersion = value => {
        if (!safe(value) || value.length > 100) return false;
        // SemVer: 숫자로만 구성된 사전 출시 식별자에만 선행 0을 금지한다.
        // 문자 혼합 사전 출시 식별자와 + 뒤 빌드 식별자는 제외하지 않는다.
        const match = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);
        return !!match && (!match[1] || match[1].split('.').every(part => !/^0\d+$/.test(part)));
      };
      const vulnId = value => safe(value) && value.length <= 160
        && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value);
      if (safe(mode)) add('조회 모드(mode)', mode);
      // 모든 경로에서 새 DOM을 반환하므로 이전 성공 표가 진행·취소·오류 화면에 남지 않는다.
      if (status === 'idle') {
        add('조회 상태', '조회 전(idle) · OSV 설치 패키지 조회가 아직 시작되지 않았습니다.');
        return root;
      }
      if (status === 'loading') {
        add('조회 상태', '조회 중(loading) · 최신 결과는 아직 확인되지 않았습니다.');
        add('안내', '이전 패키지 표를 현재 조회 결과로 표시하지 않습니다.');
        return root;
      }
      if (status === 'error') {
        add('조회 상태', '조회 실패(error) · 취약점 없음으로 판단하지 마세요.');
        if (safe(error?.code) && /^[A-Z][A-Z0-9_]{0,95}$/.test(error.code)) add('오류 코드(error.code)', error.code);
        add('오류 메시지(error.message)', safe(error?.message) ? error.message : '안전한 오류 메시지를 확인할 수 없습니다.');
        add('다음 작업', '제공 화면에서 직접 다시 조회하세요. 취소·시간 초과·통신 실패는 취약점 없음이 아닙니다.');
        return root;
      }
      if (status !== 'ok') {
        add('조회 상태', '상태 확인 불가 · 이전 조회 결과를 현재 결과로 사용하지 않습니다.');
        return root;
      }
      const labels = {
        'complete': '모두 조회(complete) · 허용된 공개 패키지의 OSV 조회 완료',
        'partial': '일부 조회 실패(partial) · 확인된 결과와 실패한 패키지를 구분',
        'not_checked': '아직 조회 안 함(not_checked) · 승인된 공개 조회 대상 패키지가 없음',
        'not_configured': '조회 준비 미완료(not_configured) · 조회 대상 프로젝트 설정 필요',
        'unverifiable': 'lock 파일 확인 불가(unverifiable) · 설치 버전 확인 불가'
      };
      if (!data || !Object.hasOwn(labels, data.status)) {
        add('전체 조회 상태', '결과 형식 확인 불가 · 취약점 없음으로 판단할 수 없습니다.');
        return root;
      }
      add('전체 조회 상태(data.status)', labels[data.status]);
      if (data.lockfileVersion === 2 || data.lockfileVersion === 3)
        add('lockfileVersion', String(data.lockfileVersion));
      if (typeof data.lockfileHash === 'string' && /^[0-9a-f]{64}$/.test(data.lockfileHash))
        add('lockfileHash', data.lockfileHash);
      if (iso(data.checkedAt)) add('전체 조회 시각(checkedAt)', data.checkedAt);
      add('버전 출처', '서버가 package-lock.json과 설치된 node_modules 메타데이터를 대조한 정확한 설치 버전입니다. ^1.2.0 등 범위 버전이 아닙니다.');
      add('OSV 조회 주의', '조회 범위에서 알려진 취약점이 없더라도 패키지나 앱 전체가 안전하다고 보장할 수 없습니다.');

      if (data.status === 'not_configured') {
        add('조회 불가', '담당자가 조회 대상 프로젝트를 설정해야 합니다. 미설정은 취약점 없음이 아닙니다.');
      } else if (data.status === 'not_checked') {
        add('미조회', '승인된 공개 조회 대상 패키지가 없어 아직 조회하지 않았습니다. 미조회는 취약점 없음이 아닙니다.');
      } else if (data.status === 'unverifiable') {
        add('확인 불가', '잠금 파일 검증 불가: 설치된 정확한 버전 및 OSV 조회 결과를 확인할 수 없습니다.');
      }
      const rows = ['complete', 'partial'].includes(data.status) && Array.isArray(data.packages)
        ? data.packages : [];
      if (rows.length === 0) {
        add('패키지 결과', '표시할 조회 결과가 없습니다. 미조회 또는 설정 오류를 취약점 없음으로 판단하지 마세요.');
        return root;
      }
      const table = el('table');
      table.setAttribute('aria-label', '패키지 정확한 설치 버전과 알려진 취약점');
      const thead = el('thead'), header = el('tr');
      for (const heading of ['패키지 이름', '정확한 설치 버전', 'OSV 조회 상태', '조회 출처', '패키지 확인 시각', '취약점 ID 및 수정 시각']) {
        const th = el('th', heading);
        th.setAttribute('scope', 'col');
        header.appendChild(th);
      }
      thead.appendChild(header);
      table.appendChild(thead);
      const tbody = el('tbody');
      for (const pkg of rows) {
        if (!packageName(pkg?.name) || !exactVersion(pkg?.version)) {
          add('유효하지 않은 패키지 정보', '패키지 이름 또는 정확한 설치 버전을 확인할 수 없어 설치 패키지로 표시하지 않습니다.');
          continue;
        }
        const tr = el('tr');
        tr.setAttribute('data-student-package-name', pkg.name);
        tr.setAttribute('data-student-package-version', pkg.version);
        tr.appendChild(el('td', pkg.name));
        tr.appendChild(el('td', pkg.version));
        const findings = Array.isArray(pkg.vulnerabilities) ? pkg.vulnerabilities : [];
        const perPackage = {
          'known_vulnerabilities': '알려진 취약점 항목 있음(known_vulnerabilities)',
          'none_found': '조회 범위에서 알려진 취약점 항목 없음(none_found) · 안전 보장 아님',
          'unverifiable': findings.length
            ? '일부 확인·전체 조회 확인 불가(unverifiable) · 취약점 없음 아님'
            : '조회 확인 불가(unverifiable) · 취약점 없음 아님'
        };
        tr.appendChild(el('td', Object.hasOwn(perPackage, pkg.status)
          ? perPackage[pkg.status] : '조회 상태 확인 불가 · 취약점 없음으로 판단 금지'));
        tr.appendChild(el('td', safe(pkg.source) ? pkg.source : '조회 출처 확인 불가'));
        tr.appendChild(el('td', iso(pkg.checkedAt) ? pkg.checkedAt : '조회 시각 확인 불가'));
        const td = el('td'), list = el('ul');
        let count = 0;
        for (const finding of findings) {
          if (!vulnId(finding?.id)) continue;
          list.appendChild(el('li', '취약점 ID: ' + finding.id
            + ' · 수정 시각(modified): ' + (iso(finding.modified) ? finding.modified : '확인 불가')));
          count++;
        }
        if (count) td.appendChild(list);
        else td.textContent = pkg.status === 'none_found'
          ? '조회 범위에서 알려진 취약점 없음 · 안전 보장 아님'
          : pkg.status === 'unverifiable'
            ? '취약점 조회 확인 불가 · 취약점 없음이 아닙니다.'
            : '취약점 식별자 확인 불가 · 원본 결과를 확인하세요.';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      root.appendChild(table);
      if (data.status === 'partial')
        add('일부 조회 실패 주의', '확인된 취약점 ID는 그대로 표시했습니다. 확인되지 않은 패키지를 취약점 없음으로 판단하지 마세요.');
      return root;
    },
    renderAiConnection({ status = 'idle', mode, data, error, checkedAt, explanationAccepted = false } = {}) {
  // 제공 화면에서 전달한 검증 결과만 표시한다. 조회나 재시도 요청은 하지 않는다.
  const root = document.createElement('section');
  root.setAttribute('aria-label', '학생 AI 연결 점검 상태');
  const add = (label, value) => {
    const p = document.createElement('p');
    p.textContent = label ? `${label}: ${value}` : value;
    root.appendChild(p);
  };
  const modeLabels = {
    demo: '예제 자료(demo) · 실제 AI 게이트 연결 아님',
    disconnected: '연결 없음(disconnected)',
    unknown: '연결 확인 불가(unknown)',
    connected: '연결됨(connected)',
  };
  if (typeof mode === 'string' && Object.hasOwn(modeLabels, mode))
    add('연결 모드', modeLabels[mode]);
  const retry = '다시 점검하려면 제공 화면의 「현재 API 연결 점검」 버튼을 직접 누르세요. 자동으로 재요청하지 않습니다.';
  const noExplanation = '이번 점검은 AI 모델 접근 상태만 확인합니다. 사건 설명은 아직 실행하지 않았습니다. 실제 설명은 보안 기록에서 별도로 요청해야 합니다.';
  if (status === 'idle') {
    add('상태', 'AI 연결 점검 전');
    add('', '계정 연결을 변경했거나 초기화한 경우 이전 점검 결과는 현재 결과가 아닙니다.');
    add('', retry);
    return root;
  }
  if (status === 'loading') {
    add('상태', 'AI 연결 점검 중');
    add('', '점검이 끝나기 전에는 연결이나 모델 응답이 검증된 것이 아닙니다.');
    return root;
  }
  if (status === 'ok') {
    if (data?.transportChecked !== true
      || !['test', 'verified'].includes(data?.audienceAuthorization)
      || !Number.isSafeInteger(data?.modelCount) || data.modelCount < 0
      || typeof checkedAt !== 'string' || !checkedAt.trim()) {
      add('상태', 'AI 연결 점검 결과 확인 불가');
      add('', '응답 형식이나 점검 시각을 확인할 수 없습니다. 점검 성공으로 간주하지 마세요.');
      return root;
    }
    const verified = data.audienceAuthorization === 'verified';
    add('상태', verified ? '앱 권한 확인 후 점검(verified)' : '시험 연결 점검(test)');
    if (!verified) add('', '시험 연결은 실제 앱의 AI 이용 권한이 확인됐다는 뜻이 아닙니다.');
    if (mode === 'demo') add('', '예제 응답은 실제 AI 연결 성공의 증거가 아닙니다.');
    add('응답 모델 수(modelCount)', String(data.modelCount));
    add('점검 시각(checkedAt)', checkedAt);
    if (data.modelCount === 0) add('', '사용할 수 있는 모델이 0개입니다. 담당자에게 모델 허용 설정을 확인하세요.');
    add('', noExplanation);
    add('', retry);
    return root;
  }
  if (status === 'error') {
    const guidance = {
      ON_AI_PROVISIONING_PENDING: '현재 계정의 연결 또는 앱 이용 권한이 준비 중이거나 확인되지 않았습니다. 담당자에게 계정 연결과 앱 권한을 확인하세요.',
      SUBJECT_SCOPE_UNVERIFIED: '현재 계정과 앱 권한의 연결이 확인되지 않았습니다. 담당자에게 확인하세요.',
      ON_AI_AUTHORIZATION_CHANGED: '점검 도중 앱 권한이 변경됐습니다. 담당자에게 현재 권한을 확인하세요.',
      WB_CLCO_AUTH_REQUIRED: 'AI 인증에 실패했습니다. 앱의 계정 연결을 다시 확인하고 담당자에게 문의하세요.',
      WB_CLCO_ACCESS_BLOCKED: 'AI 접근이 제한됐습니다. 계정 연결과 이용 권한을 담당자에게 확인하세요.',
      WB_CLCO_COHORT_BUDGET_EXHAUSTED: '수업 반의 AI 사용량이 소진됐습니다. 담당자에게 확인하세요.',
      WB_CLCO_LIMIT_REACHED: 'AI 이용 한도에 도달했습니다. 담당자에게 확인하세요.',
      WB_CLCO_SESSION_CLOSED: '현재는 AI 이용 시간이 아닙니다. 이용 가능 시간을 확인하세요.',
      WB_CLCO_RATE_LIMITED: 'AI 요청이 일시적으로 제한됐습니다. 잠시 뒤 직접 다시 점검하세요.',
      WB_CLCO_TIMEOUT: 'AI 응답 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
      REQUEST_TIMEOUT: 'AI 연결 점검 요청 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
      ENGINE_TIMEOUT: '기존 서버의 확인 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
      TIMEOUT: 'AI 점검 응답 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
      WB_CLCO_NETWORK_ERROR: 'AI 서버 네트워크 연결을 확인할 수 없습니다. 잠시 뒤 직접 다시 점검하세요.',
      WB_CLCO_SERVER_UNAVAILABLE: 'AI 서버를 사용할 수 없습니다. 잠시 뒤 직접 다시 점검하세요.',
      CANCELLED: 'AI 연결 점검이 취소됐습니다. 이전 점검 결과는 현재 결과가 아닙니다.',
      REQUEST_CANCELLED: 'AI 연결 점검이 취소됐습니다. 이전 점검 결과는 현재 결과가 아닙니다.',
      WB_CLCO_CANCELLED: 'AI 연결 점검이 취소됐습니다. 이전 점검 결과는 현재 결과가 아닙니다.',
      MODEL_NOT_CONFIGURED: '사용할 AI 모델이 설정되지 않았습니다. 담당자에게 모델 허용 설정을 확인하세요.',
      ON_AI_MODEL_LIST_EMPTY: '현재 앱 권한으로 사용할 AI 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.',
      ON_AI_INVALID_INPUT: 'AI 점검에 필요한 입력을 검증할 수 없습니다. 담당자에게 확인하세요.',
      ON_AI_INVALID_OUTPUT: 'AI 응답 형식을 검증할 수 없습니다. 담당자에게 확인하세요.',
      AI_REQUEST_UNVERIFIED: 'AI 연결 또는 응답 상태를 확인할 수 없습니다. 담당자에게 확인하세요.',
    };
    const known = typeof error?.code === 'string' && Object.hasOwn(guidance, error.code);
    const code = known ? error.code : 'AI_REQUEST_UNVERIFIED';
    // 제공 화면이 정제한 오류를 받지만, 비밀정보 형식은 추가로 차단한다.
    const containsSecret = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i;
    const safeMessage = known && typeof error.message === 'string'
      && error.message.trim() && error.message.length <= 500 && !containsSecret.test(error.message)
      && !/[\u0000-\u001f\u007f]/.test(error.message)
      ? error.message : '안전한 오류 메시지를 확인할 수 없습니다.';
    add('상태', 'AI 연결 점검 실패');
    add('오류 코드(error.code)', code);
    add('오류 메시지(error.message)', safeMessage);
    add('안내', guidance[code]);
    add('', noExplanation);
    add('', retry);
    return root;
  }
  add('상태', 'AI 연결 점검 상태 확인 불가');
  add('', '현재 연결 성공 여부를 확인할 수 없습니다.');
  return root;
},
    renderExplanation({ event, explanation, checkedAt } = {}) {
      // 18단계: 현재 선택한 사건의 근거에 묶인 설명만 표시한다. API·조치 호출 없음.
      const root = document.createElement('section');
      root.setAttribute('aria-label', '선택한 사건의 AI 설명');
      const line = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        parent.appendChild(node);
      };
      const list = (title, rows) => {
        line(root, 'h4', title);
        const ul = document.createElement('ul');
        for (const row of rows) line(ul, 'li', row);
        root.appendChild(ul);
      };
      const safeId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value);
      const secret = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i;
      const safeText = (value, max) => typeof value === 'string' && value.trim().length > 0
        && value.length <= max && !secret.test(value)
        && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
      const failure = (reason, code) => {
        line(root, 'p', '상태: AI 설명 확인 불가');
        if (safeId(code)) line(root, 'p', '오류 코드: ' + code);
        line(root, 'p', '설명을 사용할 수 없습니다: ' + reason);
        line(root, 'p', '기존 보안 기록과 업무 앱 판정은 그대로입니다. AI 설명 오류는 과제 실패가 아닙니다.');
        return root;
      };

      // 오류를 사건 선택 여부보다 먼저 확인: event=null이어도 실패 이유를 보여 준다.
      if (explanation?.status === 'error') {
        const codes = new Set([
          'ON_AI_PROVISIONING_PENDING', 'ON_AI_AUTHORIZATION_CHANGED',
          'ON_AI_INVALID_INPUT', 'ON_AI_INVALID_OUTPUT', 'AI_REQUEST_UNVERIFIED',
          'WB_CLCO_AUTH_REQUIRED', 'WB_CLCO_ACCESS_BLOCKED',
          'WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_LIMIT_REACHED',
          'WB_CLCO_SESSION_CLOSED', 'WB_CLCO_RATE_LIMITED', 'WB_CLCO_TIMEOUT',
          'WB_CLCO_NETWORK_ERROR', 'WB_CLCO_SERVER_UNAVAILABLE',
          'MODEL_NOT_CONFIGURED', 'ON_AI_MODEL_LIST_EMPTY', 'CONTRACT_MISMATCH',
          'CANCELLED', 'REQUEST_CANCELLED', 'WB_CLCO_CANCELLED',
          'TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'SUBJECT_SCOPE_UNVERIFIED',
          'EVENT_NOT_FOUND', 'REQUEST_INVALID', 'SERVICE_UNAVAILABLE',
        ]);
        const rawCode = explanation.error?.code;
        const code = safeId(rawCode) && codes.has(rawCode) ? rawCode : 'AI_REQUEST_UNVERIFIED';
        const rawMessage = explanation.error?.message;
        const message = safeText(rawMessage, 500) ? rawMessage : '안전하게 표시할 수 있는 오류 메시지가 없습니다.';
        const detail = {
          ON_AI_INVALID_INPUT: '선택한 사건의 입력이나 근거가 부족하여 설명을 만들 수 없습니다.',
          ON_AI_INVALID_OUTPUT: '근거 ID 불일치·누락·중복 또는 AI 응답 형식 오류일 수 있어 검증되지 않은 설명은 사용하지 않습니다.',
          CONTRACT_MISMATCH: '응답 형식 또는 근거 검증에 실패하여 확인되지 않은 설명은 표시하지 않습니다.',
          EVENT_NOT_FOUND: '선택한 사건을 현재 보안 기록에서 확인할 수 없습니다.',
          ON_AI_PROVISIONING_PENDING: 'AI 사건 설명 권한이나 계정 연결이 준비되지 않았습니다.',
        };
        line(root, 'p', '상태: AI 설명 실패');
        line(root, 'p', '오류 코드(error.code): ' + code);
        line(root, 'p', '오류 메시지(error.message): ' + message);
        if (Object.hasOwn(detail, code)) line(root, 'p', '실패 이유: ' + detail[code]);
        line(root, 'p', '기존 보안 기록과 업무 앱 판정은 그대로입니다. AI 설명 실패는 과제 실패가 아닙니다.');
        return root;
      }

      if (!event || !safeId(event.id)) {
        line(root, 'p', '안내: 보안 기록에서 설명할 기록을 먼저 고르세요.');
        return root;
      }
      const eventId = event.id;
      if (explanation?.status === 'loading') {
        line(root, 'p', '사건 ID: ' + eventId);
        line(root, 'p', '상태: AI 설명 요청 중');
        line(root, 'p', '모델 응답을 받기 전에는 설명 성공 또는 보안 조치 완료로 표시하지 않습니다.');
        return root;
      }
      if (explanation?.status === 'idle' || !explanation?.status) {
        line(root, 'p', '사건 ID: ' + eventId);
        line(root, 'p', '상태: AI 사건 설명 요청 전');
        line(root, 'p', '연결 점검 성공은 사건 설명 성공이 아닙니다.');
        return root;
      }
      if (explanation.status !== 'ok') {
        return failure('설명 상태를 확인할 수 없습니다.');
      }

      // 제공 UI의 검증 외에도 현재 사건의 근거와 상태를 다시 대조한다.
      const data = explanation.data;
      if (!data || data.executed !== false || data.requiresHumanConfirmation !== true) {
        return failure(data?.executed === true
          ? 'AI가 보안 조치를 이미 실행했다고 주장한 출력은 사용할 수 없습니다.'
          : '사람 확인·미실행 여부가 검증되지 않은 설명은 사용할 수 없습니다.', 'ON_AI_INVALID_OUTPUT');
      }
      if (!safeText(data.summary, 1500)) {
        return failure('AI 요약의 형식이나 안전성을 확인할 수 없습니다.', 'ON_AI_INVALID_OUTPUT');
      }
      if (!Array.isArray(event.evidence) || event.evidence.length === 0
        || event.evidence.length > 20 || !event.evidence.every(row => safeId(row?.id) && safeText(row?.text, 500))
        || new Set(event.evidence.map(row => row.id)).size !== event.evidence.length
        || !Array.isArray(event.rules) || event.rules.length === 0
        || event.rules.length > 20 || !event.rules.every(row => safeId(row?.id) && safeText(row?.text, 300))
        || new Set(event.rules.map(row => row.id)).size !== event.rules.length) {
        return failure('사건의 근거 또는 규칙이 부족하거나 올바르지 않아 설명할 수 없습니다.', 'ON_AI_INVALID_INPUT');
      }
      const evidence = new Map(event.evidence.map(row => [row.id, row.text]));
      if (!Array.isArray(data.evidenceIds) || data.evidenceIds.length !== evidence.size
        || new Set(data.evidenceIds).size !== data.evidenceIds.length
        || !data.evidenceIds.every(id => safeId(id) && evidence.has(id))) {
        return failure('인용한 근거 ID가 현재 사건의 근거와 맞지 않거나 빠져 있습니다. 없는 근거는 만들지 않습니다.', 'ON_AI_INVALID_OUTPUT');
      }
      if (!event.state || !['allowed', 'denied', 'unknown'].includes(event.state.access)
        || !['active', 'expired', 'revoked', 'unknown'].includes(event.state.session)
        || !['compliant', 'noncompliant', 'unknown'].includes(event.state.device)
        || !Array.isArray(event.supportedActions)
        || !event.supportedActions.every(safeId)) {
        return failure('현재 사건의 접속·세션·기기 상태 또는 지원 조치를 확인할 수 없습니다.', 'ON_AI_INVALID_INPUT');
      }
      if (!Array.isArray(data.proposals) || data.proposals.length > 3
        || !data.proposals.every(proposal => safeId(proposal?.action)
          && event.supportedActions.includes(proposal.action)
          && safeText(proposal.reason, 500)
          && Array.isArray(proposal.evidenceIds)
          && proposal.evidenceIds.length > 0
          && new Set(proposal.evidenceIds).size === proposal.evidenceIds.length
          && proposal.evidenceIds.every(id => safeId(id) && evidence.has(id)))) {
        return failure('AI 조치 제안의 지원 여부·근거·이유가 현재 사건과 맞지 않습니다.', 'ON_AI_INVALID_OUTPUT');
      }

      // 성공 상태는 모든 검증이 끝난 현재 사건에만 연결한다.
      root.setAttribute('data-student-explanation-event', eventId);
      line(root, 'h3', 'AI 설명(참고용)');
      line(root, 'p', '사건 ID: ' + eventId);
      line(root, 'p', 'AI 설명은 해석이며 사실 판단은 보안 기록의 근거와 연동 시스템 상태를 기준으로 합니다.');
      line(root, 'p', 'AI 요약: ' + data.summary);
      if (typeof checkedAt === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(checkedAt)
        && Number.isFinite(Date.parse(checkedAt))) {
        line(root, 'p', '설명 확인 시각: ' + checkedAt);
      }
      list('인용한 근거', data.evidenceIds.map(id => id + ' — ' + evidence.get(id)));
      list('현재 적용 규칙', event.rules.map(rule => rule.id + ' — ' + rule.text));
      const unknown = [
        ['접속', event.state.access],
        ['세션', event.state.session],
        ['기기', event.state.device],
      ].filter(([, state]) => state === 'unknown').map(([name]) => name + ': 확인 불가(unknown)');
      if (unknown.length) list('확인되지 않은 현재 상태', unknown);
      else {
        line(root, 'h4', '확인되지 않은 현재 상태');
        line(root, 'p', '없음');
      }
      line(root, 'h4', '조치 제안');
      if (data.proposals.length === 0) {
        line(root, 'p', event.supportedActions.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 AI 제안이 없습니다. 제안 0개가 정상입니다.'
          : 'AI가 제안한 조치가 없습니다. 근거를 확인하여 담당자가 판단해야 합니다.');
      } else {
        const rows = data.proposals.map(proposal =>
          '조치: ' + proposal.action + ' — 제안 이유: ' + proposal.reason
          + ' — 관련 근거 ID: ' + proposal.evidenceIds.join(', ')
          + ' — 사람 확인 필요, 아직 실행되지 않았습니다.');
        const ul = document.createElement('ul');
        for (const row of rows) line(ul, 'li', row);
        root.appendChild(ul);
      }
      line(root, 'p', 'AI는 보안 조치를 실행하지 않았습니다. 제안은 사람의 확인이 필요하며 현재 미실행 상태입니다.');
      return root;
    },
    renderAction({ status = 'idle', event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      // 19단계: 제공 화면의 상태 스냅샷만 표시. 인증 티켓·집행 버튼·서버 요청은 만들지 않는다.
      const root = document.createElement('section');
      root.setAttribute('aria-label', '학생 보안 조치 상태 및 서버 결과');
      const add = (label, value) => {
        const p = document.createElement('p');
        p.textContent = label ? label + ': ' + value : value;
        root.appendChild(p);
      };
      const safeId = value => typeof value === 'string'
        && /^[A-Za-z0-9][A-Za-z0-9._:@-]{0,199}$/.test(value);
      const safeUuid = value => typeof value === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      const secret = /(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+)/i;
      const safeText = (value, max = 500) => typeof value === 'string' && value.trim().length > 0
        && value.length <= max && !secret.test(value)
        && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
      const safeTime = value => typeof value === 'string'
        && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        && Number.isFinite(Date.parse(value));
      const unknown = reason => {
        add('상태', '결과 불명(unknown)');
        if (reason) add('확인 필요', reason);
        add('', '조치 성공이나 효과 없음으로 단정하지 마세요. 제공 화면의 「연동 시스템 결과만 재조회」로 원천 결과만 확인하세요.');
      };

      // 새로고침·취소·다른 사건 선택 뒤 이전 사건과 영수증을 절대로 다시 사용하지 않는다.
      if (status === 'idle') {
        add('상태', '아직 미실행(idle)');
        add('', 'AI 조치 제안만으로 집행되지 않습니다. 기존 화면을 취소해도 이미 서버로 전달된 조치의 효과가 취소되는 것은 아닙니다.');
        add('', '현재 연결에서는 지원하는 조치가 없어 준비 버튼이 표시되지 않는 것이 정상입니다. 이 상태는 실제 원천 집행 성공을 뜻하지 않습니다.');
        return root;
      }

      // 준비·접수·관측은 현재 사건과 요청의 동일성을 유지해야 한다.
      const eventId = safeId(event?.id) ? event.id : null;
      const currentAction = safeId(actionId) ? actionId : null;
      const requestId = safeUuid(receipt?.requestId) ? receipt.requestId : null;
      const receiptId = safeUuid(receipt?.receiptId) ? receipt.receiptId : null;
      const mismatch = (safeId(receipt?.eventId) && eventId && receipt.eventId !== eventId)
        || (safeId(receipt?.actionId) && currentAction && receipt.actionId !== currentAction)
        || (receipt?.eventId != null && !safeId(receipt.eventId))
        || (receipt?.actionId != null && !safeId(receipt.actionId))
        || (receipt?.requestId != null && !requestId);
      if (mismatch) {
        unknown('영수증의 사건 ID·조치 ID·요청 ID가 현재 입력과 일치하지 않습니다. 이전 결과를 현재 사건에 적용하지 않습니다.');
        return root;
      }

      // 성공·처리 상태가 아닌 실패에도 현재 제공된 정보만 글자로 표시한다.
      if (eventId) {
        root.setAttribute('data-student-action-event', eventId);
        add('사건 ID(event.id)', eventId);
      }
      if (Array.isArray(event?.evidence)) {
        const ids = event.evidence.map(row => row?.id).filter(safeId);
        if (ids.length) add('사건 근거 ID', [...new Set(ids)].join(', '));
      }
      if (currentAction) add('조치 ID(actionId)', currentAction);
      if (safeId(target?.id)) add('실제 대상 ID(target.id)', target.id);
      if (Number.isSafeInteger(target?.generation) && target.generation > 0)
        add('대상 세대(target.generation)', String(target.generation));
      if (requestId) {
        root.setAttribute('data-student-action-request', requestId);
        add('요청 ID(receipt.requestId)', requestId);
      }
      if (receiptId) add('영수증 ID(receipt.receiptId)', receiptId);
      if (Number.isSafeInteger(receipt?.version) && receipt.version > 0)
        add('영수증 버전(receipt.version)', String(receipt.version));
      if (receipt?.replayed === true)
        add('중복 요청 표시(receipt.replayed)', 'true · 이전 요청의 재조회/재생 결과입니다. 새로운 집행으로 판단하지 마세요.');
      else if (receipt?.replayed === false)
        add('중복 요청 표시(receipt.replayed)', 'false · 영수증의 원래 표시값입니다. 이 값만으로 효과를 확인할 수 없습니다.');
      if (receipt?.superseded === true)
        add('', '이전 결과가 최신 원천 상태를 대신하지 않습니다(superseded). 다시 집행하지 말고 원천 결과만 재조회하세요.');

      switch (status) {
        case 'loading': {
          add('상태', '조치 준비 또는 연동 시스템 결과 조회 중(loading) · 실행 완료 아님');
          add('', 'AI 제안을 확인하는 단계와 실제 원천 집행은 다릅니다.');
          break;
        }
        case 'prepared': {
          add('상태', '준비됨·미실행(prepared)');
          add('', '대상과 조치를 확인하는 사람 확인 절차가 필요하며, 아직 원천에 집행하지 않았습니다.');
          add('사람 확인 기한(confirmationExpiresAt)',
            safeTime(confirmationExpiresAt) ? confirmationExpiresAt : '확인 불가 · 제공 화면의 현재 확인 기한을 확인하세요.');
          break;
        }
        case 'executing': {
          add('상태', '사람 확인 후 연동 시스템에 전달 중(executing) · 결과 미확인');
          add('', '요청을 전송하고 있지만 서버 처리와 실제 효과는 아직 확인되지 않았습니다.');
          break;
        }
        case 'pending': {
          add('상태', '서버 접수·처리 중(pending) · 결과 미확인');
          add('', 'ACK(접수 응답)는 요청을 받았다는 뜻이며 조치 실행 성공이나 실제 효과 확인이 아닙니다.');
          add('', '조치를 반복 요청하지 말고 제공 화면에서 원천 결과만 재조회하세요.');
          break;
        }
        case 'succeeded': {
          const receiptMatches = receipt?.status === undefined || receipt.status === 'succeeded';
          if (receiptMatches && receipt?.superseded !== true && observation?.effectApplied === true
            && safeTime(observation?.observedAt) && receiptId && requestId && eventId && currentAction) {
            add('상태', '연동 시스템의 실제 효과 확인(succeeded)');
            add('원천 관측 시각(observation.observedAt)', observation.observedAt);
            add('실제 효과(observation.effectApplied)', 'effectApplied: true');
            add('확인 영수증(receiptId)', receiptId);
            add('', '원천 조회에서 조치 효과를 관측한 결과입니다. AI 제안이나 ACK만으로 확인된 것이 아닙니다.');
          } else {
            unknown('succeeded 상태로 전달됐지만 현재 사건·요청의 유효한 영수증과 실제 효과 관측을 함께 확인할 수 없습니다.');
          }
          break;
        }
        case 'denied': {
          add('상태', '연동 시스템 거절(denied)');
          if (safeText(message)) add('처리 메시지', message);
          add('', '조치가 거절됐습니다. 실제 효과가 확인된 것으로 표시하지 않습니다.');
          break;
        }
        case 'failed': {
          add('상태', '연동 시스템 처리 실패(failed)');
          if (safeText(message)) add('처리 메시지', message);
          add('', '조치 처리 실패입니다. 효과 확인으로 표시하지 않습니다.');
          break;
        }
        case 'unknown': {
          unknown('요청 결과가 아직 검증되지 않았거나 처리 결과를 확인할 수 없습니다.');
          break;
        }
        case 'expired': {
          add('상태', '사람 확인 기한 만료(expired) · 기존 준비로 집행할 수 없음');
          add('', '제공 화면에서 조치를 새로 준비하고 실제 대상과 확인 기한을 다시 확인하세요.');
          break;
        }
        case 'error': {
          add('상태', '조치 요청 처리 불가(error)');
          const code = typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{0,95}$/.test(error.code)
            ? error.code : 'ACTION_RESULT_UNVERIFIED';
          add('오류 코드(error.code)', code);
          add('오류 메시지(error.message)', safeText(error?.message) ? error.message : '안전한 오류 메시지를 확인할 수 없습니다.');
          add('', '조치 요청 오류를 성공으로 판단하지 않습니다. 이미 전달된 요청의 효과는 화면 취소만으로 되돌릴 수 없습니다.');
          break;
        }
        default: {
          unknown('알 수 없는 조치 상태입니다. 실제 처리를 확인할 수 없습니다.');
          break;
        }
      }
      add('', '이 학생 화면은 상태를 표시할 뿐 조치를 실행하지 않습니다. 실제 집행·확인·결과 재조회는 제공 화면에서만 처리합니다.');
      return root;
    },
  };
}
