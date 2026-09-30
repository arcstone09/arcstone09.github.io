import { FEATURES, DIAGNOSTICS } from './statistics.js';
import { t, getLanguage } from './i18n.js';
export const format = value => Number.isFinite(value) ? (Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')) : String(value);
export const metricName = feature => getLanguage() === 'ko' ? feature.ko : feature.label;
export const retryHTML = () => `<button id="retry" class="start-button retry-button">${t('retry')} <kbd>Enter</kbd></button><p class="field-help">${t('retryHelp')}</p>`;

function histogram(model, index, observed) {
  const entries = Object.entries(model.histograms[index]).map(([v,c])=>[Number(v),c]).sort((a,b)=>a[0]-b[0]);
  const low=Math.min(observed,entries[0][0]), high=Math.max(observed,entries.at(-1)[0]), span=Math.max(high-low,1);
  const buckets=new Array(30).fill(0);
  entries.forEach(([value,count])=>{ buckets[Math.min(29,Math.floor((value-low)/span*29))]+=count; });
  const peak=Math.max(...buckets), x=16+(observed-low)/span*290;
  const bars=buckets.map((count,i)=>`<rect class="hist-bar" x="${16+i*10}" y="${83-count/peak*57}" width="8" height="${count/peak*57}" rx="1"/>`).join('');
  return `<svg viewBox="0 0 330 110" role="img" aria-label="${t('observed')}: ${format(observed)}; ${t('nullFrequency')}"><title>${t('observed')}: ${format(observed)}</title>${bars}<line class="hist-marker" x1="${x}" x2="${x}" y1="18" y2="86"/><circle class="hist-point" cx="${x}" cy="15" r="3"/><text class="hist-axis" x="16" y="103">${format(low)}</text><text class="hist-axis" x="315" y="103" text-anchor="end">${format(high)}</text></svg>`;
}
export function resultHTML(game,model,result,mode) {
  if(game.status==='timeout') return `<div class="result-top"><div><h2 id="result-heading">${t('timeoutTitle')}</h2><div class="score timeout-score">${game.bits.length}<span> / ${game.length} bits</span></div></div><div class="result-actions">${retryHTML()}</div></div><p class="result-copy">${t('timeoutCopy',{n:game.length})}</p>`;
  const all=[...FEATURES,...DIAGNOSTICS], values=[...result.t,...result.extra], n=game.length;
  const rows=all.map((feature,i)=>{
    const missing=i>=8&&i<13&&n<=i-7;
    const expected=feature.expectation ? feature.expectation(model.p,n) : model.diagnosticMeans[i];
    const z=i<13?(values[i]-model.mean[i])/model.scale[i]:null;
    return `<tr><td>${metricName(feature)} ${i>=13?`<span class="scope-label">${t('diagnosticOnly')}</span>`:''}</td><td>${missing?'—':format(values[i])}</td><td>${missing?'—':format(expected)+(feature.expectation?'':' (MC)')}</td><td>${missing||z===null?'—':(z>=0?'+':'')+z.toFixed(2)+'σ'}</td></tr>`;
  }).join('');
  const charts=[0,1,13,14].map(i=>`<div class="hist-card"><h4>${metricName(all[i])} <span class="scope-label">${t(i>=13?'diagnosticOnly':'joint')}</span></h4><p>${t('observed')} ${format(values[i])} · ${t('expected')} ${format(all[i].expectation(model.p,n))}</p>${histogram(model,i,values[i])}</div>`).join('');
  return `<div class="result-top"><div><h2 id="result-heading">${t('resultTitle')}</h2><div class="score">${result.score.toFixed(1)}<span> / 100</span></div><p class="result-meta">${t(mode==='ranking'?'ranked':'practice')} · p = ${model.p} · ${n} bits · ${game.duration} ${t('seconds')}</p></div><div class="result-actions">${retryHTML()}</div></div>
    ${mode==='ranking'?'<p class="field-help" id="submission-status" role="status"></p><button class="secondary-button" id="retry-submit" hidden>'+t('submitAgain')+'</button>':''}
    <p class="result-copy"><strong>${t(result.score<5?'resultRare':result.score>=80?'resultCentral':'resultNeutral')}</strong><br>${t('scoreMeaning')}</p>
    <p class="result-copy">${t('averageMeaning')}</p>
    ${n<10||Math.min(model.p,1-model.p)<.01?`<p class="warning-note result-copy">${t('discrete')}</p>`:''}
    <p class="observation">${t('observation',{switches:values[1]-1,expected:format(2*(n-1)*model.p*(1-model.p)),ones:values[0],expectedOnes:format(n*model.p)})}</p>
    <h3>${t('compare')}</h3><p class="diagnostic-intro">${t('diagnosticNote')}</p><div class="legend"><span><i class="observed"></i>${t('observed')}</span><span><i></i>${t('nullFrequency')}</span></div>
    <div class="chart-grid">${charts}</div><details class="analysis-details"><summary>${t('details')}</summary><p>${t('calculation',{s:format(result.s),samples:model.calibrationSamples.toLocaleString()})}</p><div class="table-wrap"><table><thead><tr><th>${t('metric')}</th><th>${t('observed')}</th><th>${t('expected')}</th><th>${t('deviation')}</th></tr></thead><tbody>${rows}</tbody></table></div><p>${t('diagnosticsDetail')}</p></details>`;
}
