import type { UnsplashPhoto } from 'react-unsplash'
import { getPhotoAlt } from '@/lib/unsplash-utils'

interface PhotoShortlistProps {
  photos: UnsplashPhoto[]
  activeId: string | null
  onSelect: (photo: UnsplashPhoto) => void
  onRemove: (photoId: string) => void
}

export function PhotoShortlist({
  photos,
  activeId,
  onSelect,
  onRemove,
}: PhotoShortlistProps) {
  return (
    <div className="cover-studio-shortlist">
      <div className="cover-studio-shortlist-header">
        <p className="cover-studio-shortlist-title">Shortlist</p>
        <span className="cover-studio-shortlist-count">{photos.length}/6</span>
      </div>

      {photos.length === 0 ? (
        <p className="cover-studio-shortlist-hint">
          Click ♡ on any photo to save it here instantly.
        </p>
      ) : (
        <div className="cover-studio-shortlist-row">
          {photos.map((photo) => {
            const isActive = photo.id === activeId

            return (
              <div
                key={photo.id}
                className={`cover-studio-shortlist-item${isActive ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  className="cover-studio-shortlist-thumb"
                  onClick={() => onSelect(photo)}
                  aria-label={`Select ${getPhotoAlt(photo)}`}
                >
                  <img src={photo.urls.thumb} alt={getPhotoAlt(photo)} />
                </button>
                <button
                  type="button"
                  className="cover-studio-shortlist-remove"
                  onClick={() => onRemove(photo.id)}
                  aria-label="Remove from shortlist"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
