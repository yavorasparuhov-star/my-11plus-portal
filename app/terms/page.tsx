"use client"

import Header from "../../components/Header"
import Footer from "../../components/Footer"

export default function TermsPage() {
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
              Terms and Conditions
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
              Using YanBo Learning
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
              These Terms explain the basic rules for using YanBo Learning, an
              online 11+ practice portal for English, Maths, Verbal Reasoning
              and Non-Verbal Reasoning.
            </p>
          </div>

          <TermsCard title="1. About YanBo Learning">
            <p style={paragraphStyle}>
              YanBo Learning provides online 11+ practice materials, including
              practice tests, explanations, progress tracking, review tools and
              custom tests for eligible members.
            </p>

            <p style={paragraphStyle}>
              The portal is designed to support learning and practice. It does
              not guarantee exam results, school places or specific outcomes.
            </p>
          </TermsCard>

          <TermsCard title="2. Who can use the portal">
            <p style={paragraphStyle}>
              YanBo Learning is intended for pupils preparing for the 11+, with
              support from parents, guardians, carers or teachers where needed.
            </p>

            <p style={paragraphStyle}>
              Children should use the portal with appropriate adult awareness
              and support, especially when creating accounts or using paid
              membership features.
            </p>
          </TermsCard>

          <TermsCard title="3. Accounts">
            <p style={paragraphStyle}>
              Some features require an account. Users are responsible for keeping
              login details secure and for making sure account information is
              accurate.
            </p>

            <p style={paragraphStyle}>
              If you believe an account has been accessed without permission,
              please contact us as soon as possible.
            </p>
          </TermsCard>

          <TermsCard title="4. Membership plans">
            <p style={paragraphStyle}>
              YanBo Learning may offer free, monthly and annual membership
              options. Access to features may depend on the user’s current plan.
            </p>

            <ul style={listStyle}>
              <li>Free users may access selected practice areas.</li>
              <li>
                Monthly and annual members may access wider practice features.
              </li>
              <li>
                Custom tests may be limited to eligible paid members and admin
                users.
              </li>
            </ul>

            <p style={paragraphStyle}>
              Prices, features and availability may be updated as the portal
              develops. Any major changes should be made clear on the website.
            </p>
          </TermsCard>

          <TermsCard title="5. Payments and subscriptions">
            <p style={paragraphStyle}>
              If paid subscriptions are available, payment terms, renewal rules
              and cancellation options should be shown clearly before purchase.
            </p>

            <p style={paragraphStyle}>
              Users should review the plan details before subscribing. If you
              have a question about a payment or subscription, please contact:
            </p>

            <p style={highlightStyle}>support@yanbolearning.co.uk</p>
          </TermsCard>

          <TermsCard title="6. Educational content">
            <p style={paragraphStyle}>
              We aim to provide clear, useful and age-appropriate 11+ practice
              content. However, mistakes can happen in questions, explanations,
              answers or images.
            </p>

            <p style={paragraphStyle}>
              If you notice a problem with a question or test, please let us know
              so it can be reviewed and improved.
            </p>
          </TermsCard>

          <TermsCard title="7. Fair use">
            <p style={paragraphStyle}>
              Users should use YanBo Learning fairly and only for personal,
              family or educational practice.
            </p>

            <ul style={listStyle}>
              <li>Do not try to damage, overload or interfere with the portal.</li>
              <li>Do not attempt to access another user’s account.</li>
              <li>
                Do not copy, resell or redistribute large amounts of content from
                the portal.
              </li>
              <li>
                Do not use the portal in a way that prevents others from using it
                properly.
              </li>
            </ul>
          </TermsCard>

          <TermsCard title="8. Intellectual property">
            <p style={paragraphStyle}>
              The content, layout, branding, questions, explanations and design
              of YanBo Learning belong to YanBo Learning unless otherwise stated.
            </p>

            <p style={paragraphStyle}>
              Users may use the portal for learning and practice, but should not
              copy, publish, sell or distribute the content without permission.
            </p>
          </TermsCard>

          <TermsCard title="9. Availability of the service">
            <p style={paragraphStyle}>
              We aim to keep the portal available and working well, but we cannot
              guarantee that it will always be available without interruption.
            </p>

            <p style={paragraphStyle}>
              Maintenance, technical problems, hosting issues or updates may
              occasionally affect access.
            </p>
          </TermsCard>

          <TermsCard title="10. Limitation of responsibility">
            <p style={paragraphStyle}>
              YanBo Learning is provided as an educational practice tool. It is
              the responsibility of parents, guardians, carers, teachers and
              pupils to decide how to use the materials as part of wider 11+
              preparation.
            </p>

            <p style={paragraphStyle}>
              We are not responsible for exam decisions, school admissions
              decisions, or outcomes that depend on external exam providers,
              schools or local authorities.
            </p>
          </TermsCard>

          <TermsCard title="11. Privacy">
            <p style={paragraphStyle}>
              Information about how personal data is used is explained in the
              Privacy Policy.
            </p>

            <a
              href="/privacy-policy"
              style={{
                display: "inline-block",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#065f46",
                borderRadius: 14,
                padding: "12px 14px",
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              View Privacy Policy
            </a>
          </TermsCard>

          <TermsCard title="12. Changes to these terms">
            <p style={paragraphStyle}>
              These Terms may be updated as YanBo Learning develops. When
              changes are made, the updated version will be published on this
              page.
            </p>

            <p style={paragraphStyle}>Last updated: June 2026</p>
          </TermsCard>

          <TermsCard title="13. Contact">
            <p style={paragraphStyle}>
              For questions about these Terms, membership, support or feedback,
              please contact:
            </p>

            <p style={highlightStyle}>support@yanbolearning.co.uk</p>
          </TermsCard>

          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#7c2d12",
              borderRadius: 20,
              padding: 20,
              lineHeight: 1.7,
              fontSize: 15.5,
            }}
          >
            <strong>Important:</strong> This Terms page is a practical starting
            point for a new education portal. It is not legal advice. Before
            taking payments at scale, the Terms should be reviewed and updated
            to match your exact subscription, cancellation, refund, payment and
            data-processing setup.
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

function TermsCard({
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