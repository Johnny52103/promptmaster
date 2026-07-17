// Image generation service
// Supports: Mock + Replicate + OpenAI + Custom API (for Chinese models)
// Key priority: user's own key → system key → mock

// User's personal keys (set in settings modal, free for them)
const REPLICATE_KEY = "promptmaster_replicate_key"
const OPENAI_KEY = "promptmaster_openai_key"
const CUSTOM_URL = "promptmaster_custom_url"
const CUSTOM_KEY = "promptmaster_custom_key"
const CUSTOM_MODEL = "promptmaster_custom_model"

// System keys (set by product owner, costs user credits)
const SYS_REPLICATE_KEY = "promptmaster_sys_replicate"
const SYS_OPENAI_KEY = "promptmaster_sys_openai"
const SYS_CUSTOM_URL = "promptmaster_sys_custom_url"
const SYS_CUSTOM_KEY = "promptmaster_sys_custom_key"
const SYS_CUSTOM_MODEL = "promptmaster_sys_custom_model"

export interface ImageGenParams {
  prompt: string
  negativePrompt?: string
  modelId: string
  width?: number
  height?: number
}

export interface ImageGenResult {
  url: string
  model: string
  seed?: number
  duration?: number
}

// --- API Key Management ---

export function getReplicateKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(REPLICATE_KEY) || ""
}

export function setReplicateKey(key: string) {
  localStorage.setItem(REPLICATE_KEY, key)
}

export function getOpenAIKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(OPENAI_KEY) || ""
}

export function setOpenAIKey(key: string) {
  localStorage.setItem(OPENAI_KEY, key)
}

export function hasApiKey(): boolean {
  return !!(getReplicateKey() || getOpenAIKey() || getCustomKey())
}

// --- System Key Management (for product owner) ---

export function getSysReplicateKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(SYS_REPLICATE_KEY) || ""
}

export function setSysReplicateKey(key: string) {
  localStorage.setItem(SYS_REPLICATE_KEY, key)
}

export function getSysOpenAIKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(SYS_OPENAI_KEY) || ""
}

export function setSysOpenAIKey(key: string) {
  localStorage.setItem(SYS_OPENAI_KEY, key)
}

export function hasSysKey(): boolean {
  return !!(getSysReplicateKey() || getSysOpenAIKey() || getSysCustomKey())
}

// Key resolution: user's own key → system key → none
export function resolveReplicateKey(): string {
  return getReplicateKey() || getSysReplicateKey()
}

export function resolveOpenAIKey(): string {
  return getOpenAIKey() || getSysOpenAIKey()
}

// Whether user is using their own key (free) or system key (costs credits)
export function usingOwnKey(): boolean {
  return !!(getReplicateKey() || getOpenAIKey() || getCustomKey())
}

// --- Mock Image Generation ---

function generateMockImageUrl(params: ImageGenParams): string {
  // Create a data URL with a styled SVG that simulates a generated image
  const { prompt, modelId } = params
  const colors = [
    ["#1a1a2e", "#16213e", "#0f3460"],
    ["#2d1b69", "#11998e", "#38ef7d"],
    ["#fc466b", "#3f5efb", "#00b4db"],
    ["#0f0c29", "#302b63", "#24243e"],
    ["#1f4037", "#99f2c8", "#e0eafc"],
  ]
  const palette = colors[Math.floor(Math.random() * colors.length)]
  const gradient = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`
  const accent = palette[2]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" style="stop-color:${palette[0]}" />
        <stop offset="100%" style="stop-color:${palette[1]}" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" />
    <circle cx="800" cy="200" r="300" fill="${accent}" opacity="0.08" />
    <circle cx="200" cy="800" r="250" fill="${accent}" opacity="0.06" />
    <circle cx="500" cy="500" r="200" fill="${accent}" opacity="0.04" />
    <text x="512" y="420" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="rgba(255,255,255,0.85)" font-weight="600">Generated with</text>
    <text x="512" y="470" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" fill="rgba(212,168,67,0.9)" font-weight="500">PromptMaster AI + ${modelId.toUpperCase()}</text>
    <text x="512" y="540" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Mock preview - Add API key for real generation</text>
    <rect x="312" y="580" width="400" height="1" fill="rgba(255,255,255,0.08)" />
    <text x="512" y="620" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="rgba(255,255,255,0.3)">Prompt: ${escapeXml(prompt.slice(0, 80))}</text>
  </svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// --- Replicate API ---

async function generateWithReplicate(params: ImageGenParams): Promise<ImageGenResult> {
  const key = resolveReplicateKey()
  if (!key) throw new Error("No Replicate API key")

  // Map model IDs to Replicate model versions
  const modelMap: Record<string, string> = {
    flux: "black-forest-labs/flux-dev",
    sd: "stability-ai/sdxl",
    midjourney: "black-forest-labs/flux-dev", // fallback for MJ
  }

  const modelVersion = modelMap[params.modelId] || modelMap.flux

  const body: Record<string, any> = {
    version: modelVersion,
    input: {
      prompt: params.prompt,
      width: params.width || 1024,
      height: params.height || 1024,
      num_outputs: 1,
    },
  }

  if (params.negativePrompt && params.modelId !== "flux") {
    body.input.negative_prompt = params.negativePrompt
  }

  // Create prediction
  const startTime = Date.now()
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Replicate API error: ${err}`)
  }

  const prediction = await createRes.json()

  // Poll for completion
  let output: string | null = null
  for (let i = 0; i < 60; i++) {
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      { headers: { Authorization: `Bearer ${key}` } }
    )
    const pollData = await pollRes.json()

    if (pollData.status === "succeeded") {
      output = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output
      break
    }
    if (pollData.status === "failed") throw new Error("Replicate generation failed")
    await new Promise((r) => setTimeout(r, 1000))
  }

  if (!output) throw new Error("Generation timeout")

  return {
    url: output,
    model: params.modelId,
    duration: Date.now() - startTime,
  }
}

