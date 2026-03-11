/**
 * Backend Warmup Service (呼吸访问)
 * 
 * Keeps the backend server warm by periodically pinging the health endpoint.
 * Prevents cold start delays on serverless/container platforms like Zeabur.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bbv2.zeabur.app/api';
const HEALTH_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/health';

// Ping interval: 4 minutes (keep below typical 5-min idle timeout)
const WARMUP_INTERVAL_MS = 4 * 60 * 1000;
// Ping timeout: 15 seconds per attempt
const PING_TIMEOUT_MS = 15000;
// Max retries for initial wake-up
const MAX_WAKE_RETRIES = 8;
// Delay between retries (escalating)
const RETRY_BASE_DELAY_MS = 2000;

export type WarmupStatus = 'idle' | 'pinging' | 'online' | 'waking' | 'error';

export interface WarmupState {
  status: WarmupStatus;
  latencyMs: number | null;
  retryCount: number;
  lastPingAt: number | null;
  errorMessage: string | null;
}

type WarmupListener = (state: WarmupState) => void;

let currentState: WarmupState = {
  status: 'idle',
  latencyMs: null,
  retryCount: 0,
  lastPingAt: null,
  errorMessage: null,
};

let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<WarmupListener>();

function notify() {
  listeners.forEach(fn => fn({ ...currentState }));
}

function setState(partial: Partial<WarmupState>) {
  currentState = { ...currentState, ...partial };
  notify();
}

/**
 * Single health ping with timeout
 */
async function ping(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const res = await fetch(HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: res.ok, latencyMs };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs };
  }
}

/**
 * Wake up the backend server with retries.
 * Returns true if the server is online.
 */
export async function wakeUpServer(
  onProgress?: (state: WarmupState) => void
): Promise<boolean> {
  setState({ status: 'waking', retryCount: 0, errorMessage: null });

  for (let i = 0; i <= MAX_WAKE_RETRIES; i++) {
    setState({ status: 'pinging', retryCount: i });

    const result = await ping();

    if (result.ok) {
      setState({
        status: 'online',
        latencyMs: result.latencyMs,
        lastPingAt: Date.now(),
        retryCount: i,
        errorMessage: null,
      });
      // Start background keep-alive
      startKeepAlive();
      return true;
    }

    // Not the last attempt - wait and retry
    if (i < MAX_WAKE_RETRIES) {
      setState({ status: 'waking', retryCount: i + 1 });
      const delay = Math.min(RETRY_BASE_DELAY_MS * (1 + i * 0.5), 8000);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  setState({
    status: 'error',
    errorMessage: 'Server unreachable after multiple attempts',
    retryCount: MAX_WAKE_RETRIES,
  });
  return false;
}

/**
 * Background keep-alive: periodic health pings
 */
export function startKeepAlive() {
  if (intervalId) return; // Already running

  intervalId = setInterval(async () => {
    const result = await ping();
    if (result.ok) {
      setState({
        status: 'online',
        latencyMs: result.latencyMs,
        lastPingAt: Date.now(),
        errorMessage: null,
      });
    } else {
      // Server went cold, try to wake it
      setState({ status: 'waking', errorMessage: null });
      await wakeUpServer();
    }
  }, WARMUP_INTERVAL_MS);

  // Also handle visibility change: ping when user returns to tab
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
}

async function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // User came back, check if server is still warm
    const timeSinceLastPing = currentState.lastPingAt
      ? Date.now() - currentState.lastPingAt
      : Infinity;

    // If last ping was more than 3 minutes ago, re-ping
    if (timeSinceLastPing > 3 * 60 * 1000) {
      const result = await ping();
      if (result.ok) {
        setState({
          status: 'online',
          latencyMs: result.latencyMs,
          lastPingAt: Date.now(),
        });
      } else {
        // Silently try to wake up in background
        wakeUpServer();
      }
    }
  }
}

/**
 * Stop background keep-alive
 */
export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
}

/**
 * Subscribe to warmup state changes
 */
export function onWarmupStateChange(listener: WarmupListener): () => void {
  listeners.add(listener);
  // Emit current state immediately
  listener({ ...currentState });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get current warmup state
 */
export function getWarmupState(): WarmupState {
  return { ...currentState };
}
