import { MOOD_SEARCHES } from '@/lib/unsplash-utils'

interface MoodSearchChipsProps {
  activeQuery: string
  onSelect: (query: string) => void
}

export function MoodSearchChips({ activeQuery, onSelect }: MoodSearchChipsProps) {
  return (
    <div className="cover-studio-moods">
      <p className="cover-studio-moods-label">Try a mood</p>
      <div className="cover-studio-moods-row">
        {MOOD_SEARCHES.map((mood) => {
          const isActive = activeQuery === mood.query

          return (
            <button
              key={mood.query}
              type="button"
              className={`cover-studio-mood-chip${isActive ? ' is-active' : ''}`}
              onClick={() => onSelect(mood.query)}
              aria-pressed={isActive}
            >
              <span aria-hidden>{mood.emoji}</span>
              {mood.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
