// Quality scoring engine

export interface ScoreBreakdown {
  specificity: number
  structure: number
  negativeQuality: number
  styleConsistency: number
}

export interface ScoreResult {
  total: number
  breakdown: ScoreBreakdown
}

function countSpecificTerms(text: string): number {
  // Count adjectives, colors, materials, and specific descriptors
  const specificPatterns = [
    /\b(?:silver|golden|pale|dark|bright|vibrant|deep|rich|matte|glossy|metallic|intricate|ornate|worn|ancient|flowing|sharp|sleek|elegant|aggressive|polished|ethereal|radiant|shadow|misty|neon|ceremonial|towering|glowing|winding|expansive|desolate|serene|majestic)\b/gi,
    /\b(?:ultra|hyper|highly|incredibly|strikingly|beautifully|exquisitely)\b/gi,
    /\b(?:8K|4K|UHD|HD)\b/g,
    /\b(?:photorealistic|hyperdetailed|cinematic|dramatic|painterly|artistic)\b/gi,
  ]

  let count = 0
  for (const pattern of specificPatterns) {
    const matches = text.match(pattern)
    if (matches) count += matches.length
  }
  return Math.min(count, 15)
}

function checkStructure(text: string): number {
  // Check if the prompt covers key structural elements
  const structuralElements = [
    /\b(?:wearing|adorned|clad|dressed|armor|robe|cloak|outfit|attire|gear)\b/i,
    /\b(?:in\s+(?:a|an|the)\s|within|amidst|surrounded|set\s+in)\b/i,
    /\b(?:lighting|light|illuminated|lit|sunlight|moonlight|neon|glow)\b/i,
    /\b(?:close.?up|wide|shot|angle|view|perspective|cinematic)\b/i,
    /\b(?:style|render|art|aesthetic|vibe|theme)\b/i,
    /\b(?:hyperdetailed|detailed|intricate|elaborate|complex)\b/i,
  ]

  let matched = 0
  for (const pattern of structuralElements) {
    if (pattern.test(text)) matched++
  }
  return Math.round((matched / structuralElements.length) * 100)
}

function evaluateNegativeQuality(text: string): number {
  if (!text || text.length < 10) return 40

  const negativeElements = [
    /\b(?:ugly|deformed|blurry|distorted|low quality|bad anatomy)\b/i,
    /\b(?:extra|unnecessary|unwanted|excess)\b/i,
    /\b(?:watermark|text|signature|logo)\b/i,
    /\b(?:oversaturated|noisy|grainy|pixelated)\b/i,
    /\b(?:poor|bad|terrible|awful)\b/i,
  ]

  let matched = 0
  for (const pattern of negativeElements) {
    if (pattern.test(text)) matched++
  }
  return Math.min(100, 40 + matched * 12)
}

function checkStyleConsistency(text: string): number {
  const styleKeywords = [
    /\b(?:photo|realistic|photorealistic|real|reality)\b/gi,
    /\b(?:anime|manga|cel.shade|cartoon|drawn)\b/gi,
    /\b(?:3D|render|octane|blender|c4d|unreal)\b/gi,
    /\b(?:cinematic|film|movie|anamorphic|drama)\b/gi,
    /\b(?:oil|watercolor|painting|ink|brush|canvas)\b/gi,
  ]

  let matchedStyles = 0
  for (const pattern of styleKeywords) {
    if (pattern.test(text)) matchedStyles++
  }

  // If no clear style, give a moderate score
  if (matchedStyles === 0) return 50
  // If multiple conflicting styles, reduce score
  if (matchedStyles >= 3) return 60
  // One or two consistent styles is ideal
  return 85
}

export function scorePrompt(positivePrompt: string, negativePrompt: string): ScoreResult {
  const specificity = Math.min(100, 30 + countSpecificTerms(positivePrompt) * 5)
  const structure = checkStructure(positivePrompt)
  const negativeQuality = evaluateNegativeQuality(negativePrompt)
  const styleConsistency = checkStyleConsistency(positivePrompt)

  const breakdown: ScoreBreakdown = {
    specificity,
    structure,
    negativeQuality,
    styleConsistency,
  }

  const total = Math.round(
    specificity * 0.3 + structure * 0.25 + negativeQuality * 0.2 + styleConsistency * 0.25
  )

  return { total, breakdown }
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 92) return { label: "Excellent", color: "text-emerald-400" }
  if (score >= 80) return { label: "Great", color: "text-green-400" }
  if (score >= 65) return { label: "Good", color: "text-yellow-400" }
  if (score >= 50) return { label: "Fair", color: "text-orange-400" }
  return { label: "Needs Work", color: "text-red-400" }
}
