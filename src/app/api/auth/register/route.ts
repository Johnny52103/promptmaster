// POST /api/auth/register
import { isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || password.length < 6) {
      return Response.json({ error: "Email and password (6+ chars) required" }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      // Demo mode: return success without saving
      return Response.json({
        user: { id: "demo-" + Date.now(), email, name: name || email.split("@")[0] },
        token: "demo-token-" + Date.now(),
      })
    }

    const bcrypt = require("bcryptjs")
    const { createClient } = require("@supabase/supabase-js")
    const cfg = require("@/lib/supabase").getSupabaseAdminConfig()
    const supabase = createClient(cfg.url, cfg.serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

    const passwordHash = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase.from("users").insert({
      email, password_hash: passwordHash, name: name || email.split("@")[0],
    }).select().single()

    if (error) {
      if (error.code === "23505") return Response.json({ error: "Email already registered" }, { status: 409 })
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Create credits record
    await supabase.from("credits").insert({ user_id: user.id, balance: 10, total_purchased: 10 })

    // Log bonus
    await supabase.from("credit_transactions").insert({
      user_id: user.id, amount: 10, type: "bonus", description: "Registration bonus",
    })

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name },
      credits: 10,
    })
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
