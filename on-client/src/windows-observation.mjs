// Local Windows-only, read-only observations. Each source can fail independently.
import {spawn} from 'node:child_process';
import {isIP} from 'node:net';
import {platform} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HELPER=fileURLToPath(new URL('../tools/read-windows-observation.ps1',import.meta.url));
const MAX_OUTPUT=32768;
const REASONS=new Set(['WINDOWS_ONLY','ACCESS_DENIED','COMMAND_UNAVAILABLE','QUERY_FAILED','LOG_UNAVAILABLE','TIMEOUT','INVALID_RESULT','PROCESS_FAILED','OUTPUT_TOO_LARGE']);
const SECTIONS=Object.freeze({network:'network',firewall:'firewall',system:'System',application:'Application'});
const missing=reason=>({status:'unavailable',measuredAt:null,reason});
const safeString=(value,max=128)=>typeof value==='string'&&value.length>0&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value);
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const count=value=>Number.isSafeInteger(value)&&value>=0;
const ipList=value=>Array.isArray(value)&&value.length<=16&&value.every(item=>safeString(item,45)&&isIP(item)===4);

function valid(section,value){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  if(value.status==='unavailable')return REASONS.has(value.reason)&&value.measuredAt===null;
  if(value.status!=='measured'||!iso(value.measuredAt))return false;
  if(section==='network')return value.unit==='adapters'&&count(value.adapterCount)
    &&typeof value.truncated==='boolean'&&Array.isArray(value.adapters)&&value.adapters.length<=32
    &&value.adapterCount>=value.adapters.length&&value.truncated===(value.adapterCount>32)
    &&value.adapters.every(item=>item&&safeString(item.name)&&safeString(item.status,80)
      &&ipList(item.ipv4)&&ipList(item.gateway));
  if(section==='firewall')return Array.isArray(value.profiles)&&value.profiles.length>=1&&value.profiles.length<=3
    &&new Set(value.profiles.map(p=>p.name)).size===value.profiles.length
    &&value.profiles.every(item=>item&&['Domain','Private','Public'].includes(item.name)
      &&typeof item.enabled==='boolean'&&safeString(item.inbound,40)&&safeString(item.outbound,40));
  return value.log===SECTIONS[section]&&value.unit==='events'&&count(value.errorCount)
    &&count(value.warningCount)&&iso(value.windowStart)&&iso(value.windowEnd)
    &&Date.parse(value.windowStart)<=Date.parse(value.windowEnd);
}

// Helper never receives user input or remote addresses. Stdout is aggregated JSON only.
export async function readWindowsSection(section,{spawnProcess=spawn,timeoutMs=8000}={}){
  if(!Object.hasOwn(SECTIONS,section))throw Error('UNKNOWN_SECTION');
  return new Promise(resolveResult=>{
    let completed=false,child,stdout='',timer;
    const finish=result=>{if(completed)return;completed=true;clearTimeout(timer);resolveResult(result);};
    try{
      const executable=resolve(process.env.SystemRoot??'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
      child=spawnProcess(executable,['-NoLogo','-NoProfile','-NonInteractive','-File',HELPER,'-Section',SECTIONS[section]],{
        windowsHide:true,shell:false,stdio:['ignore','pipe','ignore'],env:{SystemRoot:process.env.SystemRoot??'C:\\Windows',WINDIR:process.env.WINDIR??'C:\\Windows'},
      });
      timer=setTimeout(()=>{child.kill();finish(missing('TIMEOUT'));},timeoutMs);
      child.stdout?.on('data',chunk=>{
        stdout+=chunk.toString('utf8');
        if(Buffer.byteLength(stdout,'utf8')>MAX_OUTPUT){child.kill();finish(missing('OUTPUT_TOO_LARGE'));}
      });
      child.on('error',()=>finish(missing('PROCESS_FAILED')));
      child.on('close',code=>{
        if(completed)return;
        if(code!==0)return finish(missing('PROCESS_FAILED'));
        try{
          const output=JSON.parse(stdout.trim());
          finish(valid(section,output)?output:missing('INVALID_RESULT'));
        }catch{finish(missing('INVALID_RESULT'));}
      });
    }catch{finish(missing('PROCESS_FAILED'));}
  });
}

export async function collectWindowsObservation({os=platform(),readSection=readWindowsSection,now=()=>new Date()}={}){
  const data={schema:'gigachad.windows-observation.v1',source:'local-windows',scope:'app-host',
    network:missing('WINDOWS_ONLY'),firewall:missing('WINDOWS_ONLY'),
    system:missing('WINDOWS_ONLY'),application:missing('WINDOWS_ONLY')};
  if(os==='win32'){
    await Promise.all(Object.keys(SECTIONS).map(async section=>{
      try{const result=await readSection(section);data[section]=valid(section,result)?result:missing('INVALID_RESULT');}
      catch{data[section]=missing('QUERY_FAILED');}
    }));
  }
  data.checkedAt=now().toISOString();
  return data;
}
