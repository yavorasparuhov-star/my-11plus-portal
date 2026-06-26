"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type MembershipProfile = {
  plan: UserPlan | null
}

const PLAN_LABELS: Record<UserPlan, string> = {
  guest: "Guest",
  free: "Free",
  monthly: "Monthly",
  annual: "Annual",
  admin: "Admin",
}

const PLAN_DESCRIPTIONS: Record<UserPlan, string> = {
  guest:
    "Guest access is limited. Create or sign in to an account to save progress and use the full student portal.",
  free:
    "Your free membership gives access to selected free practice tests and lets you track progress in the portal.",
  monthly:
    "Your monthly membership gives access to member practice areas while your membership is active.",
  annual:
    "Your annual membership gives access to member practice areas while your membership is active.",
  admin:
    "Admin access gives full portal access for management, testing and support tasks.",
}

const PLAN_FEATURES: Record<UserPlan, string[]> = {
  guest: [
    "Limited access to public practice areas",
    "No saved student progress",
    "No member-only practice access",
  ],
  free: [
    "Selected free practice tests",
    "Student progress tracking",
    "Review practice for incorrect answers",
    "YanBo Coins and avatar access",
  ],
  monthly: [
    "Member practice access",
    "Student progress tracking",
    "Review practice for incorrect answers",
    "Custom test access where available",
    "YanBo Coins and avatar access",
  ],
  annual: [
    "Member practice access",
    "Student progress tracking",
    "Review practice for incorrect answers",
    "Custom test access where available",
    "YanBo Coins and avatar access",
  ],
  admin: [
    "Full portal access",
    "Testing and support access",
    "All member practice areas",
    "YanBo Coins and avatar access",
  ],
}

function normalisePlan(plan: string | null | undefined): UserPlan {
  if (
    plan === "guest" ||
    plan === "free" ||
    plan === "monthly" ||
    plan === "annual" ||
    plan === "admin"
  ) {
    return plan
  }

  return "free"
}

function getStatusText(plan: UserPlan) {
  if (plan === "guest") return "Limited access"
  if (plan === "free") return "Free access"
  if (plan === "admin") return "Admin access"
  return "Active membership"
}

function getStatusTone(plan: UserPlan) {
  if (plan === "monthly" || plan === "annual" || plan === "admin") {
    return {
      background: "#dcfce7",
      border: "#86efac",
      text: "#166534",
    }
  }

  if (plan === "free") {
    return {
      background: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
    }
  }

  return {
    background: "#fef3c7",
    border: "#fde68a",
    text: "#92400e",
  }
}

export default function MembershipPage() {
  const [plan, setPlan] = useState<UserPlan>("free")
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadMembership() {
      setLoading(true)
      setErrorMessage("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !user) {
        setPlan("guest")
        setErrorMessage("We could not load your membership details. Please sign in again.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle<MembershipProfile>()

      if (!isMounted) return

      if (error) {
        console.error("Could not load membership profile:", error)
        setPlan("free")
        setErrorMessage("We could not load your membership details just now.")
        setLoading(false)
        return
      }

      setPlan(normalisePlan(data?.plan))
      setLoading(false)
    }

    loadMembership()

    return () => {
      isMounted = false
    }
  }, [])

  const statusTone = useMemo(() => getStatusTone(plan), [plan])
  const planLabel = PLAN_LABELS[plan]
  const statusText = getStatusText(plan)
  const features = PLAN_FEATURES[plan]
  const description = PLAN_DESCRIPTIONS[plan]

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fbff 0%, #eef7ff 45%, #fff7ed 100%)",
        padding: "32px 16px 48px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1040px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#64748b",
              fontSize: "0.95rem",
              fontWeight: 700,
            }}
          >
            Account
          </p>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              lineHeight: 1.05,
              fontWeight: 900,
            }}
          >
            Membership
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              color: "#475569",
              fontSize: "1rem",
              maxWidth: "680px",
              lineHeight: 1.6,
            }}
          >
            View your current YanBo Learning membership and what access is
            included with your plan.
          </p>
        </div>

        {errorMessage ? (
          <div
            style={{
              marginBottom: "18px",
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#991b1b",
              borderRadius: "18px",
              padding: "14px 16px",
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.75fr)",
            gap: "20px",
            alignItems: "stretch",
          }}
        >
          <article
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "28px",
              padding: "24px",
              boxShadow: "0 22px 55px rgba(15, 23, 42, 0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "22px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#64748b",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Current plan
                </p>

                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "2rem",
                    fontWeight: 900,
                  }}
                >
                  {loading ? "Loading..." : planLabel}
                </h2>
              </div>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "999px",
                  border: `1px solid ${statusTone.border}`,
                  background: statusTone.background,
                  color: statusTone.text,
                  padding: "8px 13px",
                  fontSize: "0.88rem",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "Checking..." : statusText}
              </span>
            </div>

            <p
              style={{
                margin: "0 0 22px",
                color: "#475569",
                fontSize: "1rem",
                lineHeight: 1.7,
              }}
            >
              {loading ? "Checking your membership details..." : description}
            </p>

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "20px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 14px",
                  color: "#0f172a",
                  fontSize: "1.15rem",
                  fontWeight: 900,
                }}
              >
                Included with this plan
              </h3>

              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: "10px",
                }}
              >
                {features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      color: "#334155",
                      lineHeight: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        color: "#166534",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        flex: "0 0 auto",
                        marginTop: "1px",
                      }}
                    >
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <aside
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            <article
              style={{
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                borderRadius: "28px",
                padding: "22px",
                boxShadow: "0 22px 55px rgba(15, 23, 42, 0.08)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 12px",
                  color: "#111827",
                  fontSize: "1.25rem",
                  fontWeight: 900,
                }}
              >
                Renewal details
              </h2>

              <p
                style={{
                  margin: "0 0 14px",
                  color: "#475569",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                Membership renewals, upgrades and plan changes are managed by
                YanBo Learning support.
              </p>

              <div
                style={{
                  borderRadius: "18px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "14px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#334155",
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                    fontWeight: 700,
                  }}
                >
                  For membership changes, please contact YanBo Learning
                  support.
                </p>
              </div>
            </article>

            <article
              style={{
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                borderRadius: "28px",
                padding: "22px",
                boxShadow: "0 22px 55px rgba(15, 23, 42, 0.08)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 12px",
                  color: "#111827",
                  fontSize: "1.25rem",
                  fontWeight: 900,
                }}
              >
                Need help?
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                If your membership information does not look right, please
                contact YanBo Learning support and we will check your account.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </main>
  )
}
