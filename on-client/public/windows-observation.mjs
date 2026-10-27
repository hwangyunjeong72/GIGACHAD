// Local Windows observations are independent of demo events and SDP admission.
const refreshButton=document.getElementById('windows-observation-refresh');
const message=document.getElementById('windows-observation-message');
const networkSlot=document.getElementById('windows-network');
const firewallSlot=document.getElementById('windows-firewall');
const eventsSlot=document.getElementById('windows-events');
const sdpSlot=document.getElementById('sdp-status-summary');
const errorPanel=document.getElementById('windows-observation-errors');
let pending=false;

const REASONS=Object.freeze({
  WINDOWS_ONLY:'Windows 운영체제에서 앱을 실행하지 않았습니다. 다른 OS의 결과를 Windows 값처럼 표시하지 않습니다.',
  ACCESS_DENIED:'현재 일반 사용자 계정에 해당 기록을 읽을 권한이 없습니다. 관리자 권한을 요청하지 않습니다.',
  COMMAND_UNAVAILABLE:'이 Windows 환경에서 필요한 읽기 전용 PowerShell 명령을 사용할 수 없습니다.',
  QUERY_FAILED:'Windows가 요청한 정보를 반환하지 못했습니다. 설정은 변경하지 않았습니다.',
  LOG_UNAVAILABLE:'이 이벤트 로그가 비활성화됐거나 접근 가능한 상태가 아닙니다.',
  TIMEOUT:'조회 시간이 초과됐습니다. 실패한 값을 0건으로 표시하지 않습니다.',
  INVALID_RESULT:'운영체제 응답 형식을 검증하지 못했습니다.',
  PROCESS_FAILED:'읽기 전용 조회 도구를 실행하지 못했습니다.',
  OUTPUT_TOO_LARGE:'조회 결과가 제한 크기를 초과해 안전하게 중단했습니다.',
  NO_SDP_CONFIG:'기본 실행 또는 예제 모드에 SDP 서버 연결 설정이 없습니다.',
  SDP_LIVE_RESPONSE_UNVERIFIED:'SDP 설정·어댑터만으로는 실제 서버 연결 성공을 확인할 수 없습니다.',
  NETWORK_ERROR:'앱 서버의 조회 API에 연결하지 못했거나 응답을 검증하지 못했습니다.',
});
const ACTIONS=Object.freeze({
  WINDOWS_ONLY:'앱이 Windows PC에서 실행 중인지 확인하세요. 다른 운영체제에서는 Windows 값을 조회할 수 없습니다.',
  ACCESS_DENIED:'관리자 권한을 요청하거나 보안 설정을 변경하지 마세요. 담당자에게 현재 계정의 조회 권한을 문의하세요.',
  COMMAND_UNAVAILABLE:'지원되는 Windows 버전과 PowerShell 읽기 명령이 있는지 확인하고 담당자에게 문의하세요.',
  QUERY_FAILED:'「Windows 상태 다시 조회」를 눌러 재시도하세요. 반복되면 오류 문구를 기록하세요.',
  LOG_UNAVAILABLE:'해당 로그의 사용 가능 여부를 담당자에게 문의하세요. 설정을 직접 바꾸지 마세요.',
  TIMEOUT:'잠시 뒤 한 번 더 조회하세요. 반복되면 앱 서버가 실행 중인지 확인하세요.',
  INVALID_RESULT:'응답의 실제 값과 시각을 확인하지 못했습니다. 앱을 재실행하고 다시 조회하세요.',
  PROCESS_FAILED:'로컬 Windows 조회 도구 실행을 확인하세요. 관리자 권한으로 다시 실행하지 마세요.',
  OUTPUT_TOO_LARGE:'로그 결과가 많아 조회가 중단됐습니다. 결과를 0건으로 해석하지 말고 담당자에게 알리세요.',
  NETWORK_ERROR:'로컬 앱 서버가 실행 중인지 확인한 뒤 새로고침하고 다시 조회하세요.',
});
function el(tag,label='',className=''){
  const node=document.createElement(tag);node.textContent=label;
  if(className)node.className=className;
  return node;
}
function timestamp(value){
  const date=typeof value==='string'?new Date(value):new Date(NaN);
  return Number.isFinite(date.getTime())
    ? `${date.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})} (KST)`:'확인 불가';
}
function reason(row){return REASONS[row?.reason]??REASONS.INVALID_RESULT;}
function nextAction(row){return ACTIONS[row?.reason]??ACTIONS.INVALID_RESULT;}
function measurable(row){return row?.status==='measured'&&timestamp(row.measuredAt)!=='확인 불가';}
function showUnknown(slot,row){
  slot.appendChild(el('p','확인 불가','pc-status-value'));
  slot.appendChild(el('p',`사유: ${reason(row)}`));
  slot.appendChild(el('p',`다음 행동: ${nextAction(row)}`));
  slot.appendChild(el('p','조회 시각: 확인 불가','pc-status-time'));
}
function showTime(slot,row){slot.appendChild(el('p',`조회 시각: ${timestamp(row.measuredAt)}`,'pc-status-time'));}

function renderNetwork(row){
  networkSlot.replaceChildren();
  if(!measurable(row)||!Number.isSafeInteger(row.adapterCount)||!Array.isArray(row.adapters)){
    showUnknown(networkSlot,row);return;
  }
  networkSlot.appendChild(el('p',`실제 로컬 조회 · 어댑터 ${row.adapterCount}개 (단위: 개)`));
  if(!row.adapterCount)networkSlot.appendChild(el('p','조회된 네트워크 어댑터가 없습니다.'));
  const list=el('ul');
  for(const adapter of row.adapters){
    const connected=adapter.status==='Up'?'연결됨':adapter.status==='Disconnected'?'연결 안 됨':adapter.status;
    const ips=Array.isArray(adapter.ipv4)&&adapter.ipv4.length?adapter.ipv4.join(', '):'조회된 IPv4 없음';
    const gateways=Array.isArray(adapter.gateway)&&adapter.gateway.length?adapter.gateway.join(', '):'조회된 게이트웨이 없음';
    list.appendChild(el('li',`${adapter.name} · ${connected} · IPv4 ${ips} · 기본 게이트웨이 ${gateways}`));
  }
  networkSlot.appendChild(list);
  if(row.truncated)networkSlot.appendChild(el('p','어댑터 32개까지만 표시했습니다. 전체 어댑터 수는 위에 표시됩니다.','muted'));
  showTime(networkSlot,row);
}
function renderFirewall(row){
  firewallSlot.replaceChildren();
  if(!measurable(row)||!Array.isArray(row.profiles)){
    showUnknown(firewallSlot,row);return;
  }
  firewallSlot.appendChild(el('p','실제 로컬 조회 · 프로필 설정값 (활성/비활성), 인바운드·아웃바운드 기본 동작'));
  const list=el('ul');
  for(const profile of row.profiles){
    const name={Domain:'도메인',Private:'개인',Public:'공용'}[profile.name]??profile.name;
    list.appendChild(el('li',`${name}: ${profile.enabled?'켜짐':'꺼짐'} · 기본 인바운드 ${profile.inbound} · 기본 아웃바운드 ${profile.outbound}`));
  }
  firewallSlot.appendChild(list);
  firewallSlot.appendChild(el('p','설정값 조회 결과이며 보안 적합성·방화벽 규칙의 실효성을 판정하지 않습니다.','muted'));
  showTime(firewallSlot,row);
}
function renderEvents(data){
  eventsSlot.replaceChildren();
  for(const [label,key] of [['System','system'],['Application','application']]){
    const block=el('section','','dashboard-event-log');
    block.appendChild(el('h4',`${label} 로그`));
    const row=data?.[key];
    if(measurable(row)&&Number.isSafeInteger(row.errorCount)&&Number.isSafeInteger(row.warningCount)
      &&row.errorCount>=0&&row.warningCount>=0){
      block.appendChild(el('p',`실제 로컬 조회 · 오류 ${row.errorCount}건 · 경고 ${row.warningCount}건 (단위: 건 / 최근 24시간)`));
      block.appendChild(el('p',`집계 구간: ${timestamp(row.windowStart)} ~ ${timestamp(row.windowEnd)}`,'muted'));
      showTime(block,row);
    }else showUnknown(block,row);
    eventsSlot.appendChild(block);
  }
}
function renderSdp(row){
  sdpSlot.replaceChildren(el('h3','SDP 서버 연결'));
  if(row?.status==='disconnected'&&row.reason==='NO_SDP_CONFIG'){
    sdpSlot.appendChild(el('p','SDP 미연결','pc-status-value'));
  }else sdpSlot.appendChild(el('p','확인 불가','pc-status-value'));
  sdpSlot.appendChild(el('p',`사유: ${reason(row)}`));
  sdpSlot.appendChild(el('p','PC 네트워크 조회 성공은 SDP 서버 접속 성공을 뜻하지 않습니다.','muted'));
  sdpSlot.appendChild(el('p',`상태 확인 시각: ${timestamp(row?.checkedAt)}`,'pc-status-time'));
}
function renderEmpty(code='NETWORK_ERROR'){
  const empty={status:'unavailable',reason:code,measuredAt:null};
  renderNetwork(empty);renderFirewall(empty);renderEvents({system:empty,application:empty});renderSdp(empty);
}
function showErrors(failures){
  errorPanel.replaceChildren();
  if(failures.length===0){errorPanel.hidden=true;return;}
  errorPanel.appendChild(el('h3',`조회 실패 · ${failures.map(([name])=>name).join(' · ')}`));
  const list=el('ul');
  for(const [name,row] of failures){
    list.appendChild(el('li',`${name}: ${reason(row)} 다음 행동: ${nextAction(row)}`));
  }
  errorPanel.appendChild(list);
  errorPanel.hidden=false;
}
function renderBeforeFirstRequest(){
  for(const slot of [networkSlot,firewallSlot,eventsSlot])slot.replaceChildren(el('p','첫 조회를 준비 중입니다. 아직 실제 값을 확인하지 않았습니다.'));
  sdpSlot.replaceChildren(el('h3','SDP 서버 연결'),el('p','상태 확인 중 · PC 측정과 별도'));
  showErrors([]);
}
async function refresh(){
  if(pending)return;
  pending=true;refreshButton.disabled=true;refreshButton.textContent='Windows 상태 조회 중…';
  for(const slot of [networkSlot,firewallSlot,eventsSlot])slot.setAttribute('aria-busy','true');
  showErrors([]);
  message.textContent='Windows 읽기 전용 조회 중… (설정 변경 없음)';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),11000);
  try{
    const response=await fetch('/api/windows-observation',{method:'GET',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('API_FAILURE');
    const payload=await response.json();
    if(payload?.ok!==true||payload?.data?.schema!=='gigachad.windows-observation.v1'
      ||payload.data.source!=='local-windows'||payload.data.scope!=='app-host')throw Error('INVALID_RESPONSE');
    const data=payload.data;
    renderNetwork(data.network);renderFirewall(data.firewall);renderEvents(data);renderSdp(payload.sdp);
    const labels={network:'네트워크',firewall:'방화벽',system:'System 기록',application:'Application 기록'};
    const failed=Object.keys(labels).filter(key=>!measurable(data[key]));
    showErrors(failed.map(key=>[labels[key],data[key]]));
    message.textContent=`로컬 Windows 정보 ${4-failed.length}/4항목 조회 응답 · ${failed.length?'일부 확인 불가 · ':''}${timestamp(data.checkedAt)} · 예제 데이터와 분리`;
  }catch(error){
    const code=controller.signal.aborted?'TIMEOUT':'NETWORK_ERROR';
    const empty={status:'unavailable',reason:code,measuredAt:null};
    renderEmpty(code);
    showErrors(['네트워크','방화벽','System 기록','Application 기록'].map(name=>[name,empty]));
    message.textContent=`Windows 상태 확인 불가 · ${reason(empty)}`;
  }finally{
    clearTimeout(timer);pending=false;refreshButton.disabled=false;refreshButton.textContent='Windows 상태 다시 조회';
    for(const slot of [networkSlot,firewallSlot,eventsSlot])slot.removeAttribute('aria-busy');
  }
}
if(refreshButton&&message&&networkSlot&&firewallSlot&&eventsSlot&&sdpSlot&&errorPanel){
  refreshButton.addEventListener('click',refresh);
  renderBeforeFirstRequest();refresh();
}
