import type { CSSProperties } from 'react'
import type { UnsplashPhoto } from 'react-unsplash'
import { getPhotoAlt } from '@/lib/unsplash-utils'

interface BlogPreviewFrameProps {
  photo: UnsplashPhoto
  mode: 'personal' | 'technical'
}

export function BlogPreviewFrame({ photo, mode }: BlogPreviewFrameProps) {
  const alt = getPhotoAlt(photo)
  const accent =
    photo.color ??
    (mode === 'personal' ? '#c2793a' : '#2563eb')

  return (
    <div
      className={`cover-studio-preview cover-studio-preview-${mode}`}
      data-blog-mode={mode}
      style={{ '--preview-accent': accent } as CSSProperties}
    >
      <div className="cover-studio-preview-chrome">
        <span className="cover-studio-preview-dot" />
        <span className="cover-studio-preview-dot" />
        <span className="cover-studio-preview-dot" />
        <span className="cover-studio-preview-label">
          {mode === 'personal' ? 'Personal blog' : 'Technical blog'}
        </span>
      </div>

      <div className="cover-studio-preview-body">
        <div className="cover-studio-preview-hero">
          <img src={photo.urls.small} alt={alt} />
        </div>

        <div className="cover-studio-preview-copy">
          <span className="cover-studio-preview-tag">Draft post</span>
          <h3 className="cover-studio-preview-title">
            Your next story starts here
          </h3>
          <p className="cover-studio-preview-excerpt">
            A quick peek at how this cover could frame your opening paragraph
            and pull readers in.
          </p>
        </div>
      </div>
    </div>
  )
}
