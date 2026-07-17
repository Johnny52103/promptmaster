import { verifyCode } from "@/lib/verify"

// In-memory fallback (per-instance, Supabase for cross-instance persistence)
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

    // ---- Phase 1: In-memory IP check (fast path) ----
    const lastMem = ipRegisterMap.get(ip)
    if (lastMem && Date.now() - lastMem < ONE_DAY_MS) {
      return Response.json({ error: "This IP has already registered today. Please try again tomorrow." }, { status: 429 })
    }

    // ---- Phase 2: Supabase (if configured) ----
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE || ""

    if (url && serviceRole) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

        // Check users table for same IP within 24h (users table confirmed working)
        const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString()
        const { data: dupIp, error: checkErr } = await supabase
          .from("users")
          .select("id")
          .eq("ip", ip)
          .gte("created_at", yesterday)
          .limit(1)

        if (checkErr) {
          console.warn("[Register] IP check query failed:", checkErr.message, checkErr.code)
          // Don't throw — proceed with in-memory check only
        } else if (dupIp && dupIp.length > 0) {
          ipRegisterMap.set(ip, Date.now())
          return Response.json({ error: "This IP has already registered today. Please try again tomorrow." }, { status: 429 })
        }

        // Register user (with ip)
        const bcrypt = await import("bcryptjs")
        const passwordHash = await bcrypt.hash(password, 10)

        const { data: user, error } = await supabase.from("users").insert({
          email,
          password_hash: passwordHash,
          name: name || email.split("@")[0],
          ip, // store IP for rate limiting
        }).select().single()

        if (error) {
          if (error.code === "23505") return Response.json({ error: "Email already registered" }, { status: 409 })
          throw error
        }

        // Also try to record in registration_ips (best effort)
        await supabase.from("registration_ips").insert({ ip, email }).catch(() => {})

        // Create credits
        await supabase.from("credits").insert({ user_id: user.id, balance: 10, total_purchased: 10 })
        await supabase.from("credit_transactions").insert({
          user_id: user.id, amount: 10, type: "bonus", description: "Registration bonus",
        })

        ipRegisterMap.set(ip, Date.now())
        return Response.json({ user: { id: user.id, email: user.email, name: user.name }, credits: 10 })
      } catch (dbError: any) {
        console.warn("[Register] DB error, falling back to demo:", dbError?.message, dbError?.code)
        ipRegisterMap.set(ip, Date.now())
      }
    }

    // ---- Demo mode ----
    ipRegisterMap.set(ip, Date.now())
    return Response.json({
      user: { id: "demo-" + Date.now(), email, name: name || email.split("@")[0] },
      credits: 10,
    })
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
