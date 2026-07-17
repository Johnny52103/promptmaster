"use client"
import { useState, useRef } from "react"

interface Props { open: boolean; onClose: () => void; onLogin: (user: any, credits: number) => void }

export default function AuthModal({ open, onClose, onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const codeTimer = useRef<any>(null)

  if (!open) return null

  const sendCode = async () => {
    if (!email || !email.includes("@")) { setError("Enter a valid email first"); return }
    setCodeLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to send code"); setCodeLoading(false); return }
      setCodeSent(true)
      setCodeCountdown(60)
      if (data.code) setCode(data.code)
      codeTimer.current = setInterval(() => {
        setCodeCountdown((c) => {
          if (c <= 1) { clearInterval(codeTimer.current); return 0 }
          return c - 1
        })
      }, 1000)
    } catch { setError("Network error") }
    setCodeLoading(false)
  }

  const handle = async () => {
    setError("")
    if (!email || !password) { setError("Required"); return }
    if (mode === "register") {
      if (password.length < 6) { setError("Password: 6+ characters"); return }
      if (!code) { setError("Enter verification code"); return }
    }
    setLoading(true)
    try {
      const body = mode === "login"
        ? { email, password }
        : { email, password, name: name || email.split("@")[0], code }
      const res = await fetch("/api/auth/" + mode, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return }
      onLogin(data.user, data.credits || 10); onClose()
    } catch { setError("Network error") }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{mode === "login" ? "Login" : "Create Account"}</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--foreground)] text-lg">×</button>
        </div>
        <div className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)]" />
            </div>
          )}
          <div>
            <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)]" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "6+ characters" : "Your password"}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)]" />
          </div>
          {mode === "register" && (
            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Verification Code</label>
              <div className="flex gap-2">
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6}
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)] tracking-widest text-center" />
                <button onClick={sendCode} disabled={codeLoading || codeCountdown > 0}
                  className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-30 whitespace-nowrap"
                >{codeLoading ? "..." : codeCountdown > 0 ? codeCountdown + "s" : codeSent ? "Resend" : "Send Code"}</button>
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[var(--red)] mt-2">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="w-full mt-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] disabled:opacity-30">
          {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up & Get 10 Free Credits"}
        </button>
        <p className="text-xs text-[var(--text-tertiary)] text-center mt-3">
          {mode === "login"
            ? <>No account? <button onClick={() => { setMode("register"); setError(""); setCode("") }} className="text-[var(--accent-dim)] hover:text-[var(--accent)]">Sign up</button></>
            : <>Have an account? <button onClick={() => { setMode("login"); setError("") }} className="text-[var(--accent-dim)] hover:text-[var(--accent)]">Login</button></>}
        </p>
      </div>
    </div>
  )
}
