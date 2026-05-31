"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { CUSTOM_TEST_MAIN_CATEGORIES } from "../../lib/custom-tests/catalog"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

function hasCustomTestAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

export default function PublicCustomTestsPage() {
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
  const isGuest = plan === "guest"
  const isFree = plan === "free"

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f0fdf4 0%, #f8fafc 45%, #ffffff 100%)",
        padding: "32px 16px 56px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
            flexWrap: "wrap",
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            borderRadius: 28,
            padding: 28,
            boxShadow: "0 16px 36px rgba(6, 78, 59, 0.08)",
            marginBottom: 34,
          }}
        >
          <div style={{ flex: "1 1 640px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                background: "#ecfccb",
                color: "#365314",
                border: "1px solid #d9f99d",
                fontWeight: 800,
                fontSize: "0.9rem",
                marginBottom: 16,
              }}
            >
              {loadingPlan
                ? "Checking membership..."
                : canUseCustomTests
                  ? "Custom tests unlocked"
                  : isGuest
                    ? "Sign up or log in to unlock custom tests"
                    : "Custom tests are a member feature"}
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3rem)",
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#064e3b",
                margin: "0 0 14px",
              }}
            >
              Custom 11+ Tests
            </h1>

            <p
              style={{
                fontSize: "1.05rem",
                color: "#374151",
                maxWidth: 820,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Create focused practice tests across English, Maths, Verbal
              Reasoning and Non-Verbal Reasoning. Choose the topics, difficulty,
              number of questions and time limit, then review the results to
              guide the next step.
            </p>

            {!canUseCustomTests && (
              <div
                style={{
                  marginTop: 24,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px",
                    fontSize: "1.05rem",
                    color: "#9a3412",
                    fontWeight: 800,
                  }}
                >
                  Custom tests are available for monthly and annual members
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#7c2d12",
                    lineHeight: 1.65,
                    fontSize: "0.98rem",
                  }}
                >
                  {isGuest
                    ? "Create a free account to explore the portal, or log in if you already have an account. Monthly and annual members can generate and run custom tests."
                    : "You are currently on the Free plan. Free members can explore selected practice tests. Monthly and annual members can generate and run custom tests by choosing topics, difficulty, question count and time limit."}
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            {canUseCustomTests ? (
              <Link
                href="/custom-tests/history"
                style={{
                  display: "inline-block",
                  textAlign: "center",
                  padding: "12px 18px",
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#14532d",
                  border: "1px solid #bbf7d0",
                  boxShadow: "0 8px 18px rgba(0, 0, 0, 0.04)",
                  whiteSpace: "nowrap",
                }}
              >
                View History
              </Link>
            ) : isGuest ? (
              <>
                <Link
                  href="/signup"
                  style={{
                    display: "inline-block",
                    textAlign: "center",
                    padding: "12px 18px",
                    borderRadius: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    background: "#14532d",
                    color: "#ffffff",
                    border: "1px solid #14532d",
                    boxShadow: "0 8px 18px rgba(20, 83, 45, 0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sign Up Free
                </Link>

                <Link
                  href="/login?redirectTo=%2Fcustom-tests"
                  style={{
                    display: "inline-block",
                    textAlign: "center",
                    padding: "12px 18px",
                    borderRadius: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                    background: "#ffffff",
                    color: "#14532d",
                    border: "1px solid #bbf7d0",
                    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Log In
                </Link>
              </>
            ) : (
              <Link
                href="/profile"
                style={{
                  display: "inline-block",
                  textAlign: "center",
                  padding: "12px 18px",
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: "none",
                  background: "#14532d",
                  color: "#ffffff",
                  border: "1px solid #14532d",
                  boxShadow: "0 8px 18px rgba(20, 83, 45, 0.2)",
                  whiteSpace: "nowrap",
                }}
              >
                Upgrade Membership
              </Link>
            )}
          </div>
        </section>

        <section style={{ marginBottom: 38 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                color: "#1f2937",
                fontWeight: 900,
                margin: "0 0 10px",
              }}
            >
              Why custom tests help
            </h2>

            <p
              style={{
                color: "#4b5563",
                fontSize: "1rem",
                lineHeight: 1.6,
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              Custom tests help children practise with more control, especially
              when they need to revisit weaker topics before the real exam.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 18,
            }}
          >
            <InfoCard
              icon="🎯"
              title="Choose topics"
              text="Focus on the areas your child needs most, such as punctuation, fractions, vocabulary, VR codes or NVR shape patterns."
            />

            <InfoCard
              icon="📈"
              title="Set the difficulty"
              text="Practise at Easy, Medium or Hard level depending on confidence, progress and exam preparation stage."
            />

            <InfoCard
              icon="✅"
              title="Review results"
              text="After each test, check answers, explanations and weaker areas to guide the next practice session."
            />
          </div>
        </section>

        <section>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <h2
              style={{
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                color: "#1f2937",
                fontWeight: 900,
                margin: "0 0 10px",
              }}
            >
              Choose a subject
            </h2>

            <p
              style={{
                color: "#4b5563",
                fontSize: "1rem",
                lineHeight: 1.6,
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              {canUseCustomTests
                ? "Choose a subject below to start building your custom test."
                : "You can see what is available below. Generating and running custom tests is unlocked for monthly and annual members."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {CUSTOM_TEST_MAIN_CATEGORIES.map((category) => {
              const isEnabled = category.enabled

              return (
                <div
                  key={category.key}
                  style={{
                    background: "#ffffff",
                    borderRadius: 22,
                    padding: 22,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 285,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "#ecfdf5",
                          color: "#047857",
                          fontWeight: 800,
                          fontSize: "0.8rem",
                        }}
                      >
                        {isEnabled
                          ? `${category.topics.length} topics`
                          : "Coming soon"}
                      </span>

                      {!canUseCustomTests && isEnabled && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: "#fff7ed",
                            color: "#9a3412",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                          }}
                        >
                          Locked
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 900,
                        color: "#111827",
                        margin: "0 0 10px",
                      }}
                    >
                      {category.label} Custom Test
                    </h3>

                    <p
                      style={{
                        fontSize: "0.96rem",
                        color: "#4b5563",
                        lineHeight: 1.65,
                        margin: "0 0 22px",
                      }}
                    >
                      {category.key === "english" &&
                        "Vocabulary, Spelling, Comprehension, Grammar and Punctuation."}

                      {category.key === "math" &&
                        "Number & Place Value, Four Operations, Fractions, Shape & Space, Measurement, Data Handling and Algebra & Reasoning."}

                      {category.key === "vr" &&
                        "Word Relationships, Codes & Logic and Sequence Patterns."}

                      {category.key === "nvr" &&
                        "Shape Patterns, Rotations, Reflections and Spatial Logic."}
                    </p>
                  </div>

                  {canUseCustomTests && isEnabled ? (
                    <Link
                      href={`/custom-tests/${category.key}`}
                      style={{
                        display: "inline-block",
                        textAlign: "center",
                        padding: "12px 16px",
                        borderRadius: 12,
                        fontWeight: 800,
                        textDecoration: "none",
                        background: "#16a34a",
                        color: "#ffffff",
                        border: "1px solid #16a34a",
                      }}
                    >
                      Build Test
                    </Link>
                  ) : isGuest ? (
                    <Link
                      href={`/login?redirectTo=${encodeURIComponent(
                        `/custom-tests/${category.key}`
                      )}`}
                      style={{
                        display: "inline-block",
                        textAlign: "center",
                        padding: "12px 16px",
                        borderRadius: 12,
                        fontWeight: 800,
                        textDecoration: "none",
                        background: "#fff7ed",
                        color: "#9a3412",
                        border: "1px solid #fed7aa",
                      }}
                    >
                      Log In to Unlock
                    </Link>
                  ) : isFree ? (
                    <Link
                      href="/profile"
                      style={{
                        display: "inline-block",
                        textAlign: "center",
                        padding: "12px 16px",
                        borderRadius: 12,
                        fontWeight: 800,
                        textDecoration: "none",
                        background: "#fff7ed",
                        color: "#9a3412",
                        border: "1px solid #fed7aa",
                      }}
                    >
                      Upgrade to Unlock
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        display: "inline-block",
                        textAlign: "center",
                        padding: "12px 16px",
                        borderRadius: 12,
                        fontWeight: 800,
                        background: "#f3f4f6",
                        color: "#6b7280",
                        border: "1px solid #e5e7eb",
                        cursor: "not-allowed",
                      }}
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: 22,
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{icon}</div>

      <h3
        style={{
          fontSize: "1.15rem",
          fontWeight: 800,
          color: "#064e3b",
          margin: "0 0 8px",
        }}
      >
        {title}
      </h3>

      <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.65 }}>{text}</p>
    </div>
  )
}