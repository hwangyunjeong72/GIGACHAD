import test from 'node:test';
import assert from 'node:assert/strict';
import {collectWindowsObservation} from '../src/windows-observation.mjs';

const checkedAt='2026-10-27T01:02:03.000Z';
const time=()=>new Date(checkedAt);
const success={
  network:{status:'measured',measuredAt:checkedAt,unit:'adapters',adapterCount:2,truncated:false,
    adapters:[{name:'Ethernet',status:'Up',ipv4:['192.0.2.10'],gateway:['192.0.2.1']},
      {name:'Wi-Fi',status:'Disconnected',ipv4:[],gateway:[]}]},
  firewall:{status:'measured',measuredAt:checkedAt,profiles:[
    {name:'Domain',enabled:true,inbound:'Block',outbound:'Allow'},
    {name:'Private',enabled:true,inbound:'Block',outbound:'Allow'},
    {name:'Public',enabled:false,inbound:'Block',outbound:'Allow'}]},
  system:{status:'measured',measuredAt:checkedAt,log:'System',unit:'events',errorCount:0,warningCount:4,
    windowStart:'2026-10-26T01:02:03.000Z',windowEnd:checkedAt},
  application:{status:'measured',measuredAt:checkedAt,log:'Application',unit:'events',errorCount:2,warningCount:0,
    windowStart:'2026-10-26T01:02:03.000Z',windowEnd:checkedAt},
};

test('Windows 모의 응답: 서로 다른 4개 읽기 결과·시각·단위 구분',async()=>{
  const called=[];
  const value=await collectWindowsObservation({os:'win32',now:time,readSection:async section=>{
    called.push(section);return success[section];
  }});
  assert.deepEqual(called.sort(),['application','firewall','network','system']);
  assert.equal(value.source,'local-windows');
  assert.equal(value.scope,'app-host');
  assert.equal(value.network.adapterCount,2);
  assert.equal(value.firewall.profiles[2].enabled,false);
  assert.equal(value.system.errorCount,0); // genuine zero is not 'unknown'
  assert.equal(value.application.warningCount,0);
  assert.equal(value.checkedAt,checkedAt);
});

test('권한 거부는 확인 불가, 다른 로그의 정상 0건은 그대로 둔다',async()=>{
  const value=await collectWindowsObservation({os:'win32',now:time,readSection:async section=>
    section==='system'?{status:'unavailable',measuredAt:null,reason:'ACCESS_DENIED'}:success[section]});
  assert.deepEqual(value.system,{status:'unavailable',measuredAt:null,reason:'ACCESS_DENIED'});
  assert.equal(value.application.warningCount,0);
  assert.equal(value.system.errorCount,undefined);
});

test('다른 OS에서 Windows 결과를 합성하지 않고 이유와 함께 확인 불가로 표시',async()=>{
  let called=false;
  const value=await collectWindowsObservation({os:'linux',now:time,readSection:async()=>{called=true;}});
  assert.equal(called,false);
  for(const section of ['network','firewall','system','application']){
    assert.deepEqual(value[section],{status:'unavailable',measuredAt:null,reason:'WINDOWS_ONLY'});
  }
});

test('형식 불량·명령 예외를 성공 또는 0으로 바꾸지 않는다',async()=>{
  const value=await collectWindowsObservation({os:'win32',now:time,readSection:async section=>{
    if(section==='network')return {...success.network,adapters:[{...success.network.adapters[0],ipv4:['not-an-ip']}]};
    if(section==='firewall')throw Error('sensitive path should not be surfaced');
    return success[section];
  }});
  assert.equal(value.network.reason,'INVALID_RESULT');
  assert.equal(value.firewall.reason,'QUERY_FAILED');
  assert.equal(JSON.stringify(value).includes('sensitive path'),false);
});

