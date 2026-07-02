"use client"

import type { CSSProperties, ReactNode } from "react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"

export default function TermsPage() {
  return (
    <>
      <Header />

      <main style={pageStyle}>
        <section style={contentStyle}>
          <div style={heroCardStyle}>
            <div style={heroBadgeStyle}>
              Terms and Conditions
            </div>

            <h1 style={heroTitleStyle}>
              Using YanBo Practice Portal
            </h1>

            <p style={heroTextStyle}>
              These Terms explain the basic rules for using YanBo Practice
              Portal, an online 11+ practice portal for English, Maths, Verbal
              Reasoning and Non-Verbal Reasoning.
            </p>
          </div>

          <TermsCard title="1. About YanBo Practice Portal">
            <p style={paragraphStyle}>
              YanBo Practice Portal is provided by YanBo Learning. The portal
              provides online 11+ practice materials, including practice tests,
              explanations, progress tracking, review tools and Build a Test
              features for eligible members.
            </p>

            <p style={paragraphStyle}>
              The portal is designed to support learning and practice. It does
              not guarantee exam results, school places or specific outcomes.
            </p>
          </TermsCard>

          <TermsCard title="2. Who can use the portal">
            <p style={paragraphStyle}>
              YanBo Practice Portal is intended for pupils preparing for the
              11+, with support from parents, guardians, carers or teachers
              where needed.
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
              YanBo Practice Portal offers free, monthly and annual membership
              options. Access to features depends on the user’s current plan.
            </p>

            <ul style={listStyle}>
              <li>Free users can access selected practice areas.</li>
              <li>
                Monthly members can access the wider practice features included
                in the monthly plan.
              </li>
              <li>
                Annual members can access the wider practice features included
                in the annual plan.
              </li>
              <li>
                Build a Test features are available to eligible paid members and
                admin users.
              </li>
            </ul>

            <p style={paragraphStyle}>
              Current prices and included features are shown on the Pricing page
              before purchase. We may update prices, features or membership
              options in the future, but important changes will be made clear on
              the website.
            </p>
          </TermsCard>

          <TermsCard title="5. Payments, renewals and cancellation">
            <p style={paragraphStyle}>
              Paid memberships renew automatically unless cancelled before the
              next renewal date. Monthly memberships renew each month. Annual
              memberships renew each year.
            </p>

            <p style={paragraphStyle}>
              The price, renewal period and included features are shown before
              purchase. Users should review the plan details before subscribing.
            </p>

            <p style={paragraphStyle}>
              You can ask to cancel a paid membership by contacting
              support@yanbolearning.co.uk. Cancellation stops future renewals,
              but it does not automatically refund time already used.
            </p>

            <p style={paragraphStyle}>
              Refunds and cancellation rights will be handled in line with
              applicable UK consumer law. Where a legal cancellation right
              applies, YanBo Learning will honour it. The refund position may
              depend on when cancellation is requested, whether membership access
              has started, and what service has already been supplied.
            </p>

            <p style={paragraphStyle}>
              If you have a question about a payment, subscription, renewal or
              cancellation, please contact:
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
              Users should use YanBo Practice Portal fairly and only for
              personal, family or educational practice.
            </p>

            <ul style={listStyle}>
              <li>
                Do not try to damage, overload or interfere with the portal.
              </li>
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
              of YanBo Practice Portal belong to YanBo Learning unless otherwise
              stated.
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
              YanBo Practice Portal is provided as an educational practice tool.
              It is the responsibility of parents, guardians, carers, teachers
              and pupils to decide how to use the materials as part of wider 11+
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
              style={privacyLinkStyle}
            >
              View Privacy Policy
            </a>
          </TermsCard>

          <TermsCard title="12. Changes to these terms">
            <p style={paragraphStyle}>
              These Terms may be updated as YanBo Practice Portal develops. When
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
  children: ReactNode
}) {
  return (
    <section style={cardStyle}>
      <h2 style={cardTitleStyle}>
        {title}
      </h2>

      {children}
    </section>
  )
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f4fbf4 0%, #f8fafc 50%, #ffffff 100%)",
  padding: "40px 20px 64px",
  boxSizing: "border-box",
}

const contentStyle: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
}

const heroCardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 28,
  padding: "42px 28px",
  border: "1px solid #d1fae5",
  boxShadow: "0 14px 34px rgba(6, 78, 59, 0.08)",
  textAlign: "center",
  marginBottom: 30,
}

const heroBadgeStyle: CSSProperties = {
  display: "inline-block",
  background: "#dcfce7",
  color: "#166534",
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 18,
}

const heroTitleStyle: CSSProperties = {
  fontSize: "clamp(34px, 7vw, 48px)",
  lineHeight: 1.1,
  margin: "0 0 18px",
  color: "#064e3b",
  fontWeight: 900,
}

const heroTextStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.75,
  color: "#374151",
  maxWidth: 760,
  margin: "0 auto",
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 22,
  padding: "26px 24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 26px rgba(0, 0, 0, 0.06)",
  marginBottom: 20,
}

const cardTitleStyle: CSSProperties = {
  fontSize: "clamp(22px, 5vw, 28px)",
  color: "#064e3b",
  margin: "0 0 12px",
  fontWeight: 900,
}

const paragraphStyle: CSSProperties = {
  fontSize: 16.5,
  lineHeight: 1.75,
  color: "#4b5563",
  margin: "0 0 14px",
}

const listStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.8,
  color: "#4b5563",
  paddingLeft: 22,
  margin: "0 0 8px",
}

const highlightBaseStyle: CSSProperties = {
  display: "inline-block",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#065f46",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 900,
}

const highlightStyle: CSSProperties = {
  ...highlightBaseStyle,
  margin: "0 0 14px",
}

const privacyLinkStyle: CSSProperties = {
  ...highlightBaseStyle,
  textDecoration: "none",
}
