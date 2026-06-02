"use client"

import Header from "../../components/Header"
import Footer from "../../components/Footer"

export default function ContactPage() {
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
            maxWidth: 950,
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
              Contact YanBo Learning
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
              Questions, feedback or support
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
              If you have a question about YanBo Learning, need help with your
              account, or would like to share feedback about the portal, please
              get in touch.
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
              icon="💬"
              title="General questions"
              text="Ask about the portal, available subjects, custom tests, subscriptions or how the practice areas work."
            />

            <InfoCard
              icon="🛠️"
              title="Support"
              text="Get help with login problems, account access, membership questions or anything that does not seem to work as expected."
            />

            <InfoCard
              icon="📝"
              title="Feedback"
              text="Share suggestions, report unclear questions, or let us know how the portal could be improved for pupils and parents."
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
              Email support
            </h2>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: "#d1fae5",
                margin: "0 0 18px",
                maxWidth: 820,
              }}
            >
              For now, please use the email address below for support,
              questions and feedback.
            </p>

            <a
              href="mailto:support@yanbolearning.co.uk"
              style={{
                display: "inline-block",
                background: "#ffffff",
                color: "#064e3b",
                padding: "14px 18px",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              support@yanbolearning.co.uk
            </a>
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
              Before contacting us
            </h2>

            <p
              style={{
                fontSize: 16.5,
                lineHeight: 1.75,
                color: "#4b5563",
                margin: "0 0 18px",
              }}
            >
              To help us respond clearly, please include your name, the email
              address used for your account, and a short description of the
              issue or question.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <SmallPoint text="Which page or test you were using" />
              <SmallPoint text="What happened or what you expected" />
              <SmallPoint text="Any question ID, test name or screenshot if useful" />
              <SmallPoint text="Your account email if the issue is account-related" />
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