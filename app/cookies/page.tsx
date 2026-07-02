"use client"

import type { CSSProperties, ReactNode } from "react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { openCookieSettings } from "../../lib/cookieConsent"

export default function CookiePolicyPage() {
  return (
    <>
      <Header />

      <main style={pageStyle}>
        <section style={contentStyle}>
          <div style={heroCardStyle}>
            <div style={heroBadgeStyle}>
              Cookie Policy
            </div>

            <h1 style={heroTitleStyle}>
              How YanBo Practice Portal uses cookies
            </h1>

            <p style={heroTextStyle}>
              This Cookie Policy explains how YanBo Practice Portal uses cookies
              and similar technologies to keep the portal working, improve the
              service and support future advertising choices.
            </p>
          </div>

          <CookieCard title="1. What cookies are">
            <p style={paragraphStyle}>
              Cookies are small files placed on a device when someone visits a
              website. Similar technologies, such as local storage, pixels and
              tags, can also store or access information on a device.
            </p>

            <p style={paragraphStyle}>
              These technologies can help a website remember choices, keep users
              signed in, understand how the website is used, or measure the
              success of advertising.
            </p>
          </CookieCard>

          <CookieCard title="2. How we use cookies and similar technologies">
            <p style={paragraphStyle}>
              YanBo Practice Portal may use cookies and similar technologies to:
            </p>

            <ul style={listStyle}>
              <li>Keep users signed in securely</li>
              <li>Protect accounts and support portal security</li>
              <li>Remember cookie choices</li>
              <li>Support learning features and account access</li>
              <li>Understand how the portal is used</li>
              <li>Improve pages, features and learning tools</li>
              <li>Measure advertising and sign-up campaigns in the future</li>
            </ul>
          </CookieCard>

          <CookieCard title="3. Essential cookies">
            <p style={paragraphStyle}>
              Essential cookies and storage are needed for YanBo Practice Portal
              to work properly. These may support login, security, account
              access, subscription access and remembering cookie choices.
            </p>

            <p style={paragraphStyle}>
              Essential cookies cannot be switched off through our cookie
              settings because the portal needs them to provide the service.
            </p>
          </CookieCard>

          <CookieCard title="4. Analytics cookies">
            <p style={paragraphStyle}>
              Analytics cookies help us understand how visitors and members use
              the portal. For example, they may show which pages are visited,
              which features are popular and where users may need a better
              experience.
            </p>

            <p style={paragraphStyle}>
              Analytics cookies are optional and will only be used if consent is
              given.
            </p>
          </CookieCard>

          <CookieCard title="5. Marketing cookies">
            <p style={paragraphStyle}>
              Marketing cookies and pixels may be used in the future to measure
              advertising performance, understand which campaigns lead to sign-ups
              and support relevant promotion of YanBo Practice Portal.
            </p>

            <p style={paragraphStyle}>
              Marketing cookies are optional and will only be used if consent is
              given.
            </p>
          </CookieCard>

          <CookieCard title="6. Preferences cookies">
            <p style={paragraphStyle}>
              Preferences cookies may remember helpful choices such as display
              settings or other portal preferences, where these are not strictly
              necessary for the service to work.
            </p>

            <p style={paragraphStyle}>
              Preferences cookies are optional and will only be used if consent
              is given.
            </p>
          </CookieCard>

          <CookieCard title="7. Third-party services">
            <p style={paragraphStyle}>
              As YanBo Practice Portal grows, we may use trusted third-party
              services for hosting, authentication, payments, analytics,
              advertising and security.
            </p>

            <p style={paragraphStyle}>
              Examples may include services such as authentication providers,
              payment processors, analytics tools and advertising platforms.
              Optional analytics or marketing tools should only load when the
              relevant consent has been given.
            </p>
          </CookieCard>

          <CookieCard title="8. Children and privacy">
            <p style={paragraphStyle}>
              YanBo Practice Portal is designed for 11+ preparation and may be
              used by children with support from a parent, guardian, carer or
              teacher.
            </p>

            <p style={paragraphStyle}>
              We aim to keep cookie and privacy information clear and
              understandable. We also aim to avoid unnecessary tracking and to
              use optional analytics or marketing technologies only where
              appropriate consent has been given.
            </p>
          </CookieCard>

          <CookieCard title="9. Managing cookie choices">
            <p style={paragraphStyle}>
              You can accept all optional cookies, reject optional cookies, or
              choose which optional categories to allow.
            </p>

            <p style={paragraphStyle}>
              You can update your cookie choices at any time using the button
              below.
            </p>

            <button type="button" onClick={openCookieSettings} style={buttonStyle}>
              Manage cookie choices
            </button>
          </CookieCard>

          <CookieCard title="10. Updates to this policy">
            <p style={paragraphStyle}>
              This Cookie Policy may be updated as YanBo Practice Portal grows,
              especially if new analytics, advertising, payment or security tools
              are added.
            </p>

            <p style={paragraphStyle}>Last updated: June 2026</p>
          </CookieCard>
        </section>
      </main>

      <Footer />
    </>
  )
}

function CookieCard({
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

const buttonStyle: CSSProperties = {
  display: "inline-block",
  border: "none",
  background: "#047857",
  color: "#ffffff",
  borderRadius: 14,
  padding: "13px 16px",
  fontWeight: 900,
  fontSize: 15.5,
  cursor: "pointer",
}
