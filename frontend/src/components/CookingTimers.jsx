import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatTimer, MAX_TIMER_SECONDS, remainingMilliseconds, restoreTimers, TIMER_STORAGE_KEY, timerReducer } from '../services/cookingTimers.mjs';

const TimerContext = createContext(null);

function initialTimers() {
  const now = Date.now();
  try {
    return { timers: restoreTimers(sessionStorage.getItem(TIMER_STORAGE_KEY), now), now };
  } catch { return { timers: [], now }; }
}

function soundAlarm(audio) {
  if (!audio || audio.state !== 'running') return;
  for (let i = 0; i < 3; i++) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + i * 0.35;
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
    gain.gain.linearRampToValueAtTime(0, start + 0.2);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + 0.22);
  }
}

export function CookingTimerProvider({ children }) {
  const [{ timers, now }, dispatch] = useReducer(timerReducer, undefined, initialTimers);
  const [permission, setPermission] = useState(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const [soundReady, setSoundReady] = useState(false);
  const audio = useRef(null);
  const announced = useRef(new Set());
  const storageWarning = useRef(false);
  const hasRunning = timers.some(timer => timer.status === 'running');

  useEffect(() => {
    try {
      sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
    } catch {
      if (!storageWarning.current) {
        storageWarning.current = true;
        toast.error('Trình duyệt chưa lưu được hẹn giờ. Hãy giữ trang mở để theo dõi bộ đếm.');
      }
    }
  }, [timers]);

  useEffect(() => {
    if (!hasRunning) return;
    const tick = () => dispatch({ type: 'tick', now: Date.now() });
    const interval = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [hasRunning]);

  useEffect(() => {
    let alarm = false;
    for (const timer of timers) {
      const notificationId = `${timer.key}:${timer.runId}`;
      if (timer.status !== 'finished' || timer.notified || announced.current.has(notificationId)) continue;
      announced.current.add(notificationId);
      dispatch({ type: 'notified', key: timer.key });
      alarm = true;
      const message = `Bước ${timer.stepNumber} đã hết giờ — ${timer.recipeTitle}`;
      toast(message, { id: notificationId, icon: '⏰', duration: 10000,
        style: { background: '#fff', color: '#1b1c1c', padding: '16px', border: '1px solid #ab2e10' } });
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          const notification = new Notification('Hẹn giờ nấu ăn đã hoàn tất', { body: message, tag: notificationId });
          notification.onclick = () => { window.focus(); notification.close(); };
        } catch { /* The in-page alert remains available on browsers without desktop notifications. */ }
      }
    }
    if (alarm) {
      try { soundAlarm(audio.current); } catch { /* Keep the visual notification if audio is unavailable. */ }
    }
  }, [timers]);

  useEffect(() => () => { audio.current?.close().catch(() => {}); }, []);

  const enableSound = () => {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio.current || audio.current.state === 'closed') audio.current = new Audio();
      audio.current.resume().then(() => setSoundReady(true)).catch(() => setSoundReady(false));
    } catch { /* Countdown and visual alerts still work without audio. */ }
  };

  const start = timer => {
    enableSound();
    dispatch({ type: 'start', now: Date.now(), timer: { ...timer, runId: `${Date.now()}-${Math.random()}` } });
  };
  const control = (type, key) => {
    if (type === 'resume') enableSound();
    dispatch({ type, key, now: Date.now() });
  };
  const requestNotification = async () => {
    try { setPermission(await Notification.requestPermission()); }
    catch { setPermission('unsupported'); }
  };

  return <TimerContext.Provider value={{ timers, now, start, control, permission, requestNotification, soundReady, enableSound }}>
    {children}
    <TimerTray />
  </TimerContext.Provider>;
}

export function StepDurationFields({ value = 0, onChange, disabled = false, stepNumber }) {
  const total = Number(value) || 0;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const change = (nextMinutes, nextSeconds) => {
    const duration = nextMinutes * 60 + nextSeconds;
    if (Number.isInteger(duration) && duration >= 0 && duration <= MAX_TIMER_SECONDS && nextSeconds >= 0 && nextSeconds < 60) onChange(duration);
  };
  return <div className="flex flex-wrap gap-3 items-end">
    <label className="text-xs font-bold text-secondary flex flex-col gap-1">
      Phút
      <input type="number" min="0" max={Math.floor(MAX_TIMER_SECONDS / 60)} step="1" value={minutes} disabled={disabled}
        aria-label={`Số phút hẹn giờ bước ${stepNumber}`} onChange={event => change(Number(event.target.value), seconds)}
        className="w-24 px-3 py-2 border border-outline-variant rounded-lg bg-white text-on-surface disabled:opacity-60" />
    </label>
    <label className="text-xs font-bold text-secondary flex flex-col gap-1">
      Giây
      <input type="number" min="0" max="59" step="1" value={seconds} disabled={disabled}
        aria-label={`Số giây hẹn giờ bước ${stepNumber}`} onChange={event => change(minutes, Number(event.target.value))}
        className="w-20 px-3 py-2 border border-outline-variant rounded-lg bg-white text-on-surface disabled:opacity-60" />
    </label>
  </div>;
}

