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
            maxWidth: 1040,
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
                fontSize: "clamp(34px, 7vw, 50px)",
                lineHeight: 1.08,
                margin: "0 0 18px",
                color: "#064e3b",
                fontWeight: 900,
              }}
            >
              Clear, focused 11+ practice for steady progress
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.75,
                color: "#374151",
                maxWidth: 790,
                margin: "0 auto",
              }}
            >
              YanBo Practice Portal is an online 11+ practice portal designed to
              help children practise regularly, review mistakes and build
              confidence across English, Maths, Verbal Reasoning and Non-Verbal
              Reasoning.
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
              background: "#ffffff",
              borderRadius: 28,
              padding: "34px 28px",
              border: "1px solid #d1fae5",
              boxShadow: "0 14px 34px rgba(6, 78, 59, 0.08)",
              marginBottom: 30,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 26,
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "8px 14px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 900,
                    marginBottom: 16,
                  }}
                >
                  Built for home practice
                </div>

                <h2
                  style={{
                    fontSize: "clamp(26px, 5vw, 36px)",
                    lineHeight: 1.12,
                    color: "#064e3b",
                    margin: "0 0 14px",
                    fontWeight: 900,
                  }}
                >
                  Created to make 11+ practice easier to manage
                </h2>

                <p
                  style={{
                    fontSize: 16.5,
                    lineHeight: 1.75,
                    color: "#4b5563",
                    margin: "0 0 14px",
                  }}
                >
                  The aim of YanBo Practice Portal is simple: give families a
                  clear, structured place for regular 11+ practice. Instead of
                  guessing what to practise next, pupils can work through focused
                  tests, review mistakes and build confidence over time.
                </p>

                <p
                  style={{
                    fontSize: 16.5,
                    lineHeight: 1.75,
                    color: "#4b5563",
                    margin: 0,
                  }}
                >
                  The portal is designed for short, consistent practice sessions
                  as well as longer tests built by subject, topic and difficulty.
                </p>
              </div>

              <div
                style={{
                  background:
                    "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
                  border: "1px solid #bbf7d0",
                  borderRadius: 24,
                  padding: 22,
                }}
              >
                <h3
                  style={{
                    color: "#064e3b",
                    fontSize: 22,
                    fontWeight: 900,
                    margin: "0 0 14px",
                  }}
                >
                  What families can expect
                </h3>

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <TrustPoint text="Focused practice across the main 11+ areas" />
                  <TrustPoint text="Clear answers and explanations where available" />
                  <TrustPoint text="Progress and review tools to spot weaker areas" />
                  <TrustPoint text="A child-friendly design that encourages regular practice" />
                  <TrustPoint text="Ongoing improvements based on feedback and testing" />
                </div>
              </div>
            </div>
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
                maxWidth: 890,
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
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
              marginBottom: 30,
            }}
          >
            <InfoCard
              icon="✅"
              title="Clear practice structure"
              text="Subjects are split into smaller areas so children can practise one skill at a time and gradually build stronger understanding."
            />

            <InfoCard
              icon="🔁"
              title="Review, not just scores"
              text="The portal is designed to help pupils return to mistakes, practise again and learn from the areas that need more attention."
            />

            <InfoCard
              icon="🔐"
              title="Safety and privacy matter"
              text="The portal is built with account security, child-friendly design and clear privacy information in mind."
            />
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: "30px 26px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
              marginBottom: 30,
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
              What matters to us
            </h2>

            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.75,
                color: "#4b5563",
                margin: "0 0 18px",
                maxWidth: 850,
              }}
            >
              Good 11+ preparation is not just about doing more questions. It is
              about practising regularly, understanding mistakes and helping
              children feel more confident as they improve.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <SmallPoint text="Age-appropriate practice" />
              <SmallPoint text="Clear explanations" />
              <SmallPoint text="Progress parents can understand" />
              <SmallPoint text="Regular improvements" />
              <SmallPoint text="Respectful use of pupil information" />
              <SmallPoint text="A positive practice experience" />
            </div>
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

function TrustPoint({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        color: "#065f46",
        fontSize: 15.5,
        lineHeight: 1.55,
        fontWeight: 800,
      }}
    >
      <span
        style={{
          background: "#bbf7d0",
          color: "#064e3b",
          borderRadius: 999,
          width: 24,
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        ✓
      </span>

      <span>{text}</span>
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