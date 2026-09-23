import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import {
  StartExecutionCommand,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
  GetExecutionHistoryCommand,
} from '@aws-sdk/client-sfn';
import { z } from 'zod';
import { StateMachineInputSchema, RespondToOfferSchema } from '@studying/uber-clone/shared';
import { sfn, sfnConfig } from './sfn-client.js';
import {
  getStepDelayMs,
  setStepDelayMs,
  STEP_DELAY_BOUNDS,
} from './step-delay.js';
import { getToken, deleteToken } from './token-store.js';

export const matchingApp = new Hono();
matchingApp.use('*', cors());

const StepDelaySchema = z.object({
  stepDelayMs: z.number().min(STEP_DELAY_BOUNDS.minMs).max(STEP_DELAY_BOUNDS.maxMs),
});

// GET /config/step-delay – current study playback delay
matchingApp.get('/config/step-delay', (c) =>
  c.json({
    stepDelayMs: getStepDelayMs(),
    ...STEP_DELAY_BOUNDS,
  }),
);

// PUT /config/step-delay – slow activity workers for easier observation
matchingApp.put('/config/step-delay', zValidator('json', StepDelaySchema), (c) => {
  const { stepDelayMs } = c.req.valid('json');
  const applied = setStepDelayMs(stepDelayMs);
  console.log(`[matching] step delay set to ${applied}ms`);
  return c.json({
    stepDelayMs: applied,
    ...STEP_DELAY_BOUNDS,
  });
});

// POST /matches – start a new execution (idempotent via execution name = rideId)
matchingApp.post(
  '/matches',
  zValidator('json', StateMachineInputSchema),
  async (c) => {
    const input = c.req.valid('json');
    const { rideId } = input;

    try {
      const res = await sfn.send(
        new StartExecutionCommand({
          stateMachineArn: sfnConfig.stateMachineArn,
          name: rideId,
          input: JSON.stringify(input),
        }),
      );
      console.log(
        `[matching] Started execution for ride=${rideId}: ${res.executionArn}`,
      );
      return c.json({ executionArn: res.executionArn }, 201);
    } catch (err: unknown) {
      const name = err instanceof Error ? err.constructor.name : '';
      // ExecutionAlreadyExists – idempotent
      if (name === 'ExecutionAlreadyExists' || String(err).includes('ExecutionAlreadyExists')) {
        console.log(`[matching] Execution already exists for ride=${rideId}`);
        return c.json({ executionArn: null, alreadyRunning: true }, 200);
      }
      console.error('[matching] StartExecution error:', err);
      return c.json({ error: 'Failed to start execution' }, 500);
    }
  },
);

// POST /matches/:rideId/offers/:driverId/respond
matchingApp.post(
  '/matches/:rideId/offers/:driverId/respond',
  zValidator('json', RespondToOfferSchema),
  async (c) => {
    const { rideId, driverId } = c.req.param();
    const { accept } = c.req.valid('json');

    const token = await getToken(rideId, driverId);
    if (!token) {
      // Token expired or already consumed – likely timed out
      return c.json(
        { error: 'TaskTimedOut', message: 'Offer has already expired' },
        422,
      );
    }

    try {
      if (accept) {
        await sfn.send(
          new SendTaskSuccessCommand({
            taskToken: token,
            output: JSON.stringify({ accepted: true, driverId }),
          }),
        );
        console.log(`[matching] Driver ${driverId} accepted ride=${rideId}`);
      } else {
        await sfn.send(
          new SendTaskFailureCommand({
            taskToken: token,
            error: 'DriverDeclined',
            cause: `Driver ${driverId} declined the offer`,
          }),
        );
        console.log(`[matching] Driver ${driverId} declined ride=${rideId}`);
      }
      await deleteToken(rideId, driverId);
      return c.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : '';
      const type = (err as { __type?: string }).__type ?? '';
      const isTimedOut =
        name === 'TaskTimedOut' ||
        type.includes('TaskTimedOut') ||
        msg.includes('TaskTimedOut') ||
        msg.includes('Task Timed Out');
      if (isTimedOut || msg.includes('invalid')) {
        await deleteToken(rideId, driverId);
        return c.json({ error: 'TaskTimedOut', message: 'Too late' }, 422);
      }
      console.error('[matching] respond error:', err);
      return c.json({ error: 'Internal error' }, 500);
    }
  },
);

// GET /matches/:rideId/history – proxy to SFN GetExecutionHistory
matchingApp.get('/matches/:rideId/history', async (c) => {
  const { rideId } = c.req.param();
  const executionArn = `${sfnConfig.stateMachineArn.replace(
    ':stateMachine:',
    ':execution:',
  )}:${rideId}`;

  try {
    const res = await sfn.send(
      new GetExecutionHistoryCommand({
        executionArn,
        includeExecutionData: true,
        maxResults: 100,
      }),
    );
    return c.json({ events: res.events ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('does not exist') || msg.includes('ExecutionDoesNotExist')) {
      return c.json({ events: [] });
    }
    console.error('[matching] GetExecutionHistory error:', err);
    return c.json({ error: 'Failed to get history' }, 500);
  }
});

// GET /health
matchingApp.get('/health', (c) => c.json({ ok: true }));
