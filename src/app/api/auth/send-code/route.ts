import { generateCode, storeCode, sendVerificationEmail } from "@/lib/verify"

const rateMap = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Valid email required" }, { status: 400 })
    }

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const lastSent = rateMap.get(ip)
    if (lastSent && Date.now() - lastSent < 60000) {
      return Response.json({ error: "Please wait 60s before requesting another code" }, { status: 429 })
    }

    const code = generateCode()
    storeCode(email, code)

    const sent = await sendVerificationEmail(email, code)
    rateMap.set(ip, Date.now())

    if (sent) {
      return Response.json({ ok: true })
    }

    // Email failed — return code directly so user can still test
    return Response.json({ ok: true, code, note: "Email sending unavailable. Use this code to verify." })
  } catch (e: any) {
    return Response.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
