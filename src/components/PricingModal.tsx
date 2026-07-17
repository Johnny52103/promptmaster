"use client"
import { useState } from "react"

const plans = [
  { credits: 100, price: "$3", popular: false },
  { credits: 500, price: "$9", popular: true },
  { credits: 1500, price: "$25", popular: false },
  { credits: 5000, price: "$69", popular: false },
]

interface Props { open: boolean; onClose: () => void; user: any }

export default function PricingModal({ open, onClose, user }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  if (!open) return null

  const handleBuy = async (c: number) => {
    if (!user) return
    setLoading(c.toString())
    await new Promise((r) => setTimeout(r, 800))
    alert("Paddle checkout integration pending.\n\nAfter Paddle registration, set:\nPADDLE_VENDOR_ID\nPADDLE_API_KEY\nin Vercel env vars.")
    setLoading(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Buy Credits</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--foreground)] text-lg">×</button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-5">No subscription. Credits never expire.</p>
        <div className="grid grid-cols-2 gap-3">
          {plans.map((p) => (
            <div key={p.credits} className={"relative bg-[var(--surface-2)] border rounded-xl p-4 " + (p.popular ? "border-[var(--accent)]" : "border-[var(--border)]")}>
              {p.popular && <span className="absolute -top-2 left-3 text-[10px] font-medium bg-[var(--accent)] text-black px-2 py-0.5 rounded">Best value</span>}
              <div className="text-2xl font-bold">{p.credits.toLocaleString()}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">credits</div>
              <div className="mt-3"><span className="text-lg font-semibold">{p.price}</span><span className="text-xs text-[var(--text-secondary)] ml-1">one-time</span></div>
              <button onClick={() => handleBuy(p.credits)} disabled={loading !== null || !user}
                className={"w-full mt-3 py-1.5 rounded-lg text-xs font-medium transition-all " + (p.popular ? "bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]" : "bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--foreground)]") + " disabled:opacity-30"}
              >{loading === p.credits.toString() ? "..." : "Buy Now"}</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">Powered by Paddle. Secure payments.</p>
      </div>
    </div>
  )
}
