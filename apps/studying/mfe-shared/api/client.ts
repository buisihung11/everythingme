import {
  createApiClient as createCoreApiClient,
  telemetry,
  logging,
  errorNormalization,
} from '@everythingme/api';
import type { ApiSpan, ApiTracer, ApiLogger } from '@everythingme/api';
import { getEventBus } from '../event-bus';

const SOURCE = 'mfe-shared/api';

function makeBusTracer(): ApiTracer {
  return {
    startSpan(name: string): ApiSpan {
      getEventBus().publish(
        'api:event',
        { kind: 'span:start', label: name },
        SOURCE,
      );
      const start = Date.now();
      return {
        setStatus() {},
        recordException() {},
        end() {
          getEventBus().publish(
            'api:event',
            { kind: 'span:end', label: name, durationMs: Date.now() - start },
            SOURCE,
          );
        },
      };
    },
  };
}

function makeBusLogger(): ApiLogger {
  return {
    info(message, data) {
      getEventBus().publish(
        'api:event',
        {
          kind: 'log:info',
          label: message,
          durationMs: data?.durationMs as number | undefined,
        },
        SOURCE,
      );
    },
    error(message, data) {
      getEventBus().publish(
        'api:event',
        {
          kind: 'log:error',
          label: message,
          error: data?.message as string | undefined,
          durationMs: data?.durationMs as number | undefined,
        },
        SOURCE,
      );
    },
  };
}

/**
 * Shared API client preconfigured with telemetry, logging, and error
 * normalization. All pipeline activity is published onto __MFE_EVENT_BUS__
 * so any remote can observe it.
 */
export const api = createCoreApiClient()
  .use(telemetry({ tracer: makeBusTracer() }))
  .use(logging({ logger: makeBusLogger() }))
  .use(errorNormalization());
