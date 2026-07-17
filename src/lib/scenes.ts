// Scene definitions: fields, options, and prompt templates

export interface FieldOption {
  label: string
  value: string
  keywords: string[] // words that can trigger this option
}

export interface SceneField {
  key: string
  label: string
  options: FieldOption[]
}

export interface SceneConfig {
  id: string
  label: string
  description: string
  fields: SceneField[]
  template: string
  negativePromptTemplate: string
}

export const characterFields: SceneField[] = [
  {
    key: "identity",
    label: "Identity",
    options: [
      { label: "Warrior", value: "warrior", keywords: ["warrior", "fighter", "soldier", "combatant"] },
      { label: "Wizard", value: "wizard", keywords: ["wizard", "mage", "sorcerer", "magician", "spellcaster"] },
      { label: "Rogue", value: "rogue", keywords: ["rogue", "thief", "assassin", "stealth"] },
      { label: "Knight", value: "knight", keywords: ["knight", "paladin", "crusader", "holy"] },
      { label: "Cyborg", value: "cyborg", keywords: ["cyborg", "robot", "android", "mech", "cyber"] },
      { label: "Elf", value: "elf", keywords: ["elf", "elven", "fairy", "fae"] },
      { label: "Dwarf", value: "dwarf", keywords: ["dwarf", "dwarven"] },
      { label: "Samurai", value: "samurai", keywords: ["samurai", "ronin", "katana", "japanese warrior"] },
      { label: "Necromancer", value: "necromancer", keywords: ["necromancer", "dark mage", "undead", "death knight"] },
    ],
  },
  {
    key: "appearance",
    label: "Appearance",
    options: [
      { label: "Silver hair, golden eyes", value: "silver hair and luminous golden eyes", keywords: ["silver hair", "golden eyes", "blonde"] },
      { label: "Scarred face, weathered", value: "a scarred weathered face with deep-set eyes", keywords: ["scarred", "weathered", "scar", "old"] },
      { label: "Pale skin, dark hair", value: "pale skin with long dark flowing hair", keywords: ["pale", "dark hair", "black hair"] },
      { label: "Tattooed, fierce", value: "intricate tattoos covering weathered skin", keywords: ["tattoo", "inked", "marked"] },
      { label: "Youthful, elegant", value: "youthful elegant features with bright eyes", keywords: ["young", "youthful", "elegant", "beautiful"] },
    ],
  },
  {
    key: "outfit",
    label: "Outfit",
    options: [
      { label: "Mithril armor", value: "intricately engraved mithril armor", keywords: ["armor", "mithril", "plate", "heavy"] },
      { label: "Flowing robes", value: "flowing silk robes with embroidered patterns", keywords: ["robe", "robe", "cloth", "silk", "flowing"] },
      { label: "Leather tunic", value: "worn leather tunic with steel pauldrons", keywords: ["leather", "tunic", "light armor"] },
      { label: "Dark cloak", value: "a dark hooded cloak over shadow-touched gear", keywords: ["cloak", "hood", "shadow", "dark"] },
      { label: "Ceremonial attire", value: "ornate ceremonial garb with gold trim", keywords: ["ceremonial", "formal", "noble", "royal"] },
    ],
  },
  {
    key: "pose",
    label: "Pose",
    options: [
      { label: "Standing tall", value: "standing tall with weapon at the ready", keywords: ["stand", "standing", "upright"] },
      { label: "In combat", value: "in a dynamic combat stance, mid-swing", keywords: ["fight", "combat", "battle", "attack", "swing"] },
      { label: "Sitting thoughtfully", value: "sitting thoughtfully on ruins, gazing into the distance", keywords: ["sit", "sitting", "rest", "thoughtful"] },
      { label: "Running", value: "running forward with momentum", keywords: ["run", "running", "sprint", "charge"] },
      { label: "Kneeling", value: "kneeling on one knee, head bowed", keywords: ["kneel", "kneeling", "pray", "submission"] },
    ],
  },
  {
    key: "emotion",
    label: "Emotion",
    options: [
      { label: "Stoic", value: "stoic and unreadable expression", keywords: ["stoic", "unreadable", "emotionless", "cold"] },
      { label: "Fierce", value: "fierce and intense expression", keywords: ["fierce", "angry", "intense", "rage"] },
      { label: "Calm", value: "calm and serene expression", keywords: ["calm", "serene", "peaceful", "tranquil"] },
      { label: "Mysterious", value: "mysterious and knowing expression", keywords: ["mysterious", "mystery", "enigmatic", "subtle smile"] },
      { label: "Melancholic", value: "melancholic and sorrowful expression", keywords: ["sad", "melancholy", "sorrow", "grief", "lonely"] },
    ],
  },
  {
    key: "environment",
    label: "Environment",
    options: [
      { label: "Misty forest", value: "a misty ancient forest with towering trees", keywords: ["forest", "woods", "trees", "mist"] },
      { label: "Ancient castle", value: "an ancient crumbling stone castle", keywords: ["castle", "fortress", "ruins", "stone"] },
      { label: "Volcanic wasteland", value: "a volcanic wasteland with glowing lava rivers", keywords: ["volcano", "lava", "fire", "wasteland", "hell"] },
      { label: "Celestial realm", value: "a celestial realm floating among the stars", keywords: ["celestial", "stars", "space", "cosmic", "heaven"] },
      { label: "Dark ruins", value: "dark overgrown ruins at twilight", keywords: ["ruin", "ruins", "dark", "twilight", "dusk"] },
    ],
  },
  {
    key: "lighting",
    label: "Lighting",
    options: [
      { label: "Golden hour", value: "warm golden hour sunlight filtering through", keywords: ["golden hour", "sunset", "sunrise", "warm light"] },
      { label: "Moonlight", value: "pale moonlight casting long shadows", keywords: ["moonlight", "night", "moon", "dark"] },
      { label: "Dramatic side light", value: "dramatic side lighting creating strong contrast", keywords: ["dramatic", "contrast", "side light", "chiaroscuro"] },
      { label: "Ethereal glow", value: "an ethereal magical glow emanating from within", keywords: ["glow", "magic", "ethereal", "radiant"] },
      { label: "Neon", value: "vibrant neon lights casting colored shadows", keywords: ["neon", "cyberpunk", "colorful", "vibrant"] },
    ],
  },
  {
    key: "camera",
    label: "Camera",
    options: [
      { label: "Extreme close-up", value: "extreme close-up on the face, shallow depth of field", keywords: ["close-up", "close up", "face", "portrait", "detail"] },
      { label: "Wide angle", value: "wide angle shot showing the full scene", keywords: ["wide", "wide angle", "full", "establishing"] },
      { label: "Medium shot", value: "medium shot from waist up", keywords: ["medium shot", "waist", "half body", "mid shot"] },
      { label: "Low angle", value: "low angle shot looking upward for an imposing presence", keywords: ["low angle", "looking up", "imposing", "from below"] },
    ],
  },
  {
    key: "style",
    label: "Style",
    options: [
      { label: "Photorealistic", value: "photorealistic, hyperdetailed", keywords: ["realistic", "photorealistic", "photo", "real"] },
      { label: "Anime", value: "anime style, cel-shaded", keywords: ["anime", "manga", "japanese", "cel shade"] },
      { label: "Ink wash", value: "traditional ink wash painting style", keywords: ["ink", "watercolor", "ink wash", "brush"] },
      { label: "3D render", value: "octane render, 3D render, highly detailed", keywords: ["3d", "render", "octane", "blender"] },
      { label: "Cinematic", value: "cinematic, film grain, dramatic composition", keywords: ["cinematic", "film", "movie"] },
      { label: "Oil painting", value: "oil on canvas, thick brushstrokes, painterly", keywords: ["oil", "painting", "canvas", "paint"] },
    ],
  },
]

export const carFields: SceneField[] = [
  {
    key: "vehicle_type",
    label: "Vehicle Type",
    options: [
      { label: "Sports car", value: "sports car", keywords: ["sports car", "sportscar", "coupe"] },
      { label: "Hypercar", value: "hypercar", keywords: ["hypercar", "hypersport"] },
      { label: "Concept car", value: "concept car", keywords: ["concept", "prototype"] },
      { label: "Classic muscle", value: "classic american muscle car", keywords: ["muscle", "classic", "vintage", "american"] },
      { label: "Supercar", value: "supercar", keywords: ["supercar", "high performance", "exotic"] },
      { label: "Luxury sedan", value: "luxury sedan", keywords: ["sedan", "luxury", "executive"] },
    ],
  },
  {
    key: "body_shape",
    label: "Body Shape",
    options: [
      { label: "Sleek aerodynamic", value: "sleek aerodynamic body with smooth curves", keywords: ["sleek", "aerodynamic", "smooth", "curves"] },
      { label: "Aggressive wide-body", value: "aggressive wide-body stance with flared fenders", keywords: ["aggressive", "wide-body", "widebody", "stance"] },
      { label: "Elegant flowing", value: "elegant flowing lines along the body", keywords: ["elegant", "flowing", "graceful"] },
      { label: "Angular futuristic", value: "sharp angular futuristic body panels", keywords: ["angular", "sharp", "futuristic", "geometric"] },
    ],
  },
  {
    key: "material",
    label: "Material & Finish",
    options: [
      { label: "Carbon fiber", value: "exposed carbon fiber weave body panels", keywords: ["carbon fiber", "carbon", "cf"] },
      { label: "Brushed metal", value: "brushed metal surface with matte finish", keywords: ["brushed", "metal", "matte", "steel"] },
      { label: "Pearl paint", value: "deep pearl paint with metallic flake", keywords: ["pearl", "paint", "metallic", "gloss"] },
      { label: "Chrome", value: "mirror-polished chrome reflecting the surroundings", keywords: ["chrome", "mirror", "polished", "shiny"] },
      { label: "Matte finish", value: "sleek matte finish with satin sheen", keywords: ["matte", "satin", "flat"] },
    ],
  },
  {
    key: "lighting_car",
    label: "Lighting",
    options: [
      { label: "Studio lighting", value: "clean studio lighting with soft reflections", keywords: ["studio", "clean", "soft"] },
      { label: "Golden hour", value: "warm golden hour sunlight glinting off the body", keywords: ["golden hour", "sunset", "warm"] },
      { label: "Neon city", value: "neon city lights reflecting on wet streets", keywords: ["neon", "city", "night", "urban", "wet"] },
      { label: "Dramatic spotlight", value: "dramatic spotlight from above creating shadows", keywords: ["spotlight", "dramatic", "stage"] },
      { label: "Overcast", value: "soft overcast lighting, diffused and even", keywords: ["overcast", "cloudy", "diffused", "soft"] },
    ],
  },
  {
    key: "camera_angle",
    label: "Camera Angle",
    options: [
      { label: "Front 3/4", value: "front three-quarter view showcasing the front fascia and side profile", keywords: ["front", "3/4", "three quarter"] },
      { label: "Side profile", value: "side profile emphasizing the silhouette and body lines", keywords: ["side", "profile", "silhouette"] },
      { label: "Low angle", value: "low angle shot making the car look imposing", keywords: ["low", "from below", "imposing"] },
      { label: "Aerial/drone", value: "aerial top-down view capturing the full layout", keywords: ["aerial", "top down", "drone", "bird eye"] },
      { label: "Rear 3/4", value: "rear three-quarter view highlighting the taillights and rear diffuser", keywords: ["rear", "back", "behind"] },
    ],
  },
  {
    key: "environment_car",
    label: "Environment",
    options: [
      { label: "City street", value: "parked on a wet city street at night with city lights", keywords: ["city", "street", "urban", "downtown"] },
      { label: "Desert highway", value: "cruising on an empty desert highway at sunset", keywords: ["desert", "highway", "road", "highway", "asphalt"] },
      { label: "Racetrack", value: "on a professional racetrack at high speed", keywords: ["track", "racetrack", "race", "circuit"] },
      { label: "Futuristic city", value: "in a futuristic cyberpunk city with holographic billboards", keywords: ["futuristic", "cyberpunk", "neon", "hologram"] },
      { label: "Mountain road", value: "on a winding mountain road overlooking a valley", keywords: ["mountain", "winding", "road", "cliff", "valley"] },
      { label: "Showroom", value: "in a minimalist luxury showroom with spotlights", keywords: ["showroom", "exhibition", "display", "gallery"] },
    ],
  },
  {
    key: "design_language",
    label: "Design Language",
    options: [
      { label: "Futuristic", value: "futuristic design language with LED accents and clean surfaces", keywords: ["futuristic", "future", "sci-fi"] },
      { label: "Retro", value: "retro-inspired design with classic proportions", keywords: ["retro", "vintage", "classic", "heritage"] },
      { label: "Minimalist", value: "minimalist design with no unnecessary lines", keywords: ["minimal", "clean", "simple", "less is more"] },
      { label: "Aggressive", value: "aggressive design with large air intakes and diffusers", keywords: ["aggressive", "mean", "race-inspired"] },
      { label: "Cyberpunk", value: "cyberpunk aesthetic with exposed mechanics and tech", keywords: ["cyberpunk", "tech", "mechanical"] },
    ],
  },
  {
    key: "render_style",
    label: "Render Style",
    options: [
      { label: "Photorealistic", value: "photorealistic, hyperdetailed, 8K", keywords: ["realistic", "photo", "reality"] },
      { label: "Concept art", value: "concept art, design sketch, marker rendering", keywords: ["concept", "sketch", "design", "marker"] },
      { label: "3D render", value: "octane render, 3D render, ray tracing", keywords: ["3d", "render", "octane", "blender", "c4d"] },
      { label: "Cinematic", value: "cinematic, anamorphic, filmic color grade", keywords: ["cinematic", "film", "movie", "anamorphic"] },
      { label: "Automotive photography", value: "automotive photography, DSLR, long exposure", keywords: ["photography", "dslr", "lens", "camera"] },
    ],
  },
]

