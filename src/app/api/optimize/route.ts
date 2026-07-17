// Server-side prompt optimization via DeepSeek API

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rawInput, sceneId, model, apiKey } = body

    if (!rawInput) {
      return Response.json({ error: "Missing input" }, { status: 400 })
    }

    const key = apiKey || ""
    if (!key) {
      return Response.json({ error: "No DeepSeek API key. Add it in API Settings." }, { status: 400 })
    }

    const sysPrompt = "You are an expert AI image prompt engineer. Your job is to turn short ideas into professional, production-ready prompts for AI image generation models.\n\nYou MUST respond with ONLY a valid JSON object, no other text. The JSON schema:\n{\n  \"positivePrompt\": \"string - the complete optimized prompt with all details\",\n  \"negativePrompt\": \"string - comprehensive negative prompt (common flaws, artifacts, unwanted elements)\",\n  \"scoreBreakdown\": {\n    \"specificity\": 0-100,\n    \"structure\": 0-100,\n    \"negativeQuality\": 0-100,\n    \"styleConsistency\": 0-100\n  },\n  \"totalScore\": 0-100,\n  \"detectedScene\": \"character | car | product | general\",\n  \"detectedModel\": \"midjourney | sd | dalle3 | flux | firefly | ideogram | doubao\"\n}"

    const userPrompt = "Scene: " + (sceneId || "auto-detect") + "\nTarget Model: " + (model || "auto-detect") + "\nUser's idea: " + rawInput + "\n\nOptimize this into a professional prompt and return JSON."

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
        max_tokens: 2000,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return Response.json({ error: "DeepSeek API error [" + resp.status + "]: " + errText.slice(0, 300) }, { status: resp.status })
    }

    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return Response.json({ error: "DeepSeek returned empty response" }, { status: 502 })
    }

    // Parse JSON from response
    let jsonStr = content.trim()
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      const match = jsonStr.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch {
          return Response.json({ error: "Failed to parse DeepSeek response as JSON: " + jsonStr.slice(0, 200) }, { status: 502 })
        }
      } else {
        return Response.json({ error: "DeepSeek did not return valid JSON: " + jsonStr.slice(0, 200) }, { status: 502 })
      }
    }

    return Response.json({
      positivePrompt: parsed.positivePrompt || parsed.prompt || rawInput,
      negativePrompt: parsed.negativePrompt || "",
      score: {
        total: parsed.totalScore || 85,
        breakdown: parsed.scoreBreakdown || {
          specificity: 75,
          structure: 75,
          negativeQuality: 75,
          styleConsistency: 75,
        },
      },
      detectedScene: parsed.detectedScene || sceneId || "general",
      detectedModel: parsed.detectedModel || model || "midjourney",
    })

  } catch (e: any) {
    return Response.json({ error: "Server error: " + (e.message || e) }, { status: 500 })
  }
}
