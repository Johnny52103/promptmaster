const res = await fetch("https://promptmaster-hazel.vercel.app/api/paddle/create-transaction", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ credits: 100, amountUsd: 3, userId: "test-123", email: "test@test.com" }),
})
const text = await res.text()
console.log("Status:", res.status)
try { console.log("Response:", JSON.stringify(JSON.parse(text), null, 2)) } catch { console.log("Raw:", text) }
