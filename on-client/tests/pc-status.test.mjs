import test from 'node:test';
import assert from 'node:assert/strict';
import {createPcStatusReader, cpuUsage} from '../src/pc-status.mjs';
import {pcMetricText} from '../public/pc-status-view.mjs';
import {createStudentView} from '../student/extension.mjs';

const cpu=(idle,used)=>[{times:{user:used,nice:0,sys:0,idle,irq:0}}];
const clock=()=>new Date('2026-10-26T01:02:03.000Z');

test('0.2.21 제공 PC 계약: 측정 원시값·시각·미지원 Windows 항목을 구분한다',async()=>{
  let count=0;
  const read=createPcStatusReader({
    system:{cpus:()=>++count===1?cpu(80,20):cpu(130,70),totalmem:()=>8*1024**3,
      freemem:()=>3*1024**3,networkInterfaces:()=>({Ethernet:[{internal:false,family:'IPv4'}]})},
    disk:async()=>({bsize:4096n,blocks:1000000n,bavail:250000n}),
    pause:async()=>{},clock,platform:'linux',
  });
  const result=await read();
  assert.equal(result.schema,'aleph.on.pc-status.v1');
  assert.equal(result.source,'local-pc');
  assert.equal(result.measuredAt,clock().toISOString());
  assert.equal(result.metrics.cpu.usagePercent,50);
  assert.equal(result.metrics.memory.usedBytes,5*1024**3);
  assert.equal(result.metrics.disk.freeBytes,1024000000);
  assert.equal(result.metrics.network.interfaceCount,1);
  assert.deepEqual(result.metrics.firewall,{state:'unavailable',reason:'unsupported'});
  assert.deepEqual(result.metrics.events,{state:'unavailable',reason:'unsupported'});
});

test('CPU와 디스크 오류, 잘못된 메모리는 모두 확인 불가(0으로 대체하지 않음)',async()=>{
  const read=createPcStatusReader({system:{cpus:()=>{throw Error('unavailable');},
    totalmem:()=>100,freemem:()=>101,networkInterfaces:()=>({})},
    disk:async()=>{throw Error('unavailable');},pause:async()=>{},clock,platform:'linux'});
  const result=await read();
  for(const key of ['cpu','memory','disk']){
    assert.equal(result.metrics[key].state,'unavailable');
    assert.equal(Object.hasOwn(result.metrics[key],'usagePercent'),false);
    assert.equal(pcMetricText(key,result.metrics[key]).text,'확인 불가');
  }
});

test('CPU 시간 차이가 없더라도 0% 사용률로 추정하지 않는다',async()=>{
  assert.equal(cpuUsage(cpu(10,10),cpu(10,10)).state,'unavailable');
  assert.equal(pcMetricText('cpu',cpuUsage(cpu(10,10),cpu(10,10))).text,'확인 불가');
  assert.equal(pcMetricText('memory',{state:'ok',usedBytes:80,totalBytes:100}).state,'measured');
  assert.equal(pcMetricText('disk',{state:'ok',freeBytes:20,totalBytes:100}).state,'measured');
});

test('0.2.21 학생 상단 4카드: 실제 PC 재조회·직전값 비교·조회 실패는 확인 불가',async()=>{
  class FakeElement {
    constructor(tag){this.tagName=tag;this.children=[];this.value='';this.dataset={};this.disabled=false;this.hidden=false;}
    set textContent(value){this.value=String(value);this.children=[];}
    get textContent(){return this.value+this.children.map(x=>x.textContent).join(' ');}
    append(...children){this.children.push(...children);}
    appendChild(child){this.children.push(child);return child;}
    replaceChildren(...children){this.value='';this.children=[...children];}
    setAttribute(){} removeAttribute(){}
    addEventListener(kind,handler){if(kind==='click')this.click=handler;}
  }
  const original=globalThis.document,host=new FakeElement('section');
  globalThis.document={createElement:tag=>new FakeElement(tag),getElementById:id=>id==='gigachad-pc-dashboard'?host:null};
  const time=new Date().toISOString();let reads=0;
  const payload=percent=>({ok:true,data:{schema:'aleph.on.pc-status.v1',source:'local-pc',measuredAt:time,
    metrics:{cpu:{state:'ok',usagePercent:percent},memory:{state:'ok',usedBytes:5*1024**3,totalBytes:8*1024**3},
      disk:{state:'ok',freeBytes:3*1024**3,totalBytes:10*1024**3}}}});
  try{
    createStudentView({api:{get:async path=>{assert.equal(path,'/api/pc/status');reads++;return reads===3?{ok:false,error:{code:'TIMEOUT'}}:payload(reads===1?20:30);}}});
    const button=host.children[2];
    assert.match(host.textContent,/SDP 서버 연결.*별도 확인 필요/s);
    button.click();await new Promise(resolve=>setImmediate(resolve));
    assert.match(host.textContent,/20\.0 %/);
    button.click();await new Promise(resolve=>setImmediate(resolve));
    assert.match(host.textContent,/증가 10\.0 %p/);
    button.click();await new Promise(resolve=>setImmediate(resolve));
    assert.match(host.textContent,/확인 불가: CPU·메모리·디스크/);
    assert.equal(button.disabled,false);
  }finally{globalThis.document=original;}
});

