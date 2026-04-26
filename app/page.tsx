"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Header from "../components/Header"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function LandingPage() {
  const router = useRouter()

  const subjects = [
    {
      title: "English",
      icon: "📘",
      text: "Vocabulary, spelling, grammar, punctuation and comprehension practice.",
    },
    {
      title: "Maths",
      icon: "➗",
      text: "Arithmetic, fractions, reasoning, problem-solving and exam-style practice.",
    },
    {
      title: "Verbal Reasoning",
      icon: "🧠",
      text: "Words, codes, logic, patterns and reasoning question types.",
    },
    {
      title: "Non-Verbal Reasoning",
      icon: "🔷",
      text: "Shape patterns, rotations, reflections and spatial reasoning.",
    },
  ]

  const plans = [
    {
      title: "Free",
      badge: "Start here",
      icon: "🌱",
      price: "£0 / month",
      text: "A great starting point for trying YanBo Learning before upgrading.",
      features: [
        "Register for free",
        "Try selected free tests",
        "Explore the learning areas",
        "Good for first-time users",
      ],
      button: "Get started",
      path: "/signup",
      featured: false,
    },
    {
      title: "Monthly",
      badge: "Most popular",
      icon: "⭐",
      price: "£9.99 / month",
      text: "Flexible monthly access for regular 11+ practice and progress building.",
      features: [
        "Full practice access",
        "Progress tracking",
        "Review mistakes",
        "Custom test builder",
      ],
      button: "Choose monthly",
      path: "/signup",
      featured: true,
    },
    {
      title: "Yearly",
      badge: "Best value",
      icon: "🏆",
      price: "£99 / year",
      text: "Best value for families who want long-term preparation and steady practice.",
      features: [
        "Everything in Monthly",
        "Better value overall",
        "Ideal for long-term learning",
        "Full 11+ preparation access",
      ],
      button: "Choose yearly",
      path: "/signup",
      featured: false,
    },
  ]

  const faqs = [
    {
      question: "What is YanBo Learning?",
      answer:
        "YanBo Learning is an online 11+ practice platform covering English, Maths, Verbal Reasoning and Non-Verbal Reasoning.",
    },
    {
      question: "Can I start for free?",
      answer:
        "Yes. You can create a free account and try selected practice areas before choosing a paid membership.",
    },
    {
      question: "What is included in a paid membership?",
      answer:
        "Paid members get wider access to practice tests, progress tracking, review pages and the custom test builder.",
    },
    {
      question: "Can my child review mistakes?",
      answer:
        "Yes. Review pages help students practise previous mistakes and strengthen weaker topics.",
    },
    {
      question: "Does YanBo Learning track progress?",
      answer:
        "Yes. Progress pages help show recent scores, success rates, strengths and areas that need more practice.",
    },
    {
      question: "Is this suitable for regular weekly practice?",
      answer:
        "Yes. YanBo Learning is designed for short regular practice sessions as well as longer custom tests.",
    },
  ]

  function handleCardHover(e: React.MouseEvent<HTMLDivElement>, active: boolean) {
    e.currentTarget.style.transform = active ? "translateY(-6px)" : "translateY(0)"
    e.currentTarget.style.boxShadow = active
      ? "0 20px 40px rgba(0,0,0,0.12)"
      : "0 10px 25px rgba(0,0,0,0.08)"
  }

  return (
    <>
      <Header />

      <main style={styles.page}>
        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroBadge}>11+ practice made simple</div>

          <h1 style={styles.heroTitle}>Build confidence for the 11+</h1>

          <p style={styles.heroText}>
            YanBo Learning helps students practise English, Maths, Verbal
            Reasoning and Non-Verbal Reasoning with focused tests, review tools,
            progress tracking and custom practice.
          </p>

          <div style={styles.heroActions}>
            <button
              style={styles.primaryButton}
              onClick={() => router.push("/signup")}
            >
              Start free
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => router.push("/login")}
            >
              Sign in
            </button>
          </div>
        </section>

        {/* SUBJECT OVERVIEW */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Practise the key 11+ areas</h2>
            <p style={styles.sectionSubtitle}>
              Everything is organised into clear subject areas so students can
              practise little and often.
            </p>
          </div>

          <div style={styles.subjectGrid}>
            {subjects.map((subject) => (
              <div key={subject.title} style={styles.subjectCard}>
                <div style={styles.subjectIcon}>{subject.icon}</div>
                <h3 style={styles.subjectTitle}>{subject.title}</h3>
                <p style={styles.subjectText}>{subject.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY SECTION */}
        <section style={styles.whySection}>
          <div style={styles.whyCard}>
            <div>
              <h2 style={styles.whyTitle}>Why use YanBo Learning?</h2>
              <p style={styles.whyText}>
                11+ preparation works best when practice is regular, focused and
                easy to review. YanBo Learning is designed to help students see
                what they know, spot weaker areas and practise again with more
                confidence.
              </p>
            </div>

            <div style={styles.whyList}>
              <div style={styles.whyItem}>✓ Topic-based practice</div>
              <div style={styles.whyItem}>✓ Instant learning focus</div>
              <div style={styles.whyItem}>✓ Review weaker areas</div>
              <div style={styles.whyItem}>✓ Track improvement over time</div>
            </div>
          </div>
        </section>

        {/* SUBSCRIPTION CARDS */}
        <section style={styles.subscriptionSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Choose your plan</h2>
            <p style={styles.sectionSubtitle}>
              Start free and upgrade when you are ready for more practice,
              tracking and progress tools.
            </p>
          </div>

          <div style={styles.subscriptionGrid}>
            {plans.map((plan) => (
              <div
                key={plan.title}
                style={{
                  ...styles.card,
                  ...(plan.featured ? styles.featuredCard : {}),
                  ...hoverCardStyle,
                }}
                onClick={() => router.push(plan.path)}
                onMouseEnter={(e) => handleCardHover(e, true)}
                onMouseLeave={(e) => handleCardHover(e, false)}
              >
                <div
                  style={{
                    ...styles.planBadge,
                    ...(plan.featured ? styles.featuredBadge : {}),
                  }}
                >
                  {plan.badge}
                </div>

                <div style={styles.planIcon}>{plan.icon}</div>

                <h3
                  style={{
                    ...styles.cardTitle,
                    color: plan.featured ? "white" : "#111827",
                  }}
                >
                  {plan.title}
                </h3>

                <p
                  style={{
                    ...styles.planPrice,
                    color: plan.featured ? "#bbf7d0" : "#065f46",
                  }}
                >
                  {plan.price}
                </p>

                <p
                  style={{
                    ...styles.cardText,
                    color: plan.featured ? "#d1fae5" : "#4b5563",
                  }}
                >
                  {plan.text}
                </p>

                <div
                  style={{
                    ...styles.featuresBox,
                    background: plan.featured ? "rgba(255,255,255,0.08)" : "#f9fafb",
                  }}
                >
                  {plan.features.map((feature) => (
                    <p
                      key={feature}
                      style={{
                        ...styles.featureItem,
                        color: plan.featured ? "#ecfdf5" : "#374151",
                      }}
                    >
                      ✓ {feature}
                    </p>
                  ))}
                </div>

                <button
                  style={{
                    ...styles.button,
                    ...(plan.featured ? styles.featuredButton : {}),
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(plan.path)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = plan.featured
                      ? "#f0fdf4"
                      : "#bbf7d0"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = plan.featured
                      ? "white"
                      : "#d4f5d0"
                  }}
                >
                  {plan.button}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* TRUSTPILOT PLACEHOLDER */}
        <section style={styles.trustSection}>
          <div style={styles.trustCard}>
            <div style={styles.stars}>★★★★★</div>

            <h2 style={styles.trustTitle}>
              Trusted by families preparing for the 11+
            </h2>

            <p style={styles.trustText}>
              When your Trustpilot profile is ready, you can replace this area
              with the official Trustpilot widget. For now, this gives the
              landing page a clean trust section.
            </p>

            <div style={styles.trustPlaceholder}>
              Trustpilot reviews coming soon
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={styles.faqSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p style={styles.sectionSubtitle}>
              Simple answers for parents and students getting started with YanBo
              Learning.
            </p>
          </div>

          <div style={styles.faqGrid}>
            {faqs.map((faq) => (
              <div key={faq.question} style={styles.faqCard}>
                <h3 style={styles.faqQuestion}>{faq.question}</h3>
                <p style={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f4fbf4 0%, #f8fafc 48%, #ffffff 100%)",
    padding: "30px 20px 60px",
  },

  hero: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
    textAlign: "center",
    background:
      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #ffffff 100%)",
    borderRadius: "30px",
    padding: "56px 24px",
    boxShadow: "0 14px 36px rgba(0,0,0,0.07)",
    border: "1px solid #d1fae5",
  },

  heroBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "18px",
  },

  heroTitle: {
    fontSize: "46px",
    lineHeight: 1.08,
    margin: "0 0 16px",
    color: "#064e3b",
    fontWeight: 900,
  },

  heroText: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "800px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  heroActions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "30px",
  },

  primaryButton: {
    padding: "14px 24px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    boxShadow: "0 10px 24px rgba(22,163,74,0.25)",
  },

  secondaryButton: {
    padding: "14px 24px",
    borderRadius: "14px",
    border: "1px solid #bbf7d0",
    background: "white",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
  },

  section: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  sectionTitle: {
    fontSize: "34px",
    margin: "0 0 10px",
    color: "#1f3b2d",
    fontWeight: 900,
  },

  sectionSubtitle: {
    fontSize: "17px",
    color: "#355244",
    maxWidth: "760px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  subjectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  subjectCard: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.07)",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },

  subjectIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  subjectTitle: {
    margin: "0 0 10px",
    fontSize: "22px",
    color: "#111827",
    fontWeight: 800,
  },

  subjectText: {
    margin: 0,
    fontSize: "15.5px",
    color: "#4b5563",
    lineHeight: 1.6,
  },

  whySection: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
  },

  whyCard: {
    background: "#064e3b",
    color: "white",
    borderRadius: "28px",
    padding: "34px",
    boxShadow: "0 14px 34px rgba(6,78,59,0.22)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.8fr)",
    gap: "26px",
    alignItems: "center",
  },

  whyTitle: {
    margin: "0 0 12px",
    fontSize: "32px",
    fontWeight: 900,
  },

  whyText: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  whyList: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "20px",
    display: "grid",
    gap: "12px",
  },

  whyItem: {
    color: "#ecfdf5",
    fontSize: "16px",
    fontWeight: 700,
  },

  subscriptionSection: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
    textAlign: "center",
  },

  subscriptionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "white",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    border: "1px solid #e5e7eb",
  },

  featuredCard: {
    background: "#064e3b",
    border: "1px solid #064e3b",
    boxShadow: "0 18px 40px rgba(6,78,59,0.22)",
  },

  planBadge: {
    position: "absolute",
    top: "-13px",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
  },

  featuredBadge: {
    background: "#fef3c7",
    color: "#92400e",
  },

  planIcon: {
    fontSize: "42px",
    marginBottom: "12px",
    marginTop: "4px",
  },

  cardTitle: {
    fontSize: "25px",
    margin: "0 0 8px",
    color: "#111827",
    fontWeight: 900,
  },

  planPrice: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#065f46",
    margin: "0 0 12px",
  },

  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "18px",
    minHeight: "78px",
  },

  featuresBox: {
    width: "100%",
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "20px",
    textAlign: "left",
    flexGrow: 1,
  },

  featureItem: {
    margin: "8px 0",
    fontSize: "15px",
    color: "#374151",
  },

  button: {
    padding: "13px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    minWidth: "180px",
  },

  featuredButton: {
    background: "white",
    color: "#064e3b",
  },

  trustSection: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
  },

  trustCard: {
    background: "white",
    borderRadius: "26px",
    padding: "34px 24px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },

  stars: {
    color: "#16a34a",
    fontSize: "26px",
    letterSpacing: "3px",
    marginBottom: "12px",
  },

  trustTitle: {
    fontSize: "30px",
    color: "#064e3b",
    margin: "0 0 12px",
    fontWeight: 900,
  },

  trustText: {
    fontSize: "16px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: "0 auto 20px",
    lineHeight: 1.7,
  },

  trustPlaceholder: {
    display: "inline-block",
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: 800,
  },

  faqSection: {
    maxWidth: "980px",
    margin: "0 auto",
  },

  faqGrid: {
    display: "grid",
    gap: "16px",
  },

  faqCard: {
    background: "white",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },

  faqQuestion: {
    margin: "0 0 8px",
    color: "#065f46",
    fontSize: "19px",
    fontWeight: 800,
  },

  faqAnswer: {
    margin: 0,
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: 1.7,
  },
}