export interface RootHeadMeta {
  charSet?: string
  name?: string
  content?: string
  title?: string
}

export interface RootHeadLink {
  rel: string
  href: string
}

export interface RootHead {
  meta: RootHeadMeta[]
  links: RootHeadLink[]
}

export function getRootHead(stylesheetHref: string): RootHead {
  return {
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'everything-blog',
      },
      {
        name: 'theme-color',
        content: '#000000',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'EverythingMe',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: stylesheetHref,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
      },
    ],
  }
}
