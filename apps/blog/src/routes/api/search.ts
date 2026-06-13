import { createFileRoute } from '@tanstack/react-router';
import { blogSource } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const server = createFromSource(blogSource, {
  language: 'english',
});

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => server.GET(request),
    },
  },
});
