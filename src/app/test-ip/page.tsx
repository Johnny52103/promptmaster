"use client"
import { useState } from "react"

export default function TestIpPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState("")

  const testRegister = async () => {
    setLoading(true)
    setResult(null)
    try {
      const ts = Date.now()
      setPhase("Getting code for account 1...")

      // Step 1: register first account
      const email1 = "test1-" + ts + "@test.com"
      const r1 = await fetch("/api/auth/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email1 }),
      })
      const d1 = await r1.json()
      const code1 = d1.code || "000000"

      setPhase("Registering account 1...")
      const reg1 = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email1, password: "testpass123", name: "Test1", code: code1 }),
      })
      const reg1d = await reg1.json()
      const firstOk = reg1.ok

      setPhase("Waiting 65s for rate limit cooldown...")

      // Step 2: wait for send-code rate limit to clear
      await new Promise(r => setTimeout(r, 65000))

      // Step 3: try register second account (same IP, should be blocked)
      const email2 = "test2-" + ts + "@test.com"
      setPhase("Getting code for account 2...")
      const r2 = await fetch("/api/auth/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email2 }),
      })
      const d2 = await r2.json()
      const code2 = d2.code || "000000"

      setPhase("Registering account 2 (expect 429)...")
      const reg2 = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email2, password: "testpass123", name: "Test2", code: code2 }),
      })
      const reg2d = await reg2.json()

      setResult({
        first: { ok: firstOk, status: reg1.status, data: reg1d },
        second: { ok: reg2.ok, status: reg2.status, data: reg2d },
        conclusion: reg2.status === 429
          ? "✅ SECOND REGISTRATION BLOCKED (429) - IP LIMIT WORKS!"
          : "❌ SECOND REGISTRATION ALLOWED - IP LIMIT NOT WORKING",
      })
      setPhase("")
    } catch (e: any) {
      setResult({ error: e.message })
      setPhase("")
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: "40px", fontFamily: "monospace", maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>IP Limit Test</h1>
      <button
        onClick={testRegister}
        disabled={loading}
        style={{
          padding: "12px 24px", fontSize: 16, cursor: "pointer",
          background: "#d4a843", border: "none", borderRadius: 8, color: "#000",
          fontWeight: "bold",
        }}
      >
        {loading ? phase : "Run Test (takes ~65s)"}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            padding: 12, borderRadius: 8, fontSize: 14, fontWeight: "bold",
            background: result.conclusion?.includes("✅") ? "#d4edda" : "#f8d7da",
            color: result.conclusion?.includes("✅") ? "#155724" : "#721c24",
          }}>
            {result.conclusion}
          </div>
          <pre style={{ marginTop: 12, background: "#f5f5f5", padding: 16, borderRadius: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
