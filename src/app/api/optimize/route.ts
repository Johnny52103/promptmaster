// Server-side prompt optimization via DeepSeek API

export async function POST(request: Request) {
  let rawInput = "", sceneId = "", model = ""
  try {
    const body = await request.json()
    rawInput = body.rawInput || ""
    sceneId = body.sceneId || ""
    model = body.model || ""
    const apiKey = body.apiKey || ""

    if (!rawInput) {
      return Response.json({ error: "Missing input" }, { status: 400 })
    }

    // Try DeepSeek with timeout, fallback to mock on any failure
    try {
      const envKey = process.env.DEEPSEEK_API_KEY || ""
      const key = apiKey || envKey

      if (key) {
        const sysPrompt = `You are an expert AI image prompt engineer. Turn short ideas into professional, production-ready prompts for AI image generation models.
Respond ONLY with valid JSON:
{
  "positivePrompt": "string",
  "negativePrompt": "string",
  "scoreBreakdown": { "specificity": 0-100, "structure": 0-100, "negativeQuality": 0-100, "styleConsistency": 0-100 },
  "totalScore": 0-100,
  "detectedScene": "character | car | product | general",
  "detectedModel": "midjourney | sd | dalle3 | flux | firefly | ideogram | doubao"
}`

        const userPrompt = "Scene: " + (sceneId || "auto-detect") + "\nTarget Model: " + (model || "auto-detect") + "\nUser's idea: " + rawInput + "\n\nOptimize this into a professional prompt and return JSON."

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const resp = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (resp.ok) {
          const data = await resp.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            let jsonStr = content.trim()
            if (jsonStr.startsWith("```")) {
              jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
            }
            let parsed: any
            try { parsed = JSON.parse(jsonStr) } catch {
              const match = jsonStr.match(/\{[\s\S]*\}/)
              if (match) { try { parsed = JSON.parse(match[0]) } catch {} }
            }
            if (parsed) {
              return Response.json({
                positivePrompt: parsed.positivePrompt || parsed.prompt || rawInput,
                negativePrompt: parsed.negativePrompt || "",
                score: { total: parsed.totalScore || 85, breakdown: parsed.scoreBreakdown || { specificity: 75, structure: 75, negativeQuality: 75, styleConsistency: 75 } },
                detectedScene: parsed.detectedScene || sceneId || "general",
                detectedModel: parsed.detectedModel || model || "midjourney",
              })
            }
          }
        }
      }
    } catch (e: any) {
      console.error("[Optimize] DeepSeek failed:", e?.message || e)
    }
    return Response.json(fallbackResult(rawInput, sceneId, model))

  } catch {
    return Response.json(fallbackResult(rawInput, sceneId, model))
  }
}

function fallbackResult(input: string, sceneId?: string, model?: string) {
  const scene = sceneId || "general"
  const detModel = model || "midjourney"
  const prompt = input || "a beautiful scene"
  return {
    positivePrompt: prompt + ", cinematic lighting, 8k, highly detailed, professional photography, sharp focus",
    negativePrompt: "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text",
    score: { total: 82, breakdown: { specificity: 78, structure: 85, negativeQuality: 80, styleConsistency: 85 } },
    detectedScene: scene,
    detectedModel: detModel,
  }
}
