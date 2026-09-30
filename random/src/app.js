import { CONFIG, FEATURES, DIAGNOSTICS, validateP, evaluate, calibrateAsync } from './statistics.js';
import { createGame, advance } from './game.js';
import { getCached, putCached } from './cache.js';
import { referenceHTML } from './reference.js';

const $ = id => document.getElementById(id);
let model = null, game = null, worker = null, generation = 0, pending = null, animation = null, workerWatchdog = null;
const cells = Array.from({ length: 100 }, () => {
  const cell = document.createElement('span');
  cell.className = 'bit-cell'; cell.textContent = '·'; cell.setAttribute('aria-hidden', 'true');
  $('sequence').append(cell); return cell;
});
const format = value => Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
const editable = target => target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

function validSettings() {
  try {
    validateP($('probability').valueAsNumber);
    const seconds = $('duration').valueAsNumber;
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 600) throw new Error('제한시간은 1~600 사이의 정수(초)로 설정하세요.');
    $('validation').textContent = '';
    return true;
  } catch (error) { $('validation').textContent = error.message; return false; }
}

function updateStart() {
  const valid = validSettings();
  $('start').disabled = !valid || !model || model.p !== $('probability').valueAsNumber || game?.status === 'playing';
}

async function prepare() {
  const token = ++generation;
  clearTimeout(workerWatchdog);
  worker?.terminate(); worker = null; model = null;
  updateStart();
  const p = $('probability').valueAsNumber;
  try { validateP(p); } catch { $('calibration-state').textContent = '유효한 p를 입력해 주세요.'; return; }
  $('calibration-state').textContent = 'Monte Carlo 모형 준비 중…';
  const cached = await getCached(p);
  if (token !== generation) return;
  if (cached) { ready(cached, true); return; }
  let fallingBack = false;
  const fallback = async () => {
    if (token !== generation || fallingBack) return;
    fallingBack = true;
    clearTimeout(workerWatchdog); worker?.terminate(); worker = null;
    try {
      const result = await calibrateAsync(p, {
        isCancelled: () => token !== generation,
        onProgress: progress => { if (token === generation) $('calibration-state').textContent = `호환 모드로 모형 준비 중 · ${Math.round(progress * 100)}%`; },
      });
      if (token !== generation) return;
      ready(result, false); void putCached(result);
    } catch (error) { if (token === generation) failed(error.message); }
  };
  const armWatchdog = () => {
    clearTimeout(workerWatchdog);
    workerWatchdog = setTimeout(fallback, 15000);
  };
  try {
    worker = new Worker(new URL('./calibration-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (token !== generation) return;
      if (fallingBack) return;
      if (data.error) { void fallback(); return; }
      armWatchdog();
      if (data.model) {
        clearTimeout(workerWatchdog);
        ready(data.model, false); void putCached(data.model);
        worker?.terminate(); worker = null;
      } else $('calibration-state').textContent = `Monte Carlo 모형 준비 중 · ${Math.round(data.progress * 100)}%`;
    };
    worker.onerror = event => { event.preventDefault(); void fallback(); };
    worker.onmessageerror = () => { void fallback(); };
    armWatchdog();
    worker.postMessage({ p });
  } catch { void fallback(); }
}
function failed(message) {
  worker?.terminate(); worker = null;
  $('calibration-state').textContent = message;
  $('start').disabled = true;
}
function ready(value, cached) {
  model = value;
  $('calibration-state').textContent = `● 모형 준비 완료${cached ? ' · 캐시' : ''} · 24,000개 보정 표본${Math.min(model.p, 1 - model.p) < .01 ? ' · 희귀 사건: 점수가 거칠 수 있습니다' : ''}`;
  updateStart();
}

function refreshSettings() {
  const p = $('probability').valueAsNumber;
  $('expected-ones').textContent = Number.isFinite(p) ? format(100 * p) : '—';
  $('model-label').textContent = `Bernoulli(p = ${Number.isFinite(p) ? p : '—'})`;
  document.querySelectorAll('[data-p]').forEach(button => button.classList.toggle('selected', Number(button.dataset.p) === p));
  if (!game) render();
}
$('probability').addEventListener('input', () => {
  clearTimeout(workerWatchdog);
  ++generation; worker?.terminate(); worker = null; model = null;
  clearTimeout(pending); refreshSettings(); updateStart();
  $('calibration-state').textContent = '설정한 p로 모형을 준비합니다…';
  pending = setTimeout(prepare, 250);
});
document.querySelectorAll('[data-p]').forEach(button => button.addEventListener('click', () => {
  $('probability').value = button.dataset.p;
  $('probability').dispatchEvent(new Event('input'));
}));
$('duration').addEventListener('input', () => { updateStart(); if (!game) render(); });

function setLocked(locked) {
  ['probability', 'duration'].forEach(id => $(id).disabled = locked);
  document.querySelectorAll('[data-p]').forEach(button => button.disabled = locked);
  ['zero', 'one', 'delete'].forEach(id => $(id).disabled = !locked);
  document.body.classList.toggle('is-playing', locked);
}

function start() {
  updateStart();
  if ($('start').disabled || $('reference').open) return;
  game = createGame($('duration').valueAsNumber, performance.now());
  $('results').hidden = true;
  setLocked(true); $('start').disabled = true;
  $('start').innerHTML = '실험 진행 중 <span>·</span>';
  $('input-hint').textContent = '0 / 1을 입력하세요. 100번째 비트에서 즉시 완료됩니다.';
  document.activeElement?.blur();
  render();
  if (matchMedia('(max-width: 680px)').matches) $('phase').scrollIntoView({ block: 'start' });
  animation = requestAnimationFrame(tick);
}
$('settings').addEventListener('submit', event => { event.preventDefault(); start(); });

function tick() {
  if (game?.status !== 'playing') return;
  act('tick');
  if (game.status === 'playing') animation = requestAnimationFrame(tick);
}
function act(action) {
  if (game?.status !== 'playing') return;
  const before = game;
  game = advance(game, action, performance.now());
  render();
  if (before.status === 'playing' && game.status !== 'playing') finish();
}
function render() {
  const remaining = game ? Math.max(0, game.deadline - performance.now()) / 1000 : $('duration').valueAsNumber || 0;
  // Complete state retains the time at the last input, since no further render ticks run.
  const [seconds, tenth] = remaining.toFixed(1).split('.');
  $('timer').innerHTML = `${seconds}<span>.${tenth}</span>`;
  $('timer').classList.toggle('urgent', !!game && remaining <= 10);
  const bits = game?.bits || [];
  $('count').textContent = bits.length;
  $('progress').setAttribute('aria-valuenow', bits.length);
  $('progress-fill').style.width = `${bits.length}%`;
  $('sequence').setAttribute('aria-label', `입력 ${bits.length}개: ${bits.join(' ') || '없음'}`);
  cells.forEach((cell, i) => {
    cell.textContent = i < bits.length ? bits[i] : i === bits.length && game?.status === 'playing' ? '_' : '·';
    cell.className = `bit-cell${i < bits.length ? ' filled' : ''}${bits[i] === 1 ? ' one' : ''}${i === bits.length && game?.status === 'playing' ? ' next' : ''}`;
  });
  $('phase').textContent = !game ? 'STANDBY' : game.status === 'playing' ? 'RECORDING' : game.status === 'complete' ? 'COMPLETE' : 'TIME OUT';
  $('phase').classList.toggle('active', game?.status === 'playing');
}
for (const [id, action] of [['zero', 0], ['one', 1], ['delete', 'backspace']]) $(id).addEventListener('click', () => act(action));
document.addEventListener('keydown', event => {
  if ($('reference').open || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
  if (editable(event.target)) return;
  if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) return;
  if (['0', '1', 'Backspace', 'Enter'].includes(event.key)) event.preventDefault();
  if (event.repeat) return;
  if (game?.status === 'playing') {
    if (event.key === '0' || event.key === '1') {
      const button = $(event.key === '0' ? 'zero' : 'one');
      button.classList.add('pressed'); setTimeout(() => button.classList.remove('pressed'), 100);
      act(Number(event.key));
    } else if (event.key === 'Backspace') act('backspace');
  } else if (event.key === 'Enter') {
    if (game) reset(); else start();
  }
});
document.addEventListener('visibilitychange', () => { if (game?.status === 'playing') act('tick'); });

function histogram(index, observed) {
  const entries = Object.entries(model.histograms[index]).map(([value, count]) => [Number(value), count]).sort((a, b) => a[0] - b[0]);
  const low = Math.min(observed, entries[0][0]), high = Math.max(observed, entries[entries.length - 1][0]);
  const span = Math.max(high - low, 1);
  const buckets = new Array(30).fill(0);
  entries.forEach(([value, count]) => buckets[Math.min(29, Math.floor((value - low) / span * 29))] += count);
  const peak = Math.max(...buckets);
  const x = 16 + (observed - low) / span * 290;
  const bars = buckets.map((count, i) => `<rect class="hist-bar" x="${16 + i * 10}" y="${83 - count / peak * 57}" width="8" height="${count / peak * 57}" rx="1"/>`).join('');
  return `<svg viewBox="0 0 330 110" role="img" aria-label="${[...FEATURES, ...DIAGNOSTICS][index].label} 귀무분포 히스토그램, 관측값 ${format(observed)}"><title>밝은 세로선: 관측값 ${format(observed)}. 막대: Monte Carlo 빈도.</title>${bars}<line class="hist-marker" x1="${x}" x2="${x}" y1="18" y2="86"/><circle cx="${x}" cy="15" r="3" fill="#d3ff94"/><text class="hist-axis" x="16" y="103">${format(low)}</text><text class="hist-axis" x="315" y="103" text-anchor="end">${format(high)}</text></svg>`;
}
function finish() {
  cancelAnimationFrame(animation);
  setLocked(false);
  // Freeze settings until a deliberate new experiment so results always identify their actual null model.
  ['probability', 'duration'].forEach(id => $(id).disabled = true);
  document.querySelectorAll('[data-p]').forEach(button => button.disabled = true);
  $('start').disabled = true;
  $('start').innerHTML = '실험 종료 <span>✓</span>';
  $('input-hint').textContent = '입력이 종료되었습니다. 아래에서 결과를 확인하세요.';
  $('results').hidden = false;
  if (game.status === 'timeout') {
    $('results').innerHTML = `<div class="eyebrow">EXPERIMENT INCOMPLETE</div><h2 id="result-heading">시간이 종료되었습니다</h2><div class="score timeout-score">${game.bits.length} / 100 bits</div><p class="result-copy">100개를 완성하지 못해 정식 Randomness Score를 계산하지 않았습니다. 위의 수열에서 이번 입력을 확인할 수 있습니다.</p><p class="result-meta">p = ${model.p} · 제한시간 ${game.duration}초</p>${retryHTML()}`;
  } else {
    const result = evaluate(game.bits, model);
    const all = [...FEATURES, ...DIAGNOSTICS], values = [...result.t, ...result.extra];
    const rows = all.map((feature, i) => {
      const expected = feature.expectation ? feature.expectation(model.p) : model.diagnosticMeans[i];
      const z = i < FEATURES.length ? (values[i] - model.mean[i]) / model.scale[i] : null;
      return `<tr><td>${feature.label} <span class="scope-label">${i < FEATURES.length ? '' : '진단 전용'}</span></td><td>${format(values[i])}</td><td>${format(expected)}${feature.expectation ? '' : ' (MC)'}</td><td>${z === null ? '—' : `${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`}</td></tr>`;
    }).join('');
    const ranked = FEATURES.map((f, i) => ({ label: f.ko, z: Math.abs((values[i] - model.mean[i]) / model.scale[i]) })).sort((a, b) => b.z - a.z);
    const charts = [0, 1, 13, 14].map(i => `<div class="hist-card"><h4>${all[i].label} <span class="scope-label">${i >= 13 ? '진단 전용 · 점수 미포함' : 'JOINT 포함'}</span></h4><p>관측 ${format(values[i])} · 기대 ${format(all[i].expectation(model.p))}</p>${histogram(i, values[i])}<span class="legend">▏ YOUR INPUT &nbsp; ▪ NULL DISTRIBUTION</span></div>`).join('');
    $('results').innerHTML = `<div class="eyebrow">EXPERIMENT COMPLETE / 100 BITS RECORDED</div><div class="result-top"><div><h2 id="result-heading">Randomness Score</h2><div class="score">${result.score.toFixed(1)}<span> / 100</span></div></div><div class="result-copy"><strong>${result.score < 5 ? '이 모형에서는 드문 패턴입니다.' : result.score >= 80 ? '선택한 특성들이 모형의 중심에 가깝습니다.' : '당신의 수열을 확률 모형과 비교했습니다.'}</strong><br>설정한 p에 따라 100개의 비트를 독립적으로 무작위 생성했을 때, 당신의 수열과 같거나 더 극단적인 특성(S)을 보일 확률을 추정한 점수입니다. 예를 들어 20점은 무작위 수열의 약 20%가 당신의 수열 이상으로 극단적인 특성을 보인다는 뜻입니다. 당신의 수열이 실제 무작위로 생성되었을 확률은 아닙니다.</div></div><p class="result-meta">p = ${model.p} · S = ${format(result.s)} · NULL SAMPLES ${model.calibrationSamples.toLocaleString()} · 제한시간 ${game.duration}초</p><div class="chart-grid">${charts}</div><h3>수열 자세히 보기</h3><p class="diagnostic-intro">평균에서 표준편차 단위로 가장 멀리 떨어진 특성: ${ranked.slice(0, 3).map(x => `${x.label} (${x.z.toFixed(2)}σ)`).join(', ')}.<br>이는 주변적(marginal) 진단이며 점수 기여도나 별도 검정이 아닙니다. 최종 점수는 상관관계를 반영한 하나의 S로 계산합니다.</p><div class="table-wrap"><table><thead><tr><th>METRIC</th><th>YOUR INPUT</th><th>RANDOM EXPECTATION</th><th>평균으로부터 거리</th></tr></thead><tbody>${rows}</tbody></table></div><p class="diagnostic-intro">기대값은 가능한 경우 이론값, longest run은 보정 표본의 평균(MC)입니다. σ 진단은 학습 표본 평균·표준편차를 사용하며, 학습 분산이 0이면 스케일 1을 사용합니다. 히스토그램은 보정 표본의 빈도를 최대 30개 구간으로 묶어 표시합니다. ${Math.min(model.p, 1 - model.p) < .01 ? '현재 p는 극단적이므로 희귀 사건에 대한 보정 해상도가 제한됩니다.' : ''}</p>${retryHTML()}`;
  }
  $('retry').addEventListener('click', reset);
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function retryHTML() { return '<button id="retry" class="start-button retry-button">다시 하기 <span>↵</span></button><p class="diagnostic-intro">Enter로 설정으로 돌아가기 · 다시 Enter로 시작</p>'; }
function reset() {
  game = null; $('results').hidden = true; setLocked(false);
  $('start').innerHTML = '실험 시작 <span>↵</span>';
  $('input-hint').innerHTML = '<span class="cursor-mark">▌</span> 시작하면 이곳에 당신의 패턴이 기록됩니다.';
  updateStart(); render(); $('start').focus();
}

$('reference-content').innerHTML = referenceHTML();
$('reference-button').addEventListener('click', () => $('reference').showModal());
$('close-reference').addEventListener('click', () => $('reference').close());
$('reference').addEventListener('click', event => { if (event.target === $('reference')) {
  const rect = $('reference').getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('reference').close();
} });
refreshSettings(); prepare();
