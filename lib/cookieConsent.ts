export type CookieConsentChoice = {
  essential: true
  analytics: boolean
  marketing: boolean
  preferences: boolean
  updatedAt: string
  version: 1
}

export const COOKIE_CONSENT_STORAGE_KEY = "yanbo_cookie_consent_v1"

export const COOKIE_CONSENT_UPDATED_EVENT = "yanbo-cookie-consent-updated"
export const COOKIE_SETTINGS_OPEN_EVENT = "yanbo-cookie-settings-open"

export function getDefaultCookieConsent(): CookieConsentChoice {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null

  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)

    if (!stored) return null

    const parsed = JSON.parse(stored) as CookieConsentChoice

    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      preferences: Boolean(parsed.preferences),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      version: 1,
    }
  } catch {
    return null
  }
}

export function saveCookieConsent(
  choice: Omit<CookieConsentChoice, "essential" | "updatedAt" | "version">
): CookieConsentChoice {
  const consent: CookieConsentChoice = {
    essential: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    preferences: choice.preferences,
    updatedAt: new Date().toISOString(),
    version: 1,
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(consent)
    )

    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, {
        detail: consent,
      })
    )
  }

  return consent
}

export function hasAnalyticsConsent(): boolean {
  return Boolean(getCookieConsent()?.analytics)
}

export function hasMarketingConsent(): boolean {
  return Boolean(getCookieConsent()?.marketing)
}

export function hasPreferencesConsent(): boolean {
  return Boolean(getCookieConsent()?.preferences)
}

export function openCookieSettings() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT))
}