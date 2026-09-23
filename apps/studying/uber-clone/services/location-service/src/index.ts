import { serve } from '@hono/node-server';
import { locationApp } from './app.js';

const PORT = parseInt(process.env.LOCATION_PORT ?? '4403', 10);

serve({ fetch: locationApp.fetch, port: PORT }, (info) => {
  console.log(`🗺️  Location Service running on http://localhost:${info.port}`);
});
