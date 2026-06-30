"use client"

import Header from "../../components/Header"
import Footer from "../../components/Footer"

export default function AboutPage() {
  return (
    <>
      <Header />

      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #f4fbf4 0%, #f8fafc 50%, #ffffff 100%)",
          padding: "40px 20px 64px",
          boxSizing: "border-box",
        }}
      >
        <section
          style={{
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 28,
              padding: "42px 28px",
              border: "1px solid #d1fae5",
              boxShadow: "0 14px 34px rgba(6, 78, 59, 0.08)",
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "#dcfce7",
                color: "#166534",
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              About YanBo Practice Portal
            </div>

            <h1
              style={{
                fontSize: "clamp(34px, 7vw, 48px)",
                lineHeight: 1.1,
                margin: "0 0 18px",
                color: "#064e3b",
                fontWeight: 900,
              }}
            >
              Focused 11+ practice for steady progress
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.75,
                color: "#374151",
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              YanBo Practice Portal is an online 11+ practice portal designed to
              help children practise little and often, review mistakes, and
              build confidence across English, Maths, Verbal Reasoning and
              Non-Verbal Reasoning.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              marginBottom: 30,
            }}
          >
            <InfoCard
              icon="🎯"
              title="Why it was created"
              text="11+ preparation can feel overwhelming when practice is scattered across books, worksheets and different websites. YanBo Practice Portal brings key practice areas together in one clear place."
            />

            <InfoCard
              icon="📚"
              title="How it helps pupils"
              text="Children can practise focused topic tests, check answers, read explanations and return to weaker areas so they can improve step by step."
            />

            <InfoCard
              icon="👨‍👩‍👧‍👦"
              title="How it helps parents"
              text="Parents can see progress more clearly, support regular practice at home and guide children towards the topics that need more attention."
            />
          </div>

          <div
            style={{
              background: "#064e3b",
              color: "#ffffff",
              borderRadius: 28,
              padding: "34px 28px",
              boxShadow: "0 14px 34px rgba(6, 78, 59, 0.18)",
              marginBottom: 30,
            }}
          >
            <h2
              style={{
                fontSize: "clamp(26px, 5vw, 34px)",
                lineHeight: 1.15,
                margin: "0 0 14px",
                fontWeight: 900,
              }}
            >
              Built with guidance from pupils, parents and teachers
            </h2>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: "#d1fae5",
                margin: 0,
                maxWidth: 860,
              }}
            >
              YanBo Practice Portal is being developed with feedback and advice
              from children preparing for the 11+, parents supporting practice
              at home, and teachers who understand what pupils need to build
              confidence and improve. The goal is to focus on real learning
              needs: clear practice, useful explanations, progress tracking and
              targeted review.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: "30px 26px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(24px, 5vw, 30px)",
                color: "#064e3b",
                margin: "0 0 14px",
                fontWeight: 900,
              }}
            >
              What we are improving next
            </h2>

            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.75,
                color: "#4b5563",
                margin: "0 0 18px",
              }}
            >
              The portal is being improved gradually, with a focus on question
              quality, clear explanations, better progress tools and a smooth
              experience for children and parents.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <SmallPoint text="More focused practice by topic" />
              <SmallPoint text="Clearer review of mistakes" />
              <SmallPoint text="Better parent-friendly progress information" />
              <SmallPoint text="Ongoing improvements based on feedback" />
            </div>
          </div>
        </section>
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
    <div
      style={{
        background: "#ffffff",
        borderRadius: 22,
        padding: 24,
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>

      <h2
        style={{
          fontSize: 21,
          color: "#064e3b",
          margin: "0 0 10px",
          fontWeight: 900,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: 15.5,
          lineHeight: 1.7,
          color: "#4b5563",
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  )
}

function SmallPoint({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#065f46",
        borderRadius: 14,
        padding: "12px 14px",
        fontWeight: 800,
        fontSize: 15,
      }}
    >
      ✓ {text}
    </div>
  )
}