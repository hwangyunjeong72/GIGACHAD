// 학생 추가 UI: 값을 합성하거나 예제 모드의 값을 PC 측정값에 섞지 않는다.
const button=document.getElementById('pc-status-refresh');
const message=document.getElementById('pc-status-message');
const values=document.getElementById('pc-status-values');
const compare=document.getElementById('pc-status-compare');
const errorPanel=document.getElementById('pc-status-errors');
let latest=null;
let pending=false;

function element(tag,content='',className=''){
  const node=document.createElement(tag);
  node.textContent=content;
  if(className)node.className=className;
  return node;
}
function when(value){
  const date=typeof value==='string'?new Date(value):new Date(NaN);
  return Number.isFinite(date.getTime())
    ? `${date.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})} (KST)` : '확인 불가';
}
function amount(bytes){return `${(bytes/1073741824).toFixed(2)} GiB`;}
function measured(row){return row?.status==='measured'&&typeof row.measuredAt==='string'
  &&Number.isFinite(Date.parse(row.measuredAt));}
function validPercent(value){return Number.isFinite(value)&&value>=0&&value<=100;}
function validBytes(value){return Number.isSafeInteger(value)&&value>=0;}

function metricValue(row,kind){
  if(!measured(row))return null;
  if(kind==='cpu'&&validPercent(row.usagePercent))return `${row.usagePercent.toFixed(1)} %`;
  if(kind==='memory'&&validBytes(row.usedBytes)&&validBytes(row.totalBytes)&&row.usedBytes<=row.totalBytes)
    return `${amount(row.usedBytes)} / ${amount(row.totalBytes)}`;
  if(kind==='disk'&&validBytes(row.availableBytes)&&validBytes(row.totalBytes)&&row.availableBytes<=row.totalBytes)
    return `${amount(row.availableBytes)} 남음 / ${amount(row.totalBytes)}`;
  return null;
}
function metric(title,row,kind){
  const card=element('section','','pc-status-metric');
  card.appendChild(element('h3',title));
  const value=metricValue(row,kind),actual=value!==null;
  card.dataset.state=actual?'measured':'unavailable';
  card.appendChild(element('p',value??'확인 불가','pc-status-value'));
  card.appendChild(element('p',actual?'실제 로컬 측정 · 예제 값 아님':'확인 불가 · 예시 값으로 대체하지 않음'));
  card.appendChild(element('p',`측정 시각: ${actual?when(row.measuredAt):'확인 불가'}`,'pc-status-time'));
  if(kind==='cpu')card.appendChild(element('p','단위: % (논리 CPU 합계, 약 0.5초 구간)','muted'));
  if(kind==='memory')card.appendChild(element('p','단위: GiB (전체 메모리 − 자유 메모리)','muted'));
  if(kind==='disk')card.appendChild(element('p','단위: GiB (앱 설치 드라이브의 사용 가능 공간)','muted'));
  return card;
}
function showErrors(names,reason){
  errorPanel.replaceChildren();
  if(names.length===0){errorPanel.hidden=true;return;}
  errorPanel.appendChild(element('h3',`조회 실패 · ${names.join(' · ')}`));
  errorPanel.appendChild(element('p',`확인 불가 원인: ${reason}`));
  errorPanel.appendChild(element('p','다음 행동: 「PC 상태 다시 조회」를 한 번 더 누르고, 계속 실패하면 앱을 종료했다가 일반 권한으로 다시 실행하세요. 그래도 실패하면 이 오류 문구를 기록해 주세요.'));
  errorPanel.hidden=false;
}
function difference(current,previous,field,unit){
  if(!measured(current)||!measured(previous))return '확인 불가';
  const a=current[field],b=previous[field];
  if(!Number.isFinite(a)||!Number.isFinite(b))return '확인 불가';
  const delta=unit==='GiB'?(a-b)/1073741824:a-b;
  if(Math.abs(delta)<0.00001)return '변화 없음';
  return `${delta>0?'증가':'감소'} ${Math.abs(delta).toFixed(unit==='GiB'?2:1)} ${unit}`;
}
function render(data,previous){
  values.replaceChildren(
    metric('CPU 사용률',data?.cpu,'cpu'),
    metric('메모리 사용량',data?.memory,'memory'),
    metric('디스크 남은 공간',data?.disk,'disk'),
  );
  compare.replaceChildren();
  compare.appendChild(element('h3','직전 측정과 비교'));
  if(!data||!previous){
    compare.appendChild(element('p','비교할 이전 측정값이 없습니다. 「PC 상태 다시 조회」를 누르면 비교합니다.'));
    return;
  }
  const list=element('ul');
  for(const [title,next,old,field,unit] of [
    ['CPU 사용률',data.cpu,previous.cpu,'usagePercent','%p'],
    ['메모리 사용량',data.memory,previous.memory,'usedBytes','GiB'],
    ['디스크 남은 공간',data.disk,previous.disk,'availableBytes','GiB'],
  ])list.appendChild(element('li',`${title}: ${difference(next,old,field,unit)}`));
  compare.appendChild(list);
  compare.appendChild(element('p','최근 두 번의 실제 로컬 측정만 비교합니다. 장기 추이나 알림은 제공하지 않습니다. SDP 연결은 별도의 네 번째 상태 카드에서 확인합니다.','muted'));
}

async function refresh(){
  if(pending)return;
  pending=true;button.disabled=true;button.textContent='PC 상태 조회 중…';
  values.setAttribute('aria-busy','true');
  showErrors([],'');
  message.textContent='실제 PC 상태 측정 중…';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch('/api/pc-status',{method:'GET',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('HTTP_ERROR');
    const body=await response.json();
    if(body?.ok!==true||body?.data?.schema!=='gigachad.pc-status.v1'
      ||body.data.source!=='local-os'||body.data.scope!=='app-host')throw Error('INVALID_RESULT');
    const previous=latest;
    latest=body.data;
    render(latest,previous);
    const names={cpu:'CPU 사용률',memory:'메모리 사용량',disk:'디스크 남은 공간'};
    const failed=Object.keys(names).filter(key=>metricValue(latest[key],key)===null);
    showErrors(failed.map(key=>names[key]),'운영체제 측정값을 읽지 못했거나 값·측정 시각을 검증하지 못했습니다. 원인을 정상 0으로 간주하지 않습니다.');
    const available=3-failed.length;
    message.textContent=`앱 실행 PC의 로컬 측정 · ${available}/3항목 측정 응답 · 조회 완료 ${when(latest.checkedAt)}`;
  }catch(error){
    latest=null;
    render(null,null);
    const cause=controller.signal.aborted?'요청 시간(7초)을 초과했습니다.'
      :error.message==='INVALID_RESULT'?'앱 서버의 PC 측정 응답을 검증하지 못했습니다.'
      :error.message==='HTTP_ERROR'?'앱 서버가 PC 측정 요청을 정상 처리하지 못했습니다.'
      :'로컬 앱 서버에 연결하지 못했습니다.';
    showErrors(['CPU 사용률','메모리 사용량','디스크 남은 공간'],cause);
    message.textContent=`PC 상태 확인 불가 · ${cause}`;
  }finally{
    clearTimeout(timer);pending=false;button.disabled=false;button.textContent='PC 상태 다시 조회';
    values.removeAttribute('aria-busy');
  }
}
if(button&&message&&values&&compare&&errorPanel){
  button.addEventListener('click',refresh);
  render(null,null);
  showErrors([],'');
  refresh();
}
