import { createSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const eventType = body?.event_type || ""

    // Only process completed transactions
    if (eventType !== "transaction.completed") {
      return Response.json({ ok: true })
    }

    const transaction = body?.data || {}
    const customData = transaction?.custom_data || {}
    const userId = customData?.user_id
    const credits = parseInt(customData?.credits || "0", 10)
    const paddleTransactionId = transaction?.id || ""
    const status = transaction?.status || "completed"
    const amountCents = transaction?.details?.totals?.subtotal || 0

    if (!userId || credits <= 0) {
      console.warn("[Paddle Webhook] Missing user_id or credits in custom_data:", customData)
      return Response.json({ ok: true, warning: "Missing user/credits" })
    }

    const supabase = createSupabaseAdmin()
    if (!supabase) {
      console.error("[Paddle Webhook] Supabase not configured")
      return Response.json({ ok: true, warning: "Supabase not configured" })
    }

    // Add credits to user
    const { data: existingCredits } = await supabase
      .from("credits")
      .select("balance, total_purchased")
      .eq("user_id", userId)
      .single()

    if (existingCredits) {
      await supabase
        .from("credits")
        .update({
          balance: (existingCredits.balance || 0) + credits,
          total_purchased: (existingCredits.total_purchased || 0) + credits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    } else {
      await supabase
        .from("credits")
        .insert({
          user_id: userId,
          balance: credits,
          total_purchased: credits,
          total_used: 0,
        })
    }

    // Record credit transaction
    await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: credits,
        type: "purchase",
        description: "Paddle purchase: " + paddleTransactionId,
        order_id: paddleTransactionId,
      })

    // Record order
    await supabase
      .from("orders")
      .insert({
        user_id: userId,
        paddle_order_id: paddleTransactionId,
        paddle_transaction_id: paddleTransactionId,
        amount_cents: amountCents,
        credits: credits,
        status: "completed",
      })

    console.log("[Paddle Webhook] Processed: user=" + userId + " credits=" + credits + " tx=" + paddleTransactionId)
    return Response.json({ ok: true })
  } catch (e: any) {
    console.error("[Paddle Webhook] Error:", e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
