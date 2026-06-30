"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  COOKIE_SETTINGS_OPEN_EVENT,
  CookieConsentChoice,
  getCookieConsent,
  getDefaultCookieConsent,
  saveCookieConsent,
} from "../lib/cookieConsent"

type ConsentDraft = {
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false)
  const [hasSavedChoice, setHasSavedChoice] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [draft, setDraft] = useState<ConsentDraft>({
    analytics: false,
    marketing: false,
    preferences: false,
  })

  useEffect(() => {
    setMounted(true)

    const stored = getCookieConsent()

    if (stored) {
      setHasSavedChoice(true)
      setDraft({
        analytics: stored.analytics,
        marketing: stored.marketing,
        preferences: stored.preferences,
      })
      setIsOpen(false)
    } else {
      const defaults = getDefaultCookieConsent()

      setDraft({
        analytics: defaults.analytics,
        marketing: defaults.marketing,
        preferences: defaults.preferences,
      })

      setHasSavedChoice(false)
      setIsOpen(true)
    }

    const openSettings = () => {
      const current = getCookieConsent()

      setDraft({
        analytics: Boolean(current?.analytics),
        marketing: Boolean(current?.marketing),
        preferences: Boolean(current?.preferences),
      })

      setShowChoices(true)
      setIsOpen(true)
    }

    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings)

    return () => {
      window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings)
    }
  }, [])

  const statusText = useMemo(() => {
    const active: string[] = ["essential"]

    if (draft.analytics) active.push("analytics")
    if (draft.marketing) active.push("marketing")
    if (draft.preferences) active.push("preferences")

    return active.join(", ")
  }, [draft])

  if (!mounted || !isOpen) return null

  const acceptAll = () => {
    saveCookieConsent({
      analytics: true,
      marketing: true,
      preferences: true,
    })

    setHasSavedChoice(true)
    setIsOpen(false)
  }

  const rejectOptional = () => {
    saveCookieConsent({
      analytics: false,
      marketing: false,
      preferences: false,
    })

    setHasSavedChoice(true)
    setIsOpen(false)
  }

  const saveChoices = () => {
    saveCookieConsent(draft)

    setHasSavedChoice(true)
    setIsOpen(false)
  }

  const updateDraft = (key: keyof ConsentDraft) => {
    setDraft((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie choices"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.32)",
        padding: 18,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          background: "#ffffff",
          borderRadius: 26,
          border: "1px solid #d1fae5",
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b, #047857)",
            color: "#ffffff",
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.16)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 10,
            }}
          >
            Cookie choices
          </div>

          <h2
            style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              lineHeight: 1.15,
              margin: "0 0 8px",
              fontWeight: 950,
            }}
          >
            Help us keep YanBo Practice Portal useful and safe
          </h2>

          <p
            style={{
              color: "#d1fae5",
              fontSize: 16,
              lineHeight: 1.65,
              margin: 0,
              maxWidth: 820,
            }}
          >
            We use essential cookies and storage to make the portal work. With
            your choice, we may also use optional cookies to understand how the
            portal is used and to improve future advertising.
          </p>
        </div>

        <div style={{ padding: 22 }}>
          {!showChoices ? (
            <>
              <p
                style={{
                  color: "#374151",
                  fontSize: 15.5,
                  lineHeight: 1.7,
                  margin: "0 0 16px",
                }}
              >
                Essential cookies are always on because they are needed for
                login, security and basic portal features. Optional analytics,
                marketing and preference cookies are off unless you allow them.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <button type="button" onClick={acceptAll} style={primaryButton}>
                  Accept all
                </button>

                <button
                  type="button"
                  onClick={rejectOptional}
                  style={secondaryButton}
                >
                  Reject optional
                </button>

                <button
                  type="button"
                  onClick={() => setShowChoices(true)}
                  style={outlineButton}
                >
                  Manage choices
                </button>

                {hasSavedChoice && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={plainButton}
                  >
                    Close
                  </button>
                )}
              </div>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: "14px 0 0",
                }}
              >
                Read more in our{" "}
                <Link
                  href="/cookies"
                  style={{
                    color: "#065f46",
                    fontWeight: 800,
                    textDecoration: "underline",
                  }}
                >
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  style={{
                    color: "#065f46",
                    fontWeight: 800,
                    textDecoration: "underline",
                  }}
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <CookieChoiceRow
                  title="Essential cookies"
                  description="Needed for login, security, account access and remembering your cookie choice. These are always on."
                  checked
                  disabled
                />

                <CookieChoiceRow
                  title="Analytics cookies"
                  description="Help us understand which pages and features are used, so we can improve the portal."
                  checked={draft.analytics}
                  onChange={() => updateDraft("analytics")}
                />

                <CookieChoiceRow
                  title="Marketing cookies"
                  description="Help us measure advertising, understand sign-ups from campaigns and support future relevant promotion."
                  checked={draft.marketing}
                  onChange={() => updateDraft("marketing")}
                />

                <CookieChoiceRow
                  title="Preferences cookies"
                  description="Remember helpful choices such as display preferences or portal settings where they are not essential."
                  checked={draft.preferences}
                  onChange={() => updateDraft("preferences")}
                />
              </div>

              <p
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: "0 0 14px",
                }}
              >
                Current choice: {statusText}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <button type="button" onClick={saveChoices} style={primaryButton}>
                  Save choices
                </button>

                <button type="button" onClick={acceptAll} style={secondaryButton}>
                  Accept all
                </button>

                <button
                  type="button"
                  onClick={rejectOptional}
                  style={outlineButton}
                >
                  Reject optional
                </button>

                <button
                  type="button"
                  onClick={() => setShowChoices(false)}
                  style={plainButton}
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CookieChoiceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: () => void
}) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 14,
        alignItems: "center",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 16,
        background: disabled ? "#f9fafb" : "#ffffff",
      }}
    >
      <span>
        <span
          style={{
            display: "block",
            color: "#064e3b",
            fontSize: 16,
            fontWeight: 900,
            marginBottom: 4,
          }}
        >
          {title}
        </span>

        <span
          style={{
            display: "block",
            color: "#4b5563",
            fontSize: 14.5,
            lineHeight: 1.55,
          }}
        >
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={{
          width: 22,
          height: 22,
          accentColor: "#047857",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      />
    </label>
  )
}

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "#047857",
  color: "#ffffff",
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
}

const secondaryButton: React.CSSProperties = {
  border: "1px solid #bbf7d0",
  background: "#ecfdf5",
  color: "#065f46",
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
}

const outlineButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
}

const plainButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#374151",
  borderRadius: 14,
  padding: "12px 10px",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
}