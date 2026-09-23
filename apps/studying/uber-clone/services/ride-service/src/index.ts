import { serve } from '@hono/node-server';
import { rideApp, startReconciler } from './app.js';

const PORT = parseInt(process.env.RIDE_PORT ?? '4401', 10);

serve({ fetch: rideApp.fetch, port: PORT }, (info) => {
  console.log(`🚗 Ride Service running on http://localhost:${info.port}`);
  startReconciler();
});
