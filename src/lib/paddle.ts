"use client"

import { initializePaddle } from "@paddle/paddle-js"
import type { Paddle } from "@paddle/paddle-js"

let paddleInstance: Paddle | null = null

export async function initPaddle(): Promise<Paddle | null> {
  if (paddleInstance) return paddleInstance

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
  if (!token) {
    console.warn("[Paddle] No client token")
    return null
  }

  try {
    const instance = await initializePaddle({
      token,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production",
    })
    if (instance) paddleInstance = instance
    return instance || null
  } catch (e) {
    console.error("[Paddle] Init failed:", e)
    return null
  }
}

export async function openPaddleCheckout(transactionId: string): Promise<boolean> {
  // Auto-init if not yet initialized
  if (!paddleInstance) {
    const instance = await initPaddle()
    if (!instance) return false
  }

  try {
    paddleInstance!.Checkout.open({
      transactionId,
      settings: { displayMode: "overlay", allowLogout: false },
    })
    return true
  } catch (e) {
    console.error("[Paddle] Checkout open failed:", e)
    return false
  }
}
