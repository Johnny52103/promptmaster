// POST /api/auth/login

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 })
    }

    // Demo mode fallback
    const { isSupabaseConfigured } = await import("@/lib/supabase")
    if (!isSupabaseConfigured()) {
      if (email === "demo@promptmaster.ai" && password === "demo123456") {
        return Response.json({
          user: { id: "demo-user", email, name: "Demo User" },
          credits: 10, token: "demo-token",
        })
      }
      return Response.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const bcrypt = require("bcryptjs")
    const { createClient } = require("@supabase/supabase-js")
    const cfg = require("@/lib/supabase").getSupabaseAdminConfig()
    const supabase = createClient(cfg.url, cfg.serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()
    if (error || !user) return Response.json({ error: "Invalid email or password" }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return Response.json({ error: "Invalid email or password" }, { status: 401 })

    // Update last login
    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

    // Get credits
    const { data: creds } = await supabase.from("credits").select("balance").eq("user_id", user.id).single()

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name },
      credits: creds?.balance || 0,
      token: "session-" + user.id + "-" + Date.now(),
    })
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
