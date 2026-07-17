import { createClient } from "@supabase/supabase-js"

export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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

// Client-side Supabase instance (for browser usage)
export function createSupabaseClient() {
  const cfg = getSupabaseConfig()
  if (!cfg.url || !cfg.anonKey) return null
  return createClient(cfg.url, cfg.anonKey)
}

// Server-side admin Supabase instance (for webhook, etc.)
export function createSupabaseAdmin() {
  const cfg = getSupabaseAdminConfig()
  if (!cfg.url || !cfg.serviceRole) return null
  return createClient(cfg.url, cfg.serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