// --- Product Scene ---
export const productFields: SceneField[] = [
  {
    key: "product_type",
    label: "Product Type",
    options: [
      { label: "Smartphone", value: "sleek smartphone", keywords: ["phone", "smartphone", "mobile", "iphone", "cell"] },
      { label: "Watch", value: "elegant wristwatch", keywords: ["watch", "wristwatch", "clock", "timepiece"] },
      { label: "Perfume bottle", value: "luxury perfume bottle", keywords: ["perfume", "fragrance", "bottle", "scent"] },
      { label: "Sneakers", value: "premium sneakers", keywords: ["sneaker", "shoe", "footwear", "trainer"] },
      { label: "Furniture", value: "minimalist furniture piece", keywords: ["furniture", "chair", "table", "sofa"] },
      { label: "Jewelry", value: "fine jewelry", keywords: ["jewelry", "ring", "necklace", "diamond", "gold"] },
      { label: "Electronics", value: "sleek electronic device", keywords: ["electronic", "gadget", "headphone", "speaker", "laptop"] },
      { label: "Bottle", value: "minimalist bottle", keywords: ["bottle", "container", "packaging", "water"] },
      { label: "Cosmetics", value: "cosmetic product", keywords: ["cosmetic", "skincare", "lipstick", "cream", "makeup"] },
    ],
  },
  {
    key: "material_product",
    label: "Material",
    options: [
      { label: "Glass", value: "frosted glass with metallic accents", keywords: ["glass", "transparent", "frosted"] },
      { label: "Metal", value: "brushed metal with satin finish", keywords: ["metal", "aluminum", "steel", "titanium"] },
      { label: "Leather", value: "premium stitched leather", keywords: ["leather", "stitch", "texture"] },
      { label: "Ceramic", value: "smooth ceramic with glossy glaze", keywords: ["ceramic", "porcelain", "pottery"] },
      { label: "Plastic", value: "high-gloss plastic", keywords: ["plastic", "polycarbonate", "resin"] },
      { label: "Wood", value: "natural wood grain", keywords: ["wood", "walnut", "oak", "timber"] },
      { label: "Fabric", value: "woven fabric texture", keywords: ["fabric", "textile", "cloth", "canvas"] },
    ],
  },
  {
    key: "lighting_product",
    label: "Lighting",
    options: [
      { label: "Soft studio", value: "soft studio lighting with diffused shadows", keywords: ["studio", "soft", "diffused"] },
      { label: "Dramatic", value: "dramatic side lighting with deep shadows", keywords: ["dramatic", "contrast", "shadow"] },
      { label: "Natural", value: "soft natural window light", keywords: ["natural", "window", "daylight"] },
      { label: "Rim light", value: "rim lighting with edge highlights", keywords: ["rim", "edge", "highlight", "backlight"] },
      { label: "Colorful", value: "colorful gradient lighting", keywords: ["color", "gradient", "vibrant", "colorful"] },
    ],
  },
  {
    key: "camera_product",
    label: "Camera Angle",
    options: [
      { label: "Front-on", value: "front-on straight view", keywords: ["front", "straight", "face"] },
      { label: "45-degree", value: "45-degree angled view", keywords: ["45", "angle", "three quarter"] },
      { label: "Top-down", value: "top-down flat lay view", keywords: ["top", "top down", "flat lay", "overhead"] },
      { label: "Macro", value: "extreme macro close-up detail", keywords: ["macro", "detail", "close-up", "extreme"] },
      { label: "Hero shot", value: "hero shot from slightly above", keywords: ["hero", "hero shot", "above", "slightly above"] },
    ],
  },
  {
    key: "background_product",
    label: "Background",
    options: [
      { label: "White minimal", value: "pure white seamless background", keywords: ["white", "clean", "minimal", "seamless"] },
      { label: "Gradient", value: "smooth color gradient background", keywords: ["gradient", "fade", "smooth"] },
      { label: "Textured", value: "subtle textured surface background", keywords: ["texture", "surface", "marble", "concrete"] },
      { label: "Lifestyle", value: "lifestyle setting with natural elements", keywords: ["lifestyle", "setting", "environmental"] },
      { label: "Dark premium", value: "dark premium background with moody lighting", keywords: ["dark", "premium", "moody", "black"] },
    ],
  },
  {
    key: "style_product",
    label: "Style",
    options: [
      { label: "Minimal", value: "clean minimalist product photography", keywords: ["minimal", "clean", "simple"] },
      { label: "Luxury", value: "premium luxury commercial photography", keywords: ["luxury", "premium", "high-end"] },
      { label: "Editorial", value: "editorial style with artistic composition", keywords: ["editorial", "fashion", "artistic"] },
      { label: "Cinematic", value: "cinematic product shot with dramatic depth", keywords: ["cinematic", "dramatic", "film"] },
      { label: "Tech", value: "sleek tech product aesthetic", keywords: ["tech", "modern", "futuristic", "digital"] },
    ],
  },
]

