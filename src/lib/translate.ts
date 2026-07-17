// Multi-language input translation for prompt optimization
// Detects input language and translates common AI-image terms to English

export type LanguageFamily = "en" | "zh" | "ja" | "ko" | "es" | "fr" | "de" | "pt" | "it" | "ru" | "ar" | "la" | "other"

const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/
const japaneseKana = /[\u3040-\u309f\u30a0-\u30ff]/
const koreanRegex = /[\uac00-\ud7af\u1100-\u11ff]/
const cyrillic = /[\u0400-\u04ff]/
const arabicScript = /[\u0600-\u06ff\u0750-\u077f]/
const extendedLatin = /[\u00c0-\u024f]/

export function detectLanguage(input: string): LanguageFamily {
  const cleaned = input.trim().toLowerCase()

  // Check script composition
  const cjkCount = (cleaned.match(cjkRegex) || []).length
  const kanaCount = (cleaned.match(japaneseKana) || []).length
  const koCount = (cleaned.match(koreanRegex) || []).length
  const cyrCount = (cleaned.match(cyrillic) || []).length
  const araCount = (cleaned.match(arabicScript) || []).length
  const extLatCount = (cleaned.match(extendedLatin) || []).length
  const totalNonSpace = cleaned.replace(/\s/g, "").length

  if (totalNonSpace === 0) return "en"

  const cjkRatio = cjkCount / totalNonSpace
  const kanaRatio = kanaCount / totalNonSpace
  const koRatio = koCount / totalNonSpace

  // Japanese has hiragana/katakana
  if (kanaCount > 0 || (cjkCount > 0 && cleaned.includes("の"))) return "ja"
  // Korean
  if (koRatio > 0.3) return "ko"
  // Chinese (CJK without kana/ko)
  if (cjkRatio > 0.3) return "zh"

  // Cyrillic
  if (cyrCount > 0 && cyrCount / totalNonSpace > 0.3) return "ru"
  // Arabic
  if (araCount > 0 && araCount / totalNonSpace > 0.3) return "ar"

  // Split into words for language-specific detection
  const words = cleaned.split(/\s+/)

  // Extended Latin: check for common words in European languages
  if (extLatCount > 0) {
    // Try to identify specific European languages by common words
    const esWords = words.filter((w) =>
      /^(el|la|los|las|un|una|guerrero|mago|elfo|bosque|castillo|ciudad|coche|rojo|azul|verde)$/i.test(w)
    ).length
    const frWords = words.filter((w) =>
      /^(le|la|les|un|une|guerrier|mage|elfe|forêt|château|ville|voiture|rouge|bleu|vert)$/i.test(w)
    ).length
    const deWords = words.filter((w) =>
      /^(der|die|das|ein|eine|krieger|magier|elfe|wald|schloss|stadt|auto|rot|blau|grün)$/i.test(w)
    ).length
    const ptWords = words.filter((w) =>
      /^(o|a|os|as|um|uma|guerreiro|mago|elfo|floresta|castelo|cidade|carro|vermelho|azul|verde)$/i.test(w)
    ).length

    if (esWords > 0) return "es"
    if (frWords > 0) return "fr"
    if (deWords > 0 && deWords >= esWords && deWords >= frWords) return "de"
    if (ptWords > 0) return "pt"
    if (words.some((w) => /^(il|la|lo|guerriero|mago|castello|rosso|blu)$/i.test(w))) return "it"
  }

  // Latin detection (ASCII-based, must check distinct words)
  if (words.length >= 2) {
    const laScore = words.filter((w) =>
      /^(bellator|magus|sagittarius|eques|venator|custos|silva|castrum|gladius|arcus|hasta|scutum|ruber|albus|niger|aureus|caeruleus|currus|ignis|umbra|nox|lux|nox|mons|via|urbs|desertum|stella|mare|flumen|bellum|pax|vita|mors|cibus|ferrum|aurum|argentum|sacer|regnum|fortis|pulcher|magnus|parvus|celer|gravis|levis|aeternus)$/i.test(w)
    ).length
    if (laScore >= 1) return "la"
  }

  return "en"
}

// Translation dictionaries
const zhDict: Record<string, string> = {
  "战士": "warrior", "武士": "samurai", "骑士": "knight", "法师": "wizard",
  "魔法师": "wizard", "精灵": "elf", "暗夜精灵": "dark elf", "矮人": "dwarf",
  "游侠": "ranger", "弓箭手": "archer", "刺客": "assassin", "盗贼": "rogue",
  "死灵法师": "necromancer", "圣骑士": "paladin", "德鲁伊": "druid",
  "森林": "forest", "城堡": "castle", "废墟": "ruins", "城市": "city",
  "沙漠": "desert", "山脉": "mountain", "海洋": "ocean", "洞穴": "cave",
  "战场": "battlefield", "火山": "volcano", "天空": "sky", "星空": "starry sky",
  "剑": "sword", "弓": "bow", "盾牌": "shield", "法杖": "staff",
  "斧头": "axe", "匕首": "dagger", "长矛": "spear", "铠甲": "armor",
  "魔法": "magic", "火焰": "fire", "冰霜": "frost", "闪电": "lightning",
  "黑暗": "dark", "光明": "light", "神圣": "holy", "诅咒": "cursed",
  "红色": "red", "蓝色": "blue", "黑色": "black", "白色": "white",
  "金色": "golden", "银色": "silver", "绿色": "green",
  "汽车": "car", "跑车": "sports car", "赛车": "race car",
  "未来": "futuristic", "赛博朋克": "cyberpunk", "复古": "vintage",
  "豪华": "luxury", "概念车": "concept car",
  "日落": "sunset", "夜晚": "night", "霓虹": "neon",
}

const jaDict: Record<string, string> = {
  "戦士": "warrior", "武士": "samurai", "騎士": "knight", "魔法使い": "wizard",
  "魔術師": "wizard", "エルフ": "elf", "ドワーフ": "dwarf",
  "狩人": "hunter", "弓使い": "archer", "暗殺者": "assassin",
  "盗賊": "rogue", "死霊術師": "necromancer", "聖騎士": "paladin",
  "森": "forest", "城": "castle", "廃墟": "ruins", "都市": "city",
  "砂漠": "desert", "山": "mountain", "海": "ocean", "洞窟": "cave",
  "戦場": "battlefield", "火山": "volcano",
  "剣": "sword", "弓": "bow", "盾": "shield", "杖": "staff",
  "魔法": "magic", "炎": "fire", "氷": "ice", "雷": "lightning",
  "闇": "darkness", "光": "light", "呪い": "cursed",
  "赤": "red", "青": "blue", "黒": "black", "白": "white",
  "金": "golden", "銀": "silver",
  "車": "car", "スポーツカー": "sports car", "未来": "futuristic",
  "サイバーパンク": "cyberpunk", "レトロ": "vintage", "高級": "luxury",
  "夕日": "sunset", "夜": "night", "ネオン": "neon",
}

const koDict: Record<string, string> = {
  "전사": "warrior", "기사": "knight", "마법사": "wizard", "엘프": "elf",
  "난쟁이": "dwarf", "궁수": "archer", "암살자": "assassin", "도적": "rogue",
  "성기사": "paladin", "드루이드": "druid",
  "숲": "forest", "성": "castle", "폐허": "ruins", "도시": "city",
  "사막": "desert", "산": "mountain", "바다": "ocean", "동굴": "cave",
  "전장": "battlefield", "화산": "volcano",
  "검": "sword", "활": "bow", "방패": "shield", "지팡이": "staff",
  "마법": "magic", "불": "fire", "얼음": "ice", "번개": "lightning",
  "어둠": "darkness", "빛": "light", "저주": "cursed",
  "빨간": "red", "파란": "blue", "검은": "black", "하얀": "white",
  "금색": "golden", "은색": "silver",
  "자동차": "car", "스포츠카": "sports car", "미래": "futuristic",
  "사이버펑크": "cyberpunk", "빈티지": "vintage", "럭셔리": "luxury",
  "일몰": "sunset", "밤": "night", "네온": "neon",
}

function translateByDict(input: string, dict: Record<string, string>): string {
  let result = input
  // Sort keys by length (longest first) to prioritize more specific matches
  const sorted = Object.entries(dict).sort((a, b) => b[0].length - a[0].length)
  for (const [native, english] of sorted) {
    result = result.replace(new RegExp(native, "g"), english)
  }
  return result
}

export function translateInput(input: string): { original: string; translated: string; detected: LanguageFamily } {
  const detected = detectLanguage(input)

  if (detected === "en") {
    return { original: input, translated: input, detected }
  }

  let translated = input

  switch (detected) {
    case "zh":
      translated = translateByDict(translated, zhDict)
      break
    case "ja":
      translated = translateByDict(translated, jaDict)
      break
    case "ko":
      translated = translateByDict(translated, koDict)
      break
    case "es":
      translated = translateByDict(translated, {
        "guerrero": "warrior", "mago": "wizard", "elfo": "elf", "elfa": "elf",
        "enana": "dwarf", "enano": "dwarf", "caballero": "knight",
        "asesino": "assassin", "pícaro": "rogue", "paladín": "paladin",
        "bosque": "forest", "castillo": "castle", "ruinas": "ruins",
        "ciudad": "city", "desierto": "desert", "montaña": "mountain",
        "océano": "ocean", "ocaso": "sunset", "cueva": "cave",
        "espada": "sword", "arco": "bow", "escudo": "shield", "hacha": "axe",
        "magia": "magic", "fuego": "fire", "hielo": "ice", "relámpago": "lightning",
        "oscuro": "dark", "oscura": "dark", "luz": "light", "sagrado": "holy",
        "rojo": "red", "roja": "red", "azul": "blue", "negro": "black", "negra": "black",
        "blanco": "white", "blanca": "white", "dorado": "golden", "plateado": "silver",
        "coche": "car", "auto": "car", "deportivo": "sports",
        "futurista": "futuristic", "ciberpunk": "cyberpunk", "lujo": "luxury",
        "noche": "night", "atardecer": "sunset", "neón": "neon",
        "y": "", "el": "", "la": "", "los": "", "las": "", "un": "", "una": "", "en": "", "de": "", "del": "", "con": "",
      })
      break
    case "fr":
      translated = translateByDict(translated, {
        "guerrier": "warrior", "mages": "wizard", "mago": "wizard", "elfe": "elf",
        "naine": "dwarf", "nain": "dwarf", "chevalier": "knight",
        "assassin": "assassin", "voleur": "rogue", "paladin": "paladin",
        "forêt": "forest", "château": "castle", "ruines": "ruins",
        "ville": "city", "désert": "desert", "montagne": "mountain",
        "océan": "ocean", "grotte": "cave", "mer": "sea",
        "épée": "sword", "arc": "bow", "bouclier": "shield", "hache": "axe",
        "magie": "magic", "feu": "fire", "glace": "ice", "foudre": "lightning",
        "obscur": "dark", "obscure": "dark", "ténèbres": "darkness", "lumière": "light",
        "rouge": "red", "bleu": "blue", "noir": "black", "noire": "black",
        "blanc": "white", "blanche": "white", "doré": "golden", "argent": "silver",
        "voiture": "car", "sportive": "sports",
        "futuriste": "futuristic", "cyberpunk": "cyberpunk", "luxe": "luxury",
        "nuit": "night", "coucher": "sunset", "néon": "neon",
        "le": "", "la": "", "les": "", "un": "", "une": "", "des": "", "du": "", "de": "", "en": "", "dans": "", "sur": "", "avec": "",
      })
      break
    case "de":
      translated = translateByDict(translated, {
        "krieger": "warrior", "magier": "wizard", "zauberer": "wizard", "elfe": "elf",
        "zwerg": "dwarf", "ritter": "knight", "mörder": "assassin",
        "schurke": "rogue", "paladin": "paladin",
        "wald": "forest", "schloss": "castle", "ruinen": "ruins",
        "stadt": "city", "wüste": "desert", "berg": "mountain",
        "ozean": "ocean", "höhle": "cave",
        "schwert": "sword", "bogen": "bow", "schild": "shield", "axt": "axe",
        "magie": "magic", "feuer": "fire", "eis": "ice", "blitz": "lightning",
        "dunkel": "dark", "dunkle": "dark", "licht": "light", "heilig": "holy",
        "rot": "red", "blau": "blue", "schwarz": "black", "weiß": "white",
        "golden": "golden", "silber": "silver",
        "auto": "car", "sportwagen": "sports car",
        "futuristisch": "futuristic", "cyberpunk": "cyberpunk", "luxus": "luxury",
        "nacht": "night", "sonnenuntergang": "sunset", "neon": "neon",
        "der": "", "die": "", "das": "", "ein": "", "eine": "", "in": "", "auf": "", "mit": "",
      })
      break
    case "pt":
      translated = translateByDict(translated, {
        "guerreiro": "warrior", "mago": "wizard", "elfo": "elf", "elfa": "elf",
        "anao": "dwarf", "cavaleiro": "knight", "assassino": "assassin",
        "ladrao": "rogue", "paladino": "paladin",
        "floresta": "forest", "castelo": "castle", "ruinas": "ruins",
        "cidade": "city", "deserto": "desert", "montanha": "mountain",
        "oceano": "ocean", "caverna": "cave",
        "espada": "sword", "arco": "bow", "escudo": "shield", "magia": "magic",
        "fogo": "fire", "gelo": "ice", "relampago": "lightning",
        "escuro": "dark", "luz": "light",
        "vermelho": "red", "azul": "blue", "preto": "black", "branco": "white",
        "dourado": "golden", "prata": "silver",
        "carro": "car", "esportivo": "sports",
        "futurista": "futuristic", "ciberpunk": "cyberpunk", "luxo": "luxury",
        "noite": "night", "por do sol": "sunset", "neon": "neon",
        "o": "", "a": "", "os": "", "as": "", "um": "", "uma": "", "em": "", "de": "", "com": "",
      })
      break
    case "it":
      translated = translateByDict(translated, {
        "guerriero": "warrior", "mago": "wizard", "elfo": "elf", "nano": "dwarf",
        "cavaliere": "knight", "assassino": "assassin", "paladino": "paladin",
        "foresta": "forest", "castello": "castle", "rovine": "ruins",
        "città": "city", "deserto": "desert", "montagna": "mountain",
        "oceano": "ocean", "grotta": "cave",
        "spada": "sword", "arco": "bow", "scudo": "shield", "magia": "magic",
        "fuoco": "fire", "ghiaccio": "ice", "fulmine": "lightning",
        "oscuro": "dark", "luce": "light",
        "rosso": "red", "blu": "blue", "nero": "black", "bianco": "white",
        "dorato": "golden", "argento": "silver",
        "macchina": "car", "auto": "car", "sportiva": "sports",
        "futuristico": "futuristic", "cyberpunk": "cyberpunk", "lusso": "luxury",
        "notte": "night", "tramonto": "sunset", "neon": "neon",
        "il": "", "la": "", "lo": "", "un": "", "una": "", "in": "", "su": "", "con": "",
      })
      break
    case "ru":
      translated = translateByDict(translated, {
        "воин": "warrior", "маг": "wizard", "эльф": "elf", "рыцарь": "knight",
        "убийца": "assassin", "паладин": "paladin",
        "лес": "forest", "замок": "castle", "руины": "ruins",
        "город": "city", "пустыня": "desert", "гора": "mountain",
        "океан": "ocean", "пещера": "cave",
        "меч": "sword", "лук": "bow", "щит": "shield",
        "магия": "magic", "огонь": "fire", "лёд": "ice", "молния": "lightning",
        "тьма": "darkness", "свет": "light",
        "красный": "red", "синий": "blue", "чёрный": "black", "белый": "white",
        "золотой": "golden", "серебро": "silver",
        "машина": "car", "спорткар": "sports car",
        "футуристический": "futuristic", "киберпанк": "cyberpunk",
        "ночь": "night", "закат": "sunset", "неон": "neon",
      })
      break
    case "la":
      translated = translateByDict(translated, {
        "bellator": "warrior", "gladiator": "warrior", "miles": "soldier",
        "magus": "wizard", "sagittarius": "archer", "eques": "knight",
        "venator": "hunter", "custos": "guardian", "rex": "king", "regina": "queen",
        "silva": "forest", "castrum": "castle", "urbs": "city",
        "mons": "mountain", "desertum": "desert", "mare": "ocean", "stella": "star",
        "via": "road", "flumen": "river", "vallis": "valley",
        "gladius": "sword", "arcus": "bow", "hasta": "spear",
        "scutum": "shield", "ferrum": "sword", "framea": "spear",
        "ruber": "red", "albus": "white", "niger": "black",
        "aureus": "golden", "argenteus": "silver", "caeruleus": "blue", "viridis": "green",
        "currus": "car", "bellicum": "war", "pugna": "battle",
        "ignis": "fire", "aqua": "water", "umbra": "shadow", "umbrae": "shadow",
        "nox": "night", "lux": "light", "lumen": "light",
        "aeternus": "eternal", "fortis": "strong", "pulcher": "beautiful",
        "magnus": "great", "parvus": "small", "celer": "fast", "velox": "swift",
        "sacer": "sacred", "sanctus": "holy", "regnum": "kingdom",
        "vita": "life", "mors": "death", "caelum": "sky", "terra": "earth",
        "et": "", "in": "", "cum": "", "est": "", "per": "", "ad": "", "ex": "", "de": "",
      })
      break
  }

  // Clean up extra whitespace from removed words
  translated = translated.replace(/\s+/g, " ").trim()

  return { original: input, translated: translated || input, detected }
}

export function getLanguageName(family: LanguageFamily): string {
  const names: Record<LanguageFamily, string> = {
    en: "English", zh: "中文", ja: "日本語", ko: "한국어",
    es: "Español", fr: "Français", de: "Deutsch", pt: "Português",
    it: "Italiano", ru: "Русский", ar: "العربية", la: "Latina", other: "Unknown",
  }
  return names[family]
}
