"use client"

import Link from "next/link"
import type { CSSProperties, MouseEvent, ReactNode } from "react"

type SubjectLandingCardProps = {
  shortTitle: string
  icon: ReactNode
  text: string
  href: string
  cta: string
}

const restShadow = "0 10px 25px rgba(0,0,0,0.08)"
const hoverShadow = "0 20px 40px rgba(0,0,0,0.12)"

export function SubjectLandingCard({
  shortTitle,
  icon,
  text,
  href,
  cta,
}: SubjectLandingCardProps) {
  const liftCard = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.transform = "translateY(-6px)"
    event.currentTarget.style.boxShadow = hoverShadow
  }

  const settleCard = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.transform = "translateY(0)"
    event.currentTarget.style.boxShadow = restShadow
  }

  return (
    <Link
      href={href}
      style={styles.card}
      onMouseEnter={liftCard}
      onMouseLeave={settleCard}
    >
      <div style={styles.cardHeader}>
        <div style={styles.iconWrap}>{icon}</div>

        <h3 style={styles.cardTitle}>{shortTitle}</h3>
      </div>

      <p style={styles.cardText}>{text}</p>

      <span style={styles.cardButton}>{cta}</span>
    </Link>
  )
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: restShadow,
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.25s ease",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "12px",
  },

  iconWrap: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: "24px",
    margin: 0,
    color: "#111827",
    fontWeight: 800,
  },

  cardText: {
    fontSize: "15.5px",
    color: "#4b5563",
    lineHeight: 1.55,
    margin: "0 0 18px",
    minHeight: "76px",
  },

  cardButton: {
    marginTop: "auto",
    padding: "11px 16px",
    borderRadius: "12px",
    background: "#d4f5d0",
    color: "#065f46",
    fontWeight: 800,
    fontSize: "15.5px",
    minWidth: "145px",
    display: "inline-block",
    textAlign: "center",
    alignSelf: "flex-start",
  },
}
