import { stored, persist } from './i18n.js';
// The same frontend also works on the full-stack Site and the local Worker.
const origin = location.hostname === 'arcstone09.github.io' ? 'https://arcstone09-random.basket032402.chatgpt.site' : '';
export function saveToken(value) { persist('binary-lab-session', value); }
export function hasToken() { return !!stored('binary-lab-session'); }
export async function api(path, data) {
  const token=stored('binary-lab-session');
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetch(origin+'/api/'+path,{
      method:data===undefined?'GET':'POST',
      headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{})},
      body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal,credentials:'omit'
    });
    const result=await response.json();
    if(!response.ok) throw Object.assign(new Error(result.error||'SERVER_ERROR'),{code:result.error});
    return result;
  } finally { clearTimeout(timer); }
}
