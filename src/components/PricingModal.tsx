"use client"
import { useState } from "react"
import { openPaddleCheckout } from "@/lib/paddle"

const plans = [
  { credits: 100, price: "$3", amountUsd: 3, popular: false },
  { credits: 500, price: "$9", amountUsd: 9, popular: true },
  { credits: 1500, price: "$25", amountUsd: 25, popular: false },
  { credits: 5000, price: "$69", amountUsd: 69, popular: false },
]

interface Props { open: boolean; onClose: () => void; user: any; onCreditsPurchased?: (credits: number) => void }

export default function PricingModal({ open, onClose, user, onCreditsPurchased }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  if (!open) return null

  const handleBuy = async (plan: typeof plans[0]) => {
    if (!user) return
    setLoading(plan.credits.toString())
    setError("")

    try {
      // Try to create Paddle transaction
      const resp = await fetch("/api/paddle/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits: plan.credits,
          amountUsd: plan.amountUsd,
          userId: user.id || user.email,
          email: user.email,
        }),
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || "Failed to create transaction")
      }

      const { transactionId } = await resp.json()

      if (transactionId) {
        const opened = await openPaddleCheckout(transactionId)
        if (!opened) {
          // Paddle checkout failed — fallback to local credits
          if (onCreditsPurchased) onCreditsPurchased(plan.credits)
        }
        onClose()
      } else {
        if (onCreditsPurchased) onCreditsPurchased(plan.credits)
        onClose()
      }
    } catch (e: any) {
      console.error("[Pricing] Checkout failed:", e)
      setError(e.message || "Checkout failed")
    }
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

        {error && (
          <div className="bg-[var(--red)]/5 border border-[var(--red)]/15 rounded-lg p-2.5 mb-3 text-xs text-[var(--red)]/80">
            {error}
          </div>
        )}

        {!user ? (
          <div className="bg-[var(--surface-2)] rounded-xl p-6 text-center space-y-2">
            <p className="text-sm text-[var(--text-secondary)]">Login required to purchase credits</p>
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-colors">
              Login
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {plans.map((p) => (
              <div key={p.credits} className={"relative bg-[var(--surface-2)] border rounded-xl p-4 " + (p.popular ? "border-[var(--accent)]" : "border-[var(--border)]")}>
                {p.popular && <span className="absolute -top-2 left-3 text-[10px] font-medium bg-[var(--accent)] text-black px-2 py-0.5 rounded">Best value</span>}
                <div className="text-2xl font-bold">{p.credits.toLocaleString()}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">credits</div>
                <div className="mt-3"><span className="text-lg font-semibold">{p.price}</span><span className="text-xs text-[var(--text-secondary)] ml-1">one-time</span></div>
                <button onClick={() => handleBuy(p)} disabled={loading !== null}
                  className="w-full mt-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] disabled:opacity-30"
                >{loading === p.credits.toString() ? "..." : "Buy Now"}</button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">Powered by Paddle. Secure payments.</p>
      </div>
    </div>
  )
}