function TimerControls({ timer }) {
  const { control } = useContext(TimerContext);
  return <div className="flex flex-wrap gap-2">
    {timer.status === 'running' && <button type="button" onClick={() => control('pause', timer.key)} className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold">Tạm dừng</button>}
    {timer.status === 'paused' && <button type="button" onClick={() => control('resume', timer.key)} className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold">Tiếp tục</button>}
    {timer.status !== 'idle' && <button type="button" onClick={() => control('reset', timer.key)} className="px-3 py-2 rounded-lg border border-outline-variant text-sm font-bold">Đặt lại</button>}
  </div>;
}

export function StepTimer({ recipeId, recipeTitle, stepId, stepNumber, durationSeconds = 0 }) {
  const { timers, now, start } = useContext(TimerContext);
  const key = `${recipeId}:${stepId}`;
  const timer = timers.find(item => item.key === key);
  const [duration, setDuration] = useState(() => timer?.durationSeconds || Number(durationSeconds) || 0);
  const active = timer && ['running', 'paused'].includes(timer.status);
  const seconds = timer && timer.status !== 'idle' ? remainingMilliseconds(timer, now) / 1000 : duration;
  return <div className="mt-3 p-3 sm:p-4 rounded-xl border border-primary/20 bg-white" role="group" aria-label={`Hẹn giờ bước ${stepNumber}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <span className="font-bold text-sm text-primary flex items-center gap-2"><span className="material-symbols-outlined" aria-hidden="true">alarm</span>Hẹn giờ bước {stepNumber}</span>
      <span role="timer" aria-live="off" aria-label={`Thời gian còn lại bước ${stepNumber}`} className="text-2xl font-bold tabular-nums text-primary">{formatTimer(seconds)}</span>
    </div>
    <StepDurationFields value={duration} onChange={setDuration} disabled={Boolean(active)} stepNumber={stepNumber} />
    <div className="flex flex-wrap gap-2 mt-3">
      {!active && <button type="button" disabled={duration < 1} onClick={() => start({ key, recipeId: String(recipeId), recipeTitle, stepNumber, durationSeconds: duration })}
        className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50">{timer?.status === 'finished' ? 'Chạy lại' : 'Bắt đầu'}</button>}
      {timer && <TimerControls timer={timer} />}
    </div>
    {timer?.status === 'paused' && <p role="status" className="text-xs text-secondary mt-2">Đã tạm dừng.</p>}
    {timer?.status === 'finished' && <p role="status" className="text-sm text-primary font-bold mt-2">Đã hết giờ bước {stepNumber}!</p>}
    {!duration && <p className="text-xs text-secondary mt-2">Nhập thời gian để bắt đầu hẹn giờ.</p>}
  </div>;
}

function TimerTray() {
  const { timers, now, control, permission, requestNotification, soundReady, enableSound } = useContext(TimerContext);
  const [expanded, setExpanded] = useState(true);
  const visible = timers.filter(timer => timer.status !== 'idle');
  if (!visible.length) return null;
  const finished = visible.filter(timer => timer.status === 'finished').length;
  return <aside aria-label="Bộ hẹn giờ nấu ăn" className="fixed z-40 right-3 md:right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 w-[calc(100vw-1.5rem)] max-w-sm rounded-2xl bg-white border border-primary/30 shadow-xl overflow-hidden">
    <button type="button" aria-expanded={expanded} aria-controls="cooking-timer-list" onClick={() => setExpanded(value => !value)} className="w-full flex items-center justify-between gap-3 p-3 text-primary font-bold text-sm">
      <span className="flex items-center gap-2"><span className="material-symbols-outlined" aria-hidden="true">alarm</span>{visible.length} hẹn giờ{finished > 0 ? ` · ${finished} đã hết giờ` : ' nấu ăn'}</span>
      <span className="material-symbols-outlined" aria-hidden="true">{expanded ? 'expand_more' : 'expand_less'}</span>
    </button>
    <div id="cooking-timer-list" hidden={!expanded} className="px-3 pb-3 max-h-[60vh] overflow-y-auto">
      <ul className="space-y-3">
        {visible.map(timer => <li key={timer.key} className={`rounded-xl p-3 border ${timer.status === 'finished' ? 'border-primary bg-primary/5' : 'border-outline-variant/30'}`}>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/recipe/${timer.recipeId}`} className="text-sm font-bold hover:underline break-words">Bước {timer.stepNumber} · {timer.recipeTitle}</Link>
            <button type="button" onClick={() => control('remove', timer.key)} aria-label={`${timer.status === 'finished' ? 'Đóng' : 'Hủy'} hẹn giờ bước ${timer.stepNumber} của ${timer.recipeTitle}`} className="text-secondary p-1"><span className="material-symbols-outlined text-lg" aria-hidden="true">close</span></button>
          </div>
          <p role={timer.status === 'finished' ? 'status' : 'timer'} aria-live={timer.status === 'finished' ? 'polite' : 'off'} className="my-2 text-xl text-primary font-bold tabular-nums">
            {timer.status === 'finished' ? 'Đã hết giờ!' : formatTimer(remainingMilliseconds(timer, now) / 1000)}{timer.status === 'paused' ? ' · Tạm dừng' : ''}
          </p>
          <TimerControls timer={timer} />
        </li>)}
      </ul>
      {!soundReady && (window.AudioContext || window.webkitAudioContext) && <button type="button" onClick={enableSound} className="block mt-3 text-sm text-primary font-bold underline">Bật chuông khi hết giờ</button>}
      {permission === 'default' && <button type="button" onClick={requestNotification} className="mt-3 text-sm text-primary font-bold underline">Bật thông báo khi hết giờ</button>}
      {permission === 'granted' && <p className="mt-3 text-xs text-secondary">Đã bật thông báo của trình duyệt.</p>}
      {permission === 'denied' && <p className="mt-3 text-xs text-secondary">Thông báo trình duyệt đang bị chặn. Hết giờ sẽ hiện thông báo trong trang.</p>}
      <p className="mt-2 text-xs text-secondary">Giữ tab mở để nhận chuông và thông báo. Bộ đếm được giữ khi chuyển trang hoặc tải lại tab này.</p>
    </div>
  </aside>;
}
