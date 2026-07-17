import { verifyCode } from "@/lib/verify"

// In-memory fallback when Supabase is not available
const ipRegisterMap = new Map<string, number>()

function getIp(request: Request): string {
  return request.headers.get("x-vercel-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown"
}

/** Direct REST API call to Supabase to check if IP registered in last 24h */
async function checkIpLimit(url: string, serviceRole: string, ip: string): Promise<boolean> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const qs = `ip=eq.${encodeURIComponent(ip)}&registered_at=gte.${encodeURIComponent(yesterday)}&select=id&limit=1`
  const res = await fetch(`${url}/rest/v1/registration_ips?${qs}`, {
    headers: { "apikey": serviceRole, "Authorization": "Bearer " + serviceRole },
  })
  if (!res.ok) {
    console.warn("[Register] IP check query failed:", res.status, await res.text().catch(() => ""))
    return false // query failed — let registration proceed
  }
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0
}

/** Direct REST API call to record IP */
async function recordIp(url: string, serviceRole: string, ip: string, email: string) {
  await fetch(`${url}/rest/v1/registration_ips`, {
    method: "POST",
    headers: { "apikey": serviceRole, "Authorization": "Bearer " + serviceRole, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify({ ip, email }),
  }).catch((e) => console.warn("[Register] Failed to record IP:", e.message))
}

export async function POST(request: Request) {
  try {
    const { email, password, name, code } = await request.json()

    if (!email || !password || password.length < 6) {
      return Response.json({ error: "Email and password (6+ chars) required" }, { status: 400 })
    }

    // Verify email code
    if (!code || !verifyCode(email, code)) {
      return Response.json({ error: "Invalid or expired verification code" }, { status: 403 })
    }

    const ip = getIp(request)
    const url = process.env.SUPABASE_URL || ""
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE || ""

    // ---- Phase 1: In-memory IP check (fast path, works per-instance) ----
    const lastMem = ipRegisterMap.get(ip)
    if (lastMem && Date.now() - lastMem < 24 * 60 * 60 * 1000) {
      return Response.json({ error: "This IP has already registered today. Please try again tomorrow." }, { status: 429 })
    }

    // ---- Phase 2: Persistent check (Supabase REST API) ----
    if (url && serviceRole) {
      const blocked = await checkIpLimit(url, serviceRole, ip)
      if (blocked) {
        ipRegisterMap.set(ip, Date.now())
        return Response.json({ error: "This IP has already registered today. Please try again tomorrow." }, { status: 429 })
      }
    }

    // ---- Phase 3: Register ----
    if (url && serviceRole) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })
        const bcrypt = await import("bcryptjs")
        const passwordHash = await bcrypt.hash(password, 10)

        const { data: user, error } = await supabase.from("users").insert({
          email, password_hash: passwordHash, name: name || email.split("@")[0],
        }).select().single()

        if (error) {
          if (error.code === "23505") return Response.json({ error: "Email already registered" }, { status: 409 })
          throw error
        }

        // Record IP and create credits
        await recordIp(url, serviceRole, ip, email)
        await supabase.from("credits").insert({ user_id: user.id, balance: 10, total_purchased: 10 })
        await supabase.from("credit_transactions").insert({
          user_id: user.id, amount: 10, type: "bonus", description: "Registration bonus",
        })

        ipRegisterMap.set(ip, Date.now())
        return Response.json({ user: { id: user.id, email: user.email, name: user.name }, credits: 10 })
      } catch (dbError: any) {
        console.warn("[Register] DB error, falling back to demo:", dbError?.message)
      }
    }

    // Demo mode
    ipRegisterMap.set(ip, Date.now())
    return Response.json({
      user: { id: "demo-" + Date.now(), email, name: name || email.split("@")[0] },
      credits: 10,
    })
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
