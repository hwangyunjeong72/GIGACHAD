import test from 'node:test';
import assert from 'node:assert/strict';
import {collectPcStatus} from '../src/pc-status.mjs';
import {createStudentView} from '../student/extension.mjs';

const cpu=(idle,used)=>[{times:{user:used,nice:0,sys:0,idle,irq:0}}];
const clock=()=>new Date('2026-10-26T01:02:03.000Z');

test('각 항목의 실제 측정값·단위용 원시값·시각을 유지한다',async()=>{
  let count=0;
  const result=await collectPcStatus({
    readCpus:()=>++count===1?cpu(80,20):cpu(130,70),
    readTotalMem:()=>8*1024**3,readFreeMem:()=>3*1024**3,
    readStatfs:async()=>({bsize:4096n,blocks:1000000n,bavail:250000n}),
    wait:async()=>{},now:clock,diskPath:'/test-only',
  });
  assert.equal(result.source,'local-os');
  assert.equal(result.cpu.usagePercent,50);
  assert.equal(result.memory.usedBytes,5*1024**3);
  assert.equal(result.memory.totalBytes,8*1024**3);
  assert.equal(result.disk.availableBytes,1024000000);
  assert.equal(result.disk.volume,'app-drive');
  for(const key of ['cpu','memory','disk']){
    assert.equal(result[key].status,'measured');
    assert.equal(result[key].measuredAt,clock().toISOString());
  }
});

test('CPU와 디스크 오류, 잘못된 메모리는 모두 확인 불가(0으로 대체하지 않음)',async()=>{
  const result=await collectPcStatus({
    readCpus:()=>{throw Error('unavailable');},
    readTotalMem:()=>100,readFreeMem:()=>101,
    readStatfs:async()=>{throw Error('unavailable');},
    wait:async()=>{},now:clock,
  });
  for(const key of ['cpu','memory','disk']){
    assert.deepEqual(result[key],{status:'unavailable',measuredAt:null});
    assert.equal(Object.hasOwn(result[key],'usagePercent'),false);
  }
});

test('CPU 시간 차이가 없더라도 0% 사용률로 추정하지 않는다',async()=>{
  const result=await collectPcStatus({
    readCpus:()=>cpu(10,10),readTotalMem:()=>100,readFreeMem:()=>20,
    readStatfs:async()=>({bsize:1024n,blocks:100n,bavail:20n}),
    wait:async()=>{},now:clock,
  });
  assert.equal(result.cpu.status,'unavailable');
  assert.equal(result.memory.status,'measured');
  assert.equal(result.disk.status,'measured');
});

test('PC 모의 화면: 대기 중 버튼 잠금, 일부 확인 불가와 다음 행동, 다시 조회 시 시각 갱신',async()=>{
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
