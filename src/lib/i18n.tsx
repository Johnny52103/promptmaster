"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// --- Config ---
export const locales = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" as const },
  { code: "zh-CN", label: "简体中文", flag: "🇨🇳", dir: "ltr" as const },
]

export type LocaleCode = "en" | "zh-CN"

const STORAGE_KEY = "promptmaster_locale"

function getInitialLocale(): LocaleCode {
  if (typeof window === "undefined") return "en"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "en" || stored === "zh-CN") return stored
  // Detect browser language
  const navLang = navigator.language
  if (navLang.startsWith("zh")) return "zh-CN"
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
  | "model.midjourney" | "model.sd" | "model.dalle3" | "model.flux" | "model.firefly" | "model.ideogram"
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
  "zh-CN": {
    "header.pricing": "价格",
    "header.login": "登录",
    "hero.title": "AI 图像提示词优化工具",
    "hero.description": "将模糊的想法转化为可直接在 Midjourney 或 Stable Diffusion 中使用的优质提示词。",
    "input.scene": "场景",
    "input.model": "目标模型",
    "input.describeIdea": "描述你的想法",
    "input.placeholder.character": "例如：神秘森林中持弓的黑暗精灵游侠",
    "input.placeholder.car": "例如：日落时分在山路上飞驰的红色跑车",
    "input.wordCount": "字",
    "input.shortcut": "Cmd+Enter 生成",
    "input.generate": "生成",
    "input.outOfCredits": "积分已用完",
    "input.creditsLeft": "剩余积分",
    "input.optimizing": "优化中...",
    "result.qualityScore": "质量评分",
    "result.outOf100": "/100",
    "result.copy": "复制",
    "result.copied": "已复制",
    "result.specificity": "具体度",
    "result.structure": "结构完整度",
    "result.negativePrompt": "负面提示词",
    "result.styleConsistency": "风格一致性",
    "result.optimizedPrompt": "优化后的提示词",
    "result.positivePrompt": "正面提示词",
    "result.negativePromptLabel": "负面提示词",
    "result.settings": "设置",
    "result.switchToSD": "切换到 SD 查看正面 + 负面提示词格式",
    "result.switchToMJ": "切换到 MJ 查看 --ar --v --style --s 参数",
    "emptyState.title": "优化后的提示词将显示在此处",
    "emptyState.description": "描述你想要创建的内容，选择场景和模型，然后点击生成。",
    "beforeAfter.title": "优化前后对比",
    "beforeAfter.description": "看看 PromptMaster 如何将简短的想法转化为可直接使用的提示词",
    "beforeAfter.tryLabel": "点击试用 →",
    "beforeAfter.before": "优化前",
    "beforeAfter.after": "优化后",
    "scene.character": "角色",
    "scene.car": "汽车与车辆",
    "scene.product": "产品",
    "scene.general": "通用",
    "model.midjourney": "Midjourney",
    "model.sd": "Stable Diffusion",
    "model.dalle3": "DALL·E 3",
    "model.flux": "Flux",
    "model.firefly": "Adobe Firefly",
    "model.ideogram": "Ideogram",
    "footer.copyright": "PromptMaster AI — 为创作者打造的 AI 提示词优化工具",
    "score.excellent": "优秀",
    "score.great": "很好",
    "score.good": "良好",
    "score.fair": "一般",
    "score.needsWork": "需要改进",
    "history.title": "最近生成",
    "history.empty": "还没有生成记录，试试创建一个提示词吧！",
    "history.use": "使用",
    "history.delete": "删除",
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
      <div lang={locale === "zh-CN" ? "zh" : "en"}>{children}</div>
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
