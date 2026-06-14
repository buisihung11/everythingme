import { useInfiniteQuery } from '@tanstack/react-query'
import ReactUnsplash from 'react-unsplash'
import type { UnsplashPhoto } from 'react-unsplash'
import { fetchUnsplashPhotos } from '@/lib/unsplash'
import { PhotoShortlist } from '@/components/unsplash/PhotoShortlist'

interface UnsplashPhotoPickerProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSelect?: (photo: UnsplashPhoto) => void
  selectedId?: string | null
  onToggleShortlist?: (photo: UnsplashPhoto) => void
  shortlistedIds?: Set<string>
  shortlist?: UnsplashPhoto[]
  onShortlistSelect?: (photo: UnsplashPhoto) => void
  onShortlistRemove?: (photoId: string) => void
}

export function UnsplashPhotoPicker({
  searchQuery,
  onSearchQueryChange,
  onSelect,
  selectedId,
  onToggleShortlist,
  shortlistedIds,
  shortlist = [],
  onShortlistSelect,
  onShortlistRemove,
}: UnsplashPhotoPickerProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['unsplashPhotos', searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      fetchUnsplashPhotos({ query: searchQuery, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1
      return nextPage <= lastPage.total_pages ? nextPage : undefined
    },
    initialPageParam: 1,
    enabled: !!searchQuery,
  })

  const photos = data?.pages.flatMap((page) => page.results) ?? []

  return (
    <div className="cover-studio-picker-shell">
      {isError ? (
        <p className="cover-studio-picker-error demo-alert demo-alert-danger">
          Could not load photos. Check that UNSPLASH_ACCESS_KEY is set in your
          environment.
        </p>
      ) : null}

      <div className="cover-studio-picker-body">
        <ReactUnsplash
          key={searchQuery || 'empty'}
          images={photos}
          loading={isLoading || isFetchingNextPage}
          initValue={searchQuery}
          onCommit={onSearchQueryChange}
          hasMore={hasNextPage}
          handleLoadMore={() => {
            void fetchNextPage()
          }}
          loadMode="scroll"
          onSelect={(photo) => onSelect?.(photo)}
          gap={10}
          autoFocus
          searchPlaceholder="Search Unsplash — try “misty forest” or “neon city”..."
          className="cover-studio-unsplash"
          classNames={{
            searchInput: 'cover-studio-search-input',
            imageGrid: 'cover-studio-image-grid',
            imageItem: 'cover-studio-image-item',
            imageOverlay: 'cover-studio-image-overlay',
            loadingBar: 'cover-studio-loading-bar',
            emptyState: 'cover-studio-empty-state',
          }}
          slots={{
            emptyState: (
              <div className="cover-studio-empty">
                <p className="cover-studio-empty-title">Start with a mood</p>
                <p className="cover-studio-empty-copy">
                  Pick a chip above or type a search to explore millions of
                  Unsplash photos.
                </p>
              </div>
            ),
            noResults: (
              <div className="cover-studio-empty">
                <p className="cover-studio-empty-title">No matches yet</p>
                <p className="cover-studio-empty-copy">
                  Try a broader term like “landscape”, “portrait”, or “texture”.
                </p>
              </div>
            ),
            imageOverlay: (photo) => {
              const isSelected = photo.id === selectedId
              const isSaved = shortlistedIds?.has(photo.id)

              return (
                <div className="cover-studio-overlay-content">
                  {isSelected ? (
                    <span className="cover-studio-overlay-badge">Selected</span>
                  ) : null}
                  {onToggleShortlist ? (
                    <button
                      type="button"
                      className={`cover-studio-overlay-heart${isSaved ? ' is-active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleShortlist(photo)
                      }}
                      aria-label={
                        isSaved ? 'Remove from shortlist' : 'Add to shortlist'
                      }
                    >
                      {isSaved ? '♥' : '♡'}
                    </button>
                  ) : null}
                </div>
              )
            },
          }}
        />
      </div>

      <PhotoShortlist
        photos={shortlist}
        activeId={selectedId ?? null}
        onSelect={(photo) => onShortlistSelect?.(photo)}
        onRemove={(photoId) => onShortlistRemove?.(photoId)}
      />
    </div>
  )
}