// --- OpenAI DALL-E 3 API ---

async function generateWithOpenAI(params: ImageGenParams): Promise<ImageGenResult> {
  const key = resolveOpenAIKey()
  if (!key) throw new Error("No OpenAI API key")

  const startTime = Date.now()
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: params.prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data = await res.json()
  return {
    url: data.data[0].url,
    model: "dall-e-3",
    duration: Date.now() - startTime,
  }
}

// --- Unified Interface ---

// --- Custom API (for Chinese models like 即梦/豆包/通义万相) ---

export interface CustomAPIConfig {
  url: string
  key: string
  model: string
}

// User's custom API
export function getCustomUrl(): string { return typeof window !== "undefined" ? localStorage.getItem(CUSTOM_URL) || "" : "" }
export function setCustomUrl(v: string) { localStorage.setItem(CUSTOM_URL, v) }
export function getCustomKey(): string { return typeof window !== "undefined" ? localStorage.getItem(CUSTOM_KEY) || "" : "" }
export function setCustomKey(v: string) { localStorage.setItem(CUSTOM_KEY, v) }
export function getCustomModel(): string { return typeof window !== "undefined" ? localStorage.getItem(CUSTOM_MODEL) || "" : "" }
export function setCustomModel(v: string) { localStorage.setItem(CUSTOM_MODEL, v) }

// System custom API
export function getSysCustomUrl(): string { return typeof window !== "undefined" ? localStorage.getItem(SYS_CUSTOM_URL) || "" : "" }
export function setSysCustomUrl(v: string) { localStorage.setItem(SYS_CUSTOM_URL, v) }
export function getSysCustomKey(): string { return typeof window !== "undefined" ? localStorage.getItem(SYS_CUSTOM_KEY) || "" : "" }
export function setSysCustomKey(v: string) { localStorage.setItem(SYS_CUSTOM_KEY, v) }
export function getSysCustomModel(): string { return typeof window !== "undefined" ? localStorage.getItem(SYS_CUSTOM_MODEL) || "" : "" }
export function setSysCustomModel(v: string) { localStorage.setItem(SYS_CUSTOM_MODEL, v) }

// Resolve custom API config
export function resolveCustomConfig(): CustomAPIConfig | null {
  const url = getCustomUrl() || getSysCustomUrl()
  const key = getCustomKey() || getSysCustomKey()
  const model = getCustomModel() || getSysCustomModel()
  if (!url || !key) return null
  return { url, key, model: model || "default" }
}

export function usingOwnCustomKey(): boolean {
  return !!getCustomKey()
}

// --- Custom API generation via server proxy (avoids browser CORS) ---

async function generateWithCustom(params: ImageGenParams): Promise<ImageGenResult> {
  const config = resolveCustomConfig()
  const startTime = Date.now()

  // If config exists and has real keys (not "server" placeholder), send them
  // Otherwise leave fields empty so server-side uses env vars
  const payload: Record<string, string> = {
    prompt: params.prompt,
    ...(params.negativePrompt ? { negativePrompt: params.negativePrompt } : {}),
  }
  if (config && config.key !== "server") {
    payload.apiUrl = config.url
    payload.apiKey = config.key
    payload.model = config.model
  }

  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return {
    url: data.url,
    model: data.model || config?.model || "custom",
    duration: Date.now() - startTime,
  }
}

export type ImageGenProvider = "mock" | "replicate" | "openai" | "custom"

// Map model ID to the provider that can generate it
// Checks: user's own key → system key → mock
export function getModelProvider(modelId: string): ImageGenProvider {
  const replicateModels = ["flux", "sd"]
  const openaiModels = ["dalle3"]
  const customModels = ["custom", "jimeng", "doubao", "tongyi", "hunyuan"]
  // midjourney, firefly, ideogram — no public API, always fallback to mock

  if (customModels.includes(modelId) && (resolveCustomConfig() || getSysCustomKey() === "server")) return "custom"
  if (resolveReplicateKey() && replicateModels.includes(modelId)) return "replicate"
  if (resolveOpenAIKey() && openaiModels.includes(modelId)) return "openai"
  return "mock"
}

// What each provider supports
export interface ProviderCapability {
  id: ImageGenProvider
  label: string
  keyPrefix: string
  keyHint: string
  models: string[]
  link: string
  linkLabel: string
}

export const providerCapabilities: ProviderCapability[] = [
  {
    id: "replicate",
    label: "Replicate",
    keyPrefix: "r8_",
    keyHint: "Paste your Replicate API token",
    models: ["Flux", "Stable Diffusion (SDXL)"],
    link: "https://replicate.com/account/api-tokens",
    linkLabel: "Get Replicate token →",
  },
  {
    id: "openai",
    label: "OpenAI",
    keyPrefix: "sk-",
    keyHint: "Paste your OpenAI API key",
    models: ["DALL·E 3"],
    link: "https://platform.openai.com/api-keys",
    linkLabel: "Get OpenAI key →",
  },
  {
    id: "custom",
    label: "Custom API",
    keyPrefix: "",
    keyHint: "For Chinese models: 即梦 / 豆包 / 通义万相",
    models: ["Any OpenAI-compatible API"],
    link: "",
    linkLabel: "",
  },
]

// Which models can actually generate images right now
// Returns whether real generation is possible and via which key source
export function getModelGenStatus(modelId: string): { canGen: boolean; via?: string; keySource?: "user" | "system"; note?: string } {
  const map: Record<string, { provider: string; note?: string }> = {
    flux: { provider: "Replicate" },
    sd: { provider: "Replicate" },
    dalle3: { provider: "OpenAI" },
    midjourney: { provider: "", note: "No public API" },
    firefly: { provider: "", note: "No public API" },
    ideogram: { provider: "", note: "No public API" },
    custom: { provider: "Custom" },
    jimeng: { provider: "Custom" },
    doubao: { provider: "Custom" },
  }
  const info = map[modelId]
  if (!info) return { canGen: false, note: "Unknown model" }
  if (!info.provider) return { canGen: false, note: info.note }

  let userKey = "", sysKey = ""
  if (info.provider === "Replicate") { userKey = getReplicateKey(); sysKey = getSysReplicateKey() }
  else if (info.provider === "OpenAI") { userKey = getOpenAIKey(); sysKey = getSysOpenAIKey() }
  else if (info.provider === "Custom") { userKey = getCustomKey(); sysKey = getSysCustomKey() }

  if (userKey) return { canGen: true, via: info.provider, keySource: "user" }
  if (sysKey) return { canGen: true, via: info.provider, keySource: "system" }
  // Check if server has keys configured via env vars (stored as "server" placeholder)
  if (info.provider === "Custom" && (getSysCustomKey() === "server")) return { canGen: true, via: "Server", keySource: "system" }
  return { canGen: false, via: info.provider, note: `Add ${info.provider} key` }
}

export function detectProvider(): ImageGenProvider {
  if (resolveReplicateKey()) return "replicate"
  if (resolveOpenAIKey()) return "openai"
  return "mock"
}

export async function generateImage(params: ImageGenParams): Promise<ImageGenResult> {
  const provider = getModelProvider(params.modelId)

  switch (provider) {
    case "replicate":
      return generateWithReplicate(params)
    case "openai":
      return generateWithOpenAI(params)
    case "custom":
      return generateWithCustom(params)
    case "mock":
    default: {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))
      return {
        url: generateMockImageUrl(params),
        model: `${params.modelId} (mock)`,
        seed: Math.floor(Math.random() * 1000000),
      }
    }
  }
}
