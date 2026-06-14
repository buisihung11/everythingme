import type { UnsplashPhoto } from 'react-unsplash'

export function createUnsplashPhoto(
  overrides: Partial<UnsplashPhoto> = {},
): UnsplashPhoto {
  return {
    id: 'photo-1',
    width: 4000,
    height: 3000,
    alt_description: 'Mountain sunrise',
    description: 'A scenic mountain at dawn',
    urls: {
      raw: 'https://images.unsplash.com/photo-1',
      full: 'https://images.unsplash.com/photo-1?w=1920',
      regular: 'https://images.unsplash.com/photo-1?w=1080',
      small: 'https://images.unsplash.com/photo-1?w=400',
      thumb: 'https://images.unsplash.com/photo-1?w=200',
    },
    user: {
      id: 'user-1',
      username: 'photographer',
      name: 'Alex Photographer',
      links: {
        self: 'https://api.unsplash.com/users/photographer',
        html: 'https://unsplash.com/@photographer',
        photos: 'https://api.unsplash.com/users/photographer/photos',
        likes: 'https://api.unsplash.com/users/photographer/likes',
        portfolio: 'https://api.unsplash.com/users/photographer/portfolio',
      },
      profile_image: {
        small: 'https://images.unsplash.com/profile-1?w=32',
        medium: 'https://images.unsplash.com/profile-1?w=64',
        large: 'https://images.unsplash.com/profile-1?w=128',
      },
    },
    ...overrides,
  }
}
