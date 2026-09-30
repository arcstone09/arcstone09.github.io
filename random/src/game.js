export function createGame(seconds, now) {
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 600) throw new RangeError('제한시간은 1~600초입니다.');
  return { bits: [], status: 'playing', deadline: now + seconds * 1000, duration: seconds };
}

export function advance(game, action, now) {
  if (game.status !== 'playing') return game;
  if (now >= game.deadline) return { ...game, status: 'timeout' };
  if (action === 'tick') return game;
  const bits = [...game.bits];
  if (action === 'backspace') bits.pop();
  else if (action === 0 || action === 1) bits.push(action);
  else return game;
  return { ...game, bits, status: bits.length === 100 ? 'complete' : 'playing' };
}
