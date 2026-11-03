import {createManualSession,statusLabels} from './state.mjs';
import {panelStyles} from './style.mjs';
export function mountManualTestPanel({plan,container=document.body}={}){
  if(!container || typeof container.append!=='function')throw new Error('패널을 붙일 컨테이너가 필요합니다.');
  const session=createManualSession(plan);
  const host=document.createElement('div');const shadow=host.attachShadow({mode:'open'});
  host.setAttribute('data-manual-test-panel','');
  const style=document.createElement('style');style.textContent=panelStyles;shadow.append(style);
  const root=document.createElement('section');root.className='shell';root.setAttribute('aria-label','수동 테스트 도우미');shadow.append(root);
  let index=0,collapsed=false;const drafts=new Map();
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  function button(text,fn,cls){const b=make('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;}
  function render(){
    const p=session.plan;index=Math.min(index,p.cases.length-1);const c=p.cases[index],record=session.latest(c.id),status=session.status(c.id);
    root.replaceChildren();root.className='shell'+(collapsed?' collapsed':'');
    const head=make('div',undefined,'head');head.append(make('strong',`수동 테스트 · ${index+1}/${p.cases.length}`),button(collapsed?'펼치기':'접기',()=>{collapsed=!collapsed;render();}));root.append(head);if(collapsed)return;
    const body=make('div',undefined,'body');body.append(make('p',`${c.id} → ${c.requirements.join(', ')} · ${p.title}`,'meta'),make('h2',c.title,'title'),make('div',statusLabels[status],`status ${status}`));
    if(status==='recheck')body.append(make('p','코드나 사례 조건이 바뀌었습니다. 이전 관찰을 현재 통과로 사용하지 않습니다.','hint'));
    if(status==='unversioned')body.append(make('p','관찰은 기록됐지만 코드 판본이 확인되지 않았습니다.','hint'));
    for(const [label,value] of [['준비',c.prepare],['입력',c.input],['기대 결과',c.expected]]){const group=make('div',undefined,'field');group.append(make('strong',label),make('p',value));body.append(group);}
    const steps=make('div',undefined,'field');steps.append(make('strong','직접 할 조작'));const ol=make('ol');c.steps.forEach(s=>ol.append(make('li',s)));steps.append(ol);body.append(steps);
    let draft=drafts.get(c.id);if(!draft){draft={outcome:'',observation:''};drafts.set(c.id,draft);}
    if(draft.stale)body.append(make('p','계획이 갱신되어 작성 중 메모를 보존했습니다. 현재 조건을 다시 확인하고 결과를 선택해 주세요.','hint'));
    const outcomeLabel=make('label','관찰 후 결과 선택');const outcome=make('select');outcome.setAttribute('aria-label','관찰 결과');for(const [value,label] of [['','선택해 주세요'],['pass','통과'],['fail','실패'],['blocked','차단']]){const o=make('option',label);o.value=value;outcome.append(o);}outcome.value=draft.outcome;outcome.addEventListener('change',()=>{draft.outcome=outcome.value;});outcomeLabel.append(outcome);body.append(outcomeLabel);
    const noteLabel=make('label','실제로 본 결과 / 차단 이유');const note=make('textarea');note.setAttribute('aria-label','실제 관찰 메모');note.placeholder='실제 표시·수치·오류를 적어 주세요.';note.value=draft.observation;note.addEventListener('input',()=>{draft.observation=note.value;});noteLabel.append(note);body.append(noteLabel);
    const feedback=make('p','','message');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    body.append(button('관찰 기록하기',()=>{try{session.record(c.id,draft.outcome,draft.observation);drafts.delete(c.id);render();}catch(error){feedback.textContent=error.message;}},'save'),feedback);
    if(record)body.append(make('p',`최근 기록: ${record.observation}`,'hint'));
    const nav=make('div',undefined,'nav');const prev=button('← 이전 안내',()=>{index--;render();});prev.disabled=index===0;const next=button('다음 안내 →',()=>{index++;render();});next.disabled=index===p.cases.length-1;nav.append(prev,next);body.append(nav);
    const report=make('details',undefined,'export');report.append(make('summary','CLI에 전달할 결과 요약'));const explain=make('p','복사가 허용되면 아래 요약을 CLI에 전달하세요. 복사·붙여넣기가 제한되면 사례 ID·결과·실제 관찰을 짧게 직접 입력하세요. 자동 전달되지 않으며, 작성 중 메모는 기록 버튼을 누른 뒤 포함됩니다.','hint');const text=make('textarea');text.readOnly=true;text.value=session.summary();text.setAttribute('aria-label','복사할 결과 요약');const jsonLabel=make('label','이력을 포함한 JSON');const json=make('textarea');json.readOnly=true;json.value=JSON.stringify(session.report(),null,2);json.setAttribute('aria-label','관찰 이력 JSON');jsonLabel.append(json);report.append(explain,text,jsonLabel);body.append(report);
    body.append(make('p',`코드: ${p.codeState||'미확인'}${c.codeRefs?' · 사례별 파일 판본 지정':''}`,'hint'),make('p','안내와 사용자 관찰 기록만 제공합니다. 앱을 자동 조작하거나 결과를 자동 판정하지 않습니다. 기록은 메모리에만 있어 새로고침하면 초기화됩니다.','notice'));
    root.append(body);
  }
  container.append(host);render();
  return {updatePlan(next){session.updatePlan(next);for(const draft of drafts.values()){draft.outcome='';draft.stale=true;}render();},getReport(){return session.report();},getSummary(){return session.summary();},destroy(){host.remove();}};
}
