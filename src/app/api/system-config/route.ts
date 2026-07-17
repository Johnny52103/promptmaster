export async function GET() {
  const hasDoubao = !!(process.env.SYS_CUSTOM_URL && process.env.SYS_CUSTOM_KEY && process.env.SYS_CUSTOM_MODEL)
  return Response.json({
    hasDoubao,
    // Never expose the actual keys
  })
}
