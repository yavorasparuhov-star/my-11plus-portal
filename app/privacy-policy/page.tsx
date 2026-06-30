"use client"

import Header from "../../components/Header"
import Footer from "../../components/Footer"

export default function PrivacyPolicyPage() {
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
            maxWidth: 980,
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
              Privacy Policy
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
              How YanBo Practice Portal uses information
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
              This Privacy Policy explains what information YanBo Practice
              Portal may collect, why it is used, and how it helps provide 11+
              practice, progress tracking and account access.
            </p>
          </div>

          <PolicyCard title="1. Who we are">
            <p style={paragraphStyle}>
              YanBo Practice Portal is an online 11+ practice portal for
              English, Maths, Verbal Reasoning and Non-Verbal Reasoning. It is
              provided by YanBo Learning.
            </p>

            <p style={paragraphStyle}>
              For privacy questions, you can contact us at:
            </p>

            <p style={highlightStyle}>support@yanbolearning.co.uk</p>
          </PolicyCard>

          <PolicyCard title="2. Information we may collect">
            <p style={paragraphStyle}>
              We may collect information needed to provide and improve the
              portal, including:
            </p>

            <ul style={listStyle}>
              <li>Name or display name, if provided</li>
              <li>Email address used to create or access an account</li>
              <li>Account plan, such as free, monthly or annual</li>
              <li>Practice results, scores, answers and progress information</li>
              <li>Review items and test attempts</li>
              <li>
                Basic technical information needed for security and service
                operation
              </li>
            </ul>
          </PolicyCard>

          <PolicyCard title="3. Why we use this information">
            <p style={paragraphStyle}>
              We use information to provide the learning service, including:
            </p>

            <ul style={listStyle}>
              <li>Creating and managing user accounts</li>
              <li>Allowing pupils to complete practice tests</li>
              <li>Saving scores, progress and review items</li>
              <li>Providing Build a Test features for eligible members</li>
              <li>Helping parents and pupils understand learning progress</li>
              <li>Improving the quality and reliability of the portal</li>
              <li>Responding to support requests or feedback</li>
            </ul>
          </PolicyCard>

          <PolicyCard title="4. Children’s information">
            <p style={paragraphStyle}>
              YanBo Practice Portal is designed for 11+ preparation and may be
              used by children with support from a parent, guardian or teacher.
            </p>

            <p style={paragraphStyle}>
              We aim to keep information clear and understandable. We only ask
              for information that is needed to provide the service, support
              learning progress and keep accounts working properly.
            </p>
          </PolicyCard>

          <PolicyCard title="5. How information is stored">
            <p style={paragraphStyle}>
              Account and learning information is stored using trusted service
              providers that help operate the portal, including authentication,
              database and hosting services.
            </p>

            <p style={paragraphStyle}>
              We take reasonable steps to protect information and only use it
              for the purposes described in this policy.
            </p>
          </PolicyCard>

          <PolicyCard title="6. Sharing information">
            <p style={paragraphStyle}>
              We do not sell personal information.
            </p>

            <p style={paragraphStyle}>
              Information may be processed by service providers used to run the
              portal, such as hosting, database, authentication or payment
              services. These services are used only to help provide and manage
              YanBo Practice Portal.
            </p>
          </PolicyCard>

          <PolicyCard title="7. How long information is kept">
            <p style={paragraphStyle}>
              We keep account and learning information for as long as it is
              needed to provide the service, maintain progress records, support
              users, meet legal obligations or resolve technical issues.
            </p>

            <p style={paragraphStyle}>
              Users can contact us to ask about deleting account information.
            </p>
          </PolicyCard>

          <PolicyCard title="8. Your rights">
            <p style={paragraphStyle}>
              Depending on the situation, users may have rights to access,
              correct, delete or restrict the use of their personal information.
            </p>

            <p style={paragraphStyle}>
              To make a privacy request, please contact:
            </p>

            <p style={highlightStyle}>support@yanbolearning.co.uk</p>
          </PolicyCard>

          <PolicyCard title="9. Lawful basis for using information">
            <p style={paragraphStyle}>
              We use personal information where it is needed to provide YanBo
              Practice Portal, manage accounts, support learning progress,
              respond to support requests, keep the portal secure, and meet
              legal or administrative obligations.
            </p>
          </PolicyCard>

          <PolicyCard title="10. Complaints">
            <p style={paragraphStyle}>
              If you have a concern about how your personal information is used,
              please contact us first so we can try to help.
            </p>

            <p style={highlightStyle}>support@yanbolearning.co.uk</p>

            <p style={paragraphStyle}>
              You also have the right to raise a complaint with the UK
              Information Commissioner’s Office if you are unhappy with how your
              personal information has been handled.
            </p>
          </PolicyCard>

          <PolicyCard title="11. Cookies and similar technologies">
            <p style={paragraphStyle}>
              YanBo Practice Portal may use cookies or similar technologies
              needed for login, security, remembering sessions and improving the
              operation of the portal.
            </p>

            <p style={paragraphStyle}>
              If optional analytics or marketing cookies are added in the
              future, this policy will be updated to explain how they are used.
            </p>
          </PolicyCard>

          <PolicyCard title="12. Updates to this policy">
            <p style={paragraphStyle}>
              This Privacy Policy may be updated as YanBo Practice Portal
              develops. When changes are made, the updated version will be
              published on this page.
            </p>

            <p style={paragraphStyle}>Last updated: June 2026</p>
          </PolicyCard>
        </section>
      </main>

      <Footer />
    </>
  )
}

function PolicyCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 22,
        padding: "26px 24px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontSize: "clamp(22px, 5vw, 28px)",
          color: "#064e3b",
          margin: "0 0 12px",
          fontWeight: 900,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  )
}

const paragraphStyle: React.CSSProperties = {
  fontSize: 16.5,
  lineHeight: 1.75,
  color: "#4b5563",
  margin: "0 0 14px",
}

const listStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.8,
  color: "#4b5563",
  paddingLeft: 22,
  margin: "0 0 8px",
}

const highlightStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#065f46",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 900,
  margin: "0 0 14px",
}