const messages = {
  rankingPolicy:['사이트에서 제공하는 예시 수열을 그대로 복사·붙여넣기하여 제출한 기록은 관리자가 랭킹에서 제외합니다. 예시 수열은 연습 모드에서 체험해 주세요.','Submissions that copy and paste the site’s example sequence unchanged will be removed from the leaderboard by the administrator. Please try the example in practice mode.'],
  adminTitle:['관리자','Administration'],adminTarget:['조회할 아이디','Player username'],adminSearch:['조회','Find player'],adminSelect:['선택','Select'],adminRecorded:['기록 시각','Submitted'],adminMore:['다음 50개 기록','Next 50 records'],
  adminHelp:['개별 기록을 삭제하면 해당 유저의 다음 최고 점수가 랭킹에 나타날 수 있습니다. 모든 기록 삭제는 계정을 유지하며, 이후 새 플레이는 가능합니다.','Deleting one score may reveal the player’s next best score. Deleting all scores keeps the account and allows future play.'],
  adminConfirm:['대상 아이디를 다시 입력','Type the target username again'],adminPassword:['관리자 본인의 현재 비밀번호','Your current administrator password'],adminReason:['삭제 사유 (필수)','Reason (required)'],
  adminWarning:['삭제는 되돌릴 수 없습니다. 계정 삭제는 모든 점수와 로그인 세션도 삭제합니다. 캐시로 인해 랭킹 반영에 약 1분이 걸릴 수 있습니다.','Deletion cannot be undone. Deleting an account also deletes all its scores and sessions. Cached rankings may take about a minute to update.'],
  adminDeleteScore:['선택한 기록 삭제','Delete selected score'],adminDeleteScores:['이 유저의 모든 점수 삭제','Delete all player scores'],adminDeleteUser:['계정 삭제','Delete account'],
  adminAsk:['{username} — {action}\n영구 삭제를 진행할까요?','{username} — {action}\nPermanently delete?'],adminDone:['삭제했습니다.','Deleted.'],adminChoose:['삭제할 점수 기록을 먼저 선택하세요.','Select a score to delete first.'],adminNotFound:['아이디 또는 기록을 찾을 수 없습니다.','Player or score not found.'],adminForbidden:['관리자 권한이 필요하거나 보호된 계정입니다.','Administrator access is required, or this account is protected.'],adminInvalid:['대상 아이디·선택 기록·삭제 사유를 확인해 주세요.','Check the target username, selected score and reason.'],
  shareResult:['결과 공유','Share Result'],copyChallenge:['도전 링크 복사','Copy challenge link'],saveCard:['결과 카드 저장','Save result card'],shareDone:['도전 링크를 복사했습니다.','Challenge link copied.'],shareFailed:['공유하지 못했습니다. 아래 링크를 복사해 주세요.','Sharing failed. Copy the link below.'],
  shareChallenge:['내 무작위 점수를 넘을 수 있나요?','Can you beat my randomness score?'],
  simulationScore:['Monte Carlo 기준 점수 · 유저 순위 아님','Monte Carlo score · not a player rank'],
  challengeIntro:['친구의 점수 {score} / 100에 도전 · n={n}, p={p}, {time}초. 시작하기를 누르세요.','Beat a shared score of {score} / 100 · n={n}, p={p}, {time}s. Press Start game.'],
  challengeWin:['공유된 점수 {score}점을 넘었습니다!','You beat the shared score of {score}!'],challengeTie:['공유된 점수 {score}점과 같은 표시 점수입니다.','You tied the displayed shared score of {score}.'],challengeTry:['공유된 목표 점수는 {score}점입니다. 다시 도전해 보세요.','The shared target is {score}. Try again!'],
  secureRank:['랭킹·로그인은 보안 전용 사이트에서 진행됩니다.','Ranked play and sign-in open on the isolated secure site.'],
  securityTitle:['계정 보안','Account security'],securityHelp:['비밀번호 변경·복구 코드 발급에는 현재 비밀번호가 필요합니다. 비밀번호 변경 시 모든 기기에서 로그아웃됩니다.','Current password is required to change your password or issue a recovery code. Changing your password signs out all devices.'],
  newPassword:['새 비밀번호 (10~128자)','New password (10–128 characters)'],changePassword:['비밀번호 변경','Change password'],logoutAll:['전체 기기 로그아웃','Sign out all devices'],
  recoveryCode:['복구 코드','Recovery code'],recoveryHelp:['비밀번호를 잊었을 때만 복구 코드를 입력하고, 위 비밀번호 칸에는 새 비밀번호를 입력하세요.','Only for recovery: enter your recovery code here and your new password in the password field above.'],
  recover:['코드로 계정 복구','Recover account'],rotateRecovery:['복구 코드 새로 발급','Issue new recovery code'],
  saveRecovery:['이 코드는 다시 표시되지 않습니다. 안전한 곳에 저장하세요. 이전 복구 코드는 무효가 됩니다. 비밀번호와 코드 모두 잃으면 계정을 복구할 수 없습니다.','This code is shown only once. Store it safely. The previous code is invalidated. Losing both password and code makes recovery impossible.'],savedRecovery:['코드를 저장했습니다','I saved the code'],
  deleteAccount:['계정 삭제','Delete account'],deleteWarning:['계정과 모든 점수가 영구 삭제됩니다. 현재 비밀번호와 아래에 본인 아이디를 입력한 뒤 삭제를 누르세요. 랭킹 캐시에 최대 30초 남을 수 있습니다.','Your account and all scores will be permanently deleted. Enter your current password and username below, then delete. Leaderboard caches may retain entries for up to 30 seconds.'],
  securityDone:['처리가 완료되었습니다. 비밀번호 변경 또는 전체 로그아웃 후에는 다시 로그인해 주세요.','Done. After changing your password or signing out all devices, sign in again.'],
  language: ['언어', 'Language'], theme: ['화면 테마', 'Color theme'],
  dark: ['다크', 'Dark'], light: ['라이트', 'Light'], reference: ['게임 개발 참고', 'How it works'],
  intro: ['0과 1로 수열을 만들고, 독립적인 무작위 모형과 비교해 보세요.', 'Build a sequence of zeros and ones, then compare it with an independent random model.'],
  setup: ['게임 설정', 'Game setup'], practice: ['연습', 'Practice'], ranked: ['랭킹 도전', 'Ranked'],
  mode: ['플레이 모드', 'Play mode'], practiceHelp: ['길이와 확률을 바꿔 연습하세요. 점수와 모든 통계를 제공합니다.', 'Choose your length and probability. Every completed practice round includes a score and full statistics.'],
  rankRules: ['100 bit · p = 0.5 · 45초', '100 bits · p = 0.5 · 45 seconds'],
  probability: ['1이 나올 확률', 'Probability of a 1'], presets: ['확률 빠른 설정', 'Probability presets'],
  probabilityHelp: ['0 < p < 1 · 기대되는 1: {ones}개', '0 < p < 1 · Expected ones: {ones}'],
  length: ['수열 길이', 'Sequence length'], lengthHelp: ['연습: 1~1000 bit', 'Practice: 1–1000 bits'],
  duration: ['제한시간', 'Time limit'], durationHelp: ['1~600초', '1–600 seconds'], seconds: ['초', 's'],
  timeLeft: ['남은 시간', 'Time left'], entered: ['입력한 비트', 'Bits entered'],
  game: ['비트 입력', 'Bit input'], progress: ['입력 진행률', 'Input progress'], sequence: ['입력 수열', 'Your sequence'],
  inputZero: ['0 입력', 'Enter 0'], inputOne: ['1 입력', 'Enter 1'], keyHelp: ['키보드 또는 버튼으로 입력', 'Use your keyboard or the buttons'],
  delete: ['마지막 입력 삭제', 'Delete last bit'], pasteTitle: ['이진 수열 붙여넣기', 'Paste a binary sequence'],
  pastePlaceholder: ['0과 1로 이루어진 텍스트를 여기에 붙여넣으세요.', 'Paste a string of zeros and ones here.'],
  pasteHelp: ['공백·줄바꿈은 무시합니다. 입력 적용을 누르면 현재 수열에 이어 붙입니다.', 'Spaces and line breaks are ignored. Apply to append to your current sequence.'],
  applyPaste: ['입력 적용', 'Apply sequence'], exampleTitle: ['예시 수열로 체험하기', 'Try an example sequence'],
  exampleHelp: ['p=0.5, 길이 100에서 높은 점수가 나오는 예시입니다. 복사 버튼을 누른 뒤 게임을 시작하고 붙여넣어 보세요. 높은 점수는 무작위 생성의 증명이 아닙니다.', 'This example scores highly at p=0.5 and length 100. Copy it, start a round, then paste it. A high score does not prove random generation.'],
  copy: ['복사', 'Copy'], copied: ['복사했습니다.', 'Copied to clipboard.'], copyFailed: ['복사 권한을 사용할 수 없습니다. 수열을 선택해 복사해 주세요.', 'Clipboard access is unavailable. Select the sequence to copy it.'],
  ready: ['준비 완료', 'Ready'], preparing: ['모형 준비 중 · {percent}%', 'Preparing model · {percent}%'],
  start: ['시작하기', 'Start game'], playing: ['입력 중', 'Playing'], done: ['게임 종료', 'Round finished'],
  standby: ['시작 전', 'Ready to play'], complete: ['입력 완료', 'Complete'], timeout: ['시간 종료', 'Time is up'],
  inputHint: ['시작한 뒤 0과 1을 입력하세요.', 'Start a round, then enter zeros and ones.'],
  playingHint: ['{n}번째 입력에서 자동으로 종료됩니다.', 'The round ends automatically at {n} bits.'],
  endedHint: ['입력이 종료되었습니다. 아래에서 결과를 확인하세요.', 'Input is locked. Your results are below.'],
  invalidP: ['p는 0보다 크고 1보다 작아야 합니다.', 'p must be greater than 0 and less than 1.'],
  invalidLength: ['길이는 1~1000 사이의 정수여야 합니다.', 'Length must be an integer from 1 to 1000.'],
  invalidDuration: ['제한시간은 1~600 사이의 정수여야 합니다.', 'Time limit must be an integer from 1 to 600.'],
  invalidBits: ['0과 1, 공백, 줄바꿈만 입력해 주세요.', 'Use only zeros, ones, spaces and line breaks.'],
  emptyBits: ['붙여넣을 수열을 입력해 주세요.', 'Enter a sequence first.'],
  clipped: ['목표 길이에 도달해 초과 문자는 무시했습니다.', 'Target length reached; extra characters were ignored.'],
  calibrationFailed: ['모형을 준비하지 못했습니다. 설정을 바꾸거나 새로고침해 주세요.', 'Could not prepare the model. Change a setting or reload.'],
  retry: ['다시 하기', 'Play again'], retryHelp: ['Enter로 설정으로 돌아가기 · 다시 Enter로 시작', 'Enter returns to settings; press Enter again to start.'],
  score: ['점수', 'Score'], resultTitle: ['Randomness Score', 'Randomness Score'],
  timeoutTitle: ['시간이 종료되었습니다', 'Time is up'],
  timeoutCopy: ['{n}개를 완성하지 못해 점수와 통계를 계산하지 않았습니다. 입력한 수열은 위에서 확인할 수 있습니다.', 'The round ended before {n} bits were entered, so no score or statistics were calculated. Your sequence is shown above.'],
  resultRare: ['이 모형에서는 드문 특성이 관측되었습니다.', 'These features are unusual under this model.'],
  resultCentral: ['선택한 특성들이 모형의 중심에 가깝습니다.', 'These features are close to the center of the model.'],
  resultNeutral: ['당신의 수열을 확률 모형과 비교했습니다.', 'Your sequence has been compared with the probability model.'],
  scoreMeaning: ['설정한 모형에서 무작위로 생성했을 때, 내 수열과 같거나 더 극단적인 S가 나올 비율에 기반한 점수입니다. 실제로 무작위로 생성되었을 확률은 아닙니다.', 'The score estimates how often a random sequence from your chosen model has an S at least as extreme as yours. It is not the probability that your sequence was randomly generated.'],
  averageMeaning: ['무작위 수열의 평균 점수는 보통 약 50점입니다. 100점은 거의 모든 보정 표본의 S가 내 S 이상일 만큼, 선택한 특성들이 모형 중심에 가깝다는 뜻입니다. 짧은 수열·극단적인 p에서는 동점 때문에 평균이 더 높을 수 있습니다.', 'Random sequences typically average about 50, not 100. A score of 100 means virtually all calibration samples have S at least as large as yours: the chosen features are very central. Ties in short sequences or extreme p settings can raise the average.'],
  observation: ['0과 1이 바뀐 횟수는 {switches}회입니다(모형 평균 {expected}). 1은 {ones}개 입력했습니다(기대 {expectedOnes}개).', 'Your sequence switches between 0 and 1 {switches} times (model mean: {expected}). It contains {ones} ones (expected: {expectedOnes}).'],
  compare: ['관측값과 무작위 모형 비교', 'Your observations and the random model'],
  diagnosticNote: ['아래는 개별 관측 사실에 대한 진단이며, 최종 점수의 기여도나 원인으로 해석하지 않습니다.', 'These are individual diagnostics, not independent score contributions or causes of the final score.'],
  observed: ['내 관측값', 'Your observation'], nullFrequency: ['Monte Carlo 표본 빈도', 'Monte Carlo sample frequency'],
  diagnosticOnly: ['진단 전용 · 점수 미포함', 'Diagnostic only · not scored'], joint: ['joint statistic에 포함', 'Included in joint statistic'],
  expected: ['모형 기대값', 'Model expectation'], details: ['상세 분석 보기', 'View detailed analysis'],
  metric: ['특성', 'Metric'], deviation: ['평균으로부터 거리', 'Marginal deviation'],
  calculation: ['최종 점수는 전체 공분산을 반영한 하나의 S로 계산합니다. S = {s} · 보정 표본 {samples}개. 예를 들어 20점이면 무작위 표본의 약 20%가 내 수열 이상의 S를 보인다는 뜻입니다.', 'One S, using the full covariance matrix, determines the score. S = {s} · {samples} calibration samples. A score of 20 means about 20% of random samples have S at least as large as yours.'],
  diagnosticsDetail: ['가능한 기대값은 이론값이며 최장 run은 Monte Carlo 평균(MC)입니다. σ는 학습 표본의 주변적 표준편차 단위입니다. 히스토그램은 최대 30개 구간의 빈도입니다. 길이보다 작지 않은 lag는 관측 쌍이 없어 “—”로 표시하고 통계 계산에서는 항상 0으로 둡니다.', 'Expectations are theoretical where available; longest runs use Monte Carlo means (MC). σ is a marginal deviation in fit-sample standard deviations. Histograms use up to 30 bins. Lags with no observed pairs are shown as “—” and represented by zero throughout calibration and scoring.'],
  discrete: ['이 길이 또는 p에서는 분포가 이산적입니다. 높은 점수에 몰릴 수 있으며 평균 50점 근사가 잘 맞지 않을 수 있습니다.', 'The distribution is strongly discrete at this length or p. Scores may cluster high, so the mean need not be close to 50.'],
  leaderboard: ['전체 사용자 랭킹', 'Global leaderboard'], period: ['랭킹 기간', 'Ranking period'],
  day: ['24시간', '24 hours'], week: ['7일', '7 days'], month: ['30일', '30 days'], all: ['전체', 'All time'],
  rank: ['순위', 'Rank'], username: ['아이디', 'Username'], recorded: ['기록 시각', 'Recorded'],
  refresh: ['새로고침', 'Refresh'], rankingHelp: ['최근 24시간·7일·30일·전체 기간 중 각 아이디의 최고 점수입니다. 60초마다 갱신됩니다.', 'Each username’s best score within the last 24 hours, 7 days, 30 days or all time. Refreshes every 60 seconds.'],
  rankingLoading: ['랭킹을 불러오는 중…', 'Loading leaderboard…'], rankingEmpty: ['아직 기록이 없습니다. 첫 기록에 도전해 보세요.', 'No scores yet. Set the first record.'],
  rankingUpdated: ['최근 갱신: {time}', 'Updated: {time}'], rankingUnavailable: ['랭킹 서버에 연결할 수 없습니다. 잠시 후 새로고침해 주세요. 연습 모드는 계속 이용할 수 있습니다.', 'The leaderboard server is unavailable. Try refreshing shortly. Practice remains available.'],
  saving: ['서버에서 점수를 검증하고 기록하는 중…', 'Server is verifying and recording your score…'],
  saved: ['{id}의 점수가 공용 랭킹에 기록되었습니다.', 'Score recorded in the global leaderboard for {id}.'],
  saveFailed: ['기록 전송에 실패했습니다. 아래 버튼으로 다시 전송할 수 있습니다.', 'Score submission failed. Use the button below to retry.'],
  submitAgain: ['점수 다시 전송', 'Retry submission'],
  accountTitle: ['랭킹 아이디', 'Ranked account'], accountHelp: ['고유한 아이디를 만들거나 기존 아이디로 로그인하세요. 아이디와 점수는 랭킹에 공개됩니다.', 'Create a unique username or sign in to your account. Your username and scores appear publicly on the leaderboard.'],
  usernameHelp: ['영문·숫자·밑줄·하이픈 3~20자. 대소문자는 구분하지 않습니다.', '3–20 letters, numbers, underscores or hyphens. Usernames are case-insensitive.'],
  password: ['비밀번호', 'Password'], passwordHelp: ['10~128자. 다른 사이트의 비밀번호를 재사용하지 마세요.', '10–128 characters. Do not reuse a password from another site.'],
  login: ['로그인', 'Sign in'], register: ['아이디 만들기', 'Create account'], close: ['닫기', 'Close'],
  accountWorking: ['계정 확인 중…', 'Checking account…'], signedIn: ['{id}로 로그인됨', 'Signed in as {id}'],
  logout: ['로그아웃', 'Sign out'], accountNeeded: ['랭킹 도전은 아이디 로그인 후 시작합니다.', 'Sign in to start a ranked round.'],
  accountTaken: ['이미 사용 중인 아이디입니다. 다른 아이디를 선택하거나 로그인해 주세요.', 'That username is taken. Choose another or sign in.'],
  invalidCredentials: ['아이디 또는 비밀번호가 맞지 않습니다.', 'Incorrect username or password.'],
  rateLimited: ['요청이 많습니다. 잠시 후 다시 시도해 주세요.', 'Too many requests. Please try again later.'],
  sessionExpired: ['로그인이 만료되었습니다. 다시 로그인해 주세요.', 'Your session expired. Please sign in again.'],
  expiredRound: ['랭킹 제출 시간이 지났습니다. 새 게임을 시작해 주세요.', 'This ranked round has expired. Start a new round.'],
  starting: ['랭킹 게임 준비 중…', 'Starting ranked round…'], networkError: ['서버 연결에 실패했습니다. 다시 시도해 주세요.', 'Could not connect to the server. Please try again.'],
  footer: ['독립 Bernoulli(p) 모형과 비교하는 이진 수열 게임', 'A binary sequence game compared with an independent Bernoulli(p) model']
};

let language = 'ko';
export function setLanguage(value) { language = value === 'en' ? 'en' : 'ko'; }
export function getLanguage() { return language; }
export function t(key, values = {}) {
  const pair = messages[key];
  if (!pair) throw new Error('Missing translation: ' + key);
  return pair[language === 'en' ? 1 : 0].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
export function both(ko, en) { return language === 'en' ? en : ko; }
export function localize(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.label)); });
  root.querySelectorAll('[data-placeholder]').forEach(el => { el.placeholder = t(el.dataset.placeholder); });
}
export function errorText(code) {
  return t(({USERNAME_TAKEN:'accountTaken', INVALID_CREDENTIALS:'invalidCredentials', RATE_LIMITED:'rateLimited', UNAUTHORIZED:'sessionExpired', EXPIRED_ROUND:'expiredRound', INVALID_ACCOUNT:'usernameHelp'})[code] || 'networkError');
}
export function stored(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
export function persist(key, value) { try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* Optional preferences. */ } }
