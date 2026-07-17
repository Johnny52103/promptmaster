// localStorage history for recent generations

import type { OptimizeResult } from "./optimizer"

const STORAGE_KEY = "promptmaster_history"
const MAX_ITEMS = 20

export interface HistoryItem {
  id: string
  timestamp: number
  rawInput: string
  translatedInput: string
  detectedLanguage: string
  sceneId: string
  model: string
  positivePrompt: string
  negativePrompt: string
  score: number
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToHistory(result: OptimizeResult): void {
  const history = getHistory()
  const item: HistoryItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    rawInput: result.rawInput,
    translatedInput: result.translatedInput,
    detectedLanguage: result.detectedLanguage,
    sceneId: result.sceneId,
    model: result.model,
    positivePrompt: result.positivePrompt,
    negativePrompt: result.negativePrompt,
    score: result.score.total,
  }
  history.unshift(item)
  if (history.length > MAX_ITEMS) history.pop()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory().filter((h) => h.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Quick sample prompts for easy testing
export const samplePrompts = [
  { scene: "character", text: "a stoic elven warrior in a mystical forest", label: "Fantasy Warrior" },
  { scene: "character", text: "a cyberpunk samurai in neon-lit alley", label: "Cyber Samurai" },
  { scene: "car", text: "a red supercar on a mountain road at sunset", label: "Sports Car" },
  { scene: "car", text: "a futuristic cyberpunk car in neon city", label: "Cyber Car" },
  { scene: "product", text: "a minimalist perfume bottle on marble", label: "Perfume" },
  { scene: "product", text: "a sleek smartwatch on a dark gradient", label: "Smartwatch" },
  { scene: "general", text: "a serene mountain lake at golden hour", label: "Mountain Lake" },
  { scene: "general", text: "a dark fantasy castle under moonlight", label: "Dark Castle" },
]
