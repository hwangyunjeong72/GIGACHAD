// 앱을 실행한 로컬 PC의 읽기 전용 측정. 원격 SDP·AI·예제 엔진과 무관하다.
import {cpus, totalmem, freemem} from 'node:os';
import {statfs} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';

const MAX_BYTES = BigInt(Number.MAX_SAFE_INTEGER);
const unavailable = () => ({status:'unavailable',measuredAt:null});
const percentage = (a,b) => Math.round(a/b*1000)/10;

function cpuTotals(items){
  if(!Array.isArray(items)||items.length===0)return null;
  let idle=0,total=0;
  for(const item of items){
    const times=item?.times;
    if(!times)return null;
    const values=['user','nice','sys','idle','irq'].map(key=>times[key]);
    if(values.some(value=>!Number.isFinite(value)||value<0))return null;
    idle+=times.idle;
    total+=values.reduce((sum,value)=>sum+value,0);
  }
  return Number.isFinite(total)&&Number.isFinite(idle)?{idle,total,count:items.length}:null;
}

export async function collectPcStatus({
  readCpus=cpus, readTotalMem=totalmem, readFreeMem=freemem,
  readStatfs=statfs, diskPath=process.cwd(), wait=ms=>delay(ms), now=()=>new Date(),
}={}){
  const timestamp=()=>now().toISOString();
  const data={
    schema:'gigachad.pc-status.v1',source:'local-os',scope:'app-host',
    cpu:unavailable(),memory:unavailable(),disk:unavailable(),
  };

  try{
    const before=cpuTotals(readCpus());
    if(before){
      await wait(500);
      const after=cpuTotals(readCpus());
      if(after&&after.count===before.count){
        const total=after.total-before.total,idle=after.idle-before.idle;
        if(total>0&&idle>=0&&idle<=total){
          data.cpu={status:'measured',usagePercent:percentage(total-idle,total),measuredAt:timestamp(),sampleMs:500};
        }
      }
    }
  }catch{/* 다른 측정은 계속하고 CPU만 확인 불가로 남긴다. */}

  try{
    const total=readTotalMem(),free=readFreeMem();
    if(Number.isSafeInteger(total)&&total>0&&Number.isSafeInteger(free)&&free>=0&&free<=total){
      data.memory={status:'measured',usedBytes:total-free,totalBytes:total,
        usagePercent:percentage(total-free,total),measuredAt:timestamp()};
    }
  }catch{/* 메모리 확인 불가 */}

  try{
    const fs=await readStatfs(diskPath,{bigint:true});
    const block=BigInt(fs.bsize),available=BigInt(fs.bavail),blocks=BigInt(fs.blocks);
    const freeBytes=block*available,totalBytes=block*blocks;
    if(block>0n&&available>=0n&&blocks>0n&&freeBytes<=totalBytes
      &&totalBytes<=MAX_BYTES&&freeBytes<=MAX_BYTES){
      data.disk={status:'measured',availableBytes:Number(freeBytes),totalBytes:Number(totalBytes),
        measuredAt:timestamp(),volume:'app-drive'};
    }
  }catch{/* 디스크 확인 불가: 0으로 대체하지 않는다. */}

  data.checkedAt=timestamp();
  return data;
}
