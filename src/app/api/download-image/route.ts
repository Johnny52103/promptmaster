// Proxy image download — avoids CORS issues from browser-side fetch
// /api/download-image?url=https://...

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")

  if (!imageUrl) {
    return new Response("Missing url parameter", { status: 400 })
  }

  try {
    const resp = await fetch(imageUrl)

    if (!resp.ok) {
      return new Response(`Failed to fetch image: ${resp.status}`, { status: resp.status })
    }

    const blob = await resp.blob()
    const contentType = resp.headers.get("content-type") || "image/png"

    return new Response(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="promptart-${Date.now()}.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (e: any) {
    return new Response(`Download failed: ${e.message}`, { status: 500 })
  }
}
