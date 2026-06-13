import { defineConfig, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/blog',
  docs: {
    schema: frontmatterSchema.extend({
      type: z.enum(['personal', 'technical']).optional(),
      category: z.string().optional(),
      date: z.string().optional(),
      readTime: z.number().optional(),
      thumbnail: z.string().optional(),
    }),
  },
});

export default defineConfig();
