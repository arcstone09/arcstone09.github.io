import { api } from './api.js';
import { t, getLanguage, errorText } from './i18n.js';
const $=id=>document.getElementById(id);
export function setupAdmin(onChange){
  // The GitHub practice-only build strips all credential forms.
  if(!$('admin-action'))return ()=>{};
  let target=null,nextOffset=null,busy=false,lookup=0;
  const explain=e=>['USER_NOT_FOUND','SCORE_NOT_FOUND'].includes(e.code)?t('adminNotFound'):['FORBIDDEN','PROTECTED_ACCOUNT'].includes(e.code)?t('adminForbidden'):['INVALID_CONFIRMATION','INVALID_ADMIN_ACTION'].includes(e.code)?t('adminInvalid'):errorText(e.code);
  const clear=()=>{target=null;nextOffset=null;$('admin-target').hidden=true;$('admin-scores').replaceChildren();$('admin-password').value='';$('admin-confirm').value='';$('admin-reason').value='';};
  async function find(offset=0){
    const request=++lookup,username=$('admin-username').value.trim();
    clear();$('admin-status').textContent=t('accountWorking');
    try{
      const data=await api('admin/user?username='+encodeURIComponent(username)+'&offset='+offset);
      if(request!==lookup)return;
      target=data.player;nextOffset=data.nextOffset;$('admin-target').hidden=false;
      $('admin-target-title').textContent=target.username+' · '+data.total+' '+t('score');
      $('admin-delete-user').disabled=data.protected;
      for(const score of data.scores){
        const row=document.createElement('tr'),select=document.createElement('td'),radio=document.createElement('input');radio.type='radio';radio.name='admin-score';radio.value=score.round_id;radio.setAttribute('aria-label',score.score.toFixed(1)+' / 100 · '+new Date(score.submitted_at).toLocaleString(getLanguage()));select.append(radio);row.append(select);
        for(const text of [score.score.toFixed(1),new Date(score.submitted_at).toLocaleString(getLanguage())]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
        $('admin-scores').append(row);
      }
      $('admin-more').hidden=nextOffset===null;$('admin-status').textContent='';
    }catch(error){if(request===lookup)$('admin-status').textContent=explain(error);}
  }
  $('admin-search').onsubmit=e=>{e.preventDefault();if(!busy)void find();};
  $('admin-more').onclick=()=>{if(!busy&&nextOffset!==null)void find(nextOffset);};
  $('close-admin').onclick=()=>{if(!busy)$('admin').close();};
  $('admin').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  $('admin').addEventListener('close',()=>{lookup++;clear();});
  $('admin-action').onsubmit=async event=>{
    event.preventDefault();if(busy||!target)return;
    const action=event.submitter?.value,roundId=document.querySelector('input[name="admin-score"]:checked')?.value;
    if(action==='delete-score'&&!roundId){$('admin-status').textContent=t('adminChoose');return;}
    const name={ 'delete-score':'adminDeleteScore','delete-scores':'adminDeleteScores','delete-user':'adminDeleteUser' }[action];if(!name)return;
    if(!confirm(t('adminAsk',{username:target.username,action:t(name)})))return;
    busy=true;$('admin-status').textContent=t('accountWorking');
    const buttons=[...$('admin').querySelectorAll('button')],disabled=buttons.map(b=>b.disabled);buttons.forEach(b=>b.disabled=true);
    try{
      await api('admin/moderate',{action,roundId,targetId:target.id,confirm:$('admin-confirm').value,password:$('admin-password').value,reason:$('admin-reason').value});
      clear();$('admin-status').textContent=t('adminDone');onChange();
    }catch(error){$('admin-status').textContent=explain(error);}
    finally{busy=false;$('admin-password').value='';buttons.forEach((b,i)=>b.disabled=disabled[i]);}
  };
  return ()=>{$('admin-status').textContent='';$('admin').showModal();};
}
