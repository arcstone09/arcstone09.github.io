export function createGame(seconds, now, length = 100) {
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 600) throw new RangeError('제한시간은 1~600초입니다.');
  if (!Number.isInteger(length) || length < 1 || length > 1000) throw new RangeError('수열 길이는 1~1000입니다.');
  return { bits: [], status: 'playing', deadline: now + seconds * 1000, duration: seconds, length };
}

export function advance(game, action, now) {
  if (game.status !== 'playing') return game;
  if (now >= game.deadline) return { ...game, status: 'timeout' };
  if (action === 'tick') return game;
  const bits = [...game.bits];
  if (action === 'backspace') bits.pop();
  else if (action === 0 || action === 1) bits.push(action);
  else return game;
  return { ...game, bits, status: bits.length === game.length ? 'complete' : 'playing' };
}
