import { serve } from '@hono/node-server';
import { matchingApp } from './app.js';
import { startFetchCandidatesWorker } from './workers/fetch-candidates.worker.js';
import { startOfferDriverWorker } from './workers/offer-driver.worker.js';
import { startNotifyMatchedWorker } from './workers/notify-matched.worker.js';
import { startNotifyNoDriversWorker } from './workers/notify-no-drivers.worker.js';

const PORT = parseInt(process.env.MATCHING_PORT ?? '4402', 10);

serve({ fetch: matchingApp.fetch, port: PORT }, (info) => {
  console.log(
    `🔀 Ride Matching Service running on http://localhost:${info.port}`,
  );

  // Start the four activity workers
  startFetchCandidatesWorker();
  startOfferDriverWorker();
  startNotifyMatchedWorker();
  startNotifyNoDriversWorker();

  console.log('✅ All activity workers started');
});
