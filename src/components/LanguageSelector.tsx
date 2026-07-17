"use client"

import { useLocale } from "@/lib/i18n"

export default function LanguageSelector() {
  const { locale } = useLocale()

  return (
    <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
      <span className="px-2.5 py-1 rounded-md text-xs font-medium text-[var(--foreground)]">
        <span className="mr-1">🇬🇧</span>
        English
      </span>
    </div>
  )
}
