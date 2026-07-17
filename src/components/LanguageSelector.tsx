"use client"

import { useLocale, locales } from "@/lib/i18n"

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code as "en" | "zh-CN")}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            locale === l.code
              ? "bg-[var(--surface-3)] text-[var(--foreground)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <span className="mr-1">{l.flag}</span>
          {l.label}
        </button>
      ))}
    </div>
  )
}
