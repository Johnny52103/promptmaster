// Model definitions and formatters

export interface ModelParam {
  key: string
  label: string
  value: string
}

export interface ModelConfig {
  id: string
  label: string
  shortLabel: string
  keywords: string[]         // for auto-detection from input
  description: string
  hasNegative: boolean       // supports negative prompt
  params: ModelParam[]       // default parameters
  formatFull: (positive: string, negative: string) => string
}

const models: ModelConfig[] = [
  {
    id: "midjourney",
    label: "Midjourney",
    shortLabel: "MJ",
    keywords: ["midjourney", "mj", "mj v6", "mj6"],
    description: "Best for artistic, creative, and stylized images",
    hasNegative: false,
    params: [
      { key: "ar", label: "AR", value: "16:9" },
      { key: "v", label: "V", value: "6.1" },
      { key: "style", label: "Style", value: "raw" },
      { key: "s", label: "S", value: "250" },
    ],
    formatFull: (positive) => {
      return `${positive} --ar 16:9 --v 6.1 --style raw --s 250`
    },
  },
  {
    id: "sd",
    label: "Stable Diffusion",
    shortLabel: "SD",
    keywords: ["sd", "stable diffusion", "stable-diffusion", "sdxl", "sd3", "automatic1111", "comfyui"],
    description: "Open-source, highly customizable, good for specific styles",
    hasNegative: true,
    params: [
      { key: "cfg", label: "CFG", value: "7" },
      { key: "sampler", label: "Sampler", value: "DPM++ 2M Karras" },
      { key: "steps", label: "Steps", value: "30" },
      { key: "size", label: "Size", value: "1024x1024" },
    ],
    formatFull: (positive, negative) => {
      return `Positive: ${positive}\nNegative: ${negative}\nCFG: 7, Sampler: DPM++ 2M Karras, Steps: 30, Size: 1024x1024`
    },
  },
  {
    id: "dalle3",
    label: "DALL·E 3",
    shortLabel: "DALL·E",
    keywords: ["dalle", "dall-e", "dalle3", "dall-e 3", "openai", "chatgpt"],
    description: "OpenAI's model, strong at natural language understanding",
    hasNegative: false,
    params: [
      { key: "quality", label: "Quality", value: "hd" },
      { key: "style", label: "Style", value: "vivid" },
      { key: "size", label: "Size", value: "1792x1024" },
    ],
    formatFull: (positive) => {
      return `${positive}`
    },
  },
  {
    id: "flux",
    label: "Flux",
    shortLabel: "Flux",
    keywords: ["flux", "flux-dev", "flux-pro", "black forest", "bfl"],
    description: "Black Forest Labs — high quality, fast growing",
    hasNegative: true,
    params: [
      { key: "cfg", label: "CFG", value: "3.5" },
      { key: "steps", label: "Steps", value: "28" },
      { key: "size", label: "Size", value: "1024x1024" },
      { key: "model", label: "Model", value: "flux-dev" },
    ],
    formatFull: (positive, negative) => {
      return `${positive}\nNegative: ${negative || "low quality, blurry"}\nCFG: 3.5, Steps: 28`
    },
  },
  {
    id: "firefly",
    label: "Adobe Firefly",
    shortLabel: "Firefly",
    keywords: ["firefly", "adobe firefly", "adobe"],
    description: "Adobe's commercial-safe generative AI",
    hasNegative: false,
    params: [
      { key: "style", label: "Style", value: "auto" },
      { key: "size", label: "Size", value: "1920x1080" },
      { key: "content", label: "Type", value: "photo" },
    ],
    formatFull: (positive) => {
      return positive
    },
  },
  {
    id: "ideogram",
    label: "Ideogram",
    shortLabel: "Ideo",
    keywords: ["ideogram", "ideogram.ai"],
    description: "Great at text rendering and graphic design",
    hasNegative: false,
    params: [
      { key: "style", label: "Style", value: "auto" },
      { key: "ar", label: "AR", value: "16:9" },
    ],
    formatFull: (positive) => {
      return positive
    },
  },
  {
    id: "doubao",
    label: "Doubao",
    shortLabel: "豆包",
    keywords: ["doubao", "豆包", "ark"],
    description: "ByteDance's AI image generation — fast, affordable, Chinese-friendly",
    hasNegative: false,
    params: [
      { key: "model", label: "Model", value: "doubao-vision-pro" },
      { key: "size", label: "Size", value: "1024x1024" },
    ],
    formatFull: (positive) => {
      return positive
    },
  },
]

export function getModel(id: string): ModelConfig {
  return models.find((m) => m.id === id) || models[0]
}

export function getAllModels(): ModelConfig[] {
  return models
}

export function getModelIds(): string[] {
  return models.map((m) => m.id)
}

export function detectModel(input: string): string {
  const low = input.toLowerCase()
  for (const model of models) {
    if (model.keywords.some((kw) => low.includes(kw))) {
      return model.id
    }
  }
  return "midjourney"
}

export function cycleModel(currentId: string): string {
  const ids = getModelIds()
  const idx = ids.indexOf(currentId)
  return ids[(idx + 1) % ids.length]
}

export function formatModelPrompt(modelId: string, positive: string, negative: string): string {
  const model = getModel(modelId)
  return model.formatFull(positive, negative)
}
