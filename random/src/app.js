import { FEATURES, DIAGNOSTICS, validateP, evaluate, calibrateAsync } from './statistics.js';
import { createGame, advance } from './game.js';
import { getCached, putCached } from './cache.js';
import { referenceHTML } from './reference.js';

const $ = id => document.getElementById(id);
let model = null, game = null, worker = null, generation = 0, pending = null, animation = null, workerWatchdog = null;
let mode = 'practice';
const EXAMPLE_SEQUENCE = '1010011001010110110010000101111000110110100101100111010010010110001000101011111110110000000010101101';
const cells = Array.from({ length: 1000 }, () => {
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
    const length = $('sequence-length').valueAsNumber;
    if (!Number.isInteger(length) || length < 1 || length > 1000) throw new Error('수열 길이는 1~1000 사이의 정수로 설정하세요.');
    if (mode === 'ranking' && length !== 100) throw new Error('랭킹 모드는 100 bit로만 플레이할 수 있습니다.');
    if (mode === 'ranking' && !/^[A-Za-z0-9_-]{2,20}$/.test($('player-id').value.trim())) throw new Error('랭킹 모드 아이디는 영문·숫자·_- 2~20자로 입력하세요.');
    $('validation').textContent = '';
    return true;
  } catch (error) { $('validation').textContent = error.message; return false; }
}

function updateStart() {
  const valid = validSettings();
  $('start').disabled = !valid || (mode === 'ranking' && (!model || model.p !== $('probability').valueAsNumber)) || game?.status === 'playing';
}

async function prepare() {
  const token = ++generation;
  clearTimeout(workerWatchdog);
  worker?.terminate(); worker = null; model = null;
  updateStart();
  const p = $('probability').valueAsNumber;
  try { validateP(p); } catch { $('calibration-state').textContent = '유효한 p를 입력해 주세요.'; return; }
  $('calibration-state').textContent = '준비 중…';
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
        onProgress: progress => { if (token === generation) $('calibration-state').textContent = `준비 중 · ${Math.round(progress * 100)}%`; },
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
      } else $('calibration-state').textContent = `준비 중 · ${Math.round(data.progress * 100)}%`;
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
  $('calibration-state').textContent = '준비 완료';
  updateStart();
}

