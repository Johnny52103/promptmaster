export async function GET(request: Request) {
  const headers: Record<string, string> = {}
  for (const [k, v] of request.headers.entries()) {
    if (k.includes("ip") || k.includes("forward") || k.includes("vercel")) {
      headers[k] = v
    }
  }
  return Response.json({
    ip: headers,
    x_vercel_ip: request.headers.get("x-vercel-ip") || null,
    x_forwarded_for: request.headers.get("x-forwarded-for") || null,
    x_real_ip: request.headers.get("x-real-ip") || null,
    all_headers: Object.fromEntries(request.headers.entries()),
  })
}
