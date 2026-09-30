import { stored, persist } from './i18n.js';
// The same frontend also works on the full-stack Site and the local Worker.
const origin = location.hostname === 'arcstone09.github.io' ? 'https://arcstone09-random.basket032402.chatgpt.site' : '';
export const practiceHost=!!origin;
export const rankedURL='https://arcstone09-random.basket032402.chatgpt.site/#ranked';
// Remove the previous JavaScript-readable credential. Never migrate it to a cookie.
persist('binary-lab-session',null);
export function saveToken() { persist('binary-lab-session',null); }
export function hasToken() { return !practiceHost; }
export async function api(path, data) {
  if(practiceHost&&!path.startsWith('leaderboard?'))throw new Error('Isolated ranked host required');
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetch(origin+'/api/'+path,{
      method:data===undefined?'GET':'POST',
      headers:data===undefined?{}:{'Content-Type':'application/json','X-Binary-Lab':'1'},
      body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal,credentials:practiceHost?'omit':'same-origin'
    });
    const result=await response.json();
    if(!response.ok) throw Object.assign(new Error(result.error||'SERVER_ERROR'),{code:result.error});
    return result;
  } finally { clearTimeout(timer); }
}