function refreshSettings() {
  const p = $('probability').valueAsNumber;
  $('expected-ones').textContent = Number.isFinite(p) ? format(100 * p) : '—';
  $('model-label').textContent = `Bernoulli(p = ${Number.isFinite(p) ? p : '—'})`;
  document.querySelectorAll('[data-p]').forEach(button => {
    const selected = Number(button.dataset.p) === p;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
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
$('sequence-length').addEventListener('input', () => { updateStart(); if (!game) render(); });
$('player-id').addEventListener('input', updateStart);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(item => { const selected = item.dataset.mode === mode; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  const ranking = mode === 'ranking';
  $('identity-group').hidden = !ranking;
  $('sequence-length').value = ranking ? 100 : ($('sequence-length').value || 100);
  $('sequence-length').disabled = ranking;
  updateStart();
}));
$('theme-toggle').addEventListener('click', () => { const light = document.body.classList.toggle('light-theme'); $('theme-toggle').setAttribute('aria-pressed', String(light)); localStorage.setItem('binary-lab-theme', light ? 'light' : 'dark'); });
$('language-toggle').addEventListener('click', () => {
  const english = document.documentElement.lang !== 'en';
  document.documentElement.lang = english ? 'en' : 'ko';
  $('language-toggle').textContent = english ? '한' : 'EN';
  $('setup-heading').textContent = english ? 'Game setup' : '게임 설정';
  document.querySelector('[data-mode="practice"]').textContent = english ? 'Practice' : '연습 모드';
  document.querySelector('[data-mode="ranking"]').textContent = english ? 'Ranking' : '랭킹 모드';
  $('reference-button').textContent = english ? 'How it works' : '게임 개발 참고';
  $('leaderboard-heading').textContent = english ? 'Leaderboard' : '랭킹';
});
if (localStorage.getItem('binary-lab-theme') === 'light') { document.body.classList.add('light-theme'); $('theme-toggle').setAttribute('aria-pressed', 'true'); }

function setLocked(locked) {
  ['probability', 'duration', 'sequence-length', 'player-id'].forEach(id => $(id).disabled = locked || (id === 'sequence-length' && mode === 'ranking'));
  document.querySelectorAll('[data-p]').forEach(button => button.disabled = locked);
  ['zero', 'one', 'delete', 'paste-input'].forEach(id => $(id).disabled = !locked);
  document.body.classList.toggle('is-playing', locked);
}

function start() {
  updateStart();
  if ($('start').disabled || $('reference').open) return;
  game = createGame($('duration').valueAsNumber, performance.now(), $('sequence-length').valueAsNumber);
  $('results').hidden = true;
  setLocked(true); $('start').disabled = true;
  $('start').innerHTML = '진행 중';
  $('input-hint').textContent = `${game.length}번째 입력에서 자동으로 종료됩니다.`;
  document.activeElement?.blur();
  render();
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
  $('timer').innerHTML = `${seconds}<span>.${tenth}</span><small>초</small>`;
  $('timer').classList.toggle('urgent', !!game && remaining <= 10);
  const bits = game?.bits || [];
  $('count').textContent = bits.length;
  $('progress').setAttribute('aria-valuenow', bits.length);
  $('progress').setAttribute('aria-valuemax', game?.length || $('sequence-length').valueAsNumber || 100);
  $('progress-fill').style.width = `${Math.min(100, bits.length / (game?.length || 100) * 100)}%`;
  $('sequence').setAttribute('aria-label', `입력 ${bits.length}개: ${bits.join(' ') || '없음'}`);
  $('sequence').style.setProperty('--sequence-columns', game?.length > 200 ? '40' : '20');
  cells.forEach((cell, i) => {
    cell.hidden = i >= (game?.length || Number($('sequence-length').value) || 100);
    cell.textContent = i < bits.length ? bits[i] : i === bits.length && game?.status === 'playing' ? '_' : '·';
    cell.className = `bit-cell${i < bits.length ? ' filled' : ''}${bits[i] === 1 ? ' one' : ''}${i === bits.length && game?.status === 'playing' ? ' next' : ''}`;
  });
  $('phase').textContent = !game ? '시작 전' : game.status === 'playing' ? '입력 중' : game.status === 'complete' ? '입력 완료' : '시간 종료';
  $('phase').classList.toggle('active', game?.status === 'playing');
}
for (const [id, action] of [['zero', 0], ['one', 1], ['delete', 'backspace']]) $(id).addEventListener('click', () => act(action));
let pasteNoticeTimer = null;
$('paste-input').addEventListener('input', event => {
  if (game?.status !== 'playing') return;
  const field = event.currentTarget;
  const compact = field.value.replace(/\s/g, '');
  field.value = '';
  if (!compact) return;
  if (!/^[01]+$/.test(compact)) {
    $('input-hint').textContent = '붙여넣기에는 0과 1만 사용할 수 있습니다.';
    clearTimeout(pasteNoticeTimer);
    pasteNoticeTimer = setTimeout(() => { if (game?.status === 'playing') $('input-hint').textContent = '100번째 입력에서 자동으로 종료됩니다.'; }, 2400);
    return;
  }
  const remaining = 100 - game.bits.length;
  compact.slice(0, remaining).split('').forEach(bit => act(Number(bit)));
  if (compact.length > remaining) $('input-hint').textContent = `${game?.length || 100}개가 입력되어 나머지 문자는 무시했습니다.`;
});
$('copy-example').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(EXAMPLE_SEQUENCE); $('copy-example').textContent = '✓ 복사됨'; }
  catch { $('paste-input').value = EXAMPLE_SEQUENCE; $('copy-example').textContent = '수열을 선택해 복사하세요'; }
  setTimeout(() => { $('copy-example').textContent = '▣ 예시 100-bit 복사'; }, 1800);
});
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
function rankingRecords() { try { return JSON.parse(localStorage.getItem('binary-lab-ranking') || '[]'); } catch { return []; } }
function saveRanking(score) {
  if (mode !== 'ranking') return;
  const id = $('player-id').value.trim(), now = Date.now();
  const records = rankingRecords();
  const existing = records.find(item => item.id === id);
  if (existing) { existing.score = Math.max(existing.score, score); existing.updated = now; } else records.push({ id, score, updated: now });
  localStorage.setItem('binary-lab-ranking', JSON.stringify(records)); renderLeaderboard('24h');
}
function renderLeaderboard(period = document.querySelector('.leaderboard-tabs .selected')?.dataset.period || '24h') {
  const now = Date.now(), spans = { '24h': 86400000, week: 604800000, month: 2592000000, all: Infinity };
  const rows = rankingRecords().filter(item => now - item.updated <= spans[period]).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 20);
  $('leaderboard-list').innerHTML = rows.length ? rows.map((item, i) => `<li><span>${i + 1}</span><b>${item.id}</b><strong>${item.score.toFixed(1)}</strong></li>`).join('') : '<li class="empty-ranking">아직 이 브라우저에 기록이 없습니다.</li>';
}
document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-period]').forEach(item => item.classList.toggle('selected', item === button)); renderLeaderboard(button.dataset.period); }));
function finish() {
  cancelAnimationFrame(animation);
  setLocked(false);
  // Freeze settings until a deliberate new experiment so results always identify their actual null model.
  ['probability', 'duration'].forEach(id => $(id).disabled = true);
  document.querySelectorAll('[data-p]').forEach(button => button.disabled = true);
  $('start').disabled = true;
  $('start').innerHTML = '게임 종료';
  $('input-hint').textContent = '입력이 종료되었습니다. 아래에서 결과를 확인하세요.';
  $('results').hidden = false;
  if (game.status === 'timeout') {
    $('results').innerHTML = `<div class="result-top"><div><h2 id="result-heading">시간이 종료되었습니다</h2><div class="score timeout-score">${game.bits.length}<span> / ${game.length} bits</span></div></div><div class="result-actions">${retryHTML()}</div></div><p class="result-copy">제한시간이 끝났습니다. 입력한 수열을 확인하고 다시 시도해 보세요.</p><p class="result-meta">${mode === 'ranking' ? `랭킹 모드 · p = ${model.p}` : '연습 모드'} · 제한시간 ${game.duration}초</p>`;
  } else if (mode === 'practice' || game.length !== 100) {
    $('results').innerHTML = `<div class="result-top"><div><h2 id="result-heading">연습 완료</h2><div class="score timeout-score">${game.bits.length}<span> / ${game.length} bits</span></div></div><div class="result-actions">${retryHTML()}</div></div><p class="result-copy">연습 모드는 점수를 기록하지 않습니다. 길이와 입력 리듬을 바꿔 다시 연습해 보세요.</p>`;
  } else {
    const result = evaluate(game.bits, model);
    saveRanking(result.score);
    const all = [...FEATURES, ...DIAGNOSTICS], values = [...result.t, ...result.extra];
    const rows = all.map((feature, i) => {
      const expected = feature.expectation ? feature.expectation(model.p) : model.diagnosticMeans[i];
      const z = i < FEATURES.length ? (values[i] - model.mean[i]) / model.scale[i] : null;
      return `<tr><td>${feature.ko} <span class="scope-label">${i < FEATURES.length ? '' : '진단 전용'}</span></td><td>${format(values[i])}</td><td>${format(expected)}${feature.expectation ? '' : ' (MC)'}</td><td>${z === null ? '—' : `${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`}</td></tr>`;
    }).join('');
    const ranked = FEATURES.map((f, i) => ({ label: f.ko, z: Math.abs((values[i] - model.mean[i]) / model.scale[i]) })).sort((a, b) => b.z - a.z);
    const charts = [0, 1, 13, 14].map(i => `<div class="hist-card"><h4>${all[i].ko} <span class="scope-label">${i >= 13 ? '진단 전용 · 점수 미포함' : 'joint statistic에 포함'}</span></h4><p>관측 ${format(values[i])} · 기대 ${format(all[i].expectation(model.p))}</p>${histogram(i, values[i])}</div>`).join('');
    const switches = values[1] - 1, expectedSwitches = 198 * model.p * (1 - model.p);
    const comparison = Math.abs(switches - expectedSwitches) < .001 ? '같았습니다' : switches > expectedSwitches ? '많았습니다' : '적었습니다';
    const observation = `0과 1이 바뀐 횟수는 ${switches}회로 모형 평균 ${format(expectedSwitches)}회와 비교해 ${comparison}. 1은 ${values[0]}개 입력했습니다(기대 ${format(100 * model.p)}개).`;
    $('results').innerHTML = `<div class="result-top"><div><h2 id="result-heading">Randomness Score</h2><div class="score">${result.score.toFixed(1)}<span> / 100</span></div><p class="result-meta">p = ${model.p} · 100 bits · 제한시간 ${game.duration}초</p></div><div class="result-actions">${retryHTML()}</div></div><p class="result-copy"><strong>${result.score < 5 ? '이 모형에서는 드문 특성이 관측되었습니다.' : result.score >= 80 ? '선택한 특성들이 모형의 중심에 가깝습니다.' : '당신의 수열을 확률 모형과 비교했습니다.'}</strong><br>설정한 모형에서 무작위로 생성했을 때, 내 수열과 같거나 더 극단적인 특성(S)이 나올 비율에 기반한 점수입니다. 실제로 무작위로 생성되었을 확률은 아닙니다.</p><p class="observation">${observation}</p><h3>관측값과 무작위 모형 비교</h3><p class="diagnostic-intro">각 특성의 관측 사실을 보여주는 진단입니다. 점수 기여도나 점수의 원인을 의미하지 않습니다.</p><div class="legend"><span><i class="observed"></i>내 관측값</span><span><i></i>Monte Carlo 표본 빈도</span></div><div class="chart-grid">${charts}</div><details class="analysis-details"><summary>상세 분석 보기</summary><p class="diagnostic-intro">최종 점수는 feature 사이의 상관관계를 반영한 하나의 joint statistic S에서 계산합니다. S = ${format(result.s)} · 보정 표본 ${model.calibrationSamples.toLocaleString()}개.<br>예를 들어 20점이면 설정한 모형의 무작위 수열 중 약 20%가 내 수열과 같거나 더 극단적인 S를 보인다는 뜻입니다.</p><p class="diagnostic-intro">평균에서 표준편차 단위로 가장 멀리 떨어진 특성: ${ranked.slice(0, 3).map(x => `${x.label} (${x.z.toFixed(2)}σ)`).join(', ')}. 이는 주변적(marginal) 진단이며 독립 배점이나 별도 검정이 아닙니다.</p><div class="table-wrap"><table><thead><tr><th>특성</th><th>내 관측값</th><th>모형 기대값</th><th>평균으로부터 거리</th></tr></thead><tbody>${rows}</tbody></table></div><p class="diagnostic-intro">기대값은 가능한 경우 이론값, longest run은 보정 표본의 평균(MC)입니다. σ 진단은 학습 표본 평균·표준편차를 사용하며, 학습 분산이 0이면 스케일 1을 사용합니다. 히스토그램은 보정 표본의 빈도를 최대 30개 구간으로 묶어 표시합니다. ${Math.min(model.p, 1 - model.p) < .01 ? '현재 p는 극단적이므로 희귀 사건에 대한 보정 해상도가 제한됩니다.' : ''}</p></details>`;
  }
  $('retry').addEventListener('click', reset);
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function retryHTML() { return '<button id="retry" class="start-button retry-button">다시 하기 <kbd>Enter</kbd></button><p class="field-help">Enter로 설정으로 돌아가기<br>다시 Enter로 시작</p>'; }
function reset() {
  game = null; $('results').hidden = true; setLocked(false);
  $('start').innerHTML = '시작하기 <kbd>Enter</kbd>';
  $('input-hint').innerHTML = '시작한 뒤 0과 1을 입력하세요.';
  updateStart(); render(); $('start').focus();
}

$('reference-content').innerHTML = referenceHTML();
$('reference-content').insertAdjacentHTML('beforeend', `<details><summary>07 · 점수의 중심과 복붙 예시</summary><p>이 점수는 ‘무작위일 확률’이 아닙니다. 귀무모형에서 내 수열의 S보다 크거나 같은 S가 나오는 비율이므로, 실제 Bernoulli(p) 수열의 점수는 평균적으로 50점 부근입니다. 100점은 무작위일 확률이 100%라는 뜻이 아니라, 보정 표본에서 내 수열 이상으로 큰 S가 거의 관측되지 않았다는 뜻입니다. 선택한 feature에 한해서 모형의 중심적인 수열이라는 의미입니다.</p><p>다음 100-bit 수열을 게임 중 ‘01 수열 붙여넣기’ 입력창에 복사해 넣어 보세요. 자연스러운 균형과 run을 섞어 높은 점수를 노려볼 수 있는 예시지만, 점수는 p와 유한 Monte Carlo 표본에 따라 달라지므로 높은 점수를 보장하지 않습니다.</p><div class="formula">1010011001010110110010000101111000110110100101100111010010010110001000101011111110110000000010101101</div><p>붙여넣기에서는 공백과 줄바꿈을 무시하며 0과 1만 받습니다.</p></details>`);
$('reference-button').addEventListener('click', () => $('reference').showModal());
$('close-reference').addEventListener('click', () => $('reference').close());
$('reference').addEventListener('click', event => { if (event.target === $('reference')) {
  const rect = $('reference').getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('reference').close();
} });
refreshSettings(); prepare();
renderLeaderboard();
