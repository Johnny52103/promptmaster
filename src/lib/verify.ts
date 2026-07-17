// In-memory verification codes (for serverless, this is per-instance)
// For production, use Redis or DB. For MVP, this works well enough.
const codeStore = new Map<string, { code: string; expiresAt: number }>()

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function storeCode(email: string, code: string) {
  codeStore.set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })
}

export function verifyCode(email: string, code: string): boolean {
  const entry = codeStore.get(email.toLowerCase().trim())
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    codeStore.delete(email.toLowerCase().trim())
    return false
  }
  const valid = entry.code === code.trim()
  if (valid) codeStore.delete(email.toLowerCase().trim()) // one-time use
  return valid
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[Verify] No RESEND_API_KEY")
    return false
  }

  // Try configured from address, then fallback
  const fromAddresses = [
    process.env.RESEND_FROM,
    "PromptMaster <noreply@promptmaster.ai>",
    "onboarding@resend.dev",
  ].filter(Boolean) as string[]

  for (const from of fromAddresses) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Your PromptMaster verification code: " + code,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#d4a843">PromptMaster AI</h2>
            <p style="color:#666;font-size:14px;line-height:1.6">Your verification code is:</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#000;margin:16px 0">${code}</div>
            <p style="color:#999;font-size:12px">This code expires in 10 minutes.</p>
          </div>`,
        }),
      })
      const body = await resp.text()
      if (resp.ok) {
        console.log("[Verify] Sent via:", from)
        return true
      }
      console.warn("[Verify] Failed via", from, resp.status, body.slice(0, 200))
    } catch (e: any) {
      console.warn("[Verify] Error via", from, e.message)
    }
  }
  return false
}
