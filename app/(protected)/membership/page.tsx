"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"
type SubscriptionStatus = "active" | "trialing" | "past_due" | "cancelled" | "expired"

type MembershipProfile = {
  plan: UserPlan | null
}

type SubscriptionRow = {
  plan: UserPlan | null
  status: SubscriptionStatus | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

const PLAN_LABELS: Record<UserPlan, string> = {
  guest: "Guest",
  free: "Free",
  monthly: "Monthly",
  annual: "Annual",
  admin: "Admin",
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment attention needed",
  cancelled: "Cancelled",
  expired: "Expired",
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

function normaliseStatus(
  status: string | null | undefined,
): SubscriptionStatus | null {
  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "cancelled" ||
    status === "expired"
  ) {
    return status
  }

  return null
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not recorded"

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return "Not recorded"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function getFallbackStatusText(plan: UserPlan) {
  if (plan === "guest") return "Limited access"
  if (plan === "free") return "Free access"
  if (plan === "admin") return "Admin access"
  return "Member access"
}

function getStatusText(
  plan: UserPlan,
  subscriptionStatus: SubscriptionStatus | null,
) {
  if (subscriptionStatus) return STATUS_LABELS[subscriptionStatus]
  return getFallbackStatusText(plan)
}

function getStatusTone(
  plan: UserPlan,
  subscriptionStatus: SubscriptionStatus | null,
) {
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return {
      background: "#dcfce7",
      border: "#86efac",
      text: "#166534",
    }
  }

  if (subscriptionStatus === "past_due") {
    return {
      background: "#fef3c7",
      border: "#fde68a",
      text: "#92400e",
    }
  }

  if (subscriptionStatus === "cancelled" || subscriptionStatus === "expired") {
    return {
      background: "#fee2e2",
      border: "#fecaca",
      text: "#991b1b",
    }
  }

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

function isPaidPlan(plan: UserPlan) {
  return plan === "monthly" || plan === "annual"
}

function getRenewalLabel(
  plan: UserPlan,
  subscription: SubscriptionRow | null,
  status: SubscriptionStatus | null,
) {
  if (!subscription) {
    if (plan === "free") return "Free plan"
    if (plan === "admin") return "Admin account"
    return "Renewal details"
  }

  if (!isPaidPlan(plan)) {
    return "Renewal"
  }

  if (status === "expired") return "Expired on"

  if (status === "cancelled" || subscription.cancel_at_period_end) {
    return "Access ends on"
  }

  return "Renews on"
}

function getRenewalValue(
  plan: UserPlan,
  subscription: SubscriptionRow | null,
) {
  if (!subscription) {
    if (plan === "free") return "No expiry"
    if (plan === "admin") return "No expiry"
    return "Not recorded yet"
  }

  if (!isPaidPlan(plan)) {
    return "Not applicable"
  }

  return formatDate(subscription.current_period_end)
}

function getAutoRenewalText(
  plan: UserPlan,
  subscription: SubscriptionRow | null,
  status: SubscriptionStatus | null,
) {
  if (!isPaidPlan(plan)) return "Not applicable"
  if (!subscription) return "Not recorded yet"
  if (status === "cancelled" || status === "expired") return "Off"
  return subscription.cancel_at_period_end ? "Off" : "On"
}

function getRenewalNote(
  plan: UserPlan,
  subscription: SubscriptionRow | null,
  status: SubscriptionStatus | null,
) {
  if (!subscription) {
    if (plan === "free") {
      return "Your account is currently on the free plan, so there is no renewal date."
    }

    if (plan === "admin") {
      return "Admin accounts do not use normal membership renewal dates."
    }

    return "Your current access is shown from your profile. Detailed renewal information has not been recorded for this account yet."
  }

  if (status === "past_due") {
    return "Your membership may need payment attention. Please contact YanBo Learning support if this does not look right."
  }

  if (status === "cancelled" || status === "expired") {
    return "If you would like to continue member access, please contact YanBo Learning support."
  }

  if (subscription.cancel_at_period_end) {
    return "Auto-renewal is off. Member access should continue until the access end date shown above."
  }

  if (isPaidPlan(plan)) {
    return "Auto-renewal is on for this membership record."
  }

  return "Membership renewals, upgrades and plan changes are managed by YanBo Learning support."
}

export default function MembershipPage() {
  const [profilePlan, setProfilePlan] = useState<UserPlan>("free")
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [renewalWarning, setRenewalWarning] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadMembership() {
      setLoading(true)
      setErrorMessage("")
      setRenewalWarning("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !user) {
        setProfilePlan("guest")
        setSubscription(null)
        setErrorMessage("We could not load your membership details. Please sign in again.")
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle<MembershipProfile>()

      if (!isMounted) return

      if (profileError) {
        console.error("Could not load membership profile:", profileError)
        setProfilePlan("free")
        setSubscription(null)
        setErrorMessage("We could not load your membership details just now.")
        setLoading(false)
        return
      }

      const fallbackPlan = normalisePlan(profileData?.plan)

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select(
          "plan, status, current_period_start, current_period_end, cancel_at_period_end",
        )
        .eq("user_id", user.id)
        .maybeSingle<SubscriptionRow>()

      if (!isMounted) return

      if (subscriptionError) {
        console.error("Could not load subscription details:", subscriptionError)
        setRenewalWarning("Renewal details could not be loaded just now.")
        setProfilePlan(fallbackPlan)
        setSubscription(null)
        setLoading(false)
        return
      }

      setProfilePlan(fallbackPlan)
      setSubscription(subscriptionData ?? null)
      setLoading(false)
    }

    loadMembership()

    return () => {
      isMounted = false
    }
  }, [])

  const plan = subscription?.plan ? normalisePlan(subscription.plan) : profilePlan
  const subscriptionStatus = normaliseStatus(subscription?.status)
  const statusTone = useMemo(
    () => getStatusTone(plan, subscriptionStatus),
    [plan, subscriptionStatus],
  )
  const planLabel = PLAN_LABELS[plan]
  const statusText = getStatusText(plan, subscriptionStatus)
  const features = PLAN_FEATURES[plan]
  const description = PLAN_DESCRIPTIONS[plan]
  const renewalLabel = getRenewalLabel(plan, subscription, subscriptionStatus)
  const renewalValue = getRenewalValue(plan, subscription)
  const autoRenewalText = getAutoRenewalText(plan, subscription, subscriptionStatus)
  const renewalNote = getRenewalNote(plan, subscription, subscriptionStatus)

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
            View your current YanBo Learning membership, renewal details and
            what access is included with your plan.
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

        {renewalWarning ? (
          <div
            style={{
              marginBottom: "18px",
              border: "1px solid #fde68a",
              background: "#fffbeb",
              color: "#92400e",
              borderRadius: "18px",
              padding: "14px 16px",
              fontWeight: 700,
            }}
          >
            {renewalWarning}
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
                  margin: "0 0 16px",
                  color: "#111827",
                  fontSize: "1.25rem",
                  fontWeight: 900,
                }}
              >
                Renewal details
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
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
                      margin: "0 0 4px",
                      color: "#64748b",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {renewalLabel}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#111827",
                      fontSize: "1rem",
                      fontWeight: 900,
                    }}
                  >
                    {loading ? "Checking..." : renewalValue}
                  </p>
                </div>

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
                      margin: "0 0 4px",
                      color: "#64748b",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Auto-renewal
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#111827",
                      fontSize: "1rem",
                      fontWeight: 900,
                    }}
                  >
                    {loading ? "Checking..." : autoRenewalText}
                  </p>
                </div>

                {subscription?.current_period_start ? (
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
                        margin: "0 0 4px",
                        color: "#64748b",
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Current period started
                    </p>

                    <p
                      style={{
                        margin: 0,
                        color: "#111827",
                        fontSize: "1rem",
                        fontWeight: 900,
                      }}
                    >
                      {formatDate(subscription.current_period_start)}
                    </p>
                  </div>
                ) : null}
              </div>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                {loading
                  ? "Checking renewal information..."
                  : renewalNote}
              </p>
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
