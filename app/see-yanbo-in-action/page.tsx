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

const subjects = [
  {
    title: "English",
    icon: <EnglishIcon size={42} />,
    text: "Vocabulary, spelling, grammar, punctuation and comprehension practice.",
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

const walkthroughSections = [
  {
    eyebrow: "Student home",
    title: "A clear learning dashboard",
    text: "Students start from a friendly home page with subject choices, daily messages, YanBo Coins and quick access to practice tools.",
    image: "/preview/home.png",
    imageAlt: "YanBo Practice Portal protected home page preview",
    points: [
      "Four main 11+ subject areas",
      "Daily learning message",
      "YanBo Coins reward area",
      "Quick access to Build a Test, progress and review",
    ],
  },
  {
    eyebrow: "Practice tests",
    title: "Focused 11+ style questions",
    text: "Practice tests show one question at a time with clear answer options. Students can work through questions online and check their answers.",
    image: "/preview/practice-test.png",
    imageAlt: "YanBo Practice Portal practice test question preview",
    points: [
      "Online practice questions",
      "A, B, C and D answer choices",
      "Optional timer support",
      "Report question button for feedback",
    ],
  },
  {
    eyebrow: "Build a Test",
    title: "Create focused practice",
    text: "Members can build their own tests by choosing topics, difficulty, length and format. This helps families focus on the areas that need attention.",
    image: "/preview/build-a-test.png",
    imageAlt: "YanBo Practice Portal Build a Test page preview",
    points: [
      "Choose one or more topics",
      "Select question count and time",
      "Choose difficulty level",
      "Start online or download printable practice",
    ],
  },
  {
    eyebrow: "Progress tracking",
    title: "See improvement more clearly",
    text: "Progress pages help parents and students understand recent performance, success rates and topic strengths or weaknesses.",
    image: "/preview/progress.png",
    imageAlt: "YanBo Practice Portal progress page preview",
    points: [
      "Tests completed",
      "Questions practised",
      "Average success",
      "Performance trend and quick insights",
    ],
  },
  {
    eyebrow: "Review mistakes",
    title: "Turn mistakes into revision",
    text: "Review pages collect questions that need more practice, showing the student's answer, correct answer and explanation.",
    image: "/preview/review.png",
    imageAlt: "YanBo Practice Portal review page preview",
    points: [
      "Review weaker questions",
      "See correct answers",
      "Read explanations",
      "Retry filtered review items",
    ],
  },
  {
    eyebrow: "Avatar Studio",
    title: "Make practice more personal",
    text: "Students can customise their YanBo avatar and unlock items using YanBo Coins, adding a fun reward layer to regular practice.",
    image: "/preview/avatar-studio.png",
    imageAlt: "YanBo Practice Portal Avatar Studio preview",
    points: [
      "Choose a character",
      "Customise appearance",
      "Unlock wardrobe items",
      "Save a personal avatar",
    ],
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
          <div style={styles.heroTextBlock}>
            <div style={styles.heroBadge}>Portal preview</div>

            <h1 style={styles.heroTitle}>See YanBo in Action</h1>

            <p style={styles.heroText}>
              Take a look inside YanBo Practice Portal and see how students can
              practise 11+ English, Maths, Verbal Reasoning and Non-Verbal
              Reasoning with progress tracking, review tools, Build a Test
              features, YanBo Coins and avatar rewards.
            </p>

            <div style={styles.heroActions}>
              <button
                style={styles.primaryButton}
                onClick={() => router.push("/signup")}
              >
                Create free account
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => router.push("/")}
              >
                Back to home
              </button>
            </div>

            <p style={styles.heroNote}>
              Guests can preview the portal here. To experience the tests,
              progress and review features, please create a free account.
            </p>
          </div>

          <div style={styles.heroImageWrap}>
            <img
              src="/preview/home.png"
              alt="YanBo Practice Portal home page preview"
              style={styles.heroImage}
            />
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

        {/* WALKTHROUGH */}
        <section style={styles.walkthrough}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>What families can use inside</h2>
            <p style={styles.sectionSubtitle}>
              These previews show the main areas of the portal. Guests can view
              the walkthrough, while students need a free account to start using
              the tools.
            </p>
          </div>

          <div style={styles.walkthroughList}>
            {walkthroughSections.map((item, index) => {
              const reverse = index % 2 === 1

              return (
                <article
                  key={item.title}
                  style={{
                    ...styles.walkthroughCard,
                    gridTemplateAreas: reverse
                      ? `"image content"`
                      : `"content image"`,
                  }}
                >
                  <div style={styles.walkthroughContent}>
                    <div style={styles.eyebrow}>{item.eyebrow}</div>

                    <h3 style={styles.walkthroughTitle}>{item.title}</h3>

                    <p style={styles.walkthroughText}>{item.text}</p>

                    <div style={styles.pointGrid}>
                      {item.points.map((point) => (
                        <div key={point} style={styles.pointItem}>
                          <span style={styles.tick}>✓</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      style={styles.smallCtaButton}
                      onClick={() => router.push("/signup")}
                    >
                      Create a free account to try this
                    </button>
                  </div>

                  <div style={styles.screenshotShell}>
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      style={styles.screenshot}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* VALUE SECTION */}
        <section style={styles.valueSection}>
          <div style={styles.valueCard}>
            <h2 style={styles.valueTitle}>Why this helps with 11+ practice</h2>

            <p style={styles.valueText}>
              YanBo Practice Portal is designed to make preparation more
              structured. Students can practise by topic, review mistakes, track
              progress and build confidence over time.
            </p>

            <div style={styles.valueGrid}>
              <div style={styles.valueItem}>
                <div style={styles.valueIcon}>🎯</div>
                <h3 style={styles.valueItemTitle}>Focused practice</h3>
                <p style={styles.valueItemText}>
                  Choose subjects and topics instead of practising randomly.
                </p>
              </div>

              <div style={styles.valueItem}>
                <div style={styles.valueIcon}>🔁</div>
                <h3 style={styles.valueItemTitle}>Review and repeat</h3>
                <p style={styles.valueItemText}>
                  Mistakes become useful revision instead of being forgotten.
                </p>
              </div>

              <div style={styles.valueItem}>
                <div style={styles.valueIcon}>📈</div>
                <h3 style={styles.valueItemTitle}>Track progress</h3>
                <p style={styles.valueItemText}>
                  Parents can see where practice is improving and where more
                  work is needed.
                </p>
              </div>

              <div style={styles.valueItem}>
                <div style={styles.valueIcon}>🪙</div>
                <h3 style={styles.valueItemTitle}>Keep motivation high</h3>
                <p style={styles.valueItemText}>
                  YanBo Coins and avatar rewards make regular practice feel more
                  engaging.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={styles.finalCtaSection}>
          <div style={styles.finalCtaCard}>
            <div>
              <h2 style={styles.finalCtaTitle}>
                Ready to experience the portal?
              </h2>

              <p style={styles.finalCtaText}>
                Create a free account to try selected practice and see how
                YanBo Practice Portal can support your child’s 11+ preparation.
              </p>
            </div>

            <div style={styles.finalCtaActions}>
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
    maxWidth: "1180px",
    margin: "0 auto 58px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.95fr) minmax(320px, 1.05fr)",
    gap: "28px",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #ffffff 100%)",
    borderRadius: "30px",
    padding: "34px",
    boxShadow: "0 14px 36px rgba(0,0,0,0.07)",
    border: "1px solid #d1fae5",
    boxSizing: "border-box",
  },

  heroTextBlock: {
    minWidth: 0,
  },

  heroBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 900,
    marginBottom: "18px",
  },

  heroTitle: {
    fontSize: "clamp(36px, 7vw, 52px)",
    lineHeight: 1.05,
    margin: "0 0 16px",
    color: "#064e3b",
    fontWeight: 900,
  },

  heroText: {
    fontSize: "18px",
    color: "#4b5563",
    margin: 0,
    lineHeight: 1.7,
  },

  heroActions: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "28px",
  },

  heroNote: {
    margin: "18px 0 0",
    color: "#166534",
    fontSize: "14.5px",
    lineHeight: 1.6,
    fontWeight: 700,
  },

  heroImageWrap: {
    background: "white",
    borderRadius: "24px",
    padding: "12px",
    boxShadow: "0 14px 34px rgba(6,78,59,0.16)",
    border: "1px solid #bbf7d0",
    maxHeight: "520px",
    overflow: "hidden",
  },

  heroImage: {
    width: "100%",
    display: "block",
    borderRadius: "18px",
  },

  primaryButton: {
    padding: "14px 24px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
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
    fontWeight: 900,
    fontSize: "16px",
  },

  lightButton: {
    padding: "14px 24px",
    borderRadius: "14px",
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "16px",
  },

  section: {
    maxWidth: "1100px",
    margin: "0 auto 58px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  sectionTitle: {
    fontSize: "clamp(28px, 6vw, 36px)",
    margin: "0 0 10px",
    color: "#1f3b2d",
    fontWeight: 900,
  },

  sectionSubtitle: {
    fontSize: "17px",
    color: "#355244",
    maxWidth: "780px",
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

  walkthrough: {
    maxWidth: "1180px",
    margin: "0 auto 58px",
  },

  walkthroughList: {
    display: "grid",
    gap: "26px",
  },

  walkthroughCard: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.82fr) minmax(360px, 1.18fr)",
    gap: "26px",
    alignItems: "center",
    background: "white",
    border: "1px solid #d1fae5",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 14px 34px rgba(6,78,59,0.1)",
    boxSizing: "border-box",
  },

  walkthroughContent: {
    gridArea: "content",
    minWidth: 0,
  },

  eyebrow: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "14px",
  },

  walkthroughTitle: {
    margin: "0 0 10px",
    color: "#064e3b",
    fontSize: "clamp(25px, 5vw, 32px)",
    lineHeight: 1.15,
    fontWeight: 900,
  },

  walkthroughText: {
    margin: "0 0 18px",
    color: "#4b5563",
    fontSize: "16.5px",
    lineHeight: 1.7,
  },

  pointGrid: {
    display: "grid",
    gap: "10px",
    marginBottom: "20px",
  },

  pointItem: {
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    gap: "8px",
    alignItems: "start",
    color: "#374151",
    fontSize: "15.5px",
    lineHeight: 1.5,
    fontWeight: 700,
  },

  tick: {
    color: "#16a34a",
    fontWeight: 900,
  },

  smallCtaButton: {
    padding: "13px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "15px",
    boxShadow: "0 10px 22px rgba(22,163,74,0.2)",
  },

  screenshotShell: {
    gridArea: "image",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "22px",
    padding: "10px",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7)",
    maxHeight: "560px",
    overflow: "hidden",
  },

  screenshot: {
    width: "100%",
    display: "block",
    borderRadius: "16px",
  },

  valueSection: {
    maxWidth: "1100px",
    margin: "0 auto 58px",
  },

  valueCard: {
    background: "#064e3b",
    borderRadius: "30px",
    padding: "34px",
    color: "white",
    boxShadow: "0 18px 42px rgba(6,78,59,0.22)",
    boxSizing: "border-box",
  },

  valueTitle: {
    margin: "0 0 10px",
    fontSize: "clamp(28px, 6vw, 36px)",
    fontWeight: 900,
    textAlign: "center",
  },

  valueText: {
    margin: "0 auto 26px",
    maxWidth: "820px",
    color: "#d1fae5",
    fontSize: "17px",
    lineHeight: 1.7,
    textAlign: "center",
  },

  valueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  valueItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "22px",
    padding: "20px",
    boxSizing: "border-box",
  },

  valueIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    marginBottom: "12px",
  },

  valueItemTitle: {
    margin: "0 0 8px",
    fontSize: "19px",
    fontWeight: 900,
    color: "white",
  },

  valueItemText: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  finalCtaSection: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  finalCtaCard: {
    background:
      "linear-gradient(135deg, #ffffff 0%, #ecfdf5 55%, #dcfce7 100%)",
    border: "1px solid #bbf7d0",
    borderRadius: "28px",
    padding: "30px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "22px",
    alignItems: "center",
    boxShadow: "0 14px 34px rgba(6,78,59,0.12)",
    boxSizing: "border-box",
  },

  finalCtaTitle: {
    margin: "0 0 8px",
    color: "#064e3b",
    fontSize: "clamp(26px, 6vw, 34px)",
    fontWeight: 900,
  },

  finalCtaText: {
    margin: 0,
    color: "#4b5563",
    fontSize: "17px",
    lineHeight: 1.65,
  },

  finalCtaActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
}