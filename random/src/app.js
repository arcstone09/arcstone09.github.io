import { validateP, validateLength, evaluate, calibrateAsync } from './statistics.js';
import { createGame, advance } from './game.js';
import { getCached, putCached } from './cache.js';
import { referenceHTML, EXAMPLE_SEQUENCE } from './reference.js';
import { resultHTML, format } from './results.js';
import { t, both, getLanguage, setLanguage, localize, errorText, stored, persist } from './i18n.js';
import { api, hasToken, saveToken } from './api.js';

const $ = id => document.getElementById(id);
let model=null, game=null, result=null, worker=null, generation=0, pending=null, animation=null, watchdog=null;
let mode='practice', user=null, starting=false, progress=0, preparationError=false;
let practiceSettings={p:.5,length:100,duration:45}, cells=[], drawnBits=null;
let period='24h', leaderboard=null, rankingState='loading', rankingRequest=0;
let submission='idle', submissionError=null, roundId=null, toastTimer=null;
setLanguage(stored('binary-lab-language','ko'));
document.documentElement.dataset.theme=stored('binary-lab-theme','dark')==='light'?'light':'dark';
const settings=()=>({p:$('probability').valueAsNumber,length:$('sequence-length').valueAsNumber,duration:$('duration').valueAsNumber});
const editable=target=>target instanceof HTMLElement && (['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable);
const locked=()=>!!game || starting;
function toast(key) {
  $('toast').textContent=t(key); $('toast').hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,2600);
}
function validation() {
  const s=settings();
  try { validateP(s.p); } catch { return 'invalidP'; }
  try { validateLength(s.length); } catch { return 'invalidLength'; }
  if(!Number.isInteger(s.duration)||s.duration<1||s.duration>600) return 'invalidDuration';
  return null;
}
function syncControls() {
  const valid=!validation(), s=settings(), prepared=model&&model.p===s.p&&model.length===s.length;
  $('validation').textContent=valid?'':t(validation());
  ['probability','duration','sequence-length'].forEach(id=>$(id).disabled=locked()||mode==='ranking');
  document.querySelectorAll('[data-p],[data-mode]').forEach(button=>button.disabled=locked()||(button.hasAttribute('data-p')&&mode==='ranking'));
  ['zero','one','delete','paste-input','apply-paste'].forEach(id=>$(id).disabled=game?.status!=='playing');
  $('start').disabled=!!game||starting||!valid||!prepared;
  $('start').innerHTML=starting?t('starting'):game?t(game.status==='playing'?'playing':'done'):t('start')+' <kbd>Enter</kbd>';
  $('calibration-state').textContent=preparationError?t('calibrationFailed'):prepared?t('ready'):t('preparing',{percent:Math.round(progress*100)});
  $('enter-hint').textContent=t('playingHint',{n:s.length||100});
  document.body.classList.toggle('is-playing',game?.status==='playing');
}
function refreshSettings() {
  const s=settings();
  $('probability-help').textContent=t('probabilityHelp',{ones:Number.isFinite(s.p*s.length)?format(s.p*s.length):'—'});
  $('model-label').textContent='Bernoulli(p = '+(Number.isFinite(s.p)?s.p:'—')+')';
  document.querySelectorAll('[data-p]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.p)===s.p)));
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-help').textContent=mode==='practice'?t('practiceHelp'):t('rankRules')+' · '+(user?t('signedIn',{id:user.username}):t('accountNeeded'));
  if(mode==='ranking'&&user&&!game) {
    const out=document.createElement('button'); out.type='button';out.className='text-button';out.textContent=t('logout');
    out.addEventListener('click',async()=>{try{await api('logout',{});}catch{}saveToken(null);user=null;refreshSettings();});
    $('mode-help').append(document.createElement('br'),out);
  }
  if(!game) render(true);
  syncControls();
}
function cancelPreparation() {
  clearTimeout(watchdog); clearTimeout(pending); worker?.terminate(); worker=null; generation++; model=null; progress=0; preparationError=false;
}
async function prepare() {
  const token=++generation, s=settings();
  if(validation()) {syncControls();return;}
  const cached=await getCached(s.p,s.length);
  if(token!==generation)return;
  if(cached){ready(cached);return;}
  let fallbackStarted=false;
  const onProgress=value=>{if(token===generation){progress=value;syncControls();}};
  const fallback=async()=>{
    if(token!==generation||fallbackStarted)return;
    fallbackStarted=true;clearTimeout(watchdog);worker?.terminate();worker=null;
    try{
      const value=await calibrateAsync(s.p,{length:s.length,isCancelled:()=>token!==generation,onProgress});
      if(token===generation){ready(value);void putCached(value);}
    }catch{if(token===generation){preparationError=true;syncControls();}}
  };
  const arm=()=>{clearTimeout(watchdog);watchdog=setTimeout(fallback,15000);};
  try{
    worker=new Worker(new URL('./calibration-worker.js',import.meta.url),{type:'module'});
    worker.onmessage=({data})=>{
      if(token!==generation||fallbackStarted)return;
      if(data.error){void fallback();return;}
      if(data.model){clearTimeout(watchdog);ready(data.model);void putCached(data.model);worker?.terminate();worker=null;}
      else {onProgress(data.progress);arm();}
    };
    worker.onerror=e=>{e.preventDefault();void fallback();};worker.onmessageerror=()=>void fallback();
    arm();worker.postMessage({p:s.p,length:s.length});
  }catch{void fallback();}
}
function ready(value){model=value;progress=1;preparationError=false;syncControls();}
function settingsChanged(){
  cancelPreparation();refreshSettings();
  if(!validation())pending=setTimeout(prepare,250);
}
['probability','sequence-length'].forEach(id=>$(id).addEventListener('input',settingsChanged));
$('duration').addEventListener('input',refreshSettings);
document.querySelectorAll('[data-p]').forEach(b=>b.addEventListener('click',()=>{$('probability').value=b.dataset.p;settingsChanged();}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  if(locked()||b.dataset.mode===mode)return;
  if(mode==='practice')practiceSettings=settings();
  mode=b.dataset.mode;
  const s=mode==='ranking'?{p:.5,length:100,duration:45}:practiceSettings;
  $('probability').value=s.p;$('sequence-length').value=s.length;$('duration').value=s.duration;
  settingsChanged();
}));
function render(force=false){
  const n=game?.length||settings().length||100, bits=game?.bits||[];
  const remaining=game?game.status==='complete'?(game.remaining||0):Math.max(0,game.deadline-performance.now())/1000:settings().duration||0;
  const [seconds,tenth]=remaining.toFixed(1).split('.');
  $('timer').innerHTML=seconds+'<span>.'+tenth+'</span><small>'+t('seconds')+'</small>';
  $('timer').classList.toggle('urgent',!!game&&remaining<=10);
  $('phase').textContent=t(!game?'standby':game.status==='playing'?'playing':game.status==='complete'?'complete':'timeout');
  $('phase').classList.toggle('active',game?.status==='playing');
  $('input-hint').textContent=t(!game?'inputHint':game.status==='playing'?'playingHint':'endedHint',{n});
  if(cells.length!==n && Number.isInteger(n)&&n>=1&&n<=1000){
    $('sequence').replaceChildren();
    cells=Array.from({length:n},()=>{
      const cell=document.createElement('span');cell.setAttribute('aria-hidden','true');$('sequence').append(cell);return cell;
    });force=true;
  }
  if(!force&&drawnBits===game?.bits)return;
  drawnBits=game?.bits;
  $('count').textContent=bits.length;$('target-count').textContent=' / '+n;
  $('progress').setAttribute('aria-valuenow',bits.length);$('progress').setAttribute('aria-valuemax',n);
  $('progress-fill').style.width=bits.length/n*100+'%';
  $('sequence').setAttribute('aria-label',t('sequence')+': '+bits.join(''));
  cells.forEach((cell,i)=>{
    cell.textContent=i<bits.length?bits[i]:i===bits.length&&game?.status==='playing'?'_':'·';
    cell.className='bit-cell'+(i<bits.length?' filled':'')+(i===bits.length&&game?.status==='playing'?' next':'');
  });
  const current=cells[Math.min(bits.length,n-1)], container=$('sequence');
  if(game?.status==='playing'&&current){
    const delta=current.getBoundingClientRect().bottom-container.getBoundingClientRect().bottom;
    if(delta>0)container.scrollTop+=delta+14;
    if(bits.length===0)container.scrollTop=0;
  }
}
async function start(){
  syncControls();if($('start').disabled||$('reference').open||$('account').open)return;
  if(mode==='ranking'&&!user){$('account-status').textContent='';$('account').showModal();return;}
  if(mode==='ranking'){
    starting=true;syncControls();
    try{
      const round=await api('rounds',{});
      if(round.version!==model.version)throw new Error('MODEL_VERSION');
      roundId=round.id;
    }catch(error){
      if(error.code==='UNAUTHORIZED'){saveToken(null);user=null;$('account').showModal();}
      else toast('networkError');
      starting=false;refreshSettings();return;
    }
    starting=false;
  }
  const s=settings();
  game=createGame(s.duration,performance.now(),s.length);result=null;submission='idle';submissionError=null;
  $('results').hidden=true;$('paste-input').value='';document.activeElement?.blur();
  syncControls();render(true);animation=requestAnimationFrame(tick);
}
$('settings').addEventListener('submit',e=>{e.preventDefault();void start();});
function tick(){if(game?.status!=='playing')return;act('tick');if(game.status==='playing')animation=requestAnimationFrame(tick);}
function act(action){
  if(game?.status!=='playing')return;
  const next=advance(game,action,performance.now());
  game=next;render();
  if(game.status!=='playing'){game.remaining=Math.max(0,game.deadline-performance.now())/1000;finish();}
}
for(const [id,action] of [['zero',0],['one',1],['delete','backspace']])$(id).addEventListener('click',()=>act(action));
function applySequence(raw){
  if(game?.status!=='playing')return;
  const compact=raw.replace(/\s/g,'');
  if(!compact){toast('emptyBits');return;}
  if(!/^[01]+$/.test(compact)){toast('invalidBits');return;}
  const available=game.length-game.bits.length;
  for(const bit of compact.slice(0,available)){if(game.status!=='playing')break;game=advance(game,Number(bit),performance.now());}
  $('paste-input').value='';render(true);
  if(game.status!=='playing'){game.remaining=Math.max(0,game.deadline-performance.now())/1000;finish();}
  if(compact.length>available)toast('clipped');
}
$('apply-paste').addEventListener('click',()=>applySequence($('paste-input').value));
$('sequence').addEventListener('paste',event=>{event.preventDefault();applySequence(event.clipboardData.getData('text'));});
document.addEventListener('keydown',event=>{
  if($('reference').open||$('account').open||event.metaKey||event.ctrlKey||event.altKey||event.isComposing)return;
  if(editable(event.target))return;
  if(event.key==='Enter'&&(event.target instanceof HTMLButtonElement||event.target instanceof HTMLElement&&event.target.tagName==='SUMMARY'))return;
  if(['0','1','Backspace','Enter'].includes(event.key))event.preventDefault();
  if(event.repeat)return;
  if(game?.status==='playing'){
    if(event.key==='0'||event.key==='1'){
      const b=$(event.key==='0'?'zero':'one');b.classList.add('pressed');setTimeout(()=>b.classList.remove('pressed'),100);act(Number(event.key));
    }else if(event.key==='Backspace')act('backspace');
  }else if(event.key==='Enter'){if(game)reset();else void start();}
});
document.addEventListener('visibilitychange',()=>{if(game?.status==='playing')act('tick');});
function drawResult(){
  const expanded=$('results').querySelector('details')?.open;
  $('results').innerHTML=resultHTML(game,model,result,mode);
  if(expanded&&$('results').querySelector('details'))$('results').querySelector('details').open=true;
  $('retry').addEventListener('click',reset);
  $('retry-submit')?.addEventListener('click',submitResult);
  drawSubmission();
}
function finish(){
  cancelAnimationFrame(animation);syncControls();render(true);
  if(game.status==='complete')result=evaluate(game.bits,model);
  $('results').hidden=false;drawResult();
  $('results').focus({preventScroll:true});$('results').scrollIntoView({block:'start',behavior:'auto'});
  if(game.status==='complete'&&mode==='ranking')void submitResult();
}
function drawSubmission(){
  const status=$('submission-status');if(!status)return;
  status.textContent=submission==='saved'?t('saved',{id:user?.username||''}):submission==='error'?(submissionError?errorText(submissionError):t('saveFailed')):t('saving');
  $('retry-submit').hidden=submission!=='error';
}
async function submitResult(){
  if(!game||game.status!=='complete'||mode!=='ranking'||submission==='pending'||submission==='saved')return;
  const submittedGame=game;
  submission='pending';drawSubmission();
  try{
    const record=await api('scores',{roundId,bits:game.bits.join('')});
    if(game!==submittedGame)return;
    result.score=record.score;result.s=record.statistic;submission='saved';drawResult();void loadLeaderboard();
  }catch(error){if(game===submittedGame){submission='error';submissionError=error.code;drawSubmission();}}
}
function reset(){
  game=null;result=null;roundId=null;submission='idle';$('results').hidden=true;$('paste-input').value='';
  drawnBits=null;$('sequence').scrollTop=0;refreshSettings();$('start').focus();
}
function relocalize(){
  document.documentElement.lang=getLanguage();localize();
  document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===getLanguage())));
  document.querySelectorAll('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===document.documentElement.dataset.theme)));
  const expanded=[...$('reference-content').querySelectorAll('details')].map(d=>d.open);
  $('reference-content').innerHTML=referenceHTML();
  if(expanded.length)$('reference-content').querySelectorAll('details').forEach((d,i)=>d.open=expanded[i]);
  refreshSettings();render(true);
  if(game&&game.status!=='playing')drawResult();
  drawLeaderboard();
}
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>{setLanguage(b.dataset.language);persist('binary-lab-language',getLanguage());relocalize();}));
document.querySelectorAll('button[data-theme]').forEach(b=>b.addEventListener('click',()=>{
  document.documentElement.dataset.theme=b.dataset.theme;persist('binary-lab-theme',b.dataset.theme);
  document.querySelector('meta[name="theme-color"]').content=b.dataset.theme==='dark'?'#141414':'#f5f5f0';
  document.querySelectorAll('button[data-theme]').forEach(item=>item.setAttribute('aria-pressed',String(item===b)));
}));
$('example-sequence').textContent=EXAMPLE_SEQUENCE;
document.addEventListener('click',async event=>{
  if(!event.target.closest('[data-copy]'))return;
  try{await navigator.clipboard.writeText(EXAMPLE_SEQUENCE);toast('copied');}
  catch{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(event.target.closest('.code-block').querySelector('code'));selection.removeAllRanges();selection.addRange(range);toast('copyFailed');}
});
$('reference-button').addEventListener('click',()=>$('reference').showModal());
$('close-reference').addEventListener('click',()=>$('reference').close());
$('close-account').addEventListener('click',()=>$('account').close());
for(const id of ['account','reference'])$(id).addEventListener('click',event=>{
  if(event.target!==$(id))return;
  const r=$(id).getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$(id).close();
});
$('account-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const action=event.submitter?.value||'login';
  $('account-status').textContent=t('accountWorking');
  $('account-form').querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
    const response=await api(action,{username:$('username').value,password:$('password').value});
    saveToken(response.token);user={username:response.username};$('password').value='';$('account').close();refreshSettings();$('start').focus();
  }catch(error){$('account-status').textContent=errorText(error.code);}
  finally{$('account-form').querySelectorAll('button').forEach(b=>b.disabled=false);}
});
async function loadLeaderboard(){
  const token=++rankingRequest;rankingState='loading';drawLeaderboard();
  try{const value=await api('leaderboard?period='+period);if(token!==rankingRequest)return;leaderboard=value;rankingState='ready';}
  catch{if(token!==rankingRequest)return;rankingState='error';}
  drawLeaderboard();
}
function drawLeaderboard(){
  document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===period)));
  $('ranking-status').textContent=rankingState==='loading'?t('rankingLoading'):rankingState==='error'?t('rankingUnavailable'):t('rankingUpdated',{time:new Date(leaderboard.updatedAt).toLocaleTimeString(getLanguage())});
  $('leaderboard-list').replaceChildren();
  const rows=leaderboard?.period===period?leaderboard.rows:[];
  if(!rows.length){
    const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent=rankingState==='ready'?t('rankingEmpty'):'—';tr.append(td);$('leaderboard-list').append(tr);
  }else rows.forEach((record,index)=>{
    const tr=document.createElement('tr');
    [index+1,record.username,record.score.toFixed(1),new Date(record.submitted_at).toLocaleString(getLanguage(),{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})].forEach(value=>{
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    });$('leaderboard-list').append(tr);
  });
}
document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.period;void loadLeaderboard();}));
$('refresh-ranking').addEventListener('click',()=>void loadLeaderboard());
setInterval(()=>{if(!document.hidden)void loadLeaderboard();},60000);
relocalize();void prepare();void loadLeaderboard();
if(hasToken())api('me').then(value=>{user=value;refreshSettings();}).catch(error=>{if(error.code==='UNAUTHORIZED')saveToken(null);});
