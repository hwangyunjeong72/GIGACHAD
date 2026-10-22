# 17단계 ai_model_called 검토 자료 — 실제 서버·전송 소스 확인

> **검토 유형: 정적 소스 대조만 수행.** 아래 코드는 GitHub 커밋 `e303e3fd6b07a489a67185df2f28e8a360f7e41e`에 있던 제공 파일의 **원문 발췌**입니다. 소스 파일 자체를 변경하거나 인증·AI 모델 호출을 실행한 것이 아닙니다. 원문 전체는 아래 영구 링크에서 검토할 수 있습니다.

## 이번 자료가 필요한 이유

- 2026-10-22 ALEPH 심판 피드백: 9개 항목 중 8개 통과, `ai_model_called`는 **확인 불가**. 제공된 `on-client/src/server.mjs` 및 `on-client/vendor/clco-http.mjs`는 파일 이름만 검토되어 실제 요청/전송 연결이 충분히 확인되지 않았다고 안내함.
- 그러므로 이미 통과한 `student/extension.mjs`의 학생 화면 구현을 변경하지 않고, **제공 파일의 원문·라인·호출 경로를 검토 자료에 포함**함.
- 이 자료가 증명하는 것: `AI 설명 요청`에서 `POST /api/ai/explain`, 서비스의 `chat`, 전송 모듈의 `POST /chat/completions`까지 **소스상 연결 경로가 존재**함.
- 이 자료가 **증명하지 않는 것**: 실제 학생 계정의 이용 권한, 실제 모델 응답, ALEPH `ai_model_called` 공식 통과. 이전 로컬 검사에서는 `NATIVE_HOST_DISABLED`가 표시되었으므로 실제 계정 연결은 미확인. 권한이 준비되지 않은 상태를 성공으로 기록하지 않음.

## 검토할 제공 파일 전체 원문 (커밋 고정 링크)

- [on-client/public/app.js 전체 원문](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/public/app.js) (원본 blob SHA: `002bfdf421f0005c14bb98dcbf3d0163f4be091d`)
- [on-client/src/server.mjs 전체 원문](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/server.mjs) (원본 blob SHA: `42774051fa29614e28f4f823db41fe33942166ed`)
- [on-client/src/ai/vault-service.mjs 전체 원문](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/ai/vault-service.mjs) (원본 blob SHA: `033afb449305c093f4b5b032dd12ebee679a8a27`)
- [on-client/src/ai/service.mjs 전체 원문](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/ai/service.mjs) (원본 blob SHA: `4a78e9303b54dcf73d11172d2abe1fab5b274456`)
- [on-client/vendor/clco-http.mjs 전체 원문](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/vendor/clco-http.mjs) (원본 blob SHA: `aef2a78d36257ef996df8cd9721384519c477fc9`)

## 요청·응답 흐름 (실행 사실이 아닌 소스 경로)

1. 제공 UI `public/app.js`에서 사용자가 **AI 설명 요청** 버튼을 누르면 `requestExplain(event, button)`이 실행됨. `aiRequest('/api/ai/explain', { body: { eventId: event.id }, signal: controller.signal })`으로 서버 요청을 보내도록 작성되어 있음.
2. 제공 서버 `src/server.mjs`는 `POST /api/ai/explain`을 처리함. **native host 경로**에서는 현재 계정·사건과 원천 세대·권한을 확인한 후 `createVaultOnAiService(...).explainIncident(...)`를 호출함. **기존 매핑 경로**에서는 `mappedService().explainIncident(...)`를 호출함. 이는 서로 다른 환경 조건에 따른 코드 분기이지, 현재 PC에서 양쪽 모두 사용 가능하다는 뜻은 아님.
3. 제공 `src/ai/vault-service.mjs`는 서버 안의 앱 전용 vault에서 유효한 자격을 읽고, `createOnAiService(...)`를 구성한 뒤 `service.explainIncident(...)`를 호출함. 브라우저/학생 코드에 토큰을 전달하지 않음.
4. 제공 `src/ai/service.mjs`의 `transport()`는 `../../vendor/clco-http.mjs`에서 `createClcoClient`를 로드함. `explainIncident`의 실제 모델 요청 코드는 `activeClient.chat(...)`를 호출하며 `ai.explain` 권한과 입력·응답의 유효성을 검증하도록 작성되어 있음.
5. 제공 `vendor/clco-http.mjs`는 `chat()`에서 `request('/chat/completions', body, options)`로 이동하고, `request()` 안에서 서버 측 `fetch(..., { method: 'POST', ... })`를 수행하도록 작성되어 있음. 반환값/HTTP 오류 및 요청 취소·시간 초과도 검사함.
6. 제공 UI는 수신된 사건 설명을 검증한 뒤에만 `state.selectedExplanation.resource = { status: 'ok', ... }`로 저장하고 학생 `renderExplanation`에 전달함. 오류나 취소에서는 성공 표식을 붙이지 않음.

## 원문 증거 (제공 파일 그대로 발췌)

아래 코드블록은 **링크한 제공 파일의 연속된 라인을 문자 변경 없이 복사**한 것입니다. 코드 예시는 검토용 원문이며 실행하거나 자격을 발급하는 절차가 아닙니다.


### `on-client/public/app.js`

**목적:** 사용자 클릭 → `aiRequest('/api/ai/explain')` → 제공 화면 검증 → 학생 설명 표시

[원본 953~959행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/public/app.js#L953-L959)

```javascript
      el('button', {
        type: 'button',
        className: 'btn',
        text: 'AI 설명 요청',
            testid: `ai-explain-${event.id}`,
        onclick: (e) => requestExplain(event, e.currentTarget),
      }),
```

[원본 978~1016행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/public/app.js#L978-L1016)

```javascript
async function requestExplain(event, button) {
  clearAction();
  const gen = generation;
  const slot = explainSlots.get(event.id);
  if (!slot) return;
  const requestGen = ++explanationGeneration;
  for (const active of explainControllers.values()) active.abort();
  explainControllers.clear();
  for (const previousSlot of explainSlots.values()) setChildren(previousSlot);
  const controller = new AbortController();
  explainControllers.set(event.id, controller);
  button.disabled = true;
  const safeEvent = safeEventForAi(event) ? structuredClone(event) : null;
  state.selectedExplanation = { event: safeEvent, resource: { status: 'loading' } };
  renderStudent('explanation');
  $('ai-explanation-cancel').disabled = false;
  setChildren(slot, stateBox('loading', 'AI 설명을 요청하는 중…'));
  try {
    const result = safeEvent ? await aiRequest('/api/ai/explain', { body: { eventId: event.id }, signal: controller.signal })
      : localFailure('ON_AI_INVALID_INPUT', AI_MESSAGES.ON_AI_INVALID_INPUT, UNKNOWN_META);
    // 다시 불러오기 이후이거나 기록 칸이 바뀌었으면 늦은 응답은 버린다.
    if (gen !== generation || requestGen !== explanationGeneration || explainSlots.get(event.id) !== slot) return;
    // AI 결과는 기록 목록 상태와 분리한다. 실패해도 기록은 그대로 둔다.
    if (!result.ok) {
      state.selectedExplanation.resource = safeAiFailure(result);
      setChildren(slot, stateBox('error', `AI 설명 실패: ${state.selectedExplanation.resource.error.message}`), el('p', { className: 'muted', text: '기록은 그대로 유지됩니다. AI 연결이나 응답 문제는 과제 실패로 처리되지 않습니다.' }));
      renderStudent('explanation');
      return;
    }
    const explanation = validExplanation(result.data, event);
    if (!explanation || !safeAiTime(result.meta?.checkedAt)) {
      state.selectedExplanation.resource = safeAiFailure({ error: { code: 'ON_AI_INVALID_OUTPUT' } });
      setChildren(slot, stateBox('error', 'AI 설명 확인 불가: 응답 형식이나 근거 ID가 이 기록과 맞지 않습니다.'), el('p', { className: 'muted', text: '기록은 그대로 유지됩니다.' }));
      renderStudent('explanation');
      return;
    }
    state.selectedExplanation.resource = { status: 'ok', data: explanation, meta: result.meta };
    setChildren(slot, renderExplanation(explanation, event, result.meta));
    renderStudent('explanation');
```


### `on-client/src/server.mjs`

**목적:** 앱 서버의 실제 `POST /api/ai/explain` 라우트 두 경로와 원천 검증·서비스 호출

[원본 14~16행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/server.mjs#L14-L16)

```javascript
import {createOnAiService,validateLearnerSupportGuide} from './ai/service.mjs';
import {prepareLearnerSupportRequest} from './ai/learner-support-contract.mjs';
import {createVaultOnAiService} from './ai/vault-service.mjs';
```

[원본 466~525행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/server.mjs#L466-L525)

```javascript
      if(req.method==='POST'&&url.pathname==='/api/ai/explain'&&nativeHost){
        if(!Number.isSafeInteger(aiTimeoutMs)||aiTimeoutMs<=0||aiTimeoutMs>120000){
          send(503,{ok:false,error:{code:'WB_CLCO_INVALID_LIMIT',message:aiErrorMessages.WB_CLCO_INVALID_LIMIT,retryable:false}});return;
        }
        const routeLimit=Math.min(aiTimeoutMs,requestTimeoutMs);
        supportDeadline={wall:requestStartedAt.wall+routeLimit,monotonic:requestStartedAt.monotonic+routeLimit};
        const remaining=()=>{assertAlive();return Math.max(1,Math.floor(Math.min(supportDeadline.wall-Date.now(),supportDeadline.monotonic-performance.now())));};
        supportTimer=setTimeout(()=>{requestTimedOut=true;lifetime.abort();},remaining());
        let nativeOperation=null,sourceOperation=null;
        const sourceCall=async work=>{try{return await bounded(work);}catch(error){assertAlive();if(['REQUEST_TIMEOUT','REQUEST_CANCELLED'].includes(error?.code))throw error;throw engineError('ON_AI_PROVISIONING_PENDING','');}};
        try{
          if(Number(req.headers['content-length']??0)>8192)throw engineError('REQUEST_TOO_LARGE','',413);
          const input=await bounded(()=>jsonBody(req,['eventId']));
          if(!isOwnedSdpHostEngine(sdpHostEngine))throw engineError('ON_AI_PROVISIONING_PENDING','');
          nativeOperation=await sourceCall(signal=>openNativeHostOperation(nativeHost,{signal,timeoutMs:remaining()}));
          const readHost=async signal=>{if(signal.aborted)throw engineError('REQUEST_CANCELLED','');const current=await sourceCall(()=>readNativeHostOperation(nativeHost,nativeOperation));assertAlive();if(signal.aborted)throw engineError('REQUEST_CANCELLED','');return current;};
          const identity=await readHost(lifetime.signal);
          sourceOperation=await sourceCall(signal=>openSdpIncidentOperation(sdpHostEngine,input,{signal,timeoutMs:remaining()}));
          const initial=assertSdpIncidentOperation(sdpHostEngine,sourceOperation),event=initial.event;
          const sameIdentity=source=>{if(Object.keys(identity).some(key=>source.binding.ai[key]!==identity[key]))throw engineError('ON_AI_PROVISIONING_PENDING','');};
          sameIdentity(initial);
          const recheck=async({signal})=>{
            if(signal.aborted)throw engineError('REQUEST_CANCELLED','');
            const current=await sourceCall(()=>readSdpIncidentOperation(sdpHostEngine,sourceOperation,{signal}));
            const native=await readHost(signal);
            if(Object.keys(identity).some(key=>native[key]!==identity[key])||current.eventHash!==initial.eventHash)throw engineError('ON_AI_PROVISIONING_PENDING','');
            sameIdentity(current);assertAlive();
            try{assertSdpIncidentOperation(sdpHostEngine,sourceOperation);assertNativeHostOperation(nativeHost,nativeOperation);}catch{throw engineError('ON_AI_PROVISIONING_PENDING','');}
            if(current.validUntilMs<=Date.now())throw engineError('ON_AI_PROVISIONING_PENDING','');
            if(signal.aborted)throw engineError('REQUEST_CANCELLED','');assertAlive();
          };
          const service=createVaultOnAiService({enabled:true,vault:createNativeOperationVault(nativeHost,nativeOperation),timeoutMs:remaining(),
            appAuthorization:nativeConfiguration.fetchImpl?{fetchImpl:nativeConfiguration.fetchImpl}:{}});
          const options=Object.freeze({signal:lifetime.signal,
            expectedScope:Object.freeze({subjectId:identity.subjectId,projectId:identity.projectId,appId:'aleph-on',audience:'on-client'}),
            expectedContext:Object.freeze({alephUserId:identity.alephUserId,siteId:identity.siteId,identityVersion:identity.identityVersion}),
            beforeDispatch:recheck,beforePublish:recheck});
          const incident={incidentId:event.id,evidence:event.evidence.map(row=>({id:row.id,summary:row.text})),rules:event.rules.map(row=>({id:row.id,description:row.text})),currentState:event.state,supportedActions:event.supportedActions};
          const raw=await bounded(()=>service.explainIncident(incident,options));
          const capture=(value,keys)=>{
            if(value===null||typeof value!=='object'||types.isProxy(value)||Object.getPrototypeOf(value)!==Object.prototype)throw engineError('SERVICE_UNAVAILABLE','');
            const descriptors=Object.getOwnPropertyDescriptors(value);
            if(Reflect.ownKeys(descriptors).length!==keys.length||keys.some(key=>!Object.hasOwn(descriptors,key)||!Object.hasOwn(descriptors[key],'value')))throw engineError('SERVICE_UNAVAILABLE','');
            return Object.fromEntries(keys.map(key=>[key,descriptors[key].value]));
          };
          if(raw===null||typeof raw!=='object'||types.isProxy(raw))throw engineError('SERVICE_UNAVAILABLE','');
          const ok=Object.getOwnPropertyDescriptor(raw,'ok');if(!ok||!Object.hasOwn(ok,'value')||typeof ok.value!=='boolean')throw engineError('SERVICE_UNAVAILABLE','');
          if(ok.value===false){const output=capture(raw,['ok','error','help']),error=capture(output.error,['code','message']);
            const code=Object.hasOwn(aiErrorMessages,error.code)?error.code:'WB_CLCO_REQUEST_FAILED';assertAlive();send(503,{ok:false,error:{code,message:aiErrorMessages[code],retryable:true}});return;}
          const output=capture(raw,['ok','transportChecked','audienceAuthorization','explanation','authorizationValidUntilMs','help']);
          if(output.transportChecked!==true||output.audienceAuthorization!=='verified'||!Number.isSafeInteger(output.authorizationValidUntilMs)||output.authorizationValidUntilMs<=Date.now())throw engineError('ON_AI_PROVISIONING_PENDING','');
          aiHelp({audienceAuthorization:'verified',help:capture(output.help,['component','code','appCredentialsConfigured','provisioning','automaticRetries','workbenchRequiredAtRuntime'])});
          const explanation=assertExplanation(capture(output.explanation,['summary','evidenceIds','proposals','requiresHumanConfirmation','executed']),event,[]);
          const body=JSON.stringify({ok:true,data:{explanation},meta:meta()});
          assertAlive();let current;
          try{current=assertSdpIncidentOperation(sdpHostEngine,sourceOperation);assertNativeHostOperation(nativeHost,nativeOperation);}catch{throw engineError('ON_AI_PROVISIONING_PENDING','');}
          sameIdentity(current);
          if(current.eventHash!==initial.eventHash||current.validUntilMs<=Date.now()||output.authorizationValidUntilMs<=Date.now())throw engineError('ON_AI_PROVISIONING_PENDING','');
          assertAlive();res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-on-request-id':requestId});res.end(body);return;
        }finally{closeSdpIncidentOperation(sourceOperation);closeNativeHostOperation(nativeOperation);}
```

[원본 527~545행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/server.mjs#L527-L545)

```javascript
      if(req.method==='POST'&&url.pathname==='/api/ai/explain'){
        const {eventId}=await bounded(()=>jsonBody(req,['eventId']));
        const identity=assertData('identity',await call('readIdentity'));
        const expectedScope=Object.freeze({subjectId:identity.user.id,projectId:engine.projectId,appId:'aleph-on',audience:'on-client'});
        if(mode==='connected'&&(!id(expectedScope.projectId)||identity.session.status!=='active'))throw engineError('SUBJECT_SCOPE_UNVERIFIED','');
        const rawEvents=await call('readEvents',expectedScope);
        if(mode==='connected'&&(!Array.isArray(rawEvents)||rawEvents.some(event=>event.subjectId!==expectedScope.subjectId||event.projectId!==expectedScope.projectId)))throw engineError('SUBJECT_SCOPE_UNVERIFIED','');
        const events=assertData('events',rawEvents);const event=events.find(row=>row.id===eventId);
        if(!event)throw engineError('EVENT_NOT_FOUND','본인 기록에서 사건을 찾을 수 없습니다.',404);
        const after=assertData('identity',await call('readIdentity'));
        if(after.user.id!==identity.user.id||after.session.id!==identity.session.id||after.session.status!=='active'||engine.projectId!==expectedScope.projectId)throw engineError('SUBJECT_SCOPE_UNVERIFIED','');
        if(lifetime.signal.aborted||res.destroyed)throw engineError('REQUEST_CANCELLED','');
        const source=Object.freeze({sourceSubjectId:identity.user.id,projectId:expectedScope.projectId,sessionId:identity.session.id});
        const binding=await readMapping(source);
        const output=await bounded(()=>mappedService().explainIncident({incidentId:event.id,evidence:event.evidence.map(e=>({id:e.id,summary:e.text})),rules:event.rules.map(r=>({id:r.id,description:r.text})),currentState:event.state,supportedActions:event.supportedActions},authOptions(binding)));
        await finishMapping(source,binding);
        if(!output?.ok){send(503,{ok:false,error:aiFailure(output)});return;}
        send(200,{ok:true,data:{explanation:assertExplanation(output.explanation,event,aiSecrets)}});return;
      }
```


### `on-client/src/ai/vault-service.mjs`

**목적:** 신뢰된 서버 보관함을 통해 앱 전용 자격을 로드하고 `service.explainIncident` 호출

[원본 111~128행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/ai/vault-service.mjs#L111-L128)

```javascript
    const work=async()=>{
      // Snapshot the trusted mapping and incident before any callback can yield.
      const pins=mapping(options),incident=input === undefined ? undefined : structuredClone(input);
      alive();
      const loaded=await vault.load({expectedContext:pins.vaultContext},{signal:controller.signal});
      alive();
      const {value:v,context}=credential(loaded,pins);
      alive();
      const service=createOnAiService({env:{ON_AI_BASE_URL:v.baseUrl,ON_AI_APP_KEY:v.token,ON_AI_MODEL:model},model,
        timeoutMs:Math.max(1,deadline-Date.now()),transportFactory,allowLoopbackHttp:authConfig.allowLoopbackHttp === true,
        appAuthorization:{fetchImpl:authConfig.fetchImpl ?? globalThis.fetch,maxResponseBytes:authConfig.maxResponseBytes ?? 16384}});
      const serviceOptions={signal:controller.signal,expectedScope:pins.scope,expectedContext:context};
      if(guarded){serviceOptions.beforeDispatch=options.beforeDispatch;serviceOptions.beforePublish=options.beforePublish;}
      const result=await (method==='models' ? service.checkConnection(serviceOptions)
        : method==='learner-support' ? service.explainLearningSupport(incident,observation,serviceOptions)
          : service.explainIncident(incident,serviceOptions));
      alive();
      // Expiry during the remote operation also invalidates a successful result.
```


### `on-client/src/ai/service.mjs`

**목적:** CLCO 전송 클라이언트 생성·권한 확인·`chat` 모델 호출·응답 검증

[원본 263~274행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/ai/service.mjs#L263-L274)

```javascript
  async function transport() {
    if (!configured) throw own('ON_AI_PROVISIONING_PENDING');
    if (!client) {
      let factory = transportFactory;
      if (!factory) {
        try { factory = (await import('../../vendor/clco-http.mjs')).createClcoClient; }
        catch { throw own('ON_AI_TRANSPORT_PENDING'); }
      }
      client = factory({ baseUrl, token, timeoutMs, maxResponseBytes: 65536, allowLoopbackHttp });
    }
    return client;
  }
```

[원본 337~393행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/src/ai/service.mjs#L337-L393)

```javascript
    async explainIncident(input, options = {}) {
      const deadline={wall:Date.now()+timeoutMs,monotonic:performance.now()+timeoutMs};
      let captured,incident;
      try{
        if(!options||typeof options!=='object'||types.isProxy(options))throw own('ON_AI_PROVISIONING_PENDING');
        if(['beforeDispatch','beforePublish'].some(key=>Object.hasOwn(options,key))){
          captured=modelOptions(options);
          if(typeof captured.beforeDispatch!=='function'||typeof captured.beforePublish!=='function')throw own('ON_AI_PROVISIONING_PENDING');
          incident=validateInput(captureOnAiIncident(input),secrets);
        }
      }catch(error){return failure(error);}
      if(captured){
        const alive=signal=>{if(signal.aborted)throw own('WB_CLCO_CANCELLED');if(Date.now()>=deadline.wall||performance.now()>=deadline.monotonic)throw own('WB_CLCO_TIMEOUT');};
        return operation(captured,async(signal,expectedScope,expectedContext)=>{
          const authorization=await authorize('explain','ai.explain',signal,expectedScope,expectedContext);alive(signal);
          if(authorization.mode!=='verified')throw own('ON_AI_PROVISIONING_PENDING');
          const before=structuredClone(authorization.proof);
          const pins=['appId','audience','subjectId','alephUserId','siteId','projectId','credentialId','grantId','grantVersion','identityVersion','policyVersion','accessPolicyId','purpose','requiredCapability','revoked','credentialFingerprint','modelPolicyVersion'];
          const sameAuthority=current=>{
            if(current.mode!=='verified')throw own('ON_AI_PROVISIONING_PENDING');
            guard(authorization,signal);guard(current,signal);checkModel(current,true);
            if(pins.some(key=>current.proof[key]!==before[key])||['capabilities','allowedModels'].some(key=>JSON.stringify(current.proof[key])!==JSON.stringify(before[key])))throw own('ON_AI_PROVISIONING_PENDING');
          };
          const refresh=async callback=>{
            const current=await authorize('explain','ai.explain',signal,expectedScope,expectedContext);alive(signal);sameAuthority(current);
            try{await callback({signal});}catch{alive(signal);throw own('ON_AI_PROVISIONING_PENDING');}
            alive(signal);sameAuthority(current);return current;
          };
          checkModel(authorization,true);
          const activeClient=await transport();alive(signal);guard(authorization,signal);
          if(!activeClient||typeof activeClient!=='object'||types.isProxy(activeClient))throw own('ON_AI_TRANSPORT_PENDING');
          const method=Object.getOwnPropertyDescriptor(activeClient,'chat');
          if(!method||!Object.hasOwn(method,'value')||typeof method.value!=='function'||types.isProxy(method.value))throw own('ON_AI_TRANSPORT_PENDING');
          const body={model,stream:false,messages:[{role:'system',content:systemPrompt},{role:'user',content:JSON.stringify(incident)}]};
          const dispatch=await refresh(captured.beforeDispatch);alive(signal);sameAuthority(dispatch);
          const response=await Reflect.apply(method.value,activeClient,[body,{signal}]);alive(signal);sameAuthority(dispatch);
          let parsed;try{parsed=JSON.parse(incidentContent(response));}catch{throw own('ON_AI_INVALID_OUTPUT');}
          const explanation=validateOutput(parsed,incident,secrets);
          const current=await refresh(captured.beforePublish);alive(signal);sameAuthority(dispatch);sameAuthority(current);
          const authorizationValidUntilMs=Math.floor(Math.min(Date.parse(before.validUntil),Date.parse(dispatch.proof.validUntil),Date.parse(current.proof.validUntil),deadline.wall,Date.now()+Math.max(0,deadline.monotonic-performance.now())));
          if(!Number.isSafeInteger(authorizationValidUntilMs)||authorizationValidUntilMs<=Date.now())throw own('ON_AI_PROVISIONING_PENDING');
          return {ok:true,transportChecked:true,audienceAuthorization:'verified',explanation,authorizationValidUntilMs,help:help('ON_AI_APP_AUTHORIZATION_VERIFIED','verified')};
        },true);
      }
      return operation(options, async (signal, expectedScope, expectedContext) => {
        const authorization = await authorize('explain', 'ai.explain', signal, expectedScope, expectedContext);
        const incident = validateInput(input, secrets);
        checkModel(authorization,true);
        const activeClient=await transport();guard(authorization,signal);
        const result = await activeClient.chat({ model, stream: false, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify(incident) }] }, { signal });guard(authorization,signal);
        const choice = result?.choices?.[0];
        if (choice?.message?.tool_calls || choice?.message?.function_call || choice?.finish_reason === 'length' || typeof choice?.message?.content !== 'string') throw own('ON_AI_INVALID_OUTPUT');
        let output;
        try { output = JSON.parse(choice.message.content); } catch { throw own('ON_AI_INVALID_OUTPUT'); }
        return { ok: true, transportChecked: true, audienceAuthorization:authorization.mode, explanation: validateOutput(output, incident, secrets),
          help: help(authorization.mode==='verified'?'ON_AI_APP_AUTHORIZATION_VERIFIED':'ON_AI_TEST_TRANSPORT_ONLY',authorization.mode==='verified'?'verified':'pending') };
      });
```


### `on-client/vendor/clco-http.mjs`

**목적:** 모델 호출의 원본 HTTP 전송: `fetch(...)` 및 `POST /chat/completions`

[원본 42~71행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/vendor/clco-http.mjs#L42-L71)

```javascript
export function createClcoClient({ baseUrl, token, timeoutMs = 10000, maxResponseBytes = 1048576, allowLoopbackHttp = false } = {}) {
  let base;
  try { base = new URL(baseUrl); } catch { throw fail('WB_CLCO_INVALID_URL'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !(base.protocol === 'http:' && loopback && allowLoopbackHttp)) || base.username || base.password || base.search || base.hash) {
    throw fail('WB_CLCO_INVALID_URL');
  }
  base.pathname = base.pathname.replace(/\/+$/, '') || '/v1';
  if (!base.pathname.endsWith('/v1')) throw fail('WB_CLCO_INVALID_URL');
  if (typeof token !== 'string' || !/^[A-Za-z0-9._~-]+$/.test(token)) throw fail('WB_CLCO_INVALID_TOKEN');
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 120000 || !Number.isInteger(maxResponseBytes) || maxResponseBytes <= 0) {
    throw fail('WB_CLCO_INVALID_LIMIT');
  }

  async function request(endpoint, body, { signal, readStream } = {}) {
    const support=endpoint==='/learner-support';
    if (signal && (support?Reflect.apply(supportAborted,signal,[]):signal.aborted)) throw fail('WB_CLCO_CANCELLED');
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const cancel = () => controller.abort();
    if(signal){if(support)Reflect.apply(EventTarget.prototype.addEventListener,signal,['abort',cancel,{once:true}]);else signal.addEventListener('abort',cancel,{once:true});}
    try {
      const response = await fetch(base.href.replace(/\/$/, '') + endpoint, {
        method: body ? 'POST' : 'GET',
        headers: { authorization: `Bearer ${token}`, accept: body?.stream ? 'text/event-stream' : 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: 'manual',
      });
```

[원본 113~125행](https://github.com/hwangyunjeong72/GIGACHAD/blob/e303e3fd6b07a489a67185df2f28e8a360f7e41e/on-client/vendor/clco-http.mjs#L113-L125)

```javascript
  return Object.freeze({
    async listModels(options) {
      const result = await request('/models', null, options);
      if (result?.object !== 'list' || !Array.isArray(result.data) || result.data.some(row => typeof row?.id !== 'string' || !row.id)) throw fail('WB_CLCO_INVALID_RESPONSE', 200);
      return result.data.map(row => ({ id: row.id }));
    },
    async chat(body, options = {}) {
      if (!body || typeof body.model !== 'string' || !body.model || !Array.isArray(body.messages) || !body.messages.length || (body.stream !== undefined && typeof body.stream !== 'boolean')) throw fail('WB_CLCO_INVALID_REQUEST');
      if (body.stream && typeof options.readStream !== 'function') throw fail('WB_CLCO_STREAM_READER_REQUIRED');
      const result = await request('/chat/completions', body, options);
      if (!body.stream && (!Array.isArray(result?.choices) || !result.choices.length)) throw fail('WB_CLCO_INVALID_RESPONSE', 200);
      return result;
    },
```

## 확인 구분과 보존 약속

| 확인 대상 | 상태 | 범위 |
|---|---|---|
| 학생 `renderAiConnection` / `renderExplanation` | 앞선 ALEPH 피드백에서 통과 | 기존 구현 그대로 보존 |
| `src/server.mjs` 라우트 본문 | 정적 소스 확인 | native + 기존 매핑 경로; 실제 요청 미실행 |
| `src/ai/vault-service.mjs` 연결 | 정적 소스 확인 | 서버 내 자격 조회와 서비스 호출 |
| `src/ai/service.mjs`의 `chat` 호출 | 정적 소스 확인 | 권한 검사 후 모델 전송 호출 구문 |
| `vendor/clco-http.mjs` HTTP 전송 본문 | 정적 소스 확인 | `/chat/completions` 요청 코드 |
| 실제 학생 계정의 AI 설명 모델 응답 | **미확인** | 운영 측 계정·권한 및 연결 준비 필요 |
| ALEPH 공식 17단계 통과 | **미확인** | 심판 재검토 필요 |

**현장 확인은 운영 측 연결 기능이 준비된 다음에만:** 앱에서 계정 승인과 AI 연결을 순서대로 확인한 후, 본인의 실제 보안 기록에서 **AI 설명 요청**을 직접 실행해 결과를 관찰합니다. 서버 설정·원본 전송 코드·인증 설정은 임의로 수정하지 않습니다. 키·토큰·비밀번호를 요구하거나 문서에 기록하지 않습니다. 모델 목록 응답만으로 `ai_model_called`를 완료 처리하지 않습니다.

이 문서는 ALEPH 재검토를 위한 **소스 증거 보강**이지 실제 모델 호출 성공의 증거가 아닙니다.
