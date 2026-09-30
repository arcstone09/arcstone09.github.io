import { validateP, validateLength, evaluate, calibrateAsync } from './statistics.js';
import { createGame, advance } from './game.js';
import { getCached, putCached } from './cache.js';
import { referenceHTML, EXAMPLE_SEQUENCE } from './reference.js';
import { resultHTML, format } from './results.js';
import { t, both, getLanguage, setLanguage, localize, errorText, stored, persist } from './i18n.js';
import { api, hasToken, saveToken, practiceHost, rankedURL } from './api.js';
import { rankedLink, rankedEntry, restoreRankedSession } from './ranked-navigation.js';
import { readChallenge, challengeURL, challengeParams, SHARE_ORIGIN } from './challenge.js';
import { shareCard } from './share-card.js';
import { setupAdmin } from './admin.js';

const $ = id => document.getElementById(id);
// Older cached GitHub HTML can briefly load the updated module during publication.
// Add these controls if missing so existing visitors can still play normally.
if(!$('account-controls')){
  const menu=document.createElement('nav');menu.id='account-controls';menu.className='account-controls';menu.dataset.label='accountMenu';
  menu.innerHTML='<span id="account-identity" class="account-identity" aria-live="polite"></span><div class="account-control-buttons"><button id="sign-in" type="button" class="secondary-button sign-in-button" data-i18n="signIn"></button><button id="account-security" type="button" class="secondary-button" data-i18n="securityTitle" hidden></button><button id="account-admin" type="button" class="secondary-button" data-i18n="adminTitle" hidden></button><button id="sign-out" type="button" class="secondary-button sign-out-button" data-i18n="logout" hidden></button></div>';
  document.querySelector('main').prepend(menu);
}
if(!$('cancel-game')){
  const controls=document.createElement('div');controls.id='cancel-controls';controls.className='cancel-controls';controls.hidden=true;
  controls.innerHTML='<span data-i18n="cancelHelp"></span><button id="cancel-game" type="button" class="secondary-button" data-i18n="cancelGame"></button>';
  document.querySelector('.panel-heading').after(controls);
}
let model=null, game=null, result=null, worker=null, generation=0, pending=null, animation=null, watchdog=null;
let accountBusy=false;
let mode='practice', user=null, starting=false, progress=0, preparationError=false;
let practiceSettings={p:.5,length:100,duration:45}, cells=[], drawnBits=null;
let period='24h', leaderboard=null, rankingState='loading', rankingRequest=0;
let submission='idle', submissionError=null, roundId=null, toastTimer=null;
const entry=rankedEntry(location.hash);
const query=new URLSearchParams(location.search);
const challenge=query.get('challenge')==='1'?readChallenge(query):null;
if(!practiceHost&&entry.ranked){
  if(entry.theme)persist('binary-lab-theme',entry.theme);
  if(entry.language)persist('binary-lab-language',entry.language);
  history.replaceState(null,'',location.pathname+location.search+'#ranked');
}
setLanguage(!practiceHost&&entry.language||stored('binary-lab-language','ko'));
if(challenge){
  setLanguage(challenge.language);
  practiceSettings={p:challenge.p,length:challenge.n,duration:challenge.duration};
  $('probability').value=challenge.p;$('sequence-length').value=challenge.n;$('duration').value=challenge.duration;
}
document.documentElement.dataset.theme=(!practiceHost&&entry.theme||stored('binary-lab-theme','dark'))==='light'?'light':'dark';
document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.theme==='dark'?'#141414':'#f5f5f0';
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
  $('start').disabled=!!game||starting||accountBusy||!valid||!prepared;
  $('start').innerHTML=starting?t('starting'):game?t(game.status==='playing'?'playing':'done'):t('start')+' <kbd>Enter</kbd>';
  $('calibration-state').textContent=preparationError?t('calibrationFailed'):prepared?t('ready'):t('preparing',{percent:Math.round(progress*100)});
  $('enter-hint').textContent=t('playingHint',{n:s.length||100});
  document.body.classList.toggle('is-playing',game?.status==='playing');
  $('cancel-controls').hidden=game?.status!=='playing';
  $('account-identity').textContent=user?t('signedIn',{id:user.username}):t('signedOut');
  $('sign-in').hidden=!!user;$('sign-out').hidden=!user;$('account-security').hidden=!user;$('account-admin').hidden=!user?.isAdmin;
  ['sign-in','sign-out','account-security','account-admin'].forEach(id=>$(id).disabled=starting||accountBusy||game?.status==='playing');
}
function refreshSettings() {
  const s=settings();
  $('ranking-policy').hidden=mode!=='ranking';
  $('challenge-banner').hidden=!challenge||mode!=='practice';
  if(challenge)$('challenge-banner').textContent=t('challengeIntro',{score:challenge.score.toFixed(1),n:challenge.n,p:challenge.p,time:challenge.duration});
  $('probability-help').textContent=t('probabilityHelp',{ones:Number.isFinite(s.p*s.length)?format(s.p*s.length):'—'});
  $('model-label').textContent='Bernoulli(p = '+(Number.isFinite(s.p)?s.p:'—')+')';
  document.querySelectorAll('[data-p]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.p)===s.p)));
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('mode-help').textContent=mode==='practice'?t('practiceHelp'):t('rankRules')+' · '+(user?t('signedIn',{id:user.username}):t('accountNeeded'));
  if(mode==='ranking'&&practiceHost)$('mode-help').textContent=t('secureRank');
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
  syncControls();if($('start').disabled||$('admin').open||$('reference').open||$('account').open||$('security').open||$('recovery-display').open)return;
  if(mode==='ranking'&&practiceHost){location.assign(rankedLink(rankedURL,document.documentElement.dataset.theme,getLanguage()));return;}
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
  if($('admin').open||$('reference').open||$('account').open||$('security').open||$('recovery-display').open||event.metaKey||event.ctrlKey||event.altKey||event.isComposing)return;
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
  if(game.status==='complete')setupSharing();
  drawSubmission();
}
function setupSharing(){
  const value={n:game.length,p:model.p,duration:game.duration,score:result.score,language:getLanguage()};
  const url=challengeURL(value),text=t('shareChallenge')+' Randomness Score: '+value.score.toFixed(1)+' / 100';
  $('challenge-link').value=url;
  $('share-preview').src=SHARE_ORIGIN+'/api/share-card?'+challengeParams(value);
  if(challenge&&mode==='practice'&&value.n===challenge.n&&value.p===challenge.p&&value.duration===challenge.duration){
    const rounded=Number(value.score.toFixed(1));
    $('challenge-outcome').hidden=false;
    $('challenge-outcome').textContent=t(rounded>challenge.score?'challengeWin':rounded===challenge.score?'challengeTie':'challengeTry',{score:challenge.score.toFixed(1)});
  }
  const status=$('share-status');
  const copy=async()=>{try{await navigator.clipboard.writeText(url);status.textContent=t('shareDone');}catch{status.textContent=t('shareFailed');$('challenge-link').focus();$('challenge-link').select();}};
  $('copy-challenge').onclick=copy;
  // Prepare the file before the click, preserving transient user activation on mobile.
  let file=null;
  void shareCard(value).then(blob=>{file=new File([blob],'binary-lab-'+value.score.toFixed(1)+'.png',{type:'image/png'});}).catch(()=>{});
  $('share-result').onclick=async()=>{
    if(!navigator.share){await copy();return;}
    try{const data={title:'Binary Lab',text,url};if(file&&navigator.canShare?.({files:[file]}))data.files=[file];await navigator.share(data);}
    catch(error){if(error.name!=='AbortError')await copy();}
  };
  $('save-card').onclick=async()=>{
    try{const blob=file||await shareCard(value),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='binary-lab-'+value.score.toFixed(1)+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
    catch{status.textContent=t('shareFailed');}
  };
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
  cancelAnimationFrame(animation);animation=null;
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
if(practiceHost){$('account-form')?.remove();$('security-form')?.remove();}
$('account-form')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const action=event.submitter?.value||'login';
  $('account-status').textContent=t('accountWorking');
  $('account-form').querySelectorAll('button').forEach(b=>b.disabled=true);
  try{
    const response=await api(action,{username:$('username').value,password:$('password').value,recoveryCode:$('recovery-code').value});
    user={username:response.username,isAdmin:response.isAdmin};$('password').value='';$('recovery-code').value='';$('account').close();refreshSettings();$('start').focus();if(response.recoveryCode)showRecovery(response.recoveryCode);
  }catch(error){$('account-status').textContent=errorText(error.code);}
  finally{$('account-form').querySelectorAll('button').forEach(b=>b.disabled=false);}
});
function showRecovery(code){$('issued-code').textContent=code;$('recovery-display').showModal();}
$('copy-recovery').onclick=async()=>{try{await navigator.clipboard.writeText($('issued-code').textContent);toast('copied');}catch{toast('copyFailed');}};
$('close-recovery').onclick=()=>$('recovery-display').close();
$('recovery-display').addEventListener('close',()=>{$('issued-code').textContent='';});
$('close-security').onclick=()=>$('security').close();
$('security').addEventListener('close',()=>{if($('current-password')){$('current-password').value='';$('new-password').value='';$('confirm-username').value='';}});
$('account').addEventListener('close',()=>{if($('password')){$('password').value='';$('recovery-code').value='';}});
$('security-form')?.addEventListener('submit',async event=>{
  event.preventDefault();const action=event.submitter.value;
  if(action==='delete-account'&&!confirm(t('deleteWarning')))return;
  const form=event.currentTarget;form.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{const value=await api(action,{password:$('current-password').value,newPassword:$('new-password').value,confirm:$('confirm-username').value});
    $('security-status').textContent=t('securityDone');
    if(action!=='recovery-code'){user=null;refreshSettings();$('security').close();}
    $('current-password').value='';$('new-password').value='';
    if(value.recoveryCode)showRecovery(value.recoveryCode);
  }catch(error){$('security-status').textContent=errorText(error.code);}finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
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
const openAdmin=setupAdmin(()=>void loadLeaderboard());
$('sign-in').onclick=()=>{
  if(practiceHost){location.assign(rankedLink(rankedURL,document.documentElement.dataset.theme,getLanguage()));return;}
  $('account-status').textContent='';$('account').showModal();
};
$('sign-out').onclick=async()=>{
  accountBusy=true;syncControls();
  try{await api('logout',{});user=null;refreshSettings();}catch{toast('networkError');}
  finally{accountBusy=false;syncControls();}
};
$('account-security').onclick=()=>$('security').showModal();
$('account-admin').onclick=openAdmin;
$('cancel-game').onclick=()=>{
  if(game?.status!=='playing'||!confirm(t('cancelConfirm')))return;
  reset();toast('gameCanceled');
};
relocalize();void prepare();void loadLeaderboard();
if(!practiceHost&&entry.ranked&&!challenge)document.querySelector('[data-mode="ranking"]').click();
if(hasToken())void restoreRankedSession({
  getUser:()=>api('me'),
  onUser:value=>{user=value;refreshSettings();},
  shouldPrompt:()=>entry.ranked&&mode==='ranking'&&!game,
  onUnauthorized:prompt=>{
    saveToken(null);
    if(prompt&&!$('account').open){$('account-status').textContent='';$('account').showModal();}
  },
  onError:()=>toast('networkError')
});
