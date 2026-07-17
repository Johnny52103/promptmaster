export async function POST(request: Request) {
  try {
    const body = await request.json()
    const eventType = body?.event_type || ""
    if (eventType !== "transaction.completed") {
      return Response.json({ ok: true })
    }
    return Response.json({ ok: true, eventType })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
