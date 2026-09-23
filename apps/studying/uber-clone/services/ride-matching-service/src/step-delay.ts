/**
 * step-delay.ts
 * In-memory study setting that slows activity workers so each Step Functions
 * state stays visible on the dashboard long enough to follow.
 */

const MIN_MS = 0;
const MAX_MS = 5000;
const DEFAULT_MS = 1500;

let stepDelayMs = DEFAULT_MS;

export function getStepDelayMs(): number {
  return stepDelayMs;
}

export function setStepDelayMs(ms: number): number {
  if (!Number.isFinite(ms)) {
    throw new Error('stepDelayMs must be a finite number');
  }
  stepDelayMs = Math.min(MAX_MS, Math.max(MIN_MS, Math.round(ms)));
  return stepDelayMs;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function applyStepDelay(activityName: string): Promise<void> {
  const ms = getStepDelayMs();
  if (ms <= 0) return;
  console.log(`[${activityName}] study delay ${ms}ms`);
  await sleep(ms);
}

export const STEP_DELAY_BOUNDS = {
  minMs: MIN_MS,
  maxMs: MAX_MS,
  defaultMs: DEFAULT_MS,
} as const;
