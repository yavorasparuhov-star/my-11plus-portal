"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import {
  EnglishIcon,
  MathsIcon,
  NVRIcon,
  VRIcon,
} from "../../components/icons/PortalIcons"

const featureCards = [
  {
    icon: "📝",
    title: "Practice Tests",
    text: "Students can practise English, Maths, Verbal Reasoning and Non-Verbal Reasoning with clear 11+ style questions.",
  },
  {
    icon: "🧩",
    title: "Build a Test",
    text: "Members can create focused tests by choosing subject, topic, difficulty and number of questions.",
  },
  {
    icon: "🖨️",
    title: "Online or Printable",
    text: "Some tests can be completed online, while printable custom tests can be downloaded and marked later.",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    text: "Progress pages help families see scores, recent practice and topic performance more clearly.",
  },
  {
    icon: "🔁",
    title: "Review Mistakes",
    text: "Wrong or unanswered questions can be saved for review so students can practise weaker areas again.",
  },
  {
    icon: "🪙",
    title: "YanBo Coins",
    text: "Students can earn YanBo Coins from practice and use them to unlock avatar items.",
  },
  {
    icon: "🎒",
    title: "Avatar Studio",
    text: "Students can choose and customise their avatar, making practice feel more personal and fun.",
  },
  {
    icon: "🌱",
    title: "Free and Member Access",
    text: "Free accounts can try selected practice, while paid members unlock wider portal features.",
  },
]

const subjects = [
  {
    title: "English",
    icon: <EnglishIcon size={42} />,
    text: "Vocabulary, spelling, grammar, punctuation and comprehension.",
  },
  {
    title: "Maths",
    icon: <MathsIcon size={42} />,
    text: "Number, fractions, shape, measurement, data and reasoning.",
  },
  {
    title: "VR",
    icon: <VRIcon size={42} />,
    text: "Word relationships, codes, logic and sequence patterns.",
  },
  {
    title: "NVR",
    icon: <NVRIcon size={42} />,
    text: "Shapes, rotations, reflections and spatial reasoning.",
  },
]

const steps = [
  {
    number: "1",
    title: "Choose what to practise",
    text: "Pick a subject, topic or test type depending on what your child needs.",
  },
  {
    number: "2",
    title: "Complete focused questions",
    text: "Practise in short sessions online, or use printable tests for offline work.",
  },
  {
    number: "3",
    title: "Review and improve",
    text: "Use results, progress and review pages to focus on weaker areas.",
  },
]

