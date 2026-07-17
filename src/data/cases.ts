// Before/After case studies

export interface CaseStudy {
  id: string
  scene: string
  title: string
  beforePrompt: string
  afterPrompt: string
  tags: string[]
}

export const caseStudies: CaseStudy[] = [
  {
    id: "case-1",
    scene: "character",
    title: "Dark Forest Warrior",
    beforePrompt: "a warrior in a forest",
    afterPrompt: "A stoic warrior with scarred face, wearing intricately engraved mithril armor, standing tall in a misty forest with dramatic side light, wide angle shot, photorealistic, hyperdetailed --ar 16:9 --v 6.1 --style raw --s 250",
    tags: ["fantasy", "warrior", "dark", "forest"],
  },
  {
    id: "case-2",
    scene: "character",
    title: "Mystical Elf Mage",
    beforePrompt: "an elf wizard casting magic",
    afterPrompt: "A serene elf with silver hair and luminous golden eyes, wearing flowing silk robes, casting a spell in an enchanted garden at ethereal glow, medium shot, cinematic --ar 3:4 --v 6.1 --style expressive --s 300",
    tags: ["elf", "mage", "magic", "fantasy"],
  },
  {
    id: "case-3",
    scene: "car",
    title: "Cyberpunk Hypercar",
    beforePrompt: "a futuristic car in a city",
    afterPrompt: "An aggressive futuristic hypercar with matte finish and neon accents, shot in vibrant neon city lighting from low angle. In a futuristic cyberpunk city. Cyberpunk design, cinematic, octane render, 8K --ar 16:9 --v 6.1 --style raw --s 250",
    tags: ["car", "cyberpunk", "hypercar", "night"],
  },
  {
    id: "case-4",
    scene: "car",
    title: "Classic Muscle on Highway",
    beforePrompt: "vintage muscle car on road",
    afterPrompt: "A sleek classic muscle car with deep pearl paint, shot in golden hour sunlight from front three-quarter view. Cruising on an empty desert highway at sunset. Retro design, automotive photography, hyperdetailed, 8K --ar 16:9 --v 6.1 --style raw --s 250",
    tags: ["car", "muscle", "classic", "sunset"],
  },
  {
    id: "case-5",
    scene: "character",
    title: "Cyber Samurai",
    beforePrompt: "samurai in neon city",
    afterPrompt: "A fierce samurai with intricate tattoos and dark flowing hair, wearing ornate ceremonial armor, in combat stance in a neon-lit cyberpunk alley at vibrant neon lighting, extreme close-up, cinematic, hyperdetailed --ar 3:4 --v 6.1 --style expressive --s 350",
    tags: ["samurai", "cyberpunk", "neon", "futuristic"],
  },
  {
    id: "case-6",
    scene: "car",
    title: "Showroom Supercar",
    beforePrompt: "supercar in a showroom",
    afterPrompt: "An elegant sleek supercar with brushed metal and matte finish, shot in clean studio lighting from side profile. In a minimalist luxury showroom with spotlights. Minimalist design, automotive photography, 8K --ar 16:9 --v 6.1 --style raw --s 200",
    tags: ["supercar", "luxury", "showroom", "studio"],
  },
  {
    id: "case-7",
    scene: "product",
    title: "Luxury Perfume",
    beforePrompt: "a perfume bottle on a table",
    afterPrompt: "A luxury perfume bottle made of frosted glass with metallic accents, shot with dramatic side lighting from macro angle on dark premium background. Luxury commercial photography, hyperdetailed, 8K --ar 3:4 --v 6.1 --style raw --s 200",
    tags: ["product", "perfume", "luxury", "commercial"],
  },
  {
    id: "case-8",
    scene: "product",
    title: "Minimalist Watch",
    beforePrompt: "a watch product photo",
    afterPrompt: "An elegant wristwatch made of brushed metal with satin finish, shot with soft studio lighting from 45-degree angle on pure white seamless background. Clean minimalist product photography, 8K --ar 16:9 --v 6.1 --style raw --s 200",
    tags: ["product", "watch", "minimal", "studio"],
  },
  {
    id: "case-9",
    scene: "general",
    title: "Mountain Lake at Dawn",
    beforePrompt: "a mountain lake scene",
    afterPrompt: "A serene and peaceful scene bathed in warm golden hour lighting with a warm amber and gold color palette. Photorealistic with incredible detail, highly detailed, stunning composition, 8K --ar 16:9 --v 6.1 --style raw --s 250",
    tags: ["landscape", "mountain", "nature", "serene"],
  },
  {
    id: "case-10",
    scene: "general",
    title: "Neon City Nightscape",
    beforePrompt: "a cyberpunk city at night",
    afterPrompt: "A vibrant and energetic scene bathed in vibrant neon lighting with a vibrant neon color palette. Cinematic with dramatic composition, highly detailed, stunning composition, 8K --ar 16:9 --v 6.1 --style raw --s 300",
    tags: ["cyberpunk", "city", "neon", "night"],
  },
]