// --- General/Universal Scene ---
export const generalFields: SceneField[] = [
  {
    key: "mood",
    label: "Mood",
    options: [
      { label: "Epic", value: "epic and majestic atmosphere", keywords: ["epic", "majestic", "grand", "monumental"] },
      { label: "Serene", value: "serene and peaceful atmosphere", keywords: ["serene", "peaceful", "calm", "tranquil"] },
      { label: "Dark", value: "dark and mysterious atmosphere", keywords: ["dark", "mysterious", "gloomy", "ominous"] },
      { label: "Vibrant", value: "vibrant and energetic atmosphere", keywords: ["vibrant", "energetic", "colorful", "lively"] },
      { label: "Romantic", value: "romantic and dreamy atmosphere", keywords: ["romantic", "dreamy", "soft", "ethereal"] },
      { label: "Melancholic", value: "melancholic and atmospheric", keywords: ["melancholic", "melancholy", "somber", "nostalgic"] },
    ],
  },
  {
    key: "lighting_general",
    label: "Lighting",
    options: [
      { label: "Golden hour", value: "warm golden hour lighting", keywords: ["golden", "sunset", "sunrise", "warm"] },
      { label: "Moonlight", value: "moonlight with blue tones", keywords: ["moon", "moonlight", "night", "blue"] },
      { label: "Studio", value: "clean studio lighting", keywords: ["studio", "clean", "controlled"] },
      { label: "Dramatic", value: "dramatic chiaroscuro lighting", keywords: ["dramatic", "chiaroscuro", "contrast", "dark"] },
      { label: "Natural", value: "soft natural daylight", keywords: ["natural", "day", "daylight", "soft"] },
    ],
  },
  {
    key: "color_palette",
    label: "Color Palette",
    options: [
      { label: "Warm", value: "warm amber and gold tones", keywords: ["warm", "amber", "gold", "orange"] },
      { label: "Cool", value: "cool blue and teal tones", keywords: ["cool", "blue", "teal", "cold"] },
      { label: "Monochrome", value: "black and white monochrome", keywords: ["mono", "black and white", "bw", "greyscale"] },
      { label: "Pastel", value: "soft pastel colors", keywords: ["pastel", "soft", "gentle", "muted"] },
      { label: "Neon", value: "vibrant neon colors", keywords: ["neon", "cyberpunk", "vibrant", "glow"] },
    ],
  },
  {
    key: "style_general",
    label: "Visual Style",
    options: [
      { label: "Photorealistic", value: "photorealistic with incredible detail", keywords: ["realistic", "real", "photo", "photorealistic"] },
      { label: "Cinematic", value: "cinematic with dramatic composition", keywords: ["cinematic", "film", "movie"] },
      { label: "Artistic", value: "artistic with creative interpretation", keywords: ["artistic", "creative", "abstract"] },
      { label: "Minimalist", value: "minimalist with clean composition", keywords: ["minimal", "simple", "clean"] },
      { label: "Surreal", value: "surreal and dreamlike imagery", keywords: ["surreal", "dream", "fantasy", "impossible"] },
    ],
  },
]

