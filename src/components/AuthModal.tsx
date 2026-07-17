"use client"
import { useState } from "react"

interface Props { open: boolean; onClose: () => void; onLogin: (user: any, credits: number) => void }

export default function AuthModal({ open, onClose, onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("")
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false)
  if (!open) return null

  const handle = async () => {
    setError("")
    if (!email || !password) { setError("Required"); return }
    if (mode === "register" && password.length < 6) { setError("6+ characters"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/" + mode, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "login" ? { email, password } : { email, password, name: name || email.split("@")[0] }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error"); return }
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
          {mode === "register" && <div><label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)]" /></div>}
          <div><label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)]" /></div>
          <div><label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "6+ characters" : "Your password"} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-dim)]" /></div>
        </div>
        {error && <p className="text-xs text-[var(--red)] mt-2">{error}</p>}
        <button onClick={handle} disabled={loading} className="w-full mt-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] disabled:opacity-30">{loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up & Get 10 Free Credits"}</button>
        <p className="text-xs text-[var(--text-tertiary)] text-center mt-3">
          {mode === "login" ? <>No account? <button onClick={() => { setMode("register"); setError("") }} className="text-[var(--accent-dim)] hover:text-[var(--accent)]">Sign up</button></> : <>Have an account? <button onClick={() => { setMode("login"); setError("") }} className="text-[var(--accent-dim)] hover:text-[var(--accent)]">Login</button></>}
        </p>
      </div>
    </div>
  )
}
