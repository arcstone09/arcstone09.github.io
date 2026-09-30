export const CONFIG = Object.freeze({ length: 100, fitSamples: 16000, calibrationSamples: 24000, ridge: 0.001, maxLag: 5, version: 'v2-length-13d-16k-24k-r001' });

export function validateP(p) {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) throw new RangeError('p는 0보다 크고 1보다 작아야 합니다.');
  return p;
}

export function validateLength(n) {
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new RangeError('Length must be an integer from 1 to 1000.');
  return n;
}

export const FEATURES = [
  { id: 'ones', label: 'Number of ones', ko: '1의 개수', definition: 'Σᵢ Xᵢ', expectation: (p, n = 100) => n * p, theory: 'np', detects: '설정된 확률에서 벗어나는 비율', example: '11111111…', group: 'Frequency' },
  { id: 'runs', label: 'Runs', ko: '연속 덩어리 수', definition: '1 + Σᵢ₌₂ⁿ 1(Xᵢ ≠ Xᵢ₋₁)', expectation: (p, n = 100) => 1 + 2 * (n - 1) * p * (1 - p), theory: '1 + 2(n−1)p(1−p)', detects: '과도한 교대 또는 지나치게 적은 전환', example: '01010101…', group: 'Runs' },
  ...[0, 1].map(bit => ({ id: `longest${bit}`, label: `Longest ${bit}-run`, ko: `${bit}의 최장 연속 길이`, definition: `max{ℓ : 어떤 연속 ℓ개 bit가 모두 ${bit}} (없으면 0)`, expectation: null, theory: 'Bernoulli(p) Monte Carlo 분포의 평균', detects: '지나치게 길거나 짧은 연속 구간', example: bit ? '111111110…' : '000000001…', group: 'Longest Run' })),
  ...['00', '01', '10', '11'].map(pattern => ({ id: `pattern${pattern}`, label: `${pattern} count`, ko: `${pattern} 등장 횟수`, definition: `Σᵢ₌₁⁽ⁿ⁻¹⁾ 1(XᵢXᵢ₊₁ = ${pattern})`, expectation: (p, n = 100) => Math.max(0, n - 1) * [...pattern].reduce((v, b) => v * (b === '1' ? p : 1 - p), 1), theory: `(n−1) × ${[...pattern].map(b => b === '1' ? 'p' : '(1−p)').join(' × ')}`, detects: '인접 bit 사이의 비정상적 패턴 빈도', example: '00110011…', group: 'Pattern Frequency' })),
  ...Array.from({ length: CONFIG.maxLag }, (_, index) => {
    const lag = index + 1;
    return { id: `ac${lag}`, label: `Autocorrelation · lag ${lag}`, ko: `lag ${lag} 자기상관`, definition: `Σᵢ₌₁⁽ⁿ⁻${lag}⁾ (Xᵢ−p)(Xᵢ₊${lag}−p) / [(n−${lag})p(1−p)]`, expectation: () => 0, theory: '0 (알려진 p로 중심화)', detects: '교대·주기적 반복 관계', example: '010101… → lag 2 양의 상관', group: 'Autocorrelation' };
  }),
];
export const DIAGNOSTICS = ['0000', '1111'].map(pattern => ({ id: `pattern${pattern}`, label: `${pattern} count`, ko: `${pattern} 등장 횟수`, definition: `Σᵢ₌₁⁽ⁿ⁻³⁾ 1(Xᵢ…Xᵢ₊₃ = ${pattern})`, expectation: (p, n = 100) => Math.max(0, n - 3) * (pattern === '1111' ? p : 1 - p) ** 4, theory: pattern === '1111' ? 'max(n−3,0)p⁴' : 'max(n−3,0)(1−p)⁴', detects: '긴 연속 패턴을 얼마나 피하는지 확인', example: '00000 안의 0000은 2회', group: '추가 진단 (점수 미포함)' }));

// Known-p centered lag products, not sample-mean Pearson correlation. May exceed ±1.
export function extract(bits, p) {
  validateP(p);
  validateLength(bits.length);
  if (Array.from(bits).some(b => b !== 0 && b !== 1)) throw new RangeError('Only binary digits are allowed.');
  const t = new Float64Array(FEATURES.length);
  let streak = 0, previous = -1;
  const extra = new Float64Array(2);
  for (let i = 0; i < bits.length; i++) {
    const b = bits[i];
    t[0] += b;
    if (b !== previous) { t[1]++; streak = 1; } else streak++;
    t[2 + b] = Math.max(t[2 + b], streak);
    if (streak >= 4) extra[b]++;
    if (i) t[4 + 2 * previous + b]++;
    previous = b;
  }
  for (let lag = 1; lag <= CONFIG.maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < bits.length; i++) sum += (bits[i] - p) * (bits[i - lag] - p);
    // A nonexistent lag is represented by zero in both fit and calibration; it carries no information.
    t[7 + lag] = bits.length > lag ? sum / ((bits.length - lag) * p * (1 - p)) : 0;
  }
  return { t, extra };
}

// Deterministic 53-bit uniforms keep calibration reproducible; never used for user input.
export function makeRng(seed) {
  let state = seed >>> 0;
  const word = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return (t ^ t >>> 14) >>> 0;
  };
  return () => ((word() >>> 5) * 67108864 + (word() >>> 6)) / 9007199254740992;
}

export function simulate(p, rng, length = CONFIG.length) {
  validateP(p); validateLength(length);
  const bits = new Uint8Array(length);
  for (let i = 0; i < length; i++) bits[i] = Number(rng() < p);
  return bits;
}

function seedFor(p, suffix, length) {
  let h = 2166136261;
  for (const c of `${CONFIG.version}:${p}:${length}:${suffix}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function cholesky(matrix) {
  const k = matrix.length;
  const l = Array.from({ length: k }, () => new Float64Array(k));
  for (let i = 0; i < k; i++) for (let j = 0; j <= i; j++) {
    let sum = matrix[i][j];
    for (let a = 0; a < j; a++) sum -= l[i][a] * l[j][a];
    if (i === j && !(sum > 0)) throw new Error('공분산 분해에 실패했습니다.');
    l[i][j] = i === j ? Math.sqrt(sum) : sum / l[j][j];
  }
  return l;
}

export function statistic(t, model) {
  // At representable p extremely near zero, known-p lag products can overflow.
  // Such an observation is beyond every finite calibrated statistic; preserve
  // its upper-tail ordering instead of allowing 0 * Infinity to produce NaN.
  if (Array.from(t).some(value => !Number.isFinite(value))) return Infinity;
  const y = new Float64Array(t.length);
  let s = 0;
  for (let i = 0; i < t.length; i++) {
    let value = (t[i] - model.mean[i]) / model.scale[i];
    for (let j = 0; j < i; j++) value -= model.lower[i][j] * y[j];
    y[i] = value / model.lower[i][i];
    s += y[i] * y[i];
    if (!Number.isFinite(s)) return Infinity;
  }
  return s;
}

function* calibrationSteps(p, { length = CONFIG.length, fitSamples = CONFIG.fitSamples, calibrationSamples = CONFIG.calibrationSamples, onProgress = () => {} } = {}) {
  validateP(p);
  validateLength(length);
  if (fitSamples < 2 || calibrationSamples < 1) throw new RangeError('표본 수가 너무 작습니다.');
  const k = FEATURES.length;
  const mean = new Float64Array(k);
  const m2 = Array.from({ length: k }, () => new Float64Array(k));
  const fitRng = makeRng(seedFor(p, 'fit', length));
  // Multivariate Welford update avoids cancellation in rare-event settings.
  for (let n = 1; n <= fitSamples; n++) {
    const { t } = extract(simulate(p, fitRng, length), p);
    const delta = t.map((v, i) => v - mean[i]);
    for (let i = 0; i < k; i++) mean[i] += delta[i] / n;
    for (let i = 0; i < k; i++) for (let j = 0; j <= i; j++) m2[i][j] += delta[i] * (t[j] - mean[j]);
    if (n % 500 === 0) { onProgress(n / (fitSamples + calibrationSamples)); yield; }
  }
  const scale = mean.map((_, i) => Math.sqrt(Math.max(0, m2[i][i] / (fitSamples - 1))) || 1);
  const correlation = Array.from({ length: k }, () => new Float64Array(k));
  for (let i = 0; i < k; i++) for (let j = 0; j <= i; j++) {
    correlation[i][j] = correlation[j][i] = m2[i][j] / ((fitSamples - 1) * scale[i] * scale[j]);
  }
  for (let i = 0; i < k; i++) correlation[i][i] += CONFIG.ridge;
  const model = { p, length, mean, scale, lower: cholesky(correlation), fitSamples, calibrationSamples, version: CONFIG.version };
  const nullRng = makeRng(seedFor(p, 'null', length));
  const scores = new Float64Array(calibrationSamples);
  const histograms = Array.from({ length: k + 2 }, () => ({}));
  const diagnosticMeans = new Float64Array(k + 2);
  for (let n = 0; n < calibrationSamples; n++) {
    const { t, extra } = extract(simulate(p, nullRng, length), p);
    scores[n] = statistic(t, model);
    const values = [...t, ...extra];
    values.forEach((value, i) => {
      diagnosticMeans[i] += value / calibrationSamples;
      // Integer features are exact; lag-product diagnostics use 0.1-wide buckets.
      const key = i >= 8 && i < k ? (Math.round(value * 10) / 10).toFixed(1) : String(value);
      histograms[i][key] = (histograms[i][key] || 0) + 1;
    });
    if ((n + 1) % 500 === 0) { onProgress((fitSamples + n + 1) / (fitSamples + calibrationSamples)); yield; }
  }
  scores.sort();
  return { ...model, scores, histograms, diagnosticMeans };
}

export function calibrate(p, options) {
  const iterator = calibrationSteps(p, options);
  let step;
  do { step = iterator.next(); } while (!step.done);
  return step.value;
}

// Same samples, arithmetic and score in Worker and cooperative main-thread mode.
export async function calibrateAsync(p, options = {}) {
  const iterator = calibrationSteps(p, options);
  while (true) {
    if (options.isCancelled?.()) throw new Error('Calibration cancelled');
    const step = iterator.next();
    if (step.done) return step.value;
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

export function evaluate(bits, model) {
  if (bits.length !== (model.length || CONFIG.length)) throw new RangeError('Sequence length does not match calibration.');
  const values = extract(bits, model.p);
  const s = statistic(values.t, model);
  // Lower bound includes ties, making discrete null p-values conservative.
  let lo = 0, hi = model.scores.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (model.scores[mid] < s) lo = mid + 1; else hi = mid;
  }
  return { ...values, s, score: 100 * (1 + model.scores.length - lo) / (model.scores.length + 1) };
}