export const scenes: Record<string, SceneConfig> = {
  character: {
    id: "character",
    label: "Character",
    description: "Heroes, villains, fantasy figures, and character portraits",
    fields: characterFields,
    template: "A {emotion} {identity} with {appearance}, wearing {outfit}, {pose} in {environment} at {lighting}, captured in {camera}, {style}, hyperdetailed, epic composition",
    negativePromptTemplate: "ugly, deformed, blurry, low quality, distorted proportions, extra limbs, bad anatomy, watermark, text, signature, oversaturated, low contrast",
  },
  car: {
    id: "car",
    label: "Car & Vehicle",
    description: "Sports cars, hypercars, concept vehicles, and automotive design",
    fields: carFields,
    template: "A {body_shape} {vehicle_type} with {material}, shot in {lighting_car} from {camera_angle}. Set in {environment_car}. {design_language} design, {render_style}, unreal engine 5, 8K, ultra detailed, volumetric lighting",
    negativePromptTemplate: "blurry, low quality, distorted proportions, bad reflections, broken geometry, cheap, toy-like, cartoon, oversaturated, blown out highlights, lens flare",
  },
  product: {
    id: "product",
    label: "Product",
    description: "Commercial product shots, packaging, and still life photography",
    fields: productFields,
    template: "A {product_type} made of {material_product}, shot with {lighting_product} from {camera_product} angle on {background_product} background. {style_product}, 8K, hyperdetailed, commercial photography",
    negativePromptTemplate: "low quality, blurry, dirty, scratched, damaged, poor lighting, bad shadows, oversaturated, unnatural reflections, cluttered background",
  },
  general: {
    id: "general",
    label: "General",
    description: "Landscapes, scenes, concepts, and any other visual idea",
    fields: generalFields,
    template: "A {mood} scene bathed in {lighting_general} with a {color_palette} color palette. {style_general}, highly detailed, stunning composition, 8K",
    negativePromptTemplate: "ugly, blurry, low quality, distorted, bad composition, oversaturated, noisy, watermark, text, signature",
  },
}

export function getScene(sceneId: string): SceneConfig {
  return scenes[sceneId] || scenes.character
}

export function getAllScenes(): SceneConfig[] {
  return Object.values(scenes)
}
