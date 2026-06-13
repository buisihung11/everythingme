import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'EverythingMe',
    },
    links: [
      {
        text: 'Blog',
        url: '/blog',
      },
      {
        text: 'About',
        url: '/about',
      },
    ],
  };
}
