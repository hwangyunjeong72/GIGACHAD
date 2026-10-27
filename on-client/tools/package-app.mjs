// Basic portable package: only Git-tracked app source; never copy credentials.
// Each output is new and outside the repository; no existing release is overwritten.
import {execFile,spawnSync} from 'node:child_process';
import {promisify} from 'node:util';
import {copyFile,lstat,mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {basename,dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const run=promisify(execFile);
const appRoot=fileURLToPath(new URL('../',import.meta.url));
const root=resolve(appRoot);
const denyNames=new Set(['.env','.npmrc','id_rsa','id_ed25519']);
const denyEnds=/\.(?:pem|pfx|p12|key|db|sqlite|sqlite3)$/i;

async function gitAt(cwd,...args){
  const {stdout}=await run('git',args,{cwd,encoding:'utf8',maxBuffer:2_000_000});
  return stdout.trim();
}
const git=(...args)=>gitAt(root,...args);
function safeFile(name){
  const parts=name.split(/[\\/]/);
  return !parts.some(part=>denyNames.has(part.toLowerCase())||denyEnds.test(part)
    ||part.toLowerCase()==='node_modules'||part.toLowerCase()==='secrets')
    &&(!basename(name).startsWith('.env.')||basename(name)==='.env.example');
}

async function main(){
  const repoRoot=await git('rev-parse','--show-toplevel');
  const commit=await git('rev-parse','HEAD');
  const branch=await git('branch','--show-current');
  const dirty=await git('status','--porcelain=v1');
  if(dirty)throw Error('작업 폴더에 커밋되지 않은 변경이 있습니다. 먼저 상태를 확인하고 커밋한 뒤 포장해 주세요.');
  const relativeRoot=relative(repoRoot,root).split(sep).join('/');
  if(relativeRoot.startsWith('../')||relativeRoot==='..')throw Error('APP_OUTSIDE_GIT_REPO');
  const tracked=await gitAt(repoRoot,'ls-files','-z','--',relativeRoot||'.');
  const items=tracked.split('\0').filter(Boolean)
    .map(file=>({file,sub:relative(root,resolve(repoRoot,file))}))
    .filter(({sub})=>sub&&!sub.startsWith('..')&&!sub.startsWith(sep));
  if(!items.length)throw Error('NO_TRACKED_APP_FILES');
  if(items.some(({sub})=>!safeFile(sub)))throw Error('추적 중인 파일에 비밀값·개인 DB로 보이는 파일이 있어 포장을 중단했습니다.');
  let totalBytes=0;
  for(const {file} of items){
    const info=await lstat(resolve(repoRoot,file));
    if(!info.isFile()||info.isSymbolicLink()||info.size>10_000_000)throw Error('포장 가능한 일반 파일이 아닌 항목이 있습니다.');
    totalBytes+=info.size;
  }
  if(totalBytes>30_000_000)throw Error('PACKAGE_TOO_LARGE');

  const outputParent=resolve(repoRoot,'..','GIGACHAD-packages');
  await mkdir(outputParent,{recursive:true});
  const folder=await mkdtemp(join(outputParent,'GIGACHAD-release-'));
  for(const {file,sub} of items){
    const dest=join(folder,sub);
    await mkdir(dirname(dest),{recursive:true});
    await copyFile(resolve(repoRoot,file),dest);
  }
  const launcher='@echo off\r\ncd /d "%~dp0"\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\\start-alekov.ps1"\r\n';
  await writeFile(join(folder,'GIGACHAD-start.cmd'),launcher,'ascii');

  let shortcut='Windows 환경에서 생성되지 않음';
  if(process.platform==='win32'){
    const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
      join(root,'tools','create-shortcut.ps1'),'-AppRoot',folder],{windowsHide:true,encoding:'utf8',timeout:10000});
    shortcut=result.status===0&&result.stdout.includes('SHORTCUT_CREATED')?'GIGACHAD-launch.lnk 생성':'생성 실패 · GIGACHAD-start.cmd 사용';
  }
  await writeFile(join(folder,'PACKAGE-INFO.json'),JSON.stringify({
    project:'GIGACHAD',sourceCommit:commit,sourceBranch:branch,
    createdAt:new Date().toISOString(),trackedSourceFiles:items.length,
    packageMode:'Git-tracked source + user shortcut',shortcut,
    verification:'패키지 생성 확인. 사용자 Windows PC 실행·SDP 연결은 별도로 검증해야 함.',
  },null,2)+'\n','utf8');
  await writeFile(join(folder,'START-HERE.txt'),[
    '기가차드 | 처음 실행하는 사람을 위한 간단 안내',
    '1. 이 포장 폴더 전체를 Windows PC의 일반 폴더에 보관합니다.',
    '2. PowerShell에서 node --version 을 확인합니다. 권장 v24.19.0 (지원 22~24).',
    '3. GIGACHAD-launch.lnk 가 있으면 더블클릭, 없으면 GIGACHAD-start.cmd 를 더블클릭합니다.',
    '4. http://127.0.0.1:5189/ 를 브라우저에서 열고 보호 현황과 다시 조회를 확인합니다.',
    '5. 실행 창에서 Ctrl+C 로 종료합니다. 브라우저만 닫아서는 서버가 종료되지 않습니다.',
    '6. 오류가 나면 정확한 문구·막힌 단계를 적습니다. 관리자 권한이나 보안 설정 변경을 요구하지 않습니다.',
    '포장본의 docs/GIGACHAD_DAY5_QUICK_START.md 에 처음 사용자용 전체 안내가 있습니다.',
    '케셰브는 제공 시작 도구가 표시하는 기존 이름이며, 이 앱의 별칭은 기가차드입니다.',
    'CPU/메모리/디스크는 앱 서버 PC 실측이며, 예제 자료와 SDP 연결 여부는 별개입니다.',
    '비밀값·개인 설정·Windows 로그 원문은 포장하지 않습니다. SDP/AI 실연결은 별도 승인 설정이 필요합니다.',
    '',
  ].join('\r\n'),'utf8');
  console.log(`포장 완료: ${folder}`);
  console.log(`커밋: ${commit} · 추적된 소스 파일 ${items.length}개`);
  console.log(`Windows 바로가기: ${shortcut} · 실행 파일: GIGACHAD-start.cmd`);
}

main().catch(error=>{console.error(`포장 중단: ${error.message}`);process.exitCode=1;});