test('보존된 0.2.11 PC 모의 화면: 재조회와 오류 (현재 0.2.21 제공 라우트 검증은 아님)',async()=>{
  class FakeElement{
    constructor(tag){this.tagName=tag;this.value='';this.children=[];this.disabled=false;this.hidden=false;this.dataset={};this.attributes={};}
    set textContent(value){this.value=String(value);this.children=[];}
    get textContent(){return this.value+this.children.map(child=>child.textContent).join(' ');}
    appendChild(child){this.children.push(child);return child;}
    replaceChildren(...children){this.value='';this.children=[...children];}
    addEventListener(kind,listener){if(kind==='click')this.click=listener;}
    setAttribute(key,value){this.attributes[key]=value;}
    removeAttribute(key){delete this.attributes[key];}
  }
  const ids=['pc-status-refresh','pc-status-message','pc-status-values','pc-status-compare','pc-status-errors'];
  const slots=new Map(ids.map(id=>[id,new FakeElement('div')]));
  const originalDoc=globalThis.document,originalFetch=globalThis.fetch;
  const measuredAt='2026-10-27T01:00:00.000Z',laterAt='2026-10-27T01:01:00.000Z';
  let firstDone,requests=0;
  const packet=(time,cpuStatus)=>({ok:true,data:{schema:'gigachad.pc-status.v1',source:'local-os',scope:'app-host',checkedAt:time,
    cpu:cpuStatus==='unavailable'?{status:'unavailable',measuredAt:null}:{status:'measured',usagePercent:20,measuredAt:time},
    memory:{status:'measured',usedBytes:4*1024**3,totalBytes:8*1024**3,measuredAt:time},
    disk:{status:'measured',availableBytes:5*1024**3,totalBytes:10*1024**3,measuredAt:time},
  }});
  globalThis.document={getElementById:id=>slots.get(id),createElement:tag=>new FakeElement(tag)};
  globalThis.fetch=()=>{
    requests++;
    if(requests===1)return new Promise(resolve=>{firstDone=resolve;});
    return Promise.resolve({ok:true,json:async()=>packet(laterAt,'measured')});
  };
  try{
    await import('../public/pc-status.mjs?day4-ui');
    assert.equal(slots.get('pc-status-refresh').disabled,true);
    assert.match(slots.get('pc-status-refresh').textContent,/조회 중/);
    firstDone({ok:true,json:async()=>packet(measuredAt,'unavailable')});
    await new Promise(resolve=>setImmediate(resolve));
    assert.match(slots.get('pc-status-errors').textContent,/CPU 사용률.*다음 행동/s);
    assert.match(slots.get('pc-status-values').textContent,/확인 불가/);
    assert.equal(slots.get('pc-status-refresh').disabled,false);
    await slots.get('pc-status-refresh').click();
    assert.equal(requests,2);
    assert.equal(slots.get('pc-status-errors').hidden,true);
    assert.match(slots.get('pc-status-values').textContent,/20\.0 %/);
    assert.match(slots.get('pc-status-message').textContent,/2026/);
  }finally{globalThis.document=originalDoc;globalThis.fetch=originalFetch;}
});

test('기존 학생 renderStatus는 제공 입력만 요약하며 PC 측정값을 합성하지 않는다',()=>{
  class FakeElement{
    constructor(tag){this.tagName=tag;this.children=[];this.value='';this.attributes={};}
    set textContent(value){this.value=String(value);this.children=[];}
    get textContent(){return this.value+this.children.map(child=>child.textContent).join(' ');}
    appendChild(child){this.children.push(child);return child;}
    setAttribute(key,value){this.attributes[key]=value;}
    addEventListener(){}
  }
  const originalDoc=globalThis.document;
  globalThis.document={createElement:tag=>new FakeElement(tag)};
  try{
    const screen=createStudentView().renderStatus({
      devices:{status:'ok',data:[]},sessions:{status:'error',error:{code:'TIMEOUT',message:'세션 확인 지연'}},
      notifications:[],diagnostics:{status:'error',error:{code:'TIMEOUT',message:'진단 응답 없음'}},mode:'disconnected',
    });
    assert.match(screen.textContent,/먼저 확인할 보안 상태 3가지/);
    assert.match(screen.textContent,/기기·세션.*주의 알림.*연결 진단/s);
    assert.match(screen.textContent,/다음 행동:/);
    assert.doesNotMatch(screen.textContent,/CPU 사용률: \d/);
  }finally{globalThis.document=originalDoc;}
});
