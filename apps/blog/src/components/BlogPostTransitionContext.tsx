import { createContext, useContext, type ReactNode } from 'react'

const BlogPostTransitionContext = createContext<string | null>(null)

export function BlogPostTransitionProvider({
  url,
  children,
}: {
  url: string
  children: ReactNode
}) {
  return (
    <BlogPostTransitionContext.Provider value={url}>
      {children}
    </BlogPostTransitionContext.Provider>
  )
}

export function useBlogPostUrl() {
  return useContext(BlogPostTransitionContext)
}
