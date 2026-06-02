import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      style={{
        background: "#064e3b",
        color: "#ecfdf5",
        padding: "34px 20px",
        marginTop: "0",
      }}
    >
      <div
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 28,
          alignItems: "start",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              margin: "0 0 10px",
            }}
          >
            YanBo Learning
          </h2>

          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.6,
              color: "#d1fae5",
              margin: 0,
            }}
          >
            11+ practice for English, Maths, Verbal Reasoning and Non-Verbal
            Reasoning.
          </p>
        </div>

        <div>
          <h3 style={footerHeadingStyle}>Practice</h3>

          <div style={linkColumnStyle}>
            <FooterLink href="/english" label="English" />
            <FooterLink href="/math" label="Maths" />
            <FooterLink href="/vr" label="Verbal Reasoning" />
            <FooterLink href="/nvr" label="Non-Verbal Reasoning" />
            <FooterLink href="/custom-tests" label="Custom Tests" />
          </div>
        </div>

        <div>
          <h3 style={footerHeadingStyle}>Support</h3>

          <div style={linkColumnStyle}>
            <FooterLink href="/#pricing" label="Pricing" />
            <FooterLink href="/about" label="About" />
            <FooterLink href="/contact" label="Contact" />
            <FooterLink href="/privacy-policy" label="Privacy Policy" />
            <FooterLink href="/terms" label="Terms" />
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1150,
          margin: "28px auto 0",
          paddingTop: 18,
          borderTop: "1px solid rgba(209, 250, 229, 0.25)",
          fontSize: "14px",
          color: "#bbf7d0",
          textAlign: "center",
        }}
      >
        © {currentYear} YanBo Learning. All rights reserved.
      </div>
    </footer>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        color: "#ecfdf5",
        textDecoration: "none",
        fontSize: "15px",
        lineHeight: 1.6,
      }}
    >
      {label}
    </Link>
  )
}

const footerHeadingStyle = {
  fontSize: "16px",
  fontWeight: 800,
  margin: "0 0 12px",
  color: "#ffffff",
}

const linkColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
}