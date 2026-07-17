// Prompt optimizer engine

import { getScene } from "./scenes"
import { scorePrompt, type ScoreResult } from "./scorer"
import { formatResult, type FormattedResult } from "./formatters"
import { translateInput, type LanguageFamily } from "./translate"

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
  detectedLanguage: LanguageFamily
  sceneId: string
  model: string
}

function pickRandom<T>(arr: T[]): T {
  // Use the raw input as a seed for consistent but varied results
  return arr[Math.floor(Math.random() * arr.length)]
}

function findBestMatch(input: string, options: { label: string; value: string; keywords: string[] }[]): string {
  const lowerInput = input.toLowerCase()

  // First pass: try to find exact keyword matches
  for (const opt of options) {
    for (const kw of opt.keywords) {
      if (lowerInput.includes(kw)) return opt.value
    }
  }

  // Second pass: try word-level matching
  const inputWords = lowerInput.split(/\s+/)
  for (const opt of options) {
    for (const kw of opt.keywords) {
      const kwParts = kw.split(/\s+/)
      if (kwParts.every((part) => inputWords.includes(part))) return opt.value
    }
  }

  // Fallback: partial word match (one word from keyword appears in input)
  for (const opt of options) {
    for (const kw of opt.keywords) {
      const kwParts = kw.split(/\s+/)
      for (const part of kwParts) {
        if (part.length > 3 && inputWords.some((w) => w.includes(part) || part.includes(w))) {
          return opt.value
        }
      }
    }
  }

  return pickRandom(options.map((o) => o.value))
}

function fillTemplate(template: string, fieldValues: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(fieldValues)) {
    result = result.replace(`{${key}}`, value)
  }
  return result
}

function improveRawInput(rawInput: string, fieldValues: Record<string, string>): string {
  // If input is very short (< 5 words), use the field values to build a richer prompt
  const wordCount = rawInput.trim().split(/\s+/).length
  if (wordCount <= 4) {
    // Build from field values
    return Object.values(fieldValues).join(", ")
  }
  return rawInput
}

export function optimize(params: OptimizeParams): OptimizeResult {
  const { rawInput, sceneId, model } = params
  const scene = getScene(sceneId)

  // Translate input from any language to English
  const { translated: translatedInput, detected: detectedLanguage } = translateInput(rawInput)
  const matchInput = translatedInput || rawInput

  // Build field values by matching translated input to scene fields
  const fieldValues: Record<string, string> = {}

  for (const field of scene.fields) {
    const best = findBestMatch(matchInput, field.options)
    fieldValues[field.key] = best
  }

  // Generate the positive prompt
  let positivePrompt = fillTemplate(scene.template, fieldValues)
  positivePrompt = improveRawInput(matchInput, fieldValues) + ". " + positivePrompt

  // Clean up: remove double spaces, trim
  positivePrompt = positivePrompt.replace(/\s+/g, " ").trim()

  // Generate negative prompt
  let negativePrompt = scene.negativePromptTemplate

  // Add scene-specific negative elements
  if (sceneId === "character") {
    negativePrompt += ", poorly drawn face, asymmetric eyes, bad hands, fused fingers"
  } else if (sceneId === "car") {
    negativePrompt += ", bad reflections, warped body panels, mismatched wheels, floating shadows"
  }

  // Score
  const score = scorePrompt(positivePrompt, negativePrompt)

  // Format for the selected model
  const formatted = formatResult(positivePrompt, negativePrompt, model)

  return {
    positivePrompt,
    negativePrompt,
    score,
    formatted,
    rawInput,
    translatedInput,
    detectedLanguage,
    sceneId,
    model,
  }
}

// Context-aware improvement that adds more detail based on scene
export function enhanceResult(result: OptimizeResult, detailLevel: "standard" | "detailed" = "standard"): OptimizeResult {
  if (detailLevel === "detailed") {
    const enhancements: Record<string, string> = {
      character: ", intricate details, fabric texture, skin pores, subsurface scattering, volumetric fog, god rays",
      car: ", realistic reflections, anisotropic shading, detailed tire tread, brake disc heat glow, paint flake texture",
    }
    result.positivePrompt += enhancements[result.sceneId] || ""
    result.formatted = formatResult(result.positivePrompt, result.negativePrompt, result.model)
    result.score = scorePrompt(result.positivePrompt, result.negativePrompt)
  }
  return result
}
