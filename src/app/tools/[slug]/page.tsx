// SEO tool pages — each slug generates a unique landing page with proper meta tags

import { notFound, redirect } from "next/navigation"
import { findPage, seoPages } from "@/data/seo-pages"
import type { Metadata } from "next"

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return seoPages.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = findPage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
    },
  }
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params
  const page = findPage(slug)
  if (!page) notFound()

  // Redirect to main page with pre-configured params
  redirect(`/?scene=${page.scene}&model=${page.model}&input=${encodeURIComponent(page.sampleInput)}`)
}
