import { verifyCode } from "@/lib/verify"

// In-memory fallback when Supabase is not available
const ipRegisterMap = new Map<string, number>()

function getIp(request: Request): string {
  return request.headers.get("x-vercel-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown"
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
    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    // ---- Phase 1: Check IP limit (independent of mode) ----

    // Check in-memory first (fast path, also catches demo mode)
    const lastMem = ipRegisterMap.get(ip)
    if (lastMem && Date.now() - lastMem < ONE_DAY_MS) {
      return Response.json({ error: "This IP has already registered today. Please try again tomorrow." }, { status: 429 })
    }

    const url = process.env.SUPABASE_URL || ""
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE || ""

    if (url && serviceRole) {
      try {
        // Check Supabase persistent table
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

        const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString()
        const { data: existing } = await supabase
          .from("registration_ips")
          .select("id")
          .eq("ip", ip)
          .gte("registered_at", yesterday)
          .limit(1)

        if (existing && existing.length > 0) {
          ipRegisterMap.set(ip, Date.now()) // sync in-memory cache
          return Response.json({ error: "This IP has already registered today. Please try again tomorrow." }, { status: 429 })
        }

        const bcrypt = await import("bcryptjs")
        const passwordHash = await bcrypt.hash(password, 10)

        const { data: user, error } = await supabase.from("users").insert({
          email, password_hash: passwordHash, name: name || email.split("@")[0],
        }).select().single()

        if (error) {
          if (error.code === "23505") return Response.json({ error: "Email already registered" }, { status: 409 })
          throw error
        }

        // Record IP for rate limiting
        await supabase.from("registration_ips").insert({ ip, email })
        ipRegisterMap.set(ip, Date.now()) // sync in-memory cache

        await supabase.from("credits").insert({ user_id: user.id, balance: 10, total_purchased: 10 })
        await supabase.from("credit_transactions").insert({
          user_id: user.id, amount: 10, type: "bonus", description: "Registration bonus",
        })

        return Response.json({ user: { id: user.id, email: user.email, name: user.name }, credits: 10 })
      } catch (dbError: any) {
        console.warn("[Register] DB error, falling back to demo:", dbError?.message)
        // Sync in-memory before returning demo
        ipRegisterMap.set(ip, Date.now())
      }
    }

    // Demo mode (no Supabase or DB error fallback) — in-memory IP already checked above
    ipRegisterMap.set(ip, Date.now())
    return Response.json({
      user: { id: "demo-" + Date.now(), email, name: name || email.split("@")[0] },
      credits: 10,
    })
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
