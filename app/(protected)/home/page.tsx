"use client"

import React from "react"
import { useRouter } from "next/navigation"

const cardHover = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function HomePage() {
  const router = useRouter()

  const cards = [
    {
      title: "English",
      icon: "📘",
      text: "Vocabulary, spelling, grammar, punctuation and comprehension practice.",
      path: "/english",
    },
    {
      title: "Math",
      icon: "➗",
      text: "Build arithmetic, reasoning, fractions, problem-solving and exam confidence.",
      path: "/math",
    },
    {
      title: "VR",
      icon: "🧠",
      text: "Practise verbal reasoning question types including words, codes and logic.",
      path: "/vr",
    },
    {
      title: "NVR",
      icon: "🔷",
      text: "Develop non-verbal reasoning skills, pattern recognition and spatial awareness.",
      path: "/nvr",
    },
    {
      title: "Progress",
      icon: "📊",
      text: "Check recent scores, success rates, strengths and areas for improvement.",
      path: "/progress",
    },
    {
      title: "Review",
      icon: "📚",
      text: "Retry questions and topics that need more practice until they are mastered.",
      path: "/review",
    },
  ]

  const memberships = [
    {
      title: "Free Membership",
      badge: "Start here",
      price: "Free",
      text: "Create a free account and try selected practice tests before upgrading.",
      features: [
        "Register for free",
        "Try selected free tests",
        "Explore the learning areas",
        "Good for first-time users",
      ],
      button: "Register for free",
      path: "/signup",
      highlighted: false,
    },
    {
      title: "Monthly Membership",
      badge: "Popular",
      price: "Monthly",
      text: "Best for families who want flexible access to regular 11+ practice.",
      features: [
        "Full subject access",
        "Progress tracking",
        "Review mistakes",
        "Custom test builder",
      ],
      button: "Choose monthly",
      path: "/signup",
      highlighted: true,
    },
    {
      title: "Annual Membership",
      badge: "Best value",
      price: "Annual",
      text: "Ideal for steady long-term preparation throughout the school year.",
      features: [
        "Everything in monthly",
        "Better long-term value",
        "Great for regular practice",
        "Full 11+ preparation access",
      ],
      button: "Choose annual",
      path: "/signup",
      highlighted: false,
    },
  ]

  const faqs = [
    {
      question: "What is YanBo Learning?",
      answer:
        "YanBo Learning is an 11+ practice platform covering English, Maths, Verbal Reasoning and Non-Verbal Reasoning.",
    },
    {
      question: "Can I start for free?",
      answer:
        "Yes. The free membership lets you register and try selected practice areas before choosing a paid membership.",
    },
    {
      question: "What do paid members get?",
      answer:
        "Paid members get wider access to tests, progress pages, review pages and the custom test builder.",
    },
    {
      question: "Can students review mistakes?",
      answer:
        "Yes. Review pages help students practise questions they previously answered incorrectly.",
    },
    {
      question: "Does YanBo Learning track progress?",
      answer:
        "Yes. The progress pages show recent scores, success rates and areas that may need more practice.",
    },
  ]

  function handleCardHover(e: React.MouseEvent<HTMLDivElement>, active: boolean) {
    e.currentTarget.style.transform = active ? "translateY(-6px)" : "translateY(0)"
    e.currentTarget.style.boxShadow = active
      ? "0 20px 40px rgba(0,0,0,0.12)"
      : "0 10px 25px rgba(0,0,0,0.08)"
  }

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>11+ practice made simple</div>

        <h1 style={styles.title}>Welcome to YanBo Learning</h1>

        <p style={styles.subtitle}>
          Build confidence for the 11+ with focused practice in English, Maths,
          Verbal Reasoning and Non-Verbal Reasoning. Choose a subject, track
          progress, review mistakes and keep improving step by step.
        </p>

        <div style={styles.heroActions}>
          <button
            style={styles.primaryButton}
            onClick={() => router.push("/register")}
          >
            Start free
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/custom-tests")}
          >
            Build a custom test
          </button>
        </div>
      </section>

      {/* SUBJECT CARDS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Continue learning</h2>
          <p style={styles.sectionText}>
            Pick a subject area or use the progress and review pages to focus on
            what needs more practice.
          </p>
        </div>

        <div style={styles.grid}>
          {cards.map((card) => (
            <div
              key={card.title}
              style={{ ...styles.card, ...cardHover }}
              onClick={() => router.push(card.path)}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
            >
              <div style={styles.icon}>{card.icon}</div>
              <h2 style={styles.cardTitle}>{card.title}</h2>
              <p style={styles.cardText}>{card.text}</p>

              <button
                style={styles.button}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(card.path)
                }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* MEMBERSHIP CARDS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Choose your membership</h2>
          <p style={styles.sectionText}>
            Start with a free account, then upgrade when you are ready for full
            access to practice tests, review tools, progress tracking and custom
            tests.
          </p>
        </div>

        <div style={styles.membershipGrid}>
          {memberships.map((membership) => (
            <div
              key={membership.title}
              style={{
                ...styles.membershipCard,
                ...(membership.highlighted ? styles.highlightedMembership : {}),
                ...cardHover,
              }}
              onClick={() => router.push(membership.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow = membership.highlighted
                  ? "0 24px 46px rgba(6,78,59,0.28)"
                  : "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = membership.highlighted
                  ? "0 18px 40px rgba(6,78,59,0.22)"
                  : "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div
                style={{
                  ...styles.membershipBadge,
                  ...(membership.highlighted
                    ? styles.highlightedMembershipBadge
                    : {}),
                }}
              >
                {membership.badge}
              </div>

              <h3
                style={{
                  ...styles.membershipTitle,
                  color: membership.highlighted ? "white" : "#111827",
                }}
              >
                {membership.title}
              </h3>

              <p
                style={{
                  ...styles.membershipPrice,
                  color: membership.highlighted ? "#bbf7d0" : "#065f46",
                }}
              >
                {membership.price}
              </p>

              <p
                style={{
                  ...styles.membershipText,
                  color: membership.highlighted ? "#d1fae5" : "#4b5563",
                }}
              >
                {membership.text}
              </p>

              <ul
                style={{
                  ...styles.featureList,
                  color: membership.highlighted ? "#ecfdf5" : "#374151",
                }}
              >
                {membership.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                style={{
                  ...styles.membershipButton,
                  ...(membership.highlighted
                    ? styles.highlightedMembershipButton
                    : {}),
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(membership.path)
                }}
              >
                {membership.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* TRUSTPILOT STYLE SECTION */}
      <section style={styles.trustSection}>
        <div style={styles.trustCard}>
          <div style={styles.stars}>★★★★★</div>

          <h2 style={styles.trustTitle}>Trusted by families preparing for the 11+</h2>

          <p style={styles.trustText}>
            Add your real Trustpilot widget here later when your Trustpilot
            profile is ready. For now, this section gives the home page a more
            professional trust area.
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
          <p style={styles.sectionText}>
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
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "32px 20px 60px",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  hero: {
    textAlign: "center",
    marginBottom: "44px",
    background:
      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #ffffff 100%)",
    borderRadius: "28px",
    padding: "46px 24px",
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
    marginBottom: "16px",
  },

  title: {
    fontSize: "44px",
    marginBottom: "14px",
    color: "#064e3b",
    fontWeight: 800,
  },

  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "820px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  heroActions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "28px",
  },

  primaryButton: {
    padding: "13px 22px",
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
    padding: "13px 22px",
    borderRadius: "14px",
    border: "1px solid #bbf7d0",
    background: "white",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
  },

  section: {
    marginBottom: "56px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "26px",
  },

  sectionTitle: {
    fontSize: "32px",
    margin: "0 0 10px",
    color: "#111827",
    fontWeight: 800,
  },

  sectionText: {
    fontSize: "17px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "white",
    borderRadius: "20px",
    padding: "26px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid #e5e7eb",
  },

  icon: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  cardTitle: {
    fontSize: "24px",
    marginBottom: "10px",
    color: "#111827",
  },

  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "18px",
    minHeight: "78px",
  },

  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "16px",
    minWidth: "140px",
  },

  membershipGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  membershipCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
  },

  highlightedMembership: {
    background: "#064e3b",
    border: "1px solid #064e3b",
    boxShadow: "0 18px 40px rgba(6,78,59,0.22)",
  },

  membershipBadge: {
    display: "inline-block",
    alignSelf: "flex-start",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "16px",
  },

  highlightedMembershipBadge: {
    background: "#fef3c7",
    color: "#92400e",
  },

  membershipTitle: {
    fontSize: "24px",
    margin: "0 0 8px",
    fontWeight: 800,
  },

  membershipPrice: {
    fontSize: "20px",
    fontWeight: 800,
    margin: "0 0 14px",
  },

  membershipText: {
    fontSize: "16px",
    lineHeight: 1.6,
    marginBottom: "18px",
  },

  featureList: {
    lineHeight: 1.9,
    paddingLeft: "20px",
    margin: "0 0 24px",
    flexGrow: 1,
  },

  membershipButton: {
    padding: "13px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    width: "100%",
  },

  highlightedMembershipButton: {
    background: "white",
    color: "#064e3b",
  },

  trustSection: {
    marginBottom: "56px",
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
    fontWeight: 800,
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
    marginBottom: "20px",
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