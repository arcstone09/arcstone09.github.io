import { CONFIG, FEATURES, DIAGNOSTICS } from './statistics.js';
import { both, getLanguage, t } from './i18n.js';
export const EXAMPLE_SEQUENCE = '1011111010011001011100010000011110010010011000110101110011111101110101011010100100110101110011000001';
export function referenceHTML() {
  const ko = getLanguage() === 'ko';
  const section = (title, content, open = false) => `<details ${open ? 'open' : ''}><summary>${title}</summary>${content}</details>`;
  const p = (a, b) => `<p>${both(a,b)}</p>`;
  const formula = value => `<div class="formula">${value}</div>`;
  const features = [...FEATURES, ...DIAGNOSTICS].map((feature, i) => {
    const explanations = [
      ['1의 개수로 전체 비율을 확인합니다. 예: 11111111…', 'Counts ones to detect an unusual overall proportion. Example: 11111111…'],
      ['같은 숫자의 연속 덩어리를 셉니다. 과도한 교대를 관측합니다. 예: 010101…', 'Counts blocks of equal bits, detecting excessive alternation. Example: 010101…'],
      ['0의 최장 연속 길이입니다. 0이 없으면 0입니다. 예: 00000001…', 'Longest block of zeros, or zero if none occur. Example: 00000001…'],
      ['1의 최장 연속 길이입니다. 1이 없으면 0입니다. 예: 11111110…', 'Longest block of ones, or zero if none occur. Example: 11111110…']
    ];
    const description = explanations[i] || (i < 8 ?
      ['겹치는 길이 2 창의 빈도입니다. 인접 패턴의 이상을 관측합니다. 예: 00110011…', 'Counts overlapping length-2 windows. Detects unusual adjacent patterns. Example: 00110011…'] : i < 13 ?
      ['설정된 p로 중심화한 lag product입니다. 주기적 관계를 관측합니다. 예: 010101…의 lag 2.', 'A lag product centered on the specified p. Detects periodic relationships; e.g. lag 2 of 010101… .'] :
      ['겹치는 길이 4 창을 셉니다. 예: 00000에는 0000이 두 번 있습니다. 점수에는 넣지 않습니다.', 'Counts overlapping length-4 windows. For example, 00000 contains 0000 twice. Not included in scoring.']);
    const definition = !ko && (i === 2 || i === 3) ? `max{ℓ : ℓ consecutive bits all equal ${i - 2}} (0 if absent)` : feature.definition;
    return `<div class="doc-feature"><h4>${ko ? feature.ko : feature.label} <span class="scope-label">${t(i < 13 ? 'joint':'diagnosticOnly')}</span></h4>${formula(definition + '<br>E[T] = ' + (feature.expectation ? (ko ? feature.theory : feature.id.startsWith('ac') ? '0 (centered on known p)' : feature.theory) : both('Monte Carlo 평균', 'Monte Carlo mean')))}${p(...description)}</div>`;
  }).join('');
  return [
    section(both('01 · 사람이 만드는 무작위', '01 · Human-made randomness'),
      p('사람은 무작위 수열을 만들 때 0과 1을 지나치게 번갈아 입력하거나 긴 연속 구간을 피하는 경향을 보일 수 있습니다. 010101…은 균형 잡혀 보이지만 다음 bit를 예측하기 쉽습니다. 이 게임은 그런 직관과 독립적인 확률 과정의 차이를 체험하기 위해 만들었습니다.',
      'People may alternate too often or avoid long runs when trying to make a random sequence. 010101… looks balanced but is easy to predict. This game explores the difference between that intuition and an independent random process.') +
      p('귀무모형(null model)은 Xᵢ iid ~ Bernoulli(p), i=1,…,n입니다. p는 각 bit가 1일 확률입니다. 이전 bit는 다음 bit의 확률을 바꾸지 않습니다.', 'The null model is Xᵢ iid ~ Bernoulli(p), i=1,…,n. p is the probability of a 1. Previous bits do not change the probability of the next bit.') +
      formula('P(Xᵢ₊₁=1 | Xᵢ=0) = P(Xᵢ₊₁=1 | Xᵢ=1) = p') +
      p('p=0.5이면 두 확률 모두 0.5입니다. 따라서 0과 1이 반드시 번갈아 나올 이유는 없습니다.', 'At p=0.5 both probabilities are 0.5. There is no requirement for zeros and ones to alternate.'), true),
    section(both('02 · 0000과 1111은 자연스럽습니다', '02 · Why 0000 and 1111 are natural'),
      p('p=0.5에서 특정 위치의 0000 또는 1111 확률은 각각 1/16=6.25%입니다. 길이 100에는 길이 4 창이 97개 있으므로 0000의 기대 등장 횟수는 6.0625입니다.', 'At p=0.5, the probability of 0000 or 1111 at a given position is 1/16=6.25% each. A 100-bit sequence has 97 length-4 windows, so the expected count of 0000 is 6.0625.') +
      formula('P(0000) = (1−p)⁴ · P(1111) = p⁴<br>E[N₀₀₀₀] = max(n−3,0)(1−p)⁴<br>E[N₁₁₁₁] = max(n−3,0)p⁴<br>n=100, p=0.5: 97 × 1/16 = 6.0625') +
      p('창은 겹칩니다. 00000에는 0000이 두 번 있습니다. 창들이 독립이지 않아도 기대값의 선형성은 성립합니다. 100-bit 수열에 0000이 한 번도 없는 것이 드물 수 있지만, 그 사실 하나만으로 무작위가 아니라고 단정할 수 없습니다. 기대 횟수는 한 번도 안 나올 확률과 다릅니다.',
      'Windows overlap: 00000 contains 0000 twice. Linearity of expectation does not require independent windows. Seeing no 0000 in 100 bits can be unusual, but it alone does not establish nonrandomness. An expected count is not the probability of seeing no occurrences.') +
      p('두 길이 4 패턴의 히스토그램은 진단 전용으로 최종 점수에 직접 포함하지 않습니다.', 'The two length-4 histograms are diagnostics and are not directly included in the final score.')),
    section(both('03 · 실제 feature와 수열 길이', '03 · Features and sequence length'),
      p('연습은 n=1~1000, 랭킹은 n=100입니다. 모든 이론값·시뮬레이션·공분산·캐시는 동일한 n과 p를 사용합니다. 13개 통계량의 순서는 아래와 같습니다.',
      'Practice supports n=1–1000; ranked rounds use n=100. Expectations, simulations, covariance and caches all use the same n and p. The 13 scoring features appear below in order.') +
      features +
      p('최장 run의 전체 분포와 다른 feature의 결합 분포는 Monte Carlo로 구합니다. 자기상관은 표본 Pearson 상관계수가 아니므로 ±1을 벗어날 수 있습니다. n 이하가 아닌 lag는 쌍이 없어 항상 0으로 코딩하고 화면에는 —로 표시합니다. 짧은 길이의 상수 feature는 ridge로 처리하며 정보가 생기는 것으로 간주하지 않습니다.',
      'Monte Carlo supplies the longest-run and joint distributions. The lag statistic is not a sample Pearson correlation and can exceed ±1. Lags with no pairs are coded as zero in both simulation and observation and displayed as —. Ridge handles constant short-length features without inventing information.')),
    section(both('04 · 공분산을 반영한 하나의 S', '04 · One S using covariance'),
      p('runs = 1 + N₀₁ + N₁₀처럼 feature에는 중복 정보가 있습니다. 독립 Z-score 제곱합이나 개별 점수 평균을 사용하지 않습니다.', 'Features share information: for example runs = 1 + N₀₁ + N₁₀. We do not sum independent squared Z-scores or average feature scores.') +
      formula('T = (T₁,…,T₁₃)<br>μ = E[T], Σ = Cov(T)<br>S = (T−μ)ᵀΣ⁻¹(T−μ)') +
      p(`${CONFIG.fitSamples.toLocaleString()}개 학습 표본으로 평균과 전체 표본 공분산을 추정합니다. D=diag(표본 표준편차), C=D⁻¹Σ̂D⁻¹로 표준화한 뒤 λ=${CONFIG.ridge}의 ridge를 적용합니다. 분산 0인 feature의 D는 1입니다.`,
      `${CONFIG.fitSamples.toLocaleString()} fit samples estimate the mean and full sample covariance. With D=diag(sample standard deviations), C=D⁻¹Σ̂D⁻¹, we apply ridge λ=${CONFIG.ridge}. A zero-variance feature uses D=1.`) +
      formula(`z = D⁻¹(T−μ̂)<br>S = zᵀ(C + ${CONFIG.ridge}I)⁻¹z<br>Σ_reg = Σ̂ + ${CONFIG.ridge}D²`) +
      p('Cholesky 분해와 전진 대입으로 계산합니다. S≥0이며 클수록 모형 중심에서 멉니다. 양방향 편차가 quadratic form에 이미 반영되어 별도의 two-sided 변환은 하지 않습니다.', 'Cholesky decomposition and forward substitution compute S. S≥0 and larger values are farther from the center. The quadratic form already includes deviations in both directions; there is no extra two-sided transformation.')),
    section(both('05 · 평균 50점, 100점의 의미', '05 · Why the mean is 50, and what 100 means'),
      p(`학습과 독립적인 스트림의 ${CONFIG.calibrationSamples.toLocaleString()}개 표본에 같은 feature와 S를 계산합니다. χ² 분포를 가정하지 않습니다.`,
      `We calculate the same features and S on ${CONFIG.calibrationSamples.toLocaleString()} calibration samples from a stream independent of fitting. No chi-square distribution is assumed.`) +
      formula('Score = 100 × P_null(S ≥ S_user)<br>Score = 100 × (1 + #{S_sim ≥ S_user}) / (N+1)') +
      `<p>${t('scoreMeaning')}</p><p>${t('averageMeaning')}</p>` +
      p('정확히 100점이면 모든 보정 표본의 S가 내 S 이상입니다. 화면의 100.0은 반올림 값일 수도 있습니다. 실제 무작위 수열도 낮은 점수를 받으며, 점수는 모든 규칙성을 탐지하거나 무작위성을 증명하지 않습니다.',
      'An exact score of 100 means every calibration S is at least as large as yours. Displayed 100.0 may also result from rounding. Truly random sequences can score low. This score cannot detect every pattern or prove randomness.') +
      p('동점은 ≥에 포함해 보수적으로 처리합니다. 내부 최솟값은 100/(N+1)입니다. 특히 n=1이나 극단적인 p에서는 동점이 많아 평균 50점보다 높을 수 있습니다.',
      'Ties are included with ≥, producing conservative empirical p-values. The minimum is 100/(N+1). At n=1 or extreme p, many ties can push the average above 50.')),
    section(both('06 · 구현·캐시·랭킹', '06 · Implementation, caching and ranked play'),
      p(`모형 버전: ${CONFIG.version}. 표본 수: 학습 ${CONFIG.fitSamples}, 보정 ${CONFIG.calibrationSamples}. lag 1~5. p는 유한한 0<p<1이며 반올림하거나 보간하지 않습니다. n·p·버전으로 캐시를 구분합니다.`,
      `Model version: ${CONFIG.version}. Samples: ${CONFIG.fitSamples} fit and ${CONFIG.calibrationSamples} calibration. Lags 1–5. p is a finite number with 0<p<1, without quantization or interpolation. Cache keys include n, p and version.`) +
      p('설정 단계에서 Worker로 준비하고, 준비된 뒤 시작합니다. IndexedDB와 메모리에 최근 6개 모형을 보관합니다. 캐시 응답 1.5초 초과, Worker 오류 또는 15초 응답 중단 때 같은 알고리즘의 분할 계산으로 전환합니다.',
      'A Worker prepares the model before play starts. IndexedDB and memory cache the six most recent models. Cache requests time out after 1.5 seconds. Worker failures or 15 seconds without progress trigger cooperative calculation using the same algorithm.') +
      p('난수는 n·p·버전에서 유도한 재현 가능한 의사난수입니다. 24,000개 표본에서 확률 0.5 부근의 Monte Carlo 표준오차는 약 0.32점이며 공분산 추정의 불확실성은 포함하지 않습니다. 매우 작은 p에서 표현 범위를 넘는 S는 Infinity로 처리해 최소 점수를 줍니다.',
      'Reproducible pseudorandom streams are seeded by n, p and version. With 24,000 samples, Monte Carlo standard error near probability 0.5 is about 0.32 points, excluding covariance estimation uncertainty. If numerical overflow occurs at extreme p, S is treated as Infinity and receives the minimum score.') +
      p('목표 길이에 도달하면 즉시 잠기고, 시간 초과 시 정식 점수는 계산하지 않습니다. 참고창을 열어도 시간은 흐릅니다. 랭킹은 100 bit·p=0.5·45초로 서버에서 점수를 다시 계산합니다. 기간별로 실제 제출 시각에 속하는 기록 중 아이디별 최고 점수를 조회합니다. 연습은 랭킹에 제출하지 않습니다.',
      'Input locks immediately at the target length. Incomplete timed-out rounds have no official score. Opening the reference does not pause time. Ranked rounds use 100 bits, p=0.5 and 45 seconds; the server recomputes scores. Each time window uses actual submission timestamps and each account’s best score. Practice does not submit to the leaderboard.') +
      p('아이디는 대소문자를 구분하지 않고 고유합니다. 비밀번호는 서버에서 salted PBKDF2 해시로 보관합니다. 붙여넣기는 허용되며, 랭킹은 사람의 수동 입력이나 무작위 생성 여부를 보증하지 않습니다.',
      'Usernames are unique and case-insensitive. Passwords are stored as salted PBKDF2 hashes on the server. Pasting is allowed; the leaderboard does not certify manual entry or random generation.')),
    section(both('07 · 예시를 복사해 보기', '07 · Copy an example'),
      `<p>${t('exampleHelp')}</p><p>${both('현재 모형에서 약 99.9점입니다. 모형 버전이 바뀌면 점수도 바뀔 수 있습니다.', 'This example scores about 99.9 under the current model. A future model version may change that score.')}</p><div class="code-block"><code>${EXAMPLE_SEQUENCE}</code><button class="copy-button" data-copy aria-label="${t('copy')}">▣ ${t('copy')}</button></div>`)
  ].join('');
}
