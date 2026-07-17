// Server-side proxy for image generation (avoids CORS issues)
// Browser → this API route → Ark/Replicate/OpenAI API → response → browser

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { apiUrl, apiKey, model, prompt } = body

    // Fallback to system env vars if client didn't provide keys
    if (!apiKey) apiKey = process.env.SYS_CUSTOM_KEY || ""
    if (!apiUrl) apiUrl = process.env.SYS_CUSTOM_URL || ""
    if (!model) model = process.env.SYS_CUSTOM_MODEL || ""

    if (!apiUrl || !apiKey || !model || !prompt) {
      return Response.json({ error: "Missing required fields. Configure system keys in Settings or provide apiUrl/apiKey." }, { status: 400 })
    }

    // Build endpoint - trim whitespace, avoid double-appending
    let endpoint = apiUrl.trim().replace(/\/+$/, "")
    if (!endpoint.endsWith("/images/generations")) {
      endpoint += "/images/generations"
    }

    const payload: Record<string, any> = {
      model,
      prompt,
      n: 1,
      size: "1920x1920",
      response_format: "url",
    }
    if (body.width && body.height) {
      const px = body.width * body.height
      if (px >= 3686400) payload.size = `${body.width}x${body.height}`
    }

    console.log("[GenerateImage] Calling:", endpoint, "model:", model)

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Get response as text first to handle non-JSON responses
    const respText = await resp.text()
    console.log("[GenerateImage] Response status:", resp.status, "body length:", respText.length)

    if (!resp.ok) {
      return Response.json({
        error: `API error [${resp.status}]: ${respText.slice(0, 500)}`,
      }, { status: resp.status })
    }

    let data: any
    try {
      data = JSON.parse(respText)
    } catch {
      return Response.json({
        error: `Invalid JSON response: ${respText.slice(0, 500)}`,
      }, { status: 502 })
    }

    const imageUrl = data.data?.[0]?.url || data.data?.image_url || data.image_url
    if (!imageUrl) {
      return Response.json({
        error: `Unexpected response format: ${JSON.stringify(data).slice(0, 300)}`,
      }, { status: 502 })
    }

    return Response.json({ url: imageUrl, model })
  } catch (e: any) {
    return Response.json({
      error: `Server error: ${e.message || e}`,
    }, { status: 500 })
  }
}
