"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { CUSTOM_TEST_MAIN_CATEGORIES } from "../../lib/custom-tests/catalog"
import Header from "../../components/Header"
import Footer from "../../components/Footer"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

function hasCustomTestAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f0fdf4 0%, #f8fafc 45%, #ffffff 100%)",
    padding: "32px 16px 56px",
    boxSizing: "border-box",
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
  },
  hero: {
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
  },
  heroCopy: {
    flex: "1 1 640px",
  },
  planBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    background: "#ecfccb",
    color: "#365314",
    border: "1px solid #d9f99d",
    fontWeight: 800,
    fontSize: "0.9rem",
    marginBottom: 16,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    lineHeight: 1.1,
    fontWeight: 900,
    color: "#064e3b",
    margin: 0,
  },
  intro: {
    fontSize: "1.05rem",
    color: "#374151",
    maxWidth: 820,
    lineHeight: 1.7,
    margin: 0,
  },
  notice: {
    marginTop: 24,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 18,
    padding: 18,
  },
  noticeTitle: {
    margin: "0 0 8px",
    fontSize: "1.05rem",
    color: "#9a3412",
    fontWeight: 800,
  },
  noticeText: {
    margin: 0,
    color: "#7c2d12",
    lineHeight: 1.65,
    fontSize: "0.98rem",
  },
  heroActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  linkButton: {
    display: "inline-block",
    textAlign: "center",
    padding: "12px 18px",
    borderRadius: 12,
    fontWeight: 800,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  primaryLink: {
    background: "#14532d",
    color: "#ffffff",
    border: "1px solid #14532d",
    boxShadow: "0 8px 18px rgba(20, 83, 45, 0.2)",
  },
  secondaryLink: {
    background: "#ffffff",
    color: "#14532d",
    border: "1px solid #bbf7d0",
    boxShadow: "0 8px 18px rgba(0, 0, 0, 0.04)",
  },
  section: {
    marginBottom: 38,
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
    color: "#1f2937",
    fontWeight: 900,
    margin: "0 0 10px",
  },
  sectionText: {
    color: "#4b5563",
    fontSize: "1rem",
    lineHeight: 1.6,
    maxWidth: 760,
    margin: "0 auto",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 18,
  },
  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },
  subjectCard: {
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 250,
  },
  statusRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusPill: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.8rem",
  },
  comingSoonPill: {
    background: "#ecfdf5",
    color: "#047857",
  },
  lockedPill: {
    background: "#fff7ed",
    color: "#9a3412",
  },
  subjectTitle: {
    fontSize: "1.3rem",
    fontWeight: 900,
    color: "#111827",
    margin: "0 0 10px",
  },
  subjectText: {
    fontSize: "0.96rem",
    color: "#4b5563",
    lineHeight: 1.65,
    margin: "0 0 18px",
  },
  subjectButton: {
    display: "inline-block",
    textAlign: "center",
    padding: "12px 16px",
    borderRadius: 12,
    fontWeight: 800,
    textDecoration: "none",
  },
  buildButton: {
    background: "#16a34a",
    color: "#ffffff",
    border: "1px solid #16a34a",
  },
  lockedButton: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
  },
  disabledButton: {
    background: "#f3f4f6",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    cursor: "not-allowed",
  },
  infoCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: 20,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.05)",
  },
  infoHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: "1.55rem",
    width: 38,
    height: 38,
    borderRadius: 14,
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoTitle: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#064e3b",
    margin: 0,
  },
  infoText: {
    margin: 0,
    color: "#4b5563",
    lineHeight: 1.6,
  },
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
          .maybeSingle()

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
    <>
      <Header />

      <main style={styles.page}>
        <div style={styles.shell}>
          <section style={styles.hero}>
            <div style={styles.heroCopy}>
              {(loadingPlan || !canUseCustomTests) && (
                <div style={styles.planBadge}>
                  {loadingPlan
                    ? "Checking membership..."
                    : isGuest
                      ? "Sign up or log in to build your own tests"
                      : "Build a Test is a member feature"}
                </div>
              )}

              <div style={styles.titleRow}>
                <h1 style={styles.title}>
                  Build a Test
                </h1>

                {canUseCustomTests && (
                  <Link
                    href="/custom-tests/history"
                    style={{ ...styles.linkButton, ...styles.secondaryLink }}
                  >
                    View History
                  </Link>
                )}
              </div>

              <p style={styles.intro}>
