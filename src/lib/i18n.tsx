"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// --- Config ---
export const locales = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" as const },
]

export type LocaleCode = "en"

const STORAGE_KEY = "promptmaster_locale"

function getInitialLocale(): LocaleCode {
  return "en"
}

// --- Translations ---
type Key =
  | "header.pricing" | "header.login"
  | "hero.title" | "hero.description"
  | "input.scene" | "input.model" | "input.describeIdea"
  | "input.placeholder.character" | "input.placeholder.car"
  | "input.wordCount" | "input.shortcut"
  | "input.generate" | "input.outOfCredits" | "input.creditsLeft" | "input.optimizing"
  | "result.qualityScore" | "result.outOf100"
  | "result.copy" | "result.copied"
  | "result.specificity" | "result.structure" | "result.negativePrompt" | "result.styleConsistency"
  | "result.optimizedPrompt" | "result.positivePrompt" | "result.negativePromptLabel"
  | "result.settings" | "result.switchToSD" | "result.switchToMJ"
  | "emptyState.title" | "emptyState.description"
  | "beforeAfter.title" | "beforeAfter.description" | "beforeAfter.tryLabel"
  | "beforeAfter.before" | "beforeAfter.after"
  | "scene.character" | "scene.car" | "scene.product" | "scene.general"
  | "model.midjourney" | "model.sd" | "model.dalle3" | "model.flux" | "model.firefly" | "model.ideogram" | "model.doubao"
  | "footer.copyright"
  | "score.excellent" | "score.great" | "score.good" | "score.fair" | "score.needsWork"
  | "history.title" | "history.empty" | "history.use" | "history.delete"

const dict: Record<LocaleCode, Record<Key, string>> = {
  en: {
    "header.pricing": "Pricing",
    "header.login": "Login",
    "hero.title": "AI Image Prompt Optimizer",
    "hero.description": "Turn a vague idea into a production-ready Midjourney or Stable Diffusion prompt.",
    "input.scene": "Scene",
    "input.model": "Target Model",
    "input.describeIdea": "Describe your idea",
    "input.placeholder.character": "e.g. a dark elf ranger with a bow in a mystical forest",
    "input.placeholder.car": "e.g. a red sports car on a mountain road at sunset",
    "input.wordCount": "words",
    "input.shortcut": "Cmd+Enter to generate",
    "input.generate": "Generate",
    "input.outOfCredits": "Out of credits",
    "input.creditsLeft": "credits left",
    "input.optimizing": "Optimizing...",
    "result.qualityScore": "Quality Score",
    "result.outOf100": "/100",
    "result.copy": "Copy",
    "result.copied": "Copied!",
    "result.specificity": "Specificity",
    "result.structure": "Structure",
    "result.negativePrompt": "Negative Prompt",
    "result.styleConsistency": "Style Consistency",
    "result.optimizedPrompt": "Optimized Prompt",
    "result.positivePrompt": "Positive Prompt",
    "result.negativePromptLabel": "Negative Prompt",
    "result.settings": "Settings",
    "result.switchToSD": "Switch to SD to see Positive + Negative prompt format",
    "result.switchToMJ": "Switch to MJ to see --ar --v --style --s parameters",
    "emptyState.title": "Your optimized prompt will appear here",
    "emptyState.description": "Describe what you want to create, select a scene and model, then click Generate.",
    "beforeAfter.title": "Before / After",
    "beforeAfter.description": "See how PromptMaster transforms short ideas into production-ready prompts",
    "beforeAfter.tryLabel": "Click to try →",
    "beforeAfter.before": "Before",
    "beforeAfter.after": "After",
    "scene.character": "Character",
    "scene.car": "Car & Vehicle",
    "scene.product": "Product",
    "scene.general": "General",
    "model.doubao": "Doubao",
    "model.midjourney": "Midjourney",
    "model.sd": "Stable Diffusion",
    "model.dalle3": "DALL·E 3",
    "model.flux": "Flux",
    "model.firefly": "Adobe Firefly",
    "model.ideogram": "Ideogram",
    "footer.copyright": "PromptMaster AI — AI Image Prompt Optimizer for Creators",
    "score.excellent": "Excellent",
    "score.great": "Great",
    "score.good": "Good",
    "score.fair": "Fair",
    "score.needsWork": "Needs Work",
    "history.title": "Recent Generations",
    "history.empty": "No generations yet. Try creating a prompt above!",
    "history.use": "Use",
    "history.delete": "Delete",
  },
}

// --- Context ---
interface LocaleCtx {
  locale: LocaleCode
  setLocale: (l: LocaleCode) => void
  t: (key: Key) => string
  dir: "ltr" | "rtl"
}

const LocaleContext = createContext<LocaleCtx | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>("en")

  useEffect(() => {
    setLocaleState(getInitialLocale())
  }, [])

  const setLocale = (code: LocaleCode) => {
    setLocaleState(code)
    localStorage.setItem(STORAGE_KEY, code)
  }

  const t = (key: Key): string => dict[locale][key] || dict.en[key] || key
  const dir = locales.find((l) => l.code === locale)?.dir || "ltr"

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir }}>
      <div lang="en">{children}</div>
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider")
  return ctx
}

export function useT() {
  return useLocale().t
}
