import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  Badge,
  Label,
  Slider,
} from '@everythingme/ui';
import { MATCHING_URL, fetchJson } from '../lib/api';

const DEFAULT_DELAY_MS = 1500;
const MIN_DELAY_MS = 0;
const MAX_DELAY_MS = 5000;
const STEP_MS = 250;

interface StepDelayConfig {
  stepDelayMs: number;
  minMs: number;
  maxMs: number;
}

function formatDelay(ms: number): string {
  if (ms === 0) return 'Off';
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  return Number.isInteger(seconds) ? `${seconds} s` : `${seconds.toFixed(2)} s`;
}

export function StepDelayControl() {
  const [delayMs, setDelayMs] = useState(DEFAULT_DELAY_MS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchJson<StepDelayConfig>(`${MATCHING_URL}/config/step-delay`)
      .then((config) => {
        if (!cancelled) setDelayMs(config.stepDelayMs);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load step delay. Matching Service may be offline.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistDelay = useCallback(async (nextMs: number) => {
    setSaving(true);
    setError(null);
    try {
      const config = await fetchJson<StepDelayConfig>(
        `${MATCHING_URL}/config/step-delay`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ stepDelayMs: nextMs }),
        },
      );
      setDelayMs(config.stepDelayMs);
    } catch {
      setError('Could not update step delay.');
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="step-delay">Step delay</Label>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Pause between workflow steps.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 font-mono font-medium">
          {formatDelay(delayMs)}
        </Badge>
      </div>

      <Slider
        id="step-delay"
        min={MIN_DELAY_MS}
        max={MAX_DELAY_MS}
        step={STEP_MS}
        value={[delayMs]}
        disabled={saving}
        aria-label="Step delay between activities"
        onValueChange={(value) => setDelayMs(value[0] ?? DEFAULT_DELAY_MS)}
        onValueCommit={(value) => {
          void persistDelay(value[0] ?? DEFAULT_DELAY_MS);
        }}
      />

      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Off</span>
        <span>5 s</span>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
