/**
 * worker-loop.ts
 * Generic long-poll activity worker loop.
 * Continuously polls SFN for work, calls the handler, and reports back.
 */

import {
  GetActivityTaskCommand,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from '@aws-sdk/client-sfn';
import { sfn } from '../sfn-client.js';
import { applyStepDelay, sleep } from '../step-delay.js';

type WorkerHandler<I, O> = (input: I, taskToken: string) => Promise<O>;

export function startWorkerLoop<I, O>(
  activityArn: string,
  name: string,
  handler: WorkerHandler<I, O>,
  options: { keepTokenForManualCompletion?: boolean } = {},
): void {
  let running = true;

  process.on('SIGTERM', () => {
    running = false;
  });

  const poll = async () => {
    while (running) {
      try {
        const res = await sfn.send(
          new GetActivityTaskCommand({
            activityArn,
            workerName: `${name}-worker`,
          }),
        );

        if (!res.taskToken) {
          // No task available, loop immediately
          continue;
        }

        const input = JSON.parse(res.input ?? '{}') as I;

        try {
          // Pause while the activity is active so the dashboard can show it.
          await applyStepDelay(name);
          const output = await handler(input, res.taskToken);

          // Some workers (offer-driver) intentionally hold the token.
          // They return undefined to signal they're done but won't SendTaskSuccess here.
          if (!options.keepTokenForManualCompletion) {
            await sfn.send(
              new SendTaskSuccessCommand({
                taskToken: res.taskToken,
                output: JSON.stringify(output ?? {}),
              }),
            );
          }
        } catch (err: unknown) {
          const error = err instanceof Error ? err.message : 'WorkerError';
          console.error(`[${name}] handler error:`, err);
          try {
            await sfn.send(
              new SendTaskFailureCommand({
                taskToken: res.taskToken,
                error,
                cause: error,
              }),
            );
          } catch {
            // ignore
          }
        }
      } catch (err) {
        // SFN poll error – back off briefly
        console.error(`[${name}] poll error:`, err);
        await sleep(2000);
      }
    }
  };

  void poll();
  console.log(`  ↩  Worker started: ${name} (${activityArn})`);
}
