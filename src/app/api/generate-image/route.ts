// Server-side proxy for image generation (avoids CORS issues)
// Browser → this API route → Ark/Replicate/OpenAI API → response → browser

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, model, prompt } = body

    if (!apiUrl || !apiKey || !model || !prompt) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const endpoint = apiUrl.replace(/\/+$/, "") + "/images/generations"

    const payload = {
      model,
      prompt,
      n: 1,
      size: "2K",
      response_format: "url",
      sequential_image_generation: "disabled",
      watermark: true,
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await resp.json()

    if (!resp.ok) {
      return Response.json({
        error: `API error [${resp.status}]: ${JSON.stringify(data).slice(0, 300)}`,
      }, { status: resp.status })
    }

    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) {
      return Response.json({
        error: `Unexpected response format: ${JSON.stringify(data).slice(0, 200)}`,
      }, { status: 502 })
    }

    return Response.json({ url: imageUrl, model })
  } catch (e: any) {
    return Response.json({
      error: `Server error: ${e.message || e}`,
    }, { status: 500 })
  }
}
