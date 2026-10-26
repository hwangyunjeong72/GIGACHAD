import test from 'node:test';
import assert from 'node:assert/strict';
import {collectPcStatus} from '../src/pc-status.mjs';

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
