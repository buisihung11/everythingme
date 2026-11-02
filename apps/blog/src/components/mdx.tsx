import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ImgHTMLAttributes } from 'react'
import { Image } from '@/components/mdx/Image'
import * as VueStudy from '@/components/mdx/vue-study'

function PersonalImage({
  alt,
  src,
}: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null

  return <Image src={src} alt={alt ?? ''} />
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...VueStudy,
    Image,
    img: PersonalImage,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
