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
import LanguageSelector from "@/components/LanguageSelector"

const scenes = getAllScenes()
const sceneIds = scenes.map((s) => s.id)
const sceneLabelKeys: Record<string, any> = Object.fromEntries(scenes.map((s) => [s.id, `scene.${s.id}`]))

const allModels = getAllModels()
const modelLabelKeys: Record<string, string> = Object.fromEntries(allModels.map((m) => [m.id, `model.${m.id}`]))

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

  // Auto-detect from input
  const sceneId = useMemo(() => input.trim() ? autoDetectScene(input) : "character", [input])
  const model = useMemo(() => input.trim() ? detectModel(input) : "midjourney", [input])

  // Allow manual override via refs
  const [overriddenScene, setOverriddenScene] = useState<string | null>(null)
  const [overriddenModel, setOverriddenModel] = useState<string | null>(null)
  const effectiveScene = overriddenScene || sceneId
  const effectiveModel = overriddenModel || model

  const currentScene = scenes.find((s) => s.id === effectiveScene) || scenes[0]

  useEffect(() => { setHistory(getHistory()) }, [])

  // Reset overrides when input changes significantly
  useEffect(() => {
    if (!input.trim()) { setOverriddenScene(null); setOverriddenModel(null) }
  }, [input])

  const doGenerate = useCallback((raw: string) => {
    if (!raw.trim() || loading || credits <= 0) return
    setLoading(true); setCopied(false)
    setTimeout(() => {
      const res = optimize({ rawInput: raw.trim(), sceneId: effectiveScene, model: effectiveModel })
      setResult(res); setLoading(false); setCredits((c) => c - 1)
      addToHistory(res); setHistory(getHistory())
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    }, 600 + Math.random() * 400)
  }, [effectiveScene, effectiveModel, loading, credits])

  const handleGenerate = useCallback(() => doGenerate(input), [input, doGenerate])
  const handleRegenerate = useCallback(() => { if (result) doGenerate(result.rawInput) }, [result, doGenerate])

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
            <span className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] cursor-pointer transition-colors">{t("header.pricing")}</span>
            <button className="bg-[var(--accent)] text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors">{t("header.login")}</button>
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
    </div>
  )
}
