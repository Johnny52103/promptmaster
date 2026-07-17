export interface SEOPageConfig {
  slug: string; title: string; description: string; scene: string; model: string; h1: string; sampleInput: string
}

export const seoPages: SEOPageConfig[] = [
  { slug: "midjourney-prompt-generator", title: "Midjourney Prompt Generator — Free AI Prompt Optimizer", description: "Generate professional Midjourney prompts with optimal --ar --v --style --s parameters.", scene: "general", model: "midjourney", h1: "Midjourney Prompt Generator", sampleInput: "a mystical forest with glowing mushrooms" },
  { slug: "stable-diffusion-prompt-generator", title: "Stable Diffusion Prompt Generator — Positive & Negative", description: "Generate optimized SD prompts with positive/negative pairs and auto-configured settings.", scene: "general", model: "sd", h1: "Stable Diffusion Prompt Generator", sampleInput: "a fantasy landscape with floating islands" },
  { slug: "midjourney-character-prompt-generator", title: "Midjourney Character Prompt Generator — RPG Characters", description: "Create detailed character prompts with appearance, outfit, pose, environment for Midjourney.", scene: "character", model: "midjourney", h1: "Midjourney Character Prompt Generator", sampleInput: "a dark elf ranger with a bow in a mystical forest" },
  { slug: "midjourney-car-prompt-generator", title: "Midjourney Car Design Prompt Generator", description: "Generate realistic car design prompts with lighting, angles, and environment settings.", scene: "car", model: "midjourney", h1: "Midjourney Car Design Prompt Generator", sampleInput: "a red supercar on a mountain road at sunset" },
  { slug: "product-prompt-generator", title: "Product Photography Prompt Generator — Commercial", description: "professional product photography prompts with studio lighting and backgrounds.", scene: "product", model: "midjourney", h1: "Product Photography Prompt Generator", sampleInput: "a minimalist perfume bottle on marble surface" },
  { slug: "flux-prompt-generator", title: "Flux AI Prompt Generator — High Quality Prompts", description: "Generate optimized prompts for Flux AI models. Photorealistic with CFG settings.", scene: "general", model: "flux", h1: "Flux AI Prompt Generator", sampleInput: "a cinematic portrait of a warrior in golden hour" },
  { slug: "dalle3-prompt-generator", title: "DALL-E 3 Prompt Generator — Natural Language", description: "Create prompts optimized for DALL-E 3 natural language understanding.", scene: "general", model: "dalle3", h1: "DALL·E 3 Prompt Generator", sampleInput: "a surreal dreamscape with floating islands" },
]

export function findPage(slug: string): SEOPageConfig | undefined {
  return seoPages.find((p) => p.slug === slug)
}
