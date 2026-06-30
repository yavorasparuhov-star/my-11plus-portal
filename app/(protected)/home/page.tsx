"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "../../../lib/supabaseClient"
import {
  CustomTestsIcon,
  EnglishIcon,
  MathsIcon,
  NVRIcon,
  ProgressIcon,
  ReviewIcon,
  VRIcon,
} from "../../../components/icons/PortalIcons"
import {
  StudentAvatarPortrait,
  defaultAvatar,
  normaliseAvatarConfig,
  normaliseAvatarName,
  type AvatarConfig,
} from "../../../components/avatar/StudentAvatarPortrait"

type DailyLoginResult = {
  error?: string
  awarded?: boolean
  amount?: number
}

type DailyHomeMessage = {
  rotation_order: number
  message: string
}

const cardHover = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function HomePage() {
  const router = useRouter()
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar)
  const [avatarName, setAvatarName] = useState("")
  const [avatarLoading, setAvatarLoading] = useState(true)
  const [claimingDailyCoins, setClaimingDailyCoins] = useState(false)
  const [dailyCoinsClaimed, setDailyCoinsClaimed] = useState(false)
  const [dailyCoinMessage, setDailyCoinMessage] = useState<React.ReactNode | null>(null)
  const [dailyCoinError, setDailyCoinError] = useState<React.ReactNode | null>(null)
  const [dailyHomeMessage, setDailyHomeMessage] = useState(
    "A short practice every day beats one long practice once a week.",
  )

  useEffect(() => {
    loadHomeAvatar()
    loadDailyHomeMessage()
  }, [])

  async function loadHomeAvatar() {
    setAvatarLoading(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setAvatarLoading(false)
      return
    }

    const { data: avatarData, error: avatarError } = await supabase
      .from("student_avatars")
      .select("avatar_config, avatar_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!avatarError && avatarData) {
      setAvatarName(normaliseAvatarName(avatarData.avatar_name))

      if (avatarData.avatar_config) {
        setAvatarConfig(
          normaliseAvatarConfig(
            avatarData.avatar_config as Record<string, unknown>,
          ),
        )
      }
    }

    setAvatarLoading(false)
  }



  function getLondonDateParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date())

    const year = Number(parts.find((part) => part.type === "year")?.value)
    const month = Number(parts.find((part) => part.type === "month")?.value)
    const day = Number(parts.find((part) => part.type === "day")?.value)

    return { year, month, day }
  }

  function getDailyMessageIndex(messageCount: number) {
    const { year, month, day } = getLondonDateParts()

    const todayUtc = Date.UTC(year, month - 1, day)
    const startUtc = Date.UTC(2026, 0, 1)

    const daysSinceStart = Math.floor((todayUtc - startUtc) / 86400000)

    return ((daysSinceStart % messageCount) + messageCount) % messageCount
  }

  async function loadDailyHomeMessage() {
    const { data, error } = await supabase
      .from("daily_home_messages")
      .select("rotation_order, message")
      .eq("is_active", true)
      .order("rotation_order", { ascending: true })

    if (error || !data || data.length === 0) {
      return
    }

    const messages = data as DailyHomeMessage[]
    const messageIndex = getDailyMessageIndex(messages.length)

    setDailyHomeMessage(messages[messageIndex].message)
  }

  const cards = [
    {
      title: "English",
      icon: <EnglishIcon size={46} />,
      text: "Vocabulary, spelling, grammar, punctuation and comprehension practice.",
      path: "/english",
    },
    {
      title: "Maths",
      icon: <MathsIcon size={46} />,
      text: "Build arithmetic, reasoning, fractions, problem-solving and exam confidence.",
      path: "/math",
    },
    {
      title: "VR",
      icon: <VRIcon size={46} />,
      text: "Practise verbal reasoning question types including words, codes and logic.",
      path: "/vr",
    },
    {
      title: "NVR",
      icon: <NVRIcon size={46} />,
      text: "Develop non-verbal reasoning skills, pattern recognition and spatial awareness.",
      path: "/nvr",
    },
  ]

  const learningTools = [
    {
      title: "Build a Test",
      icon: <CustomTestsIcon size={42} />,
      text: "Create focused tests by subject, topic, difficulty and time limit to match your child’s current goals.",
      button: "Build a test",
      path: "/custom-tests",
    },
    {
      title: "Track Progress",
      icon: <ProgressIcon size={42} />,
      text: "Monitor recent scores, success rates and improvement trends so practice stays targeted.",
      button: "View progress",
      path: "/progress",
    },
    {
      title: "Review Mistakes",
      icon: <ReviewIcon size={42} />,
      text: "Revisit previous mistakes and strengthen weaker topics until they are fully mastered.",
      button: "Open review",
      path: "/review",
    },
  ]

  function handleCardHover(e: React.MouseEvent<HTMLDivElement>, active: boolean) {
    e.currentTarget.style.transform = active ? "translateY(-6px)" : "translateY(0)"
    e.currentTarget.style.boxShadow = active
      ? "0 20px 40px rgba(0,0,0,0.12)"
      : "0 10px 25px rgba(0,0,0,0.08)"
  }

  async function claimDailyCoins() {
    setClaimingDailyCoins(true)
    setDailyCoinMessage(null)
    setDailyCoinError(null)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        setDailyCoinError(
          <>
            You need to be logged in to claim <YanBoWord /> Coins.
          </>,
        )
        setClaimingDailyCoins(false)
        return
      }

      const response = await fetch("/api/tokens/daily-login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = (await response.json().catch(() => ({}))) as DailyLoginResult

      if (!response.ok) {
        setDailyCoinError(
          result.error || (
            <>
              Could not claim today’s <YanBoWord /> Coins.
            </>
          ),
        )
        setClaimingDailyCoins(false)
        return
      }

      if (result.awarded) {
        const amount = result.amount ?? 3
        setDailyCoinsClaimed(true)
        setDailyCoinMessage(
          <>
            Great job! You collected {amount} <YanBoWord /> Coins.
          </>,
        )
      } else {
        setDailyCoinsClaimed(true)
        setDailyCoinMessage(
          <>
            Daily <YanBoWord /> Coins already collected today.
          </>,
        )
      }
    } catch (error) {
      setDailyCoinError(
        error instanceof Error
          ? error.message
          : (
              <>
                Could not claim today’s <YanBoWord /> Coins.
              </>
            ),
      )
    }

    setClaimingDailyCoins(false)
  }

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroGrid}>
          <div style={styles.heroAvatarWrap}>
            <StudentAvatarPortrait
              config={avatarConfig}
              name={avatarName || "My learning buddy"}
              showNameArc
              size={222}
              borderWidth={7}
              ariaLabel={`${avatarName || "My learning buddy"} avatar`}
            />
          </div>

          <div style={styles.heroContent}>
            <h1 style={styles.title}>Welcome back!</h1>

            <p style={styles.subtitle}>Ready for today’s learning adventure?</p>

            <div style={styles.buddySpeechBubble}>
              <span style={styles.buddySpeechTail} />

              <div style={styles.didYouKnowBlock}>
                <p style={styles.didYouKnowLabel}>Did you know?</p>
                <p style={styles.didYouKnowText}>{dailyHomeMessage}</p>
              </div>

              <div style={styles.dailyCoinsBubbleBlock}>
                <p style={styles.dailyCoinsBubbleText}>
                  {dailyCoinsClaimed ? (
                    <>
                      You have collected today’s <YanBoWord /> Coins. Come back
                      tomorrow for more.
                    </>
                  ) : (
                    <>
                      Collect your daily <YanBoWord /> Coins before you start.
                    </>
                  )}
                </p>

                <button
                  type="button"
                  onClick={claimDailyCoins}
                  disabled={claimingDailyCoins || dailyCoinsClaimed}
                  aria-label={
                    dailyCoinsClaimed
                      ? "Daily YanBo Coins collected today"
                      : "Collect daily YanBo Coins"
                  }
                  title={
                    dailyCoinsClaimed
                      ? "Daily YanBo Coins collected today"
                      : "Collect daily YanBo Coins"
                  }
                  style={{
                    ...styles.dailyCoinsButton,
                    ...(dailyCoinsClaimed ? styles.dailyCoinsButtonDone : {}),
                  }}
                >
                  <CoinBagClaimImage collected={dailyCoinsClaimed} />

                  {!dailyCoinsClaimed && (
                    <span style={styles.coinSparkle}>+3</span>
                  )}

                  <span style={styles.dailyCoinsButtonCaption}>
                    {claimingDailyCoins
                      ? "Checking..."
                      : dailyCoinsClaimed
                        ? "Collected today"
                        : "Collect daily coins"}
                  </span>
                </button>

                {dailyCoinMessage && (
                  <p style={styles.dailyCoinMessage}>{dailyCoinMessage}</p>
                )}

                {dailyCoinError && (
                  <p style={styles.dailyCoinError}>{dailyCoinError}</p>
                )}
              </div>

              {!avatarLoading && !avatarName && (
                <div style={styles.nameAvatarBubbleBlock}>
                  <p style={styles.nameAvatarBubbleText}>
                    Name your avatar and make your learning adventure more fun.
                  </p>

                  <Link href="/avatar" style={styles.nameAvatarBubbleButton}>
                    Name my avatar
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* SUBJECT CARDS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Continue learning</h2>
          <p style={styles.sectionText}>
            Choose one of the four main 11+ subject areas and continue building
            confidence step by step.
          </p>
        </div>

        <div style={styles.grid}>
          {cards.map((card) => (
            <div
              key={card.title}
              style={{ ...styles.card, ...cardHover }}
              onClick={() => router.push(card.path)}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
            >
              <div style={styles.cardTitleRow}>
                <div style={styles.icon}>{card.icon}</div>
                <h2 style={styles.cardTitle}>{card.title}</h2>
              </div>

              <p style={styles.cardText}>{card.text}</p>

              <button
                style={styles.button}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(card.path)
                }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* PREMIUM LEARNING TOOLS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Your Premium Learning Tools</h2>
          <p style={styles.sectionText}>
            Use these tools to personalise practice, track improvement and turn
            mistakes into stronger exam performance.
          </p>
        </div>

        <div style={styles.toolsGrid}>
          {learningTools.map((tool) => (
            <div
              key={tool.title}
              style={{ ...styles.toolCard, ...cardHover }}
              onClick={() => router.push(tool.path)}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
            >
              <div style={styles.toolTitleRow}>
                <span style={styles.toolIcon}>{tool.icon}</span>
                <h3 style={styles.toolTitle}>{tool.title}</h3>
              </div>

              <p style={styles.toolText}>{tool.text}</p>

              <button
                style={styles.toolButton}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(tool.path)
                }}
              >
                {tool.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerGrid}>
          <div style={styles.footerBrandColumn}>
<h2 style={styles.footerBrand}>
  <YanBoWord /> Practice Portal
</h2>
            <p style={styles.footerDescription}>
              11+ practice for English, Maths, Verbal Reasoning and Non-Verbal
              Reasoning.
            </p>
          </div>

          <div style={styles.footerColumn}>
            <h3 style={styles.footerColumnTitle}>Practice</h3>
            <Link href="/english" style={styles.footerLink}>
              English
            </Link>
            <Link href="/math" style={styles.footerLink}>
              Maths
            </Link>
            <Link href="/vr" style={styles.footerLink}>
              Verbal Reasoning
            </Link>
            <Link href="/nvr" style={styles.footerLink}>
              Non-Verbal Reasoning
            </Link>
<Link href="/custom-tests" style={styles.footerLink}>
  Build a Test
</Link>
          </div>

          <div style={styles.footerColumn}>
            <h3 style={styles.footerColumnTitle}>Support</h3>
            <Link href="/#pricing" style={styles.footerLink}>
              Pricing
            </Link>
            <Link href="/about" style={styles.footerLink}>
              About
            </Link>
            <Link href="/contact" style={styles.footerLink}>
              Contact
            </Link>
            <Link href="/privacy-policy" style={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={styles.footerLink}>
              Terms
            </Link>
          </div>
        </div>

        <div style={styles.footerBottom}>
          © 2026 <YanBoWord /> Practice Portal. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function YanBoWord() {
  return (
    <span style={styles.yanboWord}>
      <span style={styles.yanboY}>Y</span>an
      <span style={styles.yanboB}>B</span>o
    </span>
  )
}

function CoinBagClaimImage({ collected }: { collected: boolean }) {
  return (
    <svg
      viewBox="0 0 150 145"
      role="img"
      aria-hidden="true"
      style={styles.coinBagSvg}
    >
      <defs>
        <linearGradient id="coinBagBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c47a2c" />
          <stop offset="48%" stopColor="#9a5a22" />
          <stop offset="100%" stopColor="#6f3d17" />
        </linearGradient>

        <linearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7ad" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <filter id="coinBagShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="5"
            floodColor="#92400e"
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      <ellipse cx="75" cy="132" rx="47" ry="9" fill="rgba(146, 64, 14, 0.18)" />

      <g filter="url(#coinBagShadow)">
        <circle cx="51" cy="34" r="21" fill="url(#coinGold)" stroke="#b45309" strokeWidth="4" />
        <circle cx="77" cy="27" r="24" fill="url(#coinGold)" stroke="#b45309" strokeWidth="4" />
        <circle cx="100" cy="39" r="21" fill="url(#coinGold)" stroke="#b45309" strokeWidth="4" />

        <text x="77" y="36" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff8c7" stroke="#b45309" strokeWidth="1">
          Y
        </text>

        <path
          d="M 40 45 C 29 56 25 76 24 96 C 22 122 42 134 75 134 C 108 134 128 122 126 96 C 125 76 121 56 110 45 C 97 53 53 53 40 45 Z"
          fill="url(#coinBagBody)"
          stroke="#6f3d17"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        <path
          d="M 39 55 C 57 63 93 63 111 55"
          fill="none"
          stroke="#f3c178"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M 39 61 C 61 70 89 70 111 61"
          fill="none"
          stroke="#5b3214"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M 113 61 C 132 68 132 95 120 108"
          fill="none"
          stroke="#5b3214"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <path
          d="M 103 61 C 122 70 123 91 113 104"
          fill="none"
          stroke="#c47a2c"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle cx="65" cy="91" r="16" fill="rgba(255, 255, 255, 0.08)" />
        <text x="75" y="104" textAnchor="middle" fontSize="39" fontWeight="900" fill="#fef3c7" opacity="0.95">
          $
        </text>
      </g>

      {collected && (
        <g>
          <circle cx="116" cy="31" r="20" fill="#16a34a" stroke="#ffffff" strokeWidth="5" />
          <path
            d="M 106 31 L 113 38 L 127 23"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "32px 20px 60px",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  hero: {
    marginBottom: "44px",
    background:
      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #ffffff 100%)",
    borderRadius: "28px",
    padding: "30px 28px",
    boxShadow: "0 14px 36px rgba(0,0,0,0.07)",
    border: "1px solid #d1fae5",
    overflow: "hidden",
  },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "250px minmax(0, 1fr)",
    gap: "28px",
    alignItems: "center",
  },

  heroAvatarWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  heroContent: {
    minWidth: 0,
  },

  title: {
    fontSize: "42px",
    margin: "0 0 12px",
    color: "#064e3b",
    fontWeight: 900,
    lineHeight: 1.08,
  },

  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: 0,
    lineHeight: 1.55,
    fontWeight: 650,
  },

  buddySpeechBubble: {
    position: "relative",
    marginTop: "20px",
    maxWidth: "650px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "2px solid #16a34a",
    padding: "18px 18px 16px",
    boxShadow: "0 12px 28px rgba(22,163,74,0.12)",
  },

  buddySpeechTail: {
    position: "absolute",
    left: -9,
    top: 42,
    width: 16,
    height: 16,
    transform: "rotate(45deg)",
    background: "#ffffff",
    borderLeft: "2px solid #16a34a",
    borderBottom: "2px solid #16a34a",
  },

  didYouKnowBlock: {
    paddingBottom: "14px",
    borderBottom: "1px solid #dcfce7",
  },

  didYouKnowLabel: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontSize: "0.88rem",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  didYouKnowText: {
    margin: 0,
    color: "#374151",
    fontSize: "1.05rem",
    fontWeight: 750,
    lineHeight: 1.45,
  },

  dailyCoinsBubbleBlock: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  dailyCoinsBubbleText: {
    margin: 0,
    color: "#065f46",
    fontSize: "0.95rem",
    fontWeight: 800,
    lineHeight: 1.4,
    flex: "1 1 250px",
  },

  dailyCoinsButton: {
    position: "relative",
    border: "none",
    padding: 0,
    background: "transparent",
    color: "#78350f",
    fontWeight: 950,
    fontSize: "0.88rem",
    cursor: "pointer",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },

  dailyCoinsButtonDone: {
    color: "#166534",
    cursor: "default",
  },

  coinBagSvg: {
    width: 92,
    height: 90,
    display: "block",
    transition: "transform 0.18s ease, filter 0.18s ease",
    filter: "drop-shadow(0 9px 12px rgba(146, 64, 14, 0.22))",
  },

  dailyCoinsButtonCaption: {
    display: "inline-block",
    color: "#92400e",
    fontSize: "0.78rem",
    fontWeight: 950,
    lineHeight: 1.1,
    textAlign: "center",
  },

  coinSparkle: {
    position: "absolute",
    right: 6,
    top: 2,
    minWidth: 30,
    height: 30,
    borderRadius: "50%",
    background: "#fde047",
    color: "#854d0e",
    border: "2px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.76rem",
    fontWeight: 950,
    boxShadow: "0 7px 14px rgba(146, 64, 14, 0.22)",
  },

  dailyCoinMessage: {
    margin: "2px 0 0",
    color: "#047857",
    fontSize: "0.88rem",
    fontWeight: 800,
    width: "100%",
  },

  dailyCoinError: {
    margin: "2px 0 0",
    color: "#b91c1c",
    fontSize: "0.88rem",
    fontWeight: 800,
    width: "100%",
  },

  nameAvatarBubbleBlock: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #dcfce7",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  nameAvatarBubbleText: {
    margin: 0,
    color: "#065f46",
    fontSize: "0.95rem",
    fontWeight: 800,
    lineHeight: 1.4,
    flex: "1 1 250px",
  },

  nameAvatarBubbleButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: "0.9rem",
    boxShadow: "0 10px 22px rgba(22, 163, 74, 0.22)",
    whiteSpace: "nowrap",
  },

  homeAvatarStage: {
    position: "relative",
    width: 222,
    height: 222,
    minWidth: 222,
    overflow: "hidden",
    borderRadius: "9999px",
    background: "linear-gradient(180deg, #ffffff, #eff6ff)",
    border: "7px solid #ffffff",
    outline: "4px solid #d1fae5",
    boxShadow: "0 18px 34px rgba(15, 23, 42, 0.15)",
  },

  avatarNameArcSvg: {
    position: "absolute",
    inset: 0,
    zIndex: 80,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },

  avatarNameArcText: {
    fill: "#064e3b",
    fontSize: "13px",
    fontWeight: 950,
    letterSpacing: "0.04em",
    paintOrder: "stroke",
    stroke: "#ffffff",
    strokeWidth: 4,
    strokeLinejoin: "round",
  },

  homeAvatarBackgroundImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  homeAvatarStageOverlay: {
    position: "absolute",
    inset: 0,
  },

  homeAvatarGroundShadow: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 18,
    height: 22,
    borderRadius: "50%",
    background: "rgba(15, 23, 42, 0.12)",
    filter: "blur(7px)",
  },

  homeAvatarScaledBody: {
    position: "absolute",
    left: "50%",
    top: -20,
    width: 330,
    height: 520,
    transform: "translateX(-50%) scale(1.06)",
    transformOrigin: "top center",
  },

  homeAvatarInner: {
    position: "relative",
    width: 330,
    height: 520,
  },

  homeAvatarBaseImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 18px 18px rgba(15, 23, 42, 0.26))",
    zIndex: 20,
  },

  homeAvatarEyeLayer: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    zIndex: 40,
  },

  homeAvatarHatLayer: {
    position: "absolute",
    left: "50%",
    top: 12,
    zIndex: 50,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  homeAvatarHatImage: {
    width: 128,
    height: 96,
    objectFit: "contain",
    filter: "drop-shadow(0 8px 7px rgba(15, 23, 42, 0.24))",
  },

  homeAvatarHatFallback: {
    fontSize: "4.5rem",
    filter: "drop-shadow(0 8px 7px rgba(15, 23, 42, 0.24))",
  },

  homeAvatarGlassesLayer: {
    position: "absolute",
    left: "50%",
    top: 70,
    zIndex: 50,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  homeAvatarGlassesImage: {
    width: 112,
    height: 56,
    objectFit: "contain",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.18))",
  },

  homeAvatarGlassesFallback: {
    fontSize: "3rem",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.18))",
  },

  homeAvatarBadgeLayer: {
    position: "absolute",
    left: 122,
    top: 164,
    zIndex: 50,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  homeAvatarBadgeImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.2))",
  },

  homeAvatarBadgeFallback: {
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 900,
    textShadow: "0 2px 4px rgba(15, 23, 42, 0.3)",
  },

  homeAvatarFallbackWrap: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  homeAvatarFallbackHead: {
    width: 132,
    height: 132,
    borderRadius: "50%",
    border: "8px solid #ffffff",
    background: "#f1c9a5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4rem",
    boxShadow: "0 16px 24px rgba(15, 23, 42, 0.18)",
  },

  homeAvatarFallbackJumper: {
    marginTop: -8,
    minWidth: 160,
    borderRadius: "28px 28px 8px 8px",
    background: "#1f2937",
    color: "#ffffff",
    padding: "16px 18px",
    textAlign: "center",
    fontSize: "1.4rem",
    fontWeight: 900,
    lineHeight: 1,
  },

  yanboY: {
    color: "#f472b6",
  },

  yanboB: {
    color: "#fde047",
  },

  yanboWord: {
    whiteSpace: "nowrap",
    fontWeight: 950,
  },

  section: {
    marginBottom: "56px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "26px",
  },

  sectionTitle: {
    fontSize: "32px",
    margin: "0 0 10px",
    color: "#111827",
    fontWeight: 800,
  },

  sectionText: {
    fontSize: "17px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
    alignItems: "stretch",
    border: "1px solid #e5e7eb",
  },

  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  icon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  cardTitle: {
    fontSize: "24px",
    margin: 0,
    color: "#111827",
  },

  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "18px",
    minHeight: "78px",
  },

  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "16px",
    minWidth: "140px",
  },

  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  toolCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
  },

  toolTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },

  toolIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  toolTitle: {
    fontSize: "24px",
    margin: 0,
    color: "#111827",
    fontWeight: 800,
  },

  toolText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "22px",
    flexGrow: 1,
  },

  toolButton: {
    padding: "13px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    width: "100%",
  },

  footer: {
    marginTop: "16px",
    padding: "34px 28px 24px",
    borderRadius: "28px",
    background: "#064e3b",
    color: "#ffffff",
    boxShadow: "0 14px 34px rgba(6, 78, 59, 0.18)",
  },

  footerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "28px",
    alignItems: "start",
  },

  footerBrandColumn: {
    maxWidth: 390,
  },

  footerBrand: {
    margin: "0 0 10px",
    fontSize: "1.45rem",
    fontWeight: 950,
    lineHeight: 1.1,
  },

  footerDescription: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "0.98rem",
    lineHeight: 1.65,
    fontWeight: 650,
  },

  footerColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  footerColumnTitle: {
    margin: "0 0 4px",
    color: "#ffffff",
    fontSize: "0.95rem",
    fontWeight: 950,
  },

  footerLink: {
    color: "#d1fae5",
    textDecoration: "none",
    fontSize: "0.94rem",
    fontWeight: 750,
    lineHeight: 1.35,
  },

  footerBottom: {
    marginTop: "26px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(209, 250, 229, 0.24)",
    color: "#bbf7d0",
    fontSize: "0.88rem",
    fontWeight: 750,
  },

}
