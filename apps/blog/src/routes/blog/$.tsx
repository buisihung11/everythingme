import { createFileRoute, notFound } from '@tanstack/react-router'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { createServerFn } from '@tanstack/react-start'
import { blogSource } from '@/lib/source'
import browserCollections from 'collections/browser'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page'
import { baseOptions } from '@/lib/layout.shared'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import { Suspense } from 'react'
import { useMDXComponents } from '@/components/mdx'
import PersonalArticleLayout, {
  personalClientLoader,
} from '@/components/PersonalArticleLayout'
import {
  filterPageTreeForType,
  getBlogTypeFromSlugs,
} from '@/lib/blog'

export const Route = createFileRoute('/blog/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/').filter(Boolean) ?? []
    const data = await serverLoader({ data: slugs })
    await (data.blogType === 'personal'
      ? personalClientLoader.preload(data.path)
      : technicalClientLoader.preload(data.path))
    return data
  },
})

const serverLoader = createServerFn({
  method: 'GET',
})
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const blogType = getBlogTypeFromSlugs(slugs)
    if (!blogType) throw notFound()

    const page = blogSource.getPage(slugs)
    if (!page) throw notFound()
    if (page.data.type !== blogType) throw notFound()

    if (blogType === 'personal') {
      return {
        path: page.path,
        blogType,
        pageTree: null,
      }
    }

    const filteredTree = filterPageTreeForType(
      blogSource.getPageTree(),
      blogType,
    )

    return {
      path: page.path,
      blogType,
      pageTree: await blogSource.serializePageTree(
        filteredTree as ReturnType<typeof blogSource.getPageTree>,
      ),
    }
  })

const technicalClientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData())

  if (data.blogType === 'personal') {
    return <PersonalArticleLayout path={data.path} />
  }

  return (
    <DocsLayout {...baseOptions(data.blogType)} tree={data.pageTree!}>
      <Suspense>{technicalClientLoader.useContent(data.path)}</Suspense>
    </DocsLayout>
  )
}
