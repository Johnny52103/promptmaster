// Prompt optimizer — calls DeepSeek API via server proxy

import { scorePrompt, type ScoreResult } from "./scorer"
import { formatResult, type FormattedResult } from "./formatters"

export interface OptimizeParams {
  rawInput: string
  sceneId: string
  model: string
}

export interface OptimizeResult {
  positivePrompt: string
  negativePrompt: string
  score: ScoreResult
  formatted: FormattedResult
  rawInput: string
  translatedInput: string
  detectedLanguage: string
  sceneId: string
  model: string
}

// Store DeepSeek API key (client-side storage for now)
const DS_KEY = "promptmaster_deepseek_key"

export function getDeepSeekKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(DS_KEY) || ""
}

export function setDeepSeekKey(key: string) {
  localStorage.setItem(DS_KEY, key)
}

export async function optimize(params: OptimizeParams): Promise<OptimizeResult> {
  const { rawInput, sceneId, model } = params

  const apiKey = getDeepSeekKey()

  const resp = await fetch("/api/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawInput, sceneId, model, apiKey }),
  })

  const data = await resp.json()

  if (!resp.ok || data.error) {
    throw new Error(data.error || `Optimization failed [${resp.status}]`)
  }

  const positivePrompt = data.positivePrompt || rawInput
  const negativePrompt = data.negativePrompt || ""

  // Ensure we have a properly structured score
  const score: ScoreResult = data.score || scorePrompt(positivePrompt, negativePrompt)

  // Format for the selected model
  const formatted = formatResult(positivePrompt, negativePrompt, data.detectedModel || model)

  return {
    positivePrompt,
    negativePrompt,
    score,
    formatted,
    rawInput,
    translatedInput: rawInput,
    detectedLanguage: "en",
    sceneId: data.detectedScene || sceneId,
    model: data.detectedModel || model,
  }
}
