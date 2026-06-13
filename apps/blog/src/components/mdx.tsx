import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ImgHTMLAttributes } from 'react'

function PersonalImage({
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <figure className="personal-image my-8">
      <img
        {...props}
        alt={alt ?? ''}
        className="w-full rounded-[1.25rem] object-cover"
        loading="lazy"
      />
      {alt ? (
        <figcaption className="mt-3 text-center text-sm text-[var(--blog-ink-soft,var(--sea-ink-soft))]">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: PersonalImage,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
