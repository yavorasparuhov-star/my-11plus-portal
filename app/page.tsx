"use client"

import Header from "../components/Header"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function LandingPage() {
  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.subscriptionSection}>
          <h2 style={styles.subscriptionTitle}>Choose Your Plan</h2>
          <p style={styles.subscriptionSubtitle}>
            Start free and upgrade when you are ready for more practice, tracking,
            and progress tools.
          </p>

          <div style={styles.subscriptionGrid}>
            <div
              style={{ ...styles.card, ...hoverCardStyle }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div style={styles.planIcon}>🌱</div>
              <h3 style={styles.cardTitle}>Free</h3>
              <p style={styles.planPrice}>£0 / month</p>
              <p style={styles.cardText}>
                A great starting point for trying out English and Math practice.
              </p>

              <div style={styles.featuresBox}>
                <p style={styles.featureItem}>✓ Access basic practice</p>
                <p style={styles.featureItem}>✓ English and Math entry pages</p>
                <p style={styles.featureItem}>✓ Perfect for getting started</p>
              </div>

              <button
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#bbf7d0"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#d4f5d0"
                }}
                style={styles.button}
              >
                Get Started
              </button>
            </div>

            <div
              style={{
                ...styles.card,
                ...styles.featuredCard,
                ...hoverCardStyle,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div style={styles.popularBadge}>Most Popular</div>
              <div style={styles.planIcon}>⭐</div>
              <h3 style={styles.cardTitle}>Monthly</h3>
              <p style={styles.planPrice}>£9.99 / month</p>
              <p style={styles.cardText}>
                Flexible monthly access for regular 11+ study and progress building.
              </p>

              <div style={styles.featuresBox}>
                <p style={styles.featureItem}>✓ Full practice access</p>
                <p style={styles.featureItem}>✓ Progress tracking</p>
                <p style={styles.featureItem}>✓ Review and improvement tools</p>
              </div>

              <button
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#bbf7d0"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#d4f5d0"
                }}
                style={styles.button}
              >
                Choose Monthly
              </button>
            </div>

            <div
              style={{ ...styles.card, ...hoverCardStyle }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div style={styles.planIcon}>🏆</div>
              <h3 style={styles.cardTitle}>Yearly</h3>
              <p style={styles.planPrice}>£99 / year</p>
              <p style={styles.cardText}>
                Best value for families who want long-term preparation and savings.
              </p>

              <div style={styles.featuresBox}>
                <p style={styles.featureItem}>✓ Everything in Monthly</p>
                <p style={styles.featureItem}>✓ Better value overall</p>
                <p style={styles.featureItem}>✓ Ideal for long-term learning</p>
              </div>

              <button
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#bbf7d0"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#d4f5d0"
                }}
                style={styles.button}
              >
                Choose Yearly
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4fbf4",
    padding: "30px 20px 50px",
  },
  subscriptionSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    textAlign: "center",
  },
  subscriptionTitle: {
    fontSize: "34px",
    marginBottom: "10px",
    color: "#1f3b2d",
  },
  subscriptionSubtitle: {
    fontSize: "17px",
    color: "#355244",
    maxWidth: "760px",
    margin: "0 auto 30px",
    lineHeight: 1.6,
  },
  subscriptionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "26px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  featuredCard: {
    border: "2px solid #bbf7d0",
  },
  popularBadge: {
    position: "absolute",
    top: "-12px",
    background: "#d1fae5",
    color: "#065f46",
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
  },
  planIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "24px",
    marginBottom: "8px",
    color: "#111827",
  },
  planPrice: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#065f46",
    marginBottom: "12px",
  },
  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "18px",
    minHeight: "78px",
  },
  featuresBox: {
    width: "100%",
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "18px",
    textAlign: "left",
  },
  featureItem: {
    margin: "8px 0",
    fontSize: "15px",
    color: "#374151",
  },
  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "180px",
  },
}