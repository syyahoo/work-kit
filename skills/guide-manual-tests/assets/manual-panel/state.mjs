const outcomes = new Set(['pass','fail','blocked']);
const known = value => typeof value === 'string' && !!value.trim() && !['unknown','미확인'].includes(value.trim().toLowerCase());
const text = value => typeof value === 'string' && !!value.trim();
const copy = value => JSON.parse(JSON.stringify(value));
function stable(value) {return JSON.stringify(value,(_key,v)=>v && typeof v==='object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])) : v);}
export function validatePlan(plan) {
  const errors=[];
  if(!plan || !text(plan.id) || !text(plan.title) || !Array.isArray(plan.cases) || !plan.cases.length)return ['계획 ID·제목과 한 개 이상의 사례가 필요합니다.'];
  const ids=new Set();
  for(const c of plan.cases){
    if(!c || !text(c.id) || ids.has(c.id))errors.push('검사 ID가 없거나 중복되었습니다.');
    if(c && text(c.id))ids.add(c.id);
    if(!c || !text(c.title) || !text(c.prepare) || !text(c.input) || !text(c.expected) || !Array.isArray(c.steps) || !c.steps.length || c.steps.some(x=>!text(x)))errors.push(`${c?.id??'사례'}: 제목·준비·입력·조작·기대 결과를 채워 주세요.`);
    if(!c || !Array.isArray(c.requirements) || !c.requirements.length || c.requirements.some(x=>!text(x)) || new Set(c.requirements).size!==c.requirements.length)errors.push(`${c?.id??'사례'}: 연결할 R 식별자가 필요합니다.`);
    if(c?.codeRefs!==undefined && (!c.codeRefs || Array.isArray(c.codeRefs) || typeof c.codeRefs!=='object' || Object.values(c.codeRefs).some(x=>typeof x!=='string')))errors.push(`${c?.id??'사례'}: codeRefs는 파일별 판본 문자열이어야 합니다.`);
  }
  if(plan.codeState!==undefined && typeof plan.codeState!=='string')errors.push('codeState는 문자열이어야 합니다.');
  return [...new Set(errors)];
}
function basis(plan,c){
  const refs=c.codeRefs && Object.keys(c.codeRefs).length ? c.codeRefs : null;
  const versionKnown=refs ? Object.values(refs).every(known) : known(plan.codeState);
  return {key:stable({prepare:c.prepare,input:c.input,steps:c.steps,expected:c.expected,requirements:c.requirements,code:refs??plan.codeState??''}),known:versionKnown};
}
export const statusLabels={pending:'미실행',pass:'통과 · 사용자 관찰',fail:'실패 · 사용자 관찰',blocked:'차단',recheck:'재확인 필요',unversioned:'판본 미확인'};
export function createManualSession(initialPlan,{now=()=>new Date().toISOString()}={}){
  let plan;
  const history=[];
  function setPlan(value){const errors=validatePlan(value);if(errors.length)throw new Error(errors.join(' '));if(plan && value.id!==plan.id)throw new Error('다른 계획은 새 패널로 열어 주세요.');plan=copy(value);}
  setPlan(initialPlan);
  function latest(id){return history.findLast(r=>r.caseId===id)??null;}
  function status(id){
    const c=plan.cases.find(c=>c.id===id);if(!c)throw new Error('없는 검사 ID입니다.');
    const record=latest(id);if(!record)return 'pending';
    const current=basis(plan,c);
    if(record.basisKey!==current.key)return 'recheck';
    if(!current.known)return 'unversioned';
    return record.outcome;
  }
  return {
    get plan(){return copy(plan);},
    latest(id){return copy(latest(id));},
    status,
    updatePlan:setPlan,
    record(id,outcome,observation){
      const c=plan.cases.find(c=>c.id===id);
      if(!c)throw new Error('없는 검사 ID입니다.');
      if(!outcomes.has(outcome))throw new Error('관찰 후 통과·실패·차단 중 하나를 선택해 주세요.');
      if(!text(observation))throw new Error('실제로 본 결과나 차단 이유를 적어 주세요.');
      const b=basis(plan,c);
      const record={caseId:id,requirements:copy(c.requirements),outcome,observation:observation.trim(),source:'user_report',recordedAt:now(),basisKey:b.key,versionKnown:b.known,caseSnapshot:copy(c),codeState:plan.codeState??''};
      history.push(record);return copy(record);
    },
    report(){return {schema:'manual-test-report/1',planId:plan.id,title:plan.title,exportedAt:now(),codeState:plan.codeState??'',cases:plan.cases.map(c=>({id:c.id,requirements:copy(c.requirements),status:status(c.id),latest:copy(latest(c.id))})),history:copy(history)};},
    summary(){
      const lines=[`수동 테스트: ${plan.title}`,`계획: ${plan.id} / 코드: ${plan.codeState||'미확인'}`,'출처: 사용자 관찰 기록. AI 직접 실행 증거가 아닙니다.'];
      for(const c of plan.cases){const r=latest(c.id),s=status(c.id);lines.push('',`${c.id} → ${c.requirements.join(', ')} | ${statusLabels[s]}`,`기대: ${c.expected}`);if(r){if(s==='recheck')lines.push(`이전 판본의 관찰(${r.outcome}): ${r.observation}`);else lines.push(`관찰: ${r.observation}`);lines.push(`관찰 기록의 코드: ${r.codeState||'미확인'} / 관련 파일: ${JSON.stringify(r.caseSnapshot.codeRefs??{})}`);}else lines.push('관찰: 아직 기록 없음');}
      lines.push('','판본·기대 결과가 바뀐 항목은 재확인이 필요합니다. 과거 기록은 JSON 이력에 보존됩니다.');return lines.join('\n');
    }
  };
}
