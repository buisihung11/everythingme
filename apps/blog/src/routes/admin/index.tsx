import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { UnsplashPhoto } from 'react-unsplash'
import { UnsplashPhotoPicker } from '@/components/UnsplashPhotoPicker'
import { MoodSearchChips } from '@/components/unsplash/MoodSearchChips'
import { SelectedPhotoPanel } from '@/components/unsplash/SelectedPhotoPanel'

export const Route = createFileRoute('/admin/')({
  component: CoverStudioPage,
})

const MAX_SHORTLIST = 6

function CoverStudioPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(
    null,
  )
  const [shortlist, setShortlist] = useState<UnsplashPhoto[]>([])
  const [previewMode, setPreviewMode] = useState<'personal' | 'technical'>(
    'personal',
  )

  const shortlistedIds = useMemo(
    () => new Set(shortlist.map((photo) => photo.id)),
    [shortlist],
  )

  function toggleShortlist(photo: UnsplashPhoto) {
    setShortlist((current) => {
      const exists = current.some((item) => item.id === photo.id)
      if (exists) {
        return current.filter((item) => item.id !== photo.id)
      }
      if (current.length >= MAX_SHORTLIST) {
        return [...current.slice(1), photo]
      }
      return [...current, photo]
    })
  }

  function handleSelectPhoto(photo: UnsplashPhoto) {
    setSelectedPhoto(photo)
  }

  function handleHeartToggle(photo: UnsplashPhoto) {
    const isSaved = shortlistedIds.has(photo.id)

    if (!isSaved) {
      setSelectedPhoto(photo)
      toggleShortlist(photo)
      return
    }

    toggleShortlist(photo)
  }

  return (
    <main className="cover-studio-page">
      <section className="cover-studio-hero island-shell rise-in">
        <div className="cover-studio-hero-copy">
          <p className="island-kicker mb-2">Cover studio</p>
          <h1 className="display-title cover-studio-title">
            Find your next hero image
          </h1>
          <p className="cover-studio-lede">
            Search Unsplash, shortlist favorites, preview how they look on your
            personal or technical blog, then copy the MDX snippet straight into
            a draft.
          </p>
        </div>

        <div className="cover-studio-stats" aria-label="Studio stats">
          <div className="cover-studio-stat">
            <span className="cover-studio-stat-value">{shortlist.length}</span>
            <span className="cover-studio-stat-label">Saved</span>
          </div>
          <div className="cover-studio-stat">
            <span className="cover-studio-stat-value">
              {selectedPhoto ? '1' : '0'}
            </span>
            <span className="cover-studio-stat-label">Active</span>
          </div>
          <div className="cover-studio-stat">
            <span className="cover-studio-stat-value">{MAX_SHORTLIST}</span>
            <span className="cover-studio-stat-label">Max saved</span>
          </div>
        </div>
      </section>

      <MoodSearchChips activeQuery={searchQuery} onSelect={setSearchQuery} />

      <div className="cover-studio-layout">
        <div className="cover-studio-main">
          <UnsplashPhotoPicker
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSelect={handleSelectPhoto}
            selectedId={selectedPhoto?.id ?? null}
            onToggleShortlist={handleHeartToggle}
            shortlistedIds={shortlistedIds}
            shortlist={shortlist}
            onShortlistSelect={handleSelectPhoto}
            onShortlistRemove={(photoId) => {
              setShortlist((current) =>
                current.filter((photo) => photo.id !== photoId),
              )
            }}
          />
        </div>

        <SelectedPhotoPanel
          photo={selectedPhoto}
          previewMode={previewMode}
          onPreviewModeChange={setPreviewMode}
          isShortlisted={
            selectedPhoto ? shortlistedIds.has(selectedPhoto.id) : false
          }
          onToggleShortlist={() => {
            if (selectedPhoto) {
              handleHeartToggle(selectedPhoto)
            }
          }}
        />
      </div>
    </main>
  )
}
