export interface ImageProps {
  src: string
  alt: string
  caption?: string
}

export function Image({ src, alt, caption }: ImageProps) {
  const label = caption ?? alt

  return (
    <figure className="personal-image my-8">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-[1.25rem] object-cover"
        loading="lazy"
      />
      {label ? (
        <figcaption className="mt-3 text-center text-sm text-[var(--blog-ink-soft,var(--sea-ink-soft))]">
          {label}
        </figcaption>
      ) : null}
    </figure>
  )
}
