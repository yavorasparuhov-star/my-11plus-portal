"use client"

import type { CSSProperties, MouseEvent, ReactNode } from "react"

type PublicLandingCardProps = {
  title: string
  description: string
  buttonText: string
  onOpen: () => void
  icon?: ReactNode
  iconStyle?: CSSProperties
  footer?: ReactNode
  variant?: "plain" | "icon"
}

const restShadow = "0 10px 25px rgba(0,0,0,0.08)"
const hoverShadow = "0 20px 40px rgba(0,0,0,0.12)"
const buttonRest = "#d4f5d0"
const buttonHover = "#bbf7d0"

export default function PublicLandingCard({
  title,
  description,
  buttonText,
  onOpen,
  icon,
  iconStyle,
  footer,
  variant = "icon",
}: PublicLandingCardProps) {
  const liftCard = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = "translateY(-6px)"
    event.currentTarget.style.boxShadow = hoverShadow
  }

  const settleCard = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = "translateY(0)"
    event.currentTarget.style.boxShadow = restShadow
  }

  return (
    <div
      style={{ ...styles.card, ...styles[`${variant}Card`] }}
      onClick={onOpen}
      onMouseEnter={liftCard}
      onMouseLeave={settleCard}
    >
      {icon ? (
        <div style={styles.cardHeader}>
          <div style={{ ...styles.icon, ...iconStyle }}>{icon}</div>
          <h2 style={{ ...styles.cardTitle, ...styles.iconCardTitle }}>
            {title}
          </h2>
        </div>
      ) : (
        <h2 style={styles.cardTitle}>{title}</h2>
      )}

      <p style={{ ...styles.cardText, ...styles[`${variant}CardText`] }}>
        {description}
      </p>

      {footer}

      <button
        onClick={(event) => {
          event.stopPropagation()
          onOpen()
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = buttonHover
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = buttonRest
        }}
        style={{ ...styles.button, ...styles[`${variant}Button`] }}
      >
        {buttonText}
      </button>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: "white",
    boxShadow: restShadow,
    display: "flex",
    flexDirection: "column",
    transition: "all 0.25s ease",
    cursor: "pointer",
  },

  plainCard: {
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    justifyContent: "space-between",
    minHeight: "270px",
  },

  iconCard: {
    borderRadius: "20px",
    padding: "22px",
    alignItems: "stretch",
    textAlign: "left",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "12px",
  },

  icon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 900,
    lineHeight: 1,
    boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 8px",
  },

  iconCardTitle: {
    margin: 0,
  },

  cardText: {
    fontSize: "16px",
    color: "#4b5563",
  },

  plainCardText: {
    lineHeight: 1.5,
    margin: "0 0 14px",
  },

  iconCardText: {
    lineHeight: 1.55,
    margin: "0 0 18px",
    minHeight: "78px",
  },

  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: buttonRest,
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "180px",
    marginTop: "auto",
    alignSelf: "flex-start",
  },

  plainButton: {
    width: "100%",
    padding: "11px 14px",
    fontWeight: 700,
    marginTop: 0,
    alignSelf: "stretch",
  },

  iconButton: {
    alignSelf: "flex-start",
  },
}
