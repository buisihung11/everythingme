import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ImgHTMLAttributes } from 'react'
import { Image } from '@/components/mdx/Image'

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
    Image,
    img: PersonalImage,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
