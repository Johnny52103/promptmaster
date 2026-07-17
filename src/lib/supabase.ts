// Supabase client for server-side usage
// Read env vars set in Vercel dashboard

export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
  }
}

export function getSupabaseAdminConfig() {
  return {
    url: process.env.SUPABASE_URL || "",
    serviceRole: process.env.SUPABASE_SERVICE_ROLE || "",
  }
}

export function isSupabaseConfigured() {
  const cfg = getSupabaseConfig()
  return !!(cfg.url && cfg.anonKey)
}
