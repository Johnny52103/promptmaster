import { verifyCode } from "@/lib/verify"

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

    const url = process.env.SUPABASE_URL || ""
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE || ""

    if (!url || !serviceRole) {
      return Response.json({
        user: { id: "demo-" + Date.now(), email, name: name || email.split("@")[0] },
        credits: 10,
      })
    }

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

      await supabase.from("credits").insert({ user_id: user.id, balance: 10, total_purchased: 10 })
      await supabase.from("credit_transactions").insert({
        user_id: user.id, amount: 10, type: "bonus", description: "Registration bonus",
      })

      return Response.json({ user: { id: user.id, email: user.email, name: user.name }, credits: 10 })
    } catch (dbError: any) {
      console.warn("[Register] DB error, falling back to demo:", dbError?.message)
      return Response.json({
        user: { id: "demo-" + Date.now(), email, name: name || email.split("@")[0] },
        credits: 10,
      })
    }
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
