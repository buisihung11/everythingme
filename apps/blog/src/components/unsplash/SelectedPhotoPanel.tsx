import { useState, type CSSProperties } from 'react'
import type { UnsplashPhoto } from 'react-unsplash'
import {
  buildMdxImageSnippet,
  buildPostSnippets,
  buildThumbnailFrontmatter,
  copyText,
  formatPhotoDimensions,
  getPhotoAlt,
} from '@/lib/unsplash-utils'
import { BlogPreviewFrame } from './BlogPreviewFrame'

interface SelectedPhotoPanelProps {
  photo: UnsplashPhoto | null
  previewMode: 'personal' | 'technical'
  onPreviewModeChange: (mode: 'personal' | 'technical') => void
  isShortlisted: boolean
  onToggleShortlist: () => void
}

type CopyTarget = 'thumbnail' | 'image' | 'all'
type CopyState = 'idle' | CopyTarget | 'failed'

export function SelectedPhotoPanel({
  photo,
  previewMode,
  onPreviewModeChange,
  isShortlisted,
  onToggleShortlist,
}: SelectedPhotoPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')

  if (!photo) {
    return (
      <aside className="cover-studio-panel cover-studio-panel-empty">
        <div className="cover-studio-panel-placeholder">
          <div className="cover-studio-panel-placeholder-icon" aria-hidden>
            🖼️
          </div>
          <p className="text-sm font-semibold text-[var(--sea-ink)]">
            Your canvas is empty
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--sea-ink-soft)]">
            Search a mood, pick a photo, and watch a live blog preview appear
            here with a ready-to-paste MDX snippet.
          </p>
        </div>
      </aside>
    )
  }

  const alt = getPhotoAlt(photo)
  const thumbnailSnippet = buildThumbnailFrontmatter(photo)
  const imageSnippet = buildMdxImageSnippet(photo)
  const accent = photo.color ?? 'var(--lagoon)'

  async function handleCopy(target: CopyTarget, text: string) {
    const ok = await copyText(text)
    setCopyState(ok ? target : 'failed')
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  return (
    <aside
      className="cover-studio-panel rise-in"
      style={{ '--panel-accent': accent } as CSSProperties}
    >
      <div className="cover-studio-panel-accent" aria-hidden />

      <div className="cover-studio-panel-scroll">
        <div className="cover-studio-panel-header">
          <div>
            <p className="cover-studio-panel-kicker">Selected cover</p>
            <p className="cover-studio-panel-meta">
              {formatPhotoDimensions(photo)} ·{' '}
              {photo.likes?.toLocaleString() ?? 0} likes
            </p>
          </div>
          <button
            type="button"
            className={`cover-studio-heart${isShortlisted ? ' is-active' : ''}`}
            onClick={onToggleShortlist}
            aria-label={
              isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'
            }
            aria-pressed={isShortlisted}
          >
            {isShortlisted ? '♥' : '♡'}
          </button>
        </div>

        <div className="cover-studio-panel-preview">
          <img src={photo.urls.small} alt={alt} />
        </div>

        <p className="cover-studio-panel-credit">
          Photo by{' '}
          <a
            href={`${photo.user.links.html}?utm_source=everythingme&utm_medium=referral`}
            target="_blank"
            rel="noreferrer"
          >
            {photo.user.name}
          </a>{' '}
          on Unsplash
        </p>

        <div className="cover-studio-preview-toggle">
          <button
            type="button"
            className={previewMode === 'personal' ? 'is-active' : ''}
            onClick={() => onPreviewModeChange('personal')}
          >
            Personal
          </button>
          <button
            type="button"
            className={previewMode === 'technical' ? 'is-active' : ''}
            onClick={() => onPreviewModeChange('technical')}
          >
            Technical
          </button>
        </div>

        <BlogPreviewFrame photo={photo} mode={previewMode} />

        <div className="cover-studio-snippet">
          <div className="cover-studio-snippet-header">
            <p>Post frontmatter</p>
            <button
              type="button"
              className="demo-button demo-button-secondary"
              onClick={() => handleCopy('thumbnail', thumbnailSnippet)}
            >
              {copyState === 'thumbnail'
                ? 'Copied!'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy thumbnail'}
            </button>
          </div>
          <pre className="cover-studio-snippet-code">{thumbnailSnippet}</pre>
          <p className="cover-studio-snippet-note">
            Paste into your MDX frontmatter for card + hero thumbnails.
          </p>
        </div>

        <div className="cover-studio-snippet">
          <div className="cover-studio-snippet-header">
            <p>In-article image</p>
            <button
              type="button"
              className="demo-button demo-button-secondary"
              onClick={() => handleCopy('image', imageSnippet)}
            >
              {copyState === 'image'
                ? 'Copied!'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy image'}
            </button>
          </div>
          <pre className="cover-studio-snippet-code">{imageSnippet}</pre>
        </div>

        <button
          type="button"
          className="demo-button cover-studio-snippet-all"
          onClick={() => handleCopy('all', buildPostSnippets(photo))}
        >
          {copyState === 'all'
            ? 'Copied both snippets!'
            : copyState === 'failed'
              ? 'Copy failed'
              : 'Copy thumbnail + image'}
        </button>
      </div>
    </aside>
  )
}