Build focused practice tests across English, Maths, Verbal
Reasoning and Non-Verbal Reasoning. Choose the topics,
difficulty, number of questions and time limit, then review the
results to guide the next step.
              </p>

              {!canUseCustomTests && (
                <div style={styles.notice}>
                  <h2 style={styles.noticeTitle}>
                    Build a Test is available for monthly and annual members
                  </h2>

                  <p style={styles.noticeText}>
                    {isGuest
? "Create a free account to explore the portal, or log in if you already have an account. Monthly and annual members can build and run their own tests."
: "You are currently on the Free plan. Free members can explore selected practice tests. Monthly and annual members can build and run their own tests by choosing topics, difficulty, question count and time limit."}
                  </p>
                </div>
              )}
            </div>

            {!canUseCustomTests && (
              <div style={styles.heroActions}>
                {isGuest ? (
                  <>
                  <Link
                    href="/signup"
                    style={{ ...styles.linkButton, ...styles.primaryLink }}
                  >
                    Sign Up Free
                  </Link>

                  <Link
                    href="/login?redirectTo=%2Fcustom-tests"
                    style={{ ...styles.linkButton, ...styles.secondaryLink }}
                  >
                    Log In
                  </Link>
                </>
              ) : (
                <Link
                  href="/profile"
                  style={{ ...styles.linkButton, ...styles.primaryLink }}
                >
                  Upgrade Membership
                </Link>
                )}
              </div>
            )}
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
Why building a test helps
              </h2>

              <p style={styles.sectionText}>
Building a test helps children practise with more control,
especially when they need to revisit weaker topics before the
real exam.
              </p>
            </div>

            <div style={styles.infoGrid}>
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
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                Choose a subject
              </h2>

              <p style={styles.sectionText}>
             {canUseCustomTests
  ? "Choose a subject below to start building your test."
  : "You can see what is available below. Building and running your own tests is unlocked for monthly and annual members."}
              </p>
            </div>

            <div style={styles.subjectGrid}>
              {CUSTOM_TEST_MAIN_CATEGORIES.map((category) => {
                const isEnabled = category.enabled

                return (
                  <div
                    key={category.key}
                    style={styles.subjectCard}
                  >
                    <div>
                      {(!isEnabled || (!canUseCustomTests && isEnabled)) && (
                        <div style={styles.statusRow}>
                          {!isEnabled && (
                            <span
                              style={{
                                ...styles.statusPill,
                                ...styles.comingSoonPill,
                              }}
                            >
                              Coming soon
                            </span>
                          )}

                          {!canUseCustomTests && isEnabled && (
                            <span
                              style={{
                                ...styles.statusPill,
                                ...styles.lockedPill,
                              }}
                            >
                              Locked
                            </span>
                          )}
                        </div>
                      )}

                 <h3 style={styles.subjectTitle}>
  {category.key === "english"
    ? "Build an English Test"
    : `Build a ${category.label} Test`}
</h3>

                      <p style={styles.subjectText}>
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
                          ...styles.subjectButton,
                          ...styles.buildButton,
                        }}
                      >
Build a Test
                      </Link>
                    ) : isGuest ? (
                      <Link
                        href={`/login?redirectTo=${encodeURIComponent(
                          `/custom-tests/${category.key}`
                        )}`}
                        style={{
                          ...styles.subjectButton,
                          ...styles.lockedButton,
                        }}
                      >
                        Log In to Unlock
                      </Link>
                    ) : isFree ? (
                      <Link
                        href="/profile"
                        style={{
                          ...styles.subjectButton,
                          ...styles.lockedButton,
                        }}
                      >
                        Upgrade to Unlock
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        style={{
                          ...styles.subjectButton,
                          ...styles.disabledButton,
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
      <Footer />
    </>
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
    <div style={styles.infoCard}>
      <div style={styles.infoHeader}>
        <div style={styles.infoIcon}>
          {icon}
        </div>

        <h3 style={styles.infoTitle}>
          {title}
        </h3>
      </div>

      <p style={styles.infoText}>{text}</p>
    </div>
  )
}
