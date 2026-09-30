export const SHARE_ORIGIN='https://arcstone09-random.basket032402.chatgpt.site';
export function readChallenge(params){
  const n=Number(params.get('n')),p=Number(params.get('p')),duration=Number(params.get('time')),score=Number(params.get('score'));
  if(!['n','p','time','score'].every(k=>params.has(k))||!Number.isInteger(n)||n<1||n>1000||!Number.isFinite(p)||p<=0||p>=1||!Number.isInteger(duration)||duration<1||duration>600||!Number.isFinite(score)||score<0||score>100)return null;
  return {n,p,duration,score,language:params.get('lang')==='en'?'en':'ko'};
}
export function challengeParams(value){
  return new URLSearchParams({n:String(value.n),p:String(value.p),time:String(value.duration),score:value.score.toFixed(1),lang:value.language==='en'?'en':'ko'});
}
export function challengeURL(value){return SHARE_ORIGIN+'/api/challenge?'+challengeParams(value);}
