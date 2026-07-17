// Cache price IDs per instance
const priceCache = new Map<string, string>()
let productIdCache: string | null = null
let paddleBase = "https://api.paddle.com" // determined once

const PADDLE_BASES = ["https://api.paddle.com", "https://eu-api.paddle.com"]

function headers() {
  const key = process.env.PADDLE_API_KEY
  if (!key) throw new Error("PADDLE_API_KEY not configured")
  return { Authorization: "Bearer " + key, "Content-Type": "application/json" }
}

async function ensureProduct(): Promise<string> {
  if (productIdCache) return productIdCache
  const h = headers()

  // Try to find existing product on any base
  for (const base of PADDLE_BASES) {
    const resp = await fetch(base + "/products?status[active]=true&per_page=10", { headers: h })
    if (resp.ok) {
      const data = await resp.json()
      const existing = data.data?.find((p: any) => p.name === "PromptMaster Credits")
      if (existing) { paddleBase = base; productIdCache = existing.id; return existing.id }
    }
  }

  // Try creating on each base
  for (const base of PADDLE_BASES) {
    const resp = await fetch(base + "/products", {
      method: "POST", headers: h,
      body: JSON.stringify({ name: "PromptMaster Credits" }),
    })
    const data = await resp.json()
    if (resp.ok && data.data?.id) {
      paddleBase = base
      productIdCache = data.data.id
      return data.data.id
    }
    // Store error for reporting
    if (!resp.ok) console.error("[Paddle] Create product failed on", base, JSON.stringify(data))
  }
  throw new Error("Failed to create product on any Paddle endpoint")
}

async function ensurePrice(credits: number, amountUsd: number, productId: string): Promise<string> {
  const cacheKey = credits + "-" + amountUsd
  if (priceCache.has(cacheKey)) return priceCache.get(cacheKey)!
  const h = headers()
  const amount = String(Math.round(amountUsd * 100))
  const desc = credits + " PromptMaster Credits"

  // Find existing price
  const listResp = await fetch(paddleBase + "/prices?status[active]=true&per_page=50", { headers: h })
  if (listResp.ok) {
    const listData = await listResp.json()
    const existing = listData.data?.find((p: any) =>
      p.unit_price?.amount === amount && p.description === desc
    )
    if (existing) { priceCache.set(cacheKey, existing.id); return existing.id }
  }

  // Create price
  const createResp = await fetch(paddleBase + "/prices", {
    method: "POST", headers: h,
    body: JSON.stringify({
      description: desc,
      name: credits + " Credits",
      product_id: productId,
      tax_mode: "external",
      unit_price: { amount, currency_code: "USD" },
    }),
  })
  const data = await createResp.json()
  if (!createResp.ok) throw new Error("Failed to create price: " + JSON.stringify(data))
  const priceId = data.data?.id
  if (!priceId) throw new Error("No price ID returned")
  priceCache.set(cacheKey, priceId)
  return priceId
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { credits, amountUsd, userId, email } = body
    if (!credits || !amountUsd || !userId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const productId = await ensureProduct()
    const priceId = await ensurePrice(credits, amountUsd, productId)

    const resp = await fetch(paddleBase + "/transactions", {
      method: "POST", headers: headers(),
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { user_id: userId, credits },
        ...(email ? { customer: { email } } : {}),
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return Response.json({ error: "Transaction failed: " + err.slice(0, 300) }, { status: 502 })
    }

    const data = await resp.json()
    return Response.json({ transactionId: data.data?.id })
  } catch (e: any) {
    console.error("[Paddle] Error:", e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