test('학생 UI 모의 DOM에서 조회값과 SDP 미연결·침해 판정 아님을 구분한다',async()=>{
  class FakeElement{
    constructor(tag){this.tagName=tag;this.children=[];this.value='';this.disabled=false;this.attributes={};this.hidden=false;}
    set textContent(text){this.value=String(text);this.children=[];}
    get textContent(){return this.value+this.children.map(child=>child.textContent).join(' ');}
    appendChild(child){this.children.push(child);return child;}
    replaceChildren(...children){this.value='';this.children=[...children];}
    addEventListener(kind,listener){if(kind==='click')this.click=listener;}
    setAttribute(key,value){this.attributes[key]=value;}
    removeAttribute(key){delete this.attributes[key];}
  }
  const ids=['windows-observation-refresh','windows-observation-message','windows-network',
    'windows-firewall','windows-events','sdp-status-summary','windows-observation-errors'];
  const slots=new Map(ids.map(id=>[id,new FakeElement('div')]));
  const originalDocument=globalThis.document,originalFetch=globalThis.fetch;
  globalThis.document={getElementById:id=>slots.get(id),createElement:tag=>new FakeElement(tag)};
  globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true,data:{
    schema:'gigachad.windows-observation.v1',source:'local-windows',scope:'app-host',checkedAt,
    ...success,system:{status:'unavailable',measuredAt:null,reason:'ACCESS_DENIED'},
  },sdp:{status:'disconnected',reason:'NO_SDP_CONFIG',checkedAt}})});
  try{
    await import('../public/windows-observation.mjs?test-dom');
    await new Promise(resolve=>setImmediate(resolve));
    assert.match(slots.get('sdp-status-summary').textContent,/SDP 미연결/);
    assert.match(slots.get('windows-network').textContent,/실제 로컬 조회/);
    assert.match(slots.get('windows-firewall').textContent,/개인: 켜짐/);
    assert.match(slots.get('windows-events').textContent,/System.*확인 불가/s);
    assert.match(slots.get('windows-events').textContent,/Application.*오류 2건.*경고 0건/s);
    assert.doesNotMatch(slots.get('windows-events').textContent,/System.*오류 0건/s);
    assert.match(slots.get('windows-observation-errors').textContent,/System 기록.*다음 행동/s);
    assert.equal(slots.get('windows-observation-refresh').disabled,false);
  }finally{globalThis.document=originalDocument;globalThis.fetch=originalFetch;}
});

test('Windows 모의 조회 실패 → 오류 항목·다음 행동 → 버튼 재조회 및 대기 표시',async()=>{
  class FakeElement{
    constructor(tag){this.tagName=tag;this.value='';this.children=[];this.disabled=false;this.hidden=false;this.attributes={};}
    set textContent(value){this.value=String(value);this.children=[];}
    get textContent(){return this.value+this.children.map(child=>child.textContent).join(' ');}
    appendChild(child){this.children.push(child);return child;}
    replaceChildren(...children){this.value='';this.children=[...children];}
    addEventListener(kind,callback){if(kind==='click')this.click=callback;}
    setAttribute(name,value){this.attributes[name]=value;}
    removeAttribute(name){delete this.attributes[name];}
  }
  const ids=['windows-observation-refresh','windows-observation-message','windows-network',
    'windows-firewall','windows-events','sdp-status-summary','windows-observation-errors'];
  const slots=new Map(ids.map(id=>[id,new FakeElement('div')]));
  const oldDoc=globalThis.document,oldFetch=globalThis.fetch;
  let finishFirst;let calls=0;
  globalThis.document={getElementById:id=>slots.get(id),createElement:tag=>new FakeElement(tag)};
  globalThis.fetch=()=>{
    calls++;
    if(calls===1)return new Promise(resolve=>{finishFirst=resolve;});
    return Promise.resolve({ok:true,json:async()=>({ok:true,data:{
      schema:'gigachad.windows-observation.v1',source:'local-windows',scope:'app-host',checkedAt,...success,
    },sdp:{status:'disconnected',reason:'NO_SDP_CONFIG',checkedAt}})});
  };
  try{
    await import('../public/windows-observation.mjs?test-retry');
    assert.equal(slots.get('windows-observation-refresh').disabled,true);
    assert.match(slots.get('windows-observation-refresh').textContent,/조회 중/);
    assert.equal(slots.get('windows-network').attributes['aria-busy'],'true');
    finishFirst({ok:false});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(slots.get('windows-observation-refresh').disabled,false);
    assert.match(slots.get('windows-observation-errors').textContent,/네트워크.*방화벽.*System 기록.*Application 기록/s);
    assert.match(slots.get('windows-observation-errors').textContent,/다음 행동/);
    assert.match(slots.get('windows-network').textContent,/확인 불가/);
    await slots.get('windows-observation-refresh').click();
    assert.equal(calls,2);
    assert.equal(slots.get('windows-observation-errors').hidden,true);
    assert.match(slots.get('windows-events').textContent,/System.*오류 0건/s);
    assert.match(slots.get('windows-events').textContent,/조회 시각:/);
  }finally{globalThis.document=oldDoc;globalThis.fetch=oldFetch;}
});
