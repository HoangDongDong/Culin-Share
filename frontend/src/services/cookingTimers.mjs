export const TIMER_STORAGE_KEY = 'culinshare.cookingTimers.v1';
export const MAX_TIMER_SECONDS = 2147483647;

export function formatTimer(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function remainingMilliseconds(timer, now) {
  return timer.status === 'running' ? Math.max(0, timer.endsAt - now) : timer.remainingMs;
}

function finishDueTimers(timers, now) {
  let changed = false;
  const updated = timers.map(timer => {
    if (timer.status !== 'running' || timer.endsAt > now) return timer;
    changed = true;
    return { ...timer, status: 'finished', remainingMs: 0, endsAt: null };
  });
  return changed ? updated : timers;
}

export function restoreTimers(raw, now) {
  try {
    const saved = JSON.parse(raw || '[]');
    if (!Array.isArray(saved)) return [];
    const keys = new Set();
    return finishDueTimers(saved.filter(timer => {
      if (!timer || typeof timer.key !== 'string' || keys.has(timer.key) ||
          typeof timer.recipeId !== 'string' || !/^\d+$/.test(timer.recipeId) ||
          typeof timer.recipeTitle !== 'string' || typeof timer.runId !== 'string' ||
          !Number.isInteger(timer.stepNumber) || timer.stepNumber < 1 ||
          !Number.isInteger(timer.durationSeconds) || timer.durationSeconds < 1 || timer.durationSeconds > MAX_TIMER_SECONDS ||
          !Number.isFinite(timer.remainingMs) || timer.remainingMs < 0 || timer.remainingMs > timer.durationSeconds * 1000 ||
          !['idle', 'running', 'paused', 'finished'].includes(timer.status) ||
          typeof timer.notified !== 'boolean' ||
          (timer.status === 'running' && (!Number.isFinite(timer.endsAt) || timer.endsAt < 0))) return false;
      keys.add(timer.key);
      return true;
    }), now);
  } catch { return []; }
}

export function timerReducer(state, action) {
  const { now } = action;
  if (action.type === 'tick') {
    return { timers: finishDueTimers(state.timers, now), now };
  }
  if (action.type === 'start') {
    const duration = action.timer.durationSeconds;
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_TIMER_SECONDS ||
        state.timers.some(timer => timer.key === action.timer.key && ['running', 'paused'].includes(timer.status))) return state;
    const timer = { ...action.timer, status: 'running', remainingMs: duration * 1000,
      endsAt: now + duration * 1000, notified: false };
    return { timers: [...state.timers.filter(item => item.key !== timer.key), timer], now };
  }
  if (action.type === 'remove') {
    return { ...state, timers: state.timers.filter(timer => timer.key !== action.key) };
  }
  return { ...state, now: now ?? state.now, timers: state.timers.map(timer => {
    if (timer.key !== action.key) return timer;
    switch (action.type) {
      case 'pause': {
        if (timer.status !== 'running') return timer;
        const remainingMs = remainingMilliseconds(timer, now);
        return { ...timer, status: remainingMs > 0 ? 'paused' : 'finished', remainingMs, endsAt: null };
      }
      case 'resume':
        return timer.status === 'paused' ? { ...timer, status: 'running', endsAt: now + timer.remainingMs } : timer;
      case 'reset':
        return { ...timer, status: 'idle', remainingMs: timer.durationSeconds * 1000, endsAt: null, notified: false };
      case 'notified':
        return { ...timer, notified: true };
      default:
        return timer;
    }
  }) };
}