export default function SeeYanBoInActionPage() {
  const router = useRouter()

  return (
    <>
      <Header />

      <main style={styles.page}>
        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroBadge}>Portal preview</div>

          <h1 style={styles.heroTitle}>See YanBo in Action</h1>

          <p style={styles.heroText}>
            YanBo Practice Portal helps children build 11+ confidence with
            subject practice, Build a Test tools, progress tracking, review
            pages, YanBo Coins and avatar rewards.
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
              onClick={() => router.push("/")}
            >
              Back to home
            </button>
          </div>
        </section>

        {/* SUBJECTS */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Four key 11+ areas</h2>
            <p style={styles.sectionSubtitle}>
              The portal is organised into clear subject areas so students can
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

        {/* HOW IT WORKS */}
        <section style={styles.howSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>How the portal helps</h2>
            <p style={styles.sectionSubtitle}>
              Practice is designed to be focused, easy to repeat and simple for
              parents to understand.
            </p>
          </div>

          <div style={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.number} style={styles.stepCard}>
                <div style={styles.stepNumber}>{step.number}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>What members can use</h2>
            <p style={styles.sectionSubtitle}>
              Here is a simple overview of the main features available inside
              YanBo Practice Portal.
            </p>
          </div>

          <div style={styles.featureGrid}>
            {featureCards.map((feature) => (
              <div key={feature.title} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureText}>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MOCK PREVIEW */}
        <section style={styles.previewSection}>
          <div style={styles.previewIntro}>
            <h2 style={styles.previewTitle}>A simple look inside</h2>
            <p style={styles.previewText}>
              This preview shows the type of experience families can expect.
              The real portal includes live questions, saved results and
              personalised progress.
            </p>
          </div>

          <div style={styles.previewGrid}>
            <div style={styles.mockCard}>
              <div style={styles.mockHeader}>
                <span style={styles.mockBadge}>Practice Test</span>
                <span style={styles.mockSmallText}>Question 1 of 10</span>
              </div>

              <h3 style={styles.mockQuestion}>
                Which number is 100 more than 2,450?
              </h3>

              <div style={styles.answerGrid}>
                <div style={styles.answerOption}>A&nbsp;&nbsp;2,350</div>
                <div style={styles.answerOption}>B&nbsp;&nbsp;2,450</div>
                <div style={styles.answerOption}>C&nbsp;&nbsp;2,550</div>
                <div style={styles.answerOption}>D&nbsp;&nbsp;3,450</div>
              </div>

              <div style={styles.mockFooter}>
                <span>Clear questions</span>
                <span>Instant result after completion</span>
              </div>
            </div>

            <div style={styles.mockCard}>
              <div style={styles.mockHeader}>
                <span style={styles.mockBadge}>Build a Test</span>
                <span style={styles.mockSmallText}>Focused practice</span>
              </div>

              <div style={styles.selectorBox}>
                <div style={styles.selectorRow}>
                  <span>Subject</span>
                  <strong>Maths</strong>
                </div>
                <div style={styles.selectorRow}>
                  <span>Topic</span>
                  <strong>Fractions</strong>
                </div>
                <div style={styles.selectorRow}>
                  <span>Difficulty</span>
                  <strong>Medium</strong>
                </div>
                <div style={styles.selectorRow}>
                  <span>Questions</span>
                  <strong>20</strong>
                </div>
              </div>

              <button style={styles.mockButton}>Create practice test</button>
            </div>

            <div style={styles.mockCard}>
              <div style={styles.mockHeader}>
                <span style={styles.mockBadge}>Progress</span>
                <span style={styles.mockSmallText}>Track improvement</span>
              </div>

              <div style={styles.progressList}>
                <div>
                  <div style={styles.progressLabel}>
                    <span>Vocabulary</span>
                    <strong>82%</strong>
                  </div>
                  <div style={styles.progressBarOuter}>
                    <div style={{ ...styles.progressBarInner, width: "82%" }} />
                  </div>
                </div>

                <div>
                  <div style={styles.progressLabel}>
                    <span>Fractions</span>
                    <strong>68%</strong>
                  </div>
                  <div style={styles.progressBarOuter}>
                    <div style={{ ...styles.progressBarInner, width: "68%" }} />
                  </div>
                </div>

                <div>
                  <div style={styles.progressLabel}>
                    <span>Shape Patterns</span>
                    <strong>74%</strong>
                  </div>
                  <div style={styles.progressBarOuter}>
                    <div style={{ ...styles.progressBarInner, width: "74%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.mockCard}>
              <div style={styles.mockHeader}>
                <span style={styles.mockBadge}>Review + Rewards</span>
                <span style={styles.mockSmallText}>Keep practising</span>
              </div>

              <div style={styles.rewardBox}>
                <div style={styles.avatarCircle}>😊</div>
                <div>
                  <h3 style={styles.rewardTitle}>Good job!</h3>
                  <p style={styles.rewardText}>
                    Review mistakes, earn YanBo Coins and unlock avatar items as
                    practice improves.
                  </p>
                </div>
              </div>

              <div style={styles.coinRow}>
                <span>YanBo Coins earned</span>
                <strong>+3 🪙</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ACCESS SECTION */}
        <section style={styles.accessSection}>
          <div style={styles.accessCard}>
            <h2 style={styles.accessTitle}>Start free, upgrade when ready</h2>

            <p style={styles.accessText}>
              Guests can explore the public pages, free accounts can try
              selected practice, and paid members can unlock wider practice,
              progress, review and Build a Test features.
            </p>

            <div style={styles.accessActions}>
              <button
                style={styles.primaryButton}
                onClick={() => router.push("/signup")}
              >
                Create free account
              </button>

              <button
                style={styles.lightButton}
                onClick={() => router.push("/#pricing")}
              >
                View plans
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f4fbf4 0%, #f8fafc 48%, #ffffff 100%)",
    padding: "30px 20px 60px",
    boxSizing: "border-box",
    overflowX: "hidden",
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
    boxSizing: "border-box",
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
    fontSize: "clamp(34px, 8vw, 48px)",
    lineHeight: 1.08,
    margin: "0 0 16px",
    color: "#064e3b",
    fontWeight: 900,
  },

  heroText: {
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

  lightButton: {
    padding: "14px 24px",
    borderRadius: "14px",
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
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
    fontSize: "clamp(28px, 6vw, 34px)",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  subjectCard: {
    background:
      "linear-gradient(135deg, #ffffff 0%, #f0fdf4 55%, #dcfce7 100%)",
    borderRadius: "24px",
    padding: "26px 22px",
    boxShadow: "0 14px 30px rgba(6,78,59,0.1)",
    border: "1px solid #bbf7d0",
    textAlign: "center",
    boxSizing: "border-box",
  },

  subjectIcon: {
    width: "68px",
    height: "68px",
    borderRadius: "22px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  subjectTitle: {
    margin: "0 0 10px",
    fontSize: "22px",
    color: "#111827",
    fontWeight: 900,
  },

  subjectText: {
    margin: 0,
    fontSize: "15.5px",
    color: "#4b5563",
    lineHeight: 1.6,
  },

  howSection: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
  },

  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },

  stepCard: {
    background: "white",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  stepNumber: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "#16a34a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "20px",
    marginBottom: "14px",
  },

  stepTitle: {
    margin: "0 0 8px",
    color: "#064e3b",
    fontSize: "21px",
    fontWeight: 900,
  },

  stepText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: 1.65,
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  featureCard: {
    background: "white",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  featureIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "18px",
    background: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    marginBottom: "14px",
  },

  featureTitle: {
    margin: "0 0 8px",
    color: "#064e3b",
    fontSize: "20px",
    fontWeight: 900,
  },

  featureText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "15.5px",
    lineHeight: 1.65,
  },

  previewSection: {
    maxWidth: "1100px",
    margin: "0 auto 56px",
    background: "#064e3b",
    borderRadius: "30px",
    padding: "34px",
    boxSizing: "border-box",
    boxShadow: "0 18px 42px rgba(6,78,59,0.22)",
  },

  previewIntro: {
    textAlign: "center",
    marginBottom: "26px",
  },

  previewTitle: {
    margin: "0 0 10px",
    color: "white",
    fontSize: "clamp(28px, 6vw, 34px)",
    fontWeight: 900,
  },

  previewText: {
    margin: "0 auto",
    maxWidth: "780px",
    color: "#d1fae5",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px",
  },

  mockCard: {
    background: "white",
    borderRadius: "22px",
    padding: "22px",
    boxSizing: "border-box",
    boxShadow: "0 10px 26px rgba(0,0,0,0.15)",
  },

  mockHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    marginBottom: "16px",
  },

  mockBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 900,
  },

  mockSmallText: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 700,
  },

  mockQuestion: {
    margin: "0 0 16px",
    color: "#111827",
    fontSize: "20px",
    lineHeight: 1.35,
    fontWeight: 900,
  },

  answerGrid: {
    display: "grid",
    gap: "10px",
  },

  answerOption: {
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "11px 12px",
    color: "#374151",
    fontWeight: 700,
    background: "#f9fafb",
  },

  mockFooter: {
    display: "grid",
    gap: "6px",
    marginTop: "16px",
    color: "#166534",
    fontSize: "13.5px",
    fontWeight: 800,
  },

  selectorBox: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px",
  },

  selectorRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    padding: "11px 12px",
    borderRadius: "12px",
    background: "#f9fafb",
    color: "#4b5563",
  },

  mockButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "13px",
    border: "none",
    background: "#16a34a",
    color: "white",
    fontWeight: 900,
    fontSize: "15px",
  },

  progressList: {
    display: "grid",
    gap: "16px",
  },

  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    color: "#374151",
    fontSize: "15px",
    marginBottom: "7px",
  },

  progressBarOuter: {
    height: "12px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden",
  },

  progressBarInner: {
    height: "100%",
    borderRadius: "999px",
    background: "#16a34a",
  },

  rewardBox: {
    display: "grid",
    gridTemplateColumns: "58px 1fr",
    gap: "14px",
    alignItems: "center",
    background: "#f0fdf4",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px",
  },

  avatarCircle: {
    width: "58px",
    height: "58px",
    borderRadius: "999px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow: "inset 0 0 0 1px #bbf7d0",
  },

  rewardTitle: {
    margin: "0 0 4px",
    color: "#064e3b",
    fontSize: "20px",
    fontWeight: 900,
  },

  rewardText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "14.5px",
    lineHeight: 1.55,
  },

  coinRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "13px 14px",
    borderRadius: "14px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 900,
  },

  accessSection: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  accessCard: {
    background:
      "linear-gradient(135deg, #ffffff 0%, #ecfdf5 55%, #dcfce7 100%)",
    border: "1px solid #bbf7d0",
    borderRadius: "28px",
    padding: "34px 24px",
    textAlign: "center",
    boxShadow: "0 14px 34px rgba(6,78,59,0.12)",
  },

  accessTitle: {
    margin: "0 0 12px",
    color: "#064e3b",
    fontSize: "clamp(28px, 6vw, 34px)",
    fontWeight: 900,
  },

  accessText: {
    margin: "0 auto",
    maxWidth: "780px",
    color: "#4b5563",
    fontSize: "17px",
    lineHeight: 1.7,
  },

  accessActions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "24px",
  },
}