"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"
import { CUSTOM_TEST_MAIN_CATEGORIES } from "../../../lib/custom-tests/catalog"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

function hasCustomTestAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

export default function CustomTestsPage() {
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [loadingPlan, setLoadingPlan] = useState(true)

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoadingPlan(true)

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setPlan("guest")
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setPlan("free")
          return
        }

        const profilePlan = profile?.plan

        if (
          profilePlan === "free" ||
          profilePlan === "monthly" ||
          profilePlan === "annual" ||
          profilePlan === "admin"
        ) {
          setPlan(profilePlan)
        } else {
          setPlan("free")
        }
      } catch {
        setPlan("free")
      } finally {
        setLoadingPlan(false)
      }
    }

    loadPlan()
  }, [])

  const canUseCustomTests = hasCustomTestAccess(plan)

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              flex: "1 1 600px",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#1f2937",
                margin: "0 0 10px 0",
              }}
            >
              Custom Tests
            </h1>

            <p
              style={{
                fontSize: "1rem",
                color: "#4b5563",
                maxWidth: 760,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Build your own test inside one main category only. Choose a subject,
              select topics within that subject, choose the number of questions,
              and set the total time.
            </p>

            <div
              style={{
                marginTop: 14,
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                background: canUseCustomTests ? "#ecfccb" : "#fff7ed",
                color: canUseCustomTests ? "#365314" : "#9a3412",
                border: canUseCustomTests
                  ? "1px solid #d9f99d"
                  : "1px solid #fed7aa",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              {loadingPlan
                ? "Checking membership..."
                : canUseCustomTests
                  ? "Custom tests unlocked"
                  : "Custom tests are a paid feature"}
            </div>
          </div>

          {canUseCustomTests ? (
            <Link
              href="/custom-tests/history"
              style={{
                display: "inline-block",
                textAlign: "center",
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 600,
                textDecoration: "none",
                background: "#ffffff",
                color: "#111827",
                border: "1px solid #d1d5db",
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                whiteSpace: "nowrap",
              }}
            >
              View History
            </Link>
          ) : (
            <Link
              href="/profile"
              style={{
                display: "inline-block",
                textAlign: "center",
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 600,
                textDecoration: "none",
                background: "#fff7ed",
                color: "#9a3412",
                border: "1px solid #fed7aa",
                boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                whiteSpace: "nowrap",
              }}
            >
              Upgrade Membership
            </Link>
          )}
        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {CUSTOM_TEST_MAIN_CATEGORIES.map((category) => {
            const cardStyle: React.CSSProperties = {
              background: "#ffffff",
              borderRadius: 16,
              padding: 22,
              border: "1px solid #e5e7eb",
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 240,
            }

            const titleStyle: React.CSSProperties = {
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: 10,
            }

            const textStyle: React.CSSProperties = {
              fontSize: "0.98rem",
              color: "#4b5563",
              lineHeight: 1.6,
              marginBottom: 18,
            }

            const buttonBaseStyle: React.CSSProperties = {
              display: "inline-block",
              textAlign: "center",
              padding: "12px 16px",
              borderRadius: 10,
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }

            return (
              <div key={category.key} style={cardStyle}>
                <div>
                  <h2 style={titleStyle}>{category.label}</h2>

                  <p style={textStyle}>
                    {category.key === "english" &&
                      "Create custom tests using Vocabulary, Spelling, Comprehension, Grammar, and Punctuation."}
                  {category.key === "math" &&
  "Create custom tests using Maths topics such as Number & Place Value, Four Operations, Fractions, Shape & Space, Measurement, Data Handling and Algebra & Reasoning."}
                    {category.key === "vr" &&
                      "Create custom tests using VR topics such as Word Relationships, Codes & Logic, and Sequences."}
                    {category.key === "nvr" &&
                      "Create custom tests using NVR topics such as Shape Patterns, Rotations, Reflections and Spatial Logic."}
                  </p>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#6b7280",
                      marginBottom: 20,
                    }}
                  >
                    {category.enabled
                      ? `${category.topics.length} topic${
                          category.topics.length === 1 ? "" : "s"
                        } available`
                      : "Coming soon"}
                  </div>
                </div>

                {!category.enabled ? (
                  <span
                    style={{
                      ...buttonBaseStyle,
                      background: "#e5e7eb",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      cursor: "not-allowed",
                    }}
                  >
                    Coming Soon
                  </span>
                ) : loadingPlan ? (
                  <span
                    style={{
                      ...buttonBaseStyle,
                      background: "#e5e7eb",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      cursor: "wait",
                    }}
                  >
                    Checking Access...
                  </span>
                ) : canUseCustomTests ? (
                  <Link
                    href={`/custom-tests/${category.key}`}
                    style={{
                      ...buttonBaseStyle,
                      background: "#d9f99d",
                      color: "#14532d",
                      border: "1px solid #bef264",
                    }}
                  >
                    Build {category.label} Test
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    style={{
                      ...buttonBaseStyle,
                      background: "#fff7ed",
                      color: "#9a3412",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    Upgrade to Unlock
                  </Link>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
