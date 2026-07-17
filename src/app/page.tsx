"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { getAllScenes } from "@/lib/scenes"
import { optimize, type OptimizeResult } from "@/lib/optimizer"
import { getScoreLabel } from "@/lib/scorer"
import { caseStudies } from "@/data/cases"
import { useT, useLocale } from "@/lib/i18n"
import { detectLanguage, translateInput, getLanguageName, type LanguageFamily } from "@/lib/translate"
import { getHistory, addToHistory, deleteHistoryItem, samplePrompts, type HistoryItem } from "@/lib/history"
import { detectModel, cycleModel, getModel, getAllModels } from "@/lib/models"
import { generateImage, detectProvider, usingOwnKey, hasSysKey,
  setReplicateKey, setOpenAIKey, setCustomUrl, setCustomKey, setCustomModel,
  setSysReplicateKey, setSysOpenAIKey, setSysCustomUrl, setSysCustomKey, setSysCustomModel,
  getReplicateKey, getOpenAIKey, getCustomUrl, getCustomKey, getCustomModel,
  getSysReplicateKey, getSysOpenAIKey, getSysCustomUrl, getSysCustomKey, getSysCustomModel,
  getModelGenStatus, providerCapabilities, type ImageGenResult } from "@/lib/imageGen"
import { getDeepSeekKey, setDeepSeekKey } from "@/lib/optimizer"
import AuthModal from "@/components/AuthModal"
import PricingModal from "@/components/PricingModal"
import LanguageSelector from "@/components/LanguageSelector"

const scenes = getAllScenes()
const sceneIds = scenes.map((s) => s.id)
const sceneLabelKeys: Record<string, any> = Object.fromEntries(scenes.map((s) => [s.id, `scene.${s.id}`]))

const allModels = getAllModels()
const modelLabelKeys: Record<string, string> = Object.fromEntries(allModels.map((m) => [m.id, `model.${m.id}`]))

const IMG_COST = 5 // credits for image gen with system key
const scoreLabelMap: Record<string, any> = {
  Excellent: "score.excellent", Great: "score.great", Good: "score.good",
  Fair: "score.fair", "Needs Work": "score.needsWork",
}

// Scene keyword matching for auto-detect
const sceneKeywords: Record<string, string[]> = {
  character: ["warrior", "wizard", "mage", "knight", "elf", "samurai", "rogue", "assassin", "character",
    "portrait", "person", "human", "fantasy", "hero", "villain"],
  car: ["car", "vehicle", "sports car", "hypercar", "supercar", "truck", "automobile", "race car", "muscle car"],
  product: ["product", "bottle", "watch", "phone", "perfume", "packaging", "commercial", "shoe", "sneaker",
    "smartphone", "jewelry", "cosmetic", "furniture"],
}

function autoDetectScene(input: string): string {
  const low = input.toLowerCase()
  let best = "general"
  let bestScore = 0
  for (const [scene, kws] of Object.entries(sceneKeywords)) {
    const score = kws.filter((kw) => low.includes(kw)).length
    if (score > bestScore) { bestScore = score; best = scene }
  }
  // If input mentions "sd"/"stable diff", prefer general to avoid wrong match
  if (low.includes("sd ") || low.includes("stable diff")) best = "general"
  return best
}

export default function Home() {
  const t = useT()
  const { locale } = useLocale()
  const [input, setInput] = useState("")
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [credits, setCredits] = useState(10)
  const [detectedLang, setDetectedLang] = useState<LanguageFamily>("en")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showSelectors, setShowSelectors] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [genImage, setGenImage] = useState<ImageGenResult | null>(null)
  const [genLoading, setGenLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [replicateInput, setReplicateInput] = useState("")
  const [openaiInput, setOpenaiInput] = useState("")

  // Auto-detect from input
  const sceneId = useMemo(() => input.trim() ? autoDetectScene(input) : "character", [input])
  const model = useMemo(() => input.trim() ? detectModel(input) : "midjourney", [input])

  // Allow manual override via refs
  const [overriddenScene, setOverriddenScene] = useState<string | null>(null)
  const [overriddenModel, setOverriddenModel] = useState<string | null>(null)
  const effectiveScene = overriddenScene || sceneId
  const effectiveModel = overriddenModel || model

  const currentScene = scenes.find((s) => s.id === effectiveScene) || scenes[0]

  useEffect(() => {
    setHistory(getHistory())
    setReplicateInput(getReplicateKey())
    setOpenaiInput(getOpenAIKey())

    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search)

      // SEO: pre-configure scene/model/input from URL params
      const sceneParam = p.get("scene")
      const modelParam = p.get("model")
      const inputParam = p.get("input")
      if (sceneParam) setOverriddenScene(sceneParam)
      if (modelParam) setOverriddenModel(modelParam)
      if (inputParam) { setInput(inputParam); setDetectedLang(detectLanguage(inputParam)) }

      // Dev: init API keys from URL params
      const dsk = p.get("deepseek_key")
      if (dsk) { setDeepSeekKey(dsk); console.log("[Dev] DeepSeek key configured") }
      const url = p.get("sys_custom_url")
      const key = p.get("sys_custom_key")
      const model = p.get("sys_custom_model")
      if (url && key) {
        setSysCustomUrl(url)
        setSysCustomKey(key)
        if (model) setSysCustomModel(model)
        console.log("[Dev] System custom API configured")
      }
    }
  }, [])

  // Reset overrides when input changes significantly
  useEffect(() => {
    if (!input.trim()) { setOverriddenScene(null); setOverriddenModel(null) }
  }, [input])

  const doGenerate = useCallback(async (raw: string) => {
    if (!raw.trim() || loading || credits <= 0) return
    setLoading(true); setCopied(false)
    try {
      const res = await optimize({ rawInput: raw.trim(), sceneId: effectiveScene, model: effectiveModel })
      setResult(res); setLoading(false); setCredits((c) => c - 1)
      addToHistory(res); setHistory(getHistory())
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch (e: any) {
      console.error("[Optimize] Failed:", e)
      setLoading(false)
    }
  }, [effectiveScene, effectiveModel, loading, credits])

  const handleGenerate = useCallback(() => doGenerate(input), [input, doGenerate])
  const handleRegenerate = useCallback(() => { if (result) doGenerate(result.rawInput) }, [result, doGenerate])

  const userOwnsKey = usingOwnKey()
  const imgCreditCost = userOwnsKey ? 0 : IMG_COST
  const canGenImage = result && !genLoading && (imgCreditCost === 0 || credits >= imgCreditCost)

  const handleGenImage = useCallback(async (modelOverride?: string) => {
    if (!result || genLoading) return
    const targetModel = modelOverride || effectiveModel
    const cost = usingOwnKey() ? 0 : IMG_COST
    if (cost > 0 && credits < cost) return
    setGenLoading(true); setGenImage(null)
    try {
      const img = await generateImage({
        prompt: result.positivePrompt,
        negativePrompt: result.negativePrompt,
        modelId: targetModel,
      })
      setGenImage(img)
      if (cost > 0) setCredits((c) => c - cost)
    } catch (e: any) {
      console.error("[PromptArt] Generation failed:", e)
      setGenImage({ url: "", model: `error: ${e.message || "Unknown error"}` })
    }
    setGenLoading(false)
  }, [result, effectiveModel, genLoading, credits])

  const handleDoubaoGen = useCallback(() => handleGenImage("doubao"), [handleGenImage])

  const handleDownload = useCallback((url: string) => {
    // Proxy through our server to avoid CORS
    const proxyUrl = `/api/download-image?url=${encodeURIComponent(url)}`
    const a = document.createElement("a")
    a.href = proxyUrl
    a.download = `promptart-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const handleCopy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const ta = document.createElement("textarea"); ta.value = text
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate()
  }, [handleGenerate])

  const useSample = useCallback((text: string, sid: string) => {
    setInput(text); setOverriddenScene(sid); setDetectedLang(detectLanguage(text))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const useHistory = useCallback((h: HistoryItem) => {
    setInput(h.rawInput); setOverriddenScene(h.sceneId); setOverriddenModel(h.model)
    setDetectedLang(h.detectedLanguage as LanguageFamily)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const handleLogin = useCallback((userData: any, userCredits: number) => {
    setUser(userData); setCredits(userCredits)
  }, [])

  const transPreview = input.trim() && detectedLang !== "en" ? translateInput(input.trim()) : null

  // Cycle through scenes on chip click
  const cycleScene = useCallback(() => {
    const idx = sceneIds.indexOf(effectiveScene)
    setOverriddenScene(sceneIds[(idx + 1) % sceneIds.length])
  }, [effectiveScene])

  const cycleModelCb = useCallback(() => {
    setOverriddenModel(cycleModel(effectiveModel))
  }, [effectiveModel])

  const isAutoScene = overriddenScene === null
  const isAutoModel = overriddenModel === null

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-[var(--border)] sticky top-0 bg-[var(--background)]/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center text-black font-bold text-sm">P</div>
            <span className="font-semibold text-sm tracking-tight">PromptMaster <span className="text-[var(--accent)]">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <span onClick={() => setShowPricing(true)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer transition-colors">{t("header.pricing")}</span>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">{user.name || user.email} · {credits} cr</span>
                <button onClick={() => setShowPricing(true)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors">Buy</button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="bg-[var(--accent)] text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors">{t("header.login")}</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("hero.title")}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{t("hero.description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left - Input */}
          <div className="lg:col-span-5 space-y-3">
            {/* Main input card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
              <textarea value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (e.target.value.trim()) setDetectedLang(detectLanguage(e.target.value))
                  else setDetectedLang("en")
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("input.describeIdea") + "... e.g. a dark elf ranger in a magical forest"}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:border-[var(--accent-dim)] transition-colors placeholder:text-[var(--text-tertiary)]"
              />

              {/* Auto-detect chips */}
              {input.trim() && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Scene chip */}
                  <button onClick={cycleScene}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      isAutoScene
                        ? "bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/20"
                        : "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
                    }`}
                  >
                    {t(sceneLabelKeys[effectiveScene] || "scene.general")}
                    {isAutoScene && <span className="text-[9px] opacity-50">auto</span>}
                  </button>

                  {/* Model chip */}
                  <button onClick={cycleModelCb}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      isAutoModel
                        ? "bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/20"
                        : "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
                    }`}
                  >
                    {getModel(effectiveModel).shortLabel}
                    {isAutoModel && <span className="text-[9px] opacity-50">auto</span>}
                  </button>

                  {/* Language chip if non-english */}
                  {transPreview && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-[var(--border)]">
                      {getLanguageName(detectedLang)}
                    </span>
                  )}
                </div>
              )}

              {/* Auto-translate preview */}
              {transPreview && (
                <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded uppercase tracking-wider">{getLanguageName(detectedLang)}</span>
                    <svg className="w-3 h-3 text-[var(--accent-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider">English</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{transPreview.translated}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-tertiary)]">{input.trim().split(/\s+/).filter(Boolean).length} {t("input.wordCount")}</span>
                <span className="text-xs text-[var(--text-tertiary)]">{t("input.shortcut")}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={handleGenerate} disabled={!input.trim() || loading || credits <= 0}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                >{loading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {t("input.optimizing")}
                  </span>
                ) : credits <= 0 ? t("input.outOfCredits") : `${t("input.generate")} (${credits} ${t("input.creditsLeft")})`}</button>
                {credits <= 3 && credits > 0 && (
                  <button onClick={() => setCredits((c) => c + 10)}
                    className="px-2 py-1 rounded text-[10px] text-[var(--accent-dim)] hover:text-[var(--accent)] bg-[var(--surface-2)] border border-[var(--border)] transition-colors"
                  >+10 credits</button>
                )}
                {credits <= 0 && (
                  <button onClick={() => setCredits(10)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-colors"
                  >Top up 10 credits</button>
                )}
                {result && (
                  <button onClick={handleRegenerate} disabled={loading || credits <= 0}
                    className="px-4 py-2.5 rounded-lg text-sm bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] transition-all disabled:opacity-30"
                    title="Generate another variation"
                  >↻</button>
                )}
              </div>
            </div>

            {/* Quick fill */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3 h-3 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span className="text-xs text-[var(--text-tertiary)]">Try these</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((sp, i) => (
                  <button key={i} onClick={() => useSample(sp.text, sp.scene)}
                    className="text-[11px] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-3)] px-2.5 py-1.5 rounded-md transition-all"
                  >{sp.label}</button>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{t("history.title")}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{history.length}</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg px-2.5 py-1.5 group hover:bg-[var(--surface-3)] transition-colors cursor-pointer" onClick={() => useHistory(h)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-secondary)] truncate">{h.rawInput}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[var(--text-tertiary)]">{sceneLabelKeys[h.sceneId] ? t(sceneLabelKeys[h.sceneId]) : h.sceneId}</span>
                          <span className="text-[10px] text-[var(--accent-dim)]">{h.score}/100</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">{h.model}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(h.id); setHistory(getHistory()) }}
                        className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--red)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Result */}
          <div className="lg:col-span-7" ref={resultRef}>
            {result ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                {/* Score */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{t("result.qualityScore")}</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-3xl font-bold">{result.score.total}</span>
                      <span className="text-[var(--text-secondary)] text-sm">/100</span>
                      <span className={`text-xs font-medium ml-2 ${getScoreLabel(result.score.total).color}`}>{t(scoreLabelMap[getScoreLabel(result.score.total).label] || "score.good")}</span>
                    </div>
                  </div>
                  {(() => {
                    const mod = getModel(effectiveModel)
                    return (
                      <button onClick={() => handleCopy(result.formatted.fullOutput)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-all ${copied ? "bg-[var(--green)]/20 text-[var(--green)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]"}`}
                      >{copied ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>{t("result.copied")}</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>{t("result.copy")}</>}</button>
                    )
                  })()}
                </div>

                {/* Score bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { k: "specificity", l: t("result.specificity"), v: result.score.breakdown.specificity },
                    { k: "structure", l: t("result.structure"), v: result.score.breakdown.structure },
                    { k: "negative", l: t("result.negativePrompt"), v: result.score.breakdown.negativeQuality },
                    { k: "style", l: t("result.styleConsistency"), v: result.score.breakdown.styleConsistency },
                  ].map((x) => (
                    <div key={x.k} className="bg-[var(--surface-2)] rounded-lg p-2.5">
                      <div className="flex justify-between mb-1"><span className="text-[10px] text-[var(--text-secondary)]">{x.l}</span><span className="text-[10px] font-medium">{x.v}</span></div>
                      <div className="h-1 bg-[var(--surface-3)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--accent)] transition-all duration-700" style={{width:`${x.v}%`}}/></div>
                    </div>
                  ))}
                </div>

                <hr className="border-[var(--border)]" />

                {/* Dynamic model output */}
                {(() => {
                  const mod = getModel(effectiveModel)
                  return (
                    <div className="space-y-3">
                      {/* Prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                            {effectiveModel === "midjourney" ? t("result.optimizedPrompt") : t("result.positivePrompt")}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-tertiary)]">{mod.label}</span>
                            <button onClick={() => handleCopy(result.formatted.prompt)} className="text-[10px] text-[var(--accent-dim)] hover:text-[var(--accent)]">Copy</button>
                          </div>
                        </div>
                        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-sm leading-relaxed break-all font-mono text-[13px]">{result.formatted.fullOutput}</div>
                      </div>

                      {/* Negative prompt (if model supports it) */}
                      {mod.hasNegative && result.formatted.negativePrompt && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{t("result.negativePromptLabel")}</label>
                            <button onClick={() => handleCopy(result.formatted.negativePrompt)} className="text-[10px] text-[var(--red)]/60 hover:text-[var(--red)]">Copy</button>
                          </div>
                          <div className="bg-[var(--red)]/5 border border-[var(--red)]/20 rounded-lg p-3 text-sm leading-relaxed break-all text-[var(--red)]/80 font-mono text-[13px]">{result.formatted.negativePrompt}</div>
                        </div>
                      )}

                      {/* Parameters */}
                      {result.formatted.params.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.formatted.params.map((p) => (
                            <div key={p.key} className="flex items-center gap-1 bg-[var(--surface-2)] rounded-md px-2 py-1 text-[11px]">
                              <span className="text-[var(--text-tertiary)]">{p.key}</span>
                              <span className="text-[var(--accent)] font-medium">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* 豆包 AI Image Generation - Prominent */}
                <hr className="border-[var(--border)]" />
                <div className="bg-[var(--surface-2)]/60 border border-[var(--accent)]/15 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[var(--foreground)]">PromptArt</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[var(--text-tertiary)]">AI image generation</span>
                          {(() => {
                            const st = getModelGenStatus("doubao")
                            if (st.keySource === "system") return <span className="text-[10px] text-[var(--accent-dim)]">系统 key ✓</span>
                            if (st.keySource === "user") return <span className="text-[10px] text-[var(--green)]/70">你的 key ✓</span>
                            return <span className="text-[10px] text-[var(--text-tertiary)]">mock</span>
                          })()}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setShowApiKey(true)}
                      className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--accent-dim)] px-2 py-1 rounded transition-colors"
                    >API 设置</button>
                  </div>

                  {/* Error display */}
                  {genImage?.model?.startsWith("error:") ? (
                    <div className="bg-[var(--red)]/5 border border-[var(--red)]/15 rounded-lg p-3 text-xs text-[var(--red)]/80">
                      <div className="font-medium mb-1">Generation failed</div>
                      <div className="text-[11px] break-all">{genImage.model.replace("error: ", "")}</div>
                      <button onClick={() => setGenImage(null)} className="mt-2 text-[var(--accent-dim)] hover:text-[var(--accent)]">Try again</button>
                    </div>
                  ) : genImage ? (
                    <div>
                      <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-black">
                        <img src={genImage.url} alt="豆包生成" className="w-full" />
                      </div>
                      <div className="mt-1.5 text-[10px] text-[var(--text-tertiary)] flex items-center justify-between">
                        <span>{genImage.duration ? `PromptArt · ${(genImage.duration / 1000).toFixed(1)}s` : "PromptArt"}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownload(genImage.url)}
                            className="text-[var(--accent-dim)] hover:text-[var(--accent)] flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Download
                          </button>
                          <button onClick={() => setGenImage(null)} className="hover:text-[var(--text-secondary)]">清除</button>
                          <button onClick={handleDoubaoGen} disabled={genLoading} className="text-[var(--accent-dim)] hover:text-[var(--accent)] disabled:opacity-30">重新生成</button>
                        </div>
                      </div>
                    </div>
                  ) : genLoading ? (
                    <div className="flex items-center justify-center py-10 rounded-lg border border-dashed border-[var(--accent)]/20 bg-[var(--surface-2)]">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-6 w-6 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        <span className="text-xs text-[var(--text-secondary)]">PromptArt is creating...</span>
                      </div>
                    </div>
                  ) : canGenImage || hasSysKey() ? (
                    <button onClick={handleDoubaoGen}
                      className="w-full py-4 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent)] hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/40 transition-all text-sm font-medium group"
                    >
                      <span className="flex items-center justify-center gap-2.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span>PromptArt · {IMG_COST} credits</span>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                      </span>
                    </button>
                  ) : (
                    <div className="w-full py-4 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-tertiary)] text-sm text-center">
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        积分不足，需要 {IMG_COST} 点数
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom hint */}
                <div className="text-[11px] text-[var(--text-tertiary)] text-center">
                  Using <span className="text-[var(--accent-dim)]">{getModel(effectiveModel).label}</span> — click the model chip to switch
                </div>
              </div>
            ) : (
              // Empty state
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[360px]">
                <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <h3 className="text-base font-medium mb-1">{t("emptyState.title")}</h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm">{t("emptyState.description")}</p>
                {history.length === 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {samplePrompts.slice(0, 4).map((sp, i) => (
                      <button key={i} onClick={() => useSample(sp.text, sp.scene)}
                        className="text-[11px] bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--foreground)] px-2.5 py-1.5 rounded-md border border-[var(--border)] transition-colors"
                      >{sp.label}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Before/After */}
        <section className="mt-16">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">{t("beforeAfter.title")}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{t("beforeAfter.description")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {caseStudies.map((c) => (
              <div key={c.id} onClick={() => { setInput(c.beforePrompt); setOverriddenScene(c.scene); setDetectedLang(detectLanguage(c.beforePrompt)); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--border-hover)] transition-colors cursor-pointer group"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{c.scene}</span>
                    {c.tags.slice(0, 2).map((tag) => <span key={tag} className="text-[9px] bg-[var(--surface-2)] text-[var(--text-tertiary)] px-1 py-0.5 rounded">{tag}</span>)}
                  </div>
                  <h3 className="font-medium text-sm">{c.title}</h3>
                  <div className="bg-[var(--red)]/5 border border-[var(--red)]/10 rounded-lg p-2"><span className="text-[10px] font-medium text-[var(--red)]/70 uppercase tracking-wider">{t("beforeAfter.before")}</span><p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{c.beforePrompt}</p></div>
                  <div className="bg-[var(--green)]/5 border border-[var(--green)]/10 rounded-lg p-2"><span className="text-[10px] font-medium text-[var(--green)]/70 uppercase tracking-wider">{t("beforeAfter.after")}</span><p className="text-[11px] text-[var(--foreground)] mt-0.5 line-clamp-2">{c.afterPrompt}</p></div>
                  <div className="text-[10px] text-[var(--accent-dim)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">{t("beforeAfter.tryLabel")}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 pb-6 border-t border-[var(--border)] pt-5 text-center text-xs text-[var(--text-tertiary)]">{t("footer.copyright")}</footer>
      </main>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} user={user} />

      {/* API Key Modal */}
      {showApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowApiKey(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">API Keys</h3>
              <button onClick={() => setShowApiKey(false)} className="text-[var(--text-tertiary)] hover:text-[var(--foreground)] text-lg leading-none">×</button>
            </div>
            {/* DeepSeek key for prompt optimization */}
            <div className="mb-4">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">DeepSeek API Key <span className="text-[var(--accent-dim)]">(for prompt optimization)</span></label>
              <input type="password" defaultValue={getDeepSeekKey()}
                id="deepseek-key-input"
                placeholder="sk-..."
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
              />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                Required for AI-powered prompt optimization. <a href="https://platform.deepseek.com/api_keys" target="_blank" className="text-[var(--accent-dim)] hover:text-[var(--accent)]">Get DeepSeek key →</a>
              </p>
            </div>

            <hr className="border-[var(--border)] mb-3" />

            <p className="text-xs text-[var(--text-secondary)] mb-3">
              <span className="text-[var(--green)]/70">Your key</span> — free generation, no credit deduction.&nbsp;
              <span className="text-[var(--accent-dim)]">System key</span> — costs {IMG_COST} credits per image.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-3">Without any key, mock previews are shown at no cost.</p>

            {/* Model-to-API mapping */}
            <div className="bg-[var(--surface-2)] rounded-lg p-2.5 mb-3">
              <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">Model support</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { model: "即梦/豆包/通义", api: "Custom", note: "OpenAI 兼容" },
                  { model: "Midjourney", api: "—", note: "No public API" },
                  { model: "SD / Flux", api: "Replicate", note: "r8_ key" },
                  { model: "DALL·E 3", api: "OpenAI", note: "sk- key" },
                ].map((row) => (
                  <div key={row.model} className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-[var(--text-tertiary)]">{row.model}</span>
                    <span className={row.api === "—" ? "text-[var(--red)]/50" : "text-[var(--green)]/60"}>{row.api}</span>
                    <span className="text-[var(--text-tertiary)]">{row.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">{providerCapabilities[0].label} API Key</label>
                <input type="password" value={replicateInput} onChange={(e) => setReplicateInput(e.target.value)}
                  placeholder={providerCapabilities[0].keyPrefix + "..."}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                />
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Supports: {providerCapabilities[0].models.join(", ")}. <a href={providerCapabilities[0].link} target="_blank" className="text-[var(--accent-dim)] hover:text-[var(--accent)]">{providerCapabilities[0].linkLabel}</a>
                </p>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">{providerCapabilities[1].label} API Key</label>
                <input type="password" value={openaiInput} onChange={(e) => setOpenaiInput(e.target.value)}
                  placeholder={providerCapabilities[1].keyPrefix + "..."}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                />
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Supports: {providerCapabilities[1].models.join(", ")}. <a href={providerCapabilities[1].link} target="_blank" className="text-[var(--accent-dim)] hover:text-[var(--accent)]">{providerCapabilities[1].linkLabel}</a>
                </p>
              </div>

              {/* Custom API (Chinese models) */}
              <details className="group">
                <summary className="text-[11px] font-medium text-[var(--text-secondary)] cursor-pointer hover:text-[var(--foreground)] transition-colors select-none mb-2">
                  Custom API <span className="text-[var(--text-tertiary)] font-normal">(即梦/豆包/通义万相)</span>
                </summary>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">API Endpoint URL</label>
                    <input type="text" defaultValue={getCustomUrl()}
                      id="custom-url-input"
                      placeholder="https://api.example.com"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">API Key</label>
                    <input type="password" defaultValue={getCustomKey()}
                      id="custom-key-input"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">Model Name</label>
                    <input type="text" defaultValue={getCustomModel()}
                      id="custom-model-input"
                      placeholder="e.g. jimeng-v2, doubao-pro"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>
                </div>
              </details>
            </div>

            {/* System keys (collapsible) */}
            <details className="mt-3 group">
              <summary className="text-[11px] text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors select-none">
                System keys (for product owner)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">System Replicate Key</label>
                  <input type="password" defaultValue={getSysReplicateKey()}
                    id="sys-replicate-input"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">System OpenAI Key</label>
                  <input type="password" defaultValue={getSysOpenAIKey()}
                    id="sys-openai-input"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">System Custom API URL</label>
                  <input type="text" defaultValue={getSysCustomUrl()}
                    id="sys-custom-url-input"
                    placeholder="https://api.example.com"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">System Custom API Key</label>
                  <input type="password" defaultValue={getSysCustomKey()}
                    id="sys-custom-key-input"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block mb-0.5">System Custom Model</label>
                  <input type="text" defaultValue={getSysCustomModel()}
                    id="sys-custom-model-input"
                    placeholder="e.g. jimeng-v2"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-[var(--accent-dim)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
              </div>
            </details>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowApiKey(false); setReplicateInput(getReplicateKey()); setOpenaiInput(getOpenAIKey()) }}
                className="flex-1 py-2 rounded-lg text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--foreground)] border border-[var(--border)] transition-colors"
              >Cancel</button>
              <button onClick={() => {
                // DeepSeek key
                const dsk = (document.getElementById("deepseek-key-input") as HTMLInputElement)?.value
                if (dsk !== undefined) setDeepSeekKey(dsk || "")
                // User keys
                setReplicateKey(replicateInput); setOpenAIKey(openaiInput)
                const cu = (document.getElementById("custom-url-input") as HTMLInputElement)?.value
                const ck = (document.getElementById("custom-key-input") as HTMLInputElement)?.value
                const cm = (document.getElementById("custom-model-input") as HTMLInputElement)?.value
                if (cu !== undefined) setCustomUrl(cu || "")
                if (ck !== undefined) setCustomKey(ck || "")
                if (cm !== undefined) setCustomModel(cm || "")
                // System keys
                const sysRep = (document.getElementById("sys-replicate-input") as HTMLInputElement)?.value
                const sysOai = (document.getElementById("sys-openai-input") as HTMLInputElement)?.value
                const sysCu = (document.getElementById("sys-custom-url-input") as HTMLInputElement)?.value
                const sysCk = (document.getElementById("sys-custom-key-input") as HTMLInputElement)?.value
                const sysCm = (document.getElementById("sys-custom-model-input") as HTMLInputElement)?.value
                if (sysRep !== undefined) setSysReplicateKey(sysRep || "")
                if (sysOai !== undefined) setSysOpenAIKey(sysOai || "")
                if (sysCu !== undefined) setSysCustomUrl(sysCu || "")
                if (sysCk !== undefined) setSysCustomKey(sysCk || "")
                if (sysCm !== undefined) setSysCustomModel(sysCm || "")
                setShowApiKey(false)
              }}
                className="flex-1 py-2 rounded-lg text-xs bg-[var(--accent)] text-black font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
