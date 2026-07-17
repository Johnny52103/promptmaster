// POST /api/auth/login

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 })
    }

    const url = process.env.SUPABASE_URL || ""
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE || ""

    if (!url || !serviceRole) {
      // No Supabase — demo mode: accept any credentials
      return Response.json({
        user: { id: "demo-" + Date.now(), email, name: email.split("@")[0] },
        credits: 10,
      })
    }

    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })
      const bcrypt = await import("bcryptjs")

      const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()
      if (error || !user) return Response.json({ error: "Invalid email or password" }, { status: 401 })

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) return Response.json({ error: "Invalid email or password" }, { status: 401 })

      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)
      const { data: creds } = await supabase.from("credits").select("balance").eq("user_id", user.id).single()

      return Response.json({
        user: { id: user.id, email: user.email, name: user.name },
        credits: creds?.balance || 0,
      })
    } catch (dbError: any) {
      // Tables don't exist — accept any login as demo
      console.warn("[Login] DB error, falling back to demo:", dbError?.message)
      return Response.json({
        user: { id: "demo-" + Date.now(), email, name: email.split("@")[0] },
        credits: 10,
      })
    }
  } catch (e: any) {
    return Response.json({ error: "Server error: " + e.message }, { status: 500 })
  }
}
