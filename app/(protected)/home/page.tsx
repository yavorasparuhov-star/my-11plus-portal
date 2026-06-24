"use client"

import React, { useEffect, useMemo, useState } from "react"
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

type AvatarConfig = {
  base: "yan" | "bo"
  skinTone: "light" | "medium" | "dark"
  eyeColor: "brown" | "blue" | "black"
  glasses: string
  background: string
  hat: string
  badge: string
}

type AvatarSlot = "glasses" | "background" | "hat" | "badge"

type AvatarImageSources = Record<AvatarSlot | "base" | "eyes", string[]>

type SlotOption = {
  value: string
  label: string
  itemKey?: string
}

const defaultAvatar: AvatarConfig = {
  base: "bo",
  skinTone: "light",
  eyeColor: "blue",
  glasses: "none",
  background: "plain",
  hat: "none",
  badge: "none",
}

const hiddenAvatarItemKeys = new Set<string>([
  "hat_headphones",
  "hat_star_headband",
])

const avatarLayerFolders: Record<AvatarSlot, string> = {
  glasses: "glasses",
  background: "backgrounds",
  hat: "hats",
  badge: "badges",
}

const homeSlotOptions: Record<AvatarSlot, SlotOption[]> = {
  glasses: [
    { value: "none", label: "No glasses" },
    { value: "round", label: "Round Smart Glasses", itemKey: "smart_glasses_round" },
    { value: "square", label: "Square Smart Glasses", itemKey: "smart_glasses_square" },
    { value: "blue", label: "Blue Frame Glasses", itemKey: "glasses_blue_frames" },
    { value: "green", label: "Green Frame Glasses", itemKey: "glasses_green_frames" },
    { value: "star", label: "Star Frame Glasses", itemKey: "glasses_star_frames" },
    { value: "silver", label: "Silver Reading Glasses", itemKey: "glasses_reading_silver" },
    { value: "sport", label: "Sport Goggles", itemKey: "glasses_sport_goggles" },
    { value: "rainbow", label: "Rainbow Frame Glasses", itemKey: "glasses_rainbow_frames" },
  ],
  background: [
    { value: "plain", label: "Plain" },
    { value: "classroom", label: "Classroom", itemKey: "background_classroom" },
    { value: "library", label: "Library", itemKey: "background_library" },
    { value: "science_lab", label: "Science Lab", itemKey: "background_science_lab" },
    { value: "reading_corner", label: "Reading Corner", itemKey: "background_reading_corner" },
    { value: "yanbo_stage", label: "YanBo Stage", itemKey: "background_yanbo_stage" },
  ],
  hat: [
    { value: "none", label: "No hat" },
    { value: "yanbo_cap", label: "YanBo Cap", itemKey: "hat_yanbo_cap" },
    { value: "graduation", label: "Graduation Cap", itemKey: "hat_graduation_cap" },
    { value: "wizard", label: "Wizard Hat", itemKey: "hat_wizard_hat" },
    { value: "crown", label: "Champion Crown", itemKey: "hat_crown" },
    { value: "explorer", label: "Explorer Hat", itemKey: "hat_explorer_hat" },
    { value: "blue_beanie", label: "Blue Beanie", itemKey: "hat_blue_beanie" },
  ],
  badge: [
    { value: "none", label: "No badge" },
    { value: "english", label: "English Star Badge", itemKey: "badge_english_star" },
    { value: "maths", label: "Maths Star Badge", itemKey: "badge_maths_star" },
    { value: "vr", label: "VR Master Badge", itemKey: "badge_vr_master" },
    { value: "nvr", label: "NVR Master Badge", itemKey: "badge_nvr_master" },
  ],
}

const dailyFunFacts = [
  "Mistakes help your brain grow stronger.",
  "A short practice every day beats one long practice once a week.",
  "Reading the question twice can save lots of marks.",
  "Your brain remembers more when you explain your answer.",
  "Checking your work is a superpower.",
  "Every tricky question is a chance to learn a new strategy.",
  "Practice builds confidence one question at a time.",
  "Taking a calm breath can help your brain think clearly.",
  "Reviewing mistakes turns them into future marks.",
  "Small steps every day can lead to big 11+ progress.",
  "Patterns become easier when you slow down and look carefully.",
  "A neat method helps you spot mistakes faster.",
  "Learning from one wrong answer can help with many future questions.",
  "Confidence grows when you keep trying.",
]

const cardHover = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

function normaliseEyeColor(value: unknown): AvatarConfig["eyeColor"] {
  if (value === "brown" || value === "blue" || value === "black") {
    return value
  }

  return defaultAvatar.eyeColor
}

function getSlotOption(slot: AvatarSlot, value: string) {
  return homeSlotOptions[slot].find((option) => option.value === value)
}

function normaliseSlotValue(slot: AvatarSlot, value: unknown) {
  if (typeof value !== "string") {
    return defaultAvatar[slot]
  }

  const option = getSlotOption(slot, value)

  if (!option) {
    return defaultAvatar[slot]
  }

  if (option.itemKey && hiddenAvatarItemKeys.has(option.itemKey)) {
    return defaultAvatar[slot]
  }

  return value
}

function normaliseAvatarConfig(savedConfig: Record<string, unknown> | null): AvatarConfig {
  if (!savedConfig) return defaultAvatar

  const savedBase = savedConfig.base
  let base: AvatarConfig["base"] = "bo"

  if (savedBase === "yan" || savedBase === "girl") {
    base = "yan"
  }

  if (savedBase === "bo" || savedBase === "boy") {
    base = "bo"
  }

  return {
    base,
    skinTone:
      savedConfig.skinTone === "medium" || savedConfig.skinTone === "dark"
        ? savedConfig.skinTone
        : defaultAvatar.skinTone,
    eyeColor: normaliseEyeColor(savedConfig.eyeColor),
    glasses: normaliseSlotValue("glasses", savedConfig.glasses),
    background: normaliseSlotValue("background", savedConfig.background),
    hat: normaliseSlotValue("hat", savedConfig.hat),
    badge: normaliseSlotValue("badge", savedConfig.badge),
  }
}

function normaliseAvatarName(value: unknown) {
  if (typeof value !== "string") return ""

  return value.replace(/\s+/g, " ").trim().slice(0, 20)
}

function itemKeyToAssetFileName(itemKey: string) {
  return itemKey.replace(/_/g, "-")
}

function uniqueImageSources(sources: Array<string | null | undefined>) {
  return sources.filter((source, index, allSources): source is string => {
    return Boolean(source) && allSources.indexOf(source) === index
  })
}

function getSlotItemKey(slot: AvatarSlot, value: string) {
  return getSlotOption(slot, value)?.itemKey
}

function getBaseAvatarImageSources(
  base: AvatarConfig["base"],
  skinTone: AvatarConfig["skinTone"],
) {
  const skinToneSuffix = skinTone === "light" ? "" : `-${skinTone}`

  return uniqueImageSources([
    `/avatars/builder/base/${base}-base${skinToneSuffix}.png`,
    `/avatars/builder/base/${base}-base.png`,
    `/characters/${base}-main.png`,
  ])
}

function getEyeOverlayImageSources(
  base: AvatarConfig["base"],
  eyeColor: AvatarConfig["eyeColor"],
) {
  return uniqueImageSources([
    `/avatars/builder/eyes/${base}/eyes-${eyeColor}.png`,
    `/avatars/builder/eyes/eyes-${eyeColor}.png`,
  ])
}

function getHomeLayerImageSources(
  slot: AvatarSlot,
  value: string,
  base: AvatarConfig["base"],
) {
  const itemKey = getSlotItemKey(slot, value)
  if (!itemKey) return []

  const folder = avatarLayerFolders[slot]
  const fileName = itemKeyToAssetFileName(itemKey)

  if (slot === "background" || slot === "badge") {
    return uniqueImageSources([
      `/avatars/builder/${folder}/${fileName}.png`,
      `/avatars/items/${fileName}.png`,
    ])
  }

  return uniqueImageSources([
    `/avatars/builder/${folder}/${base}/${fileName}.png`,
    `/avatars/builder/${folder}/${fileName}.png`,
    `/avatars/items/${fileName}.png`,
  ])
}

function getHomeAvatarImageSources(config: AvatarConfig): AvatarImageSources {
  return {
    base: getBaseAvatarImageSources(config.base, config.skinTone),
    eyes: getEyeOverlayImageSources(config.base, config.eyeColor),
    glasses: getHomeLayerImageSources("glasses", config.glasses, config.base),
    hat: getHomeLayerImageSources("hat", config.hat, config.base),
    badge: getHomeLayerImageSources("badge", config.badge, config.base),
    background: getHomeLayerImageSources(
      "background",
      config.background,
      config.base,
    ),
  }
}

function builderOnlySources(sources: string[]) {
  return sources.filter((source) => source.startsWith("/avatars/builder/"))
}

function profileBackgroundOverlay(background: string) {
  switch (background) {
    case "classroom":
      return "linear-gradient(180deg, rgba(255, 251, 235, 0.65), rgba(239, 246, 255, 0.45))"
    case "library":
      return "linear-gradient(180deg, rgba(224, 242, 254, 0.58), rgba(255, 255, 255, 0.35))"
    case "science_lab":
      return "linear-gradient(180deg, rgba(237, 233, 254, 0.55), rgba(207, 250, 254, 0.38))"
    case "reading_corner":
      return "linear-gradient(180deg, rgba(255, 237, 213, 0.6), rgba(255, 255, 255, 0.35))"
    case "yanbo_stage":
      return "linear-gradient(180deg, rgba(254, 240, 138, 0.55), rgba(219, 234, 254, 0.35))"
    default:
      return "linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(239, 246, 255, 0.5))"
  }
}

function getDailyFunFact() {
  const today = new Date()
  const startOfYear = new Date(today.getFullYear(), 0, 0)
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / 86400000,
  )

  return dailyFunFacts[dayOfYear % dailyFunFacts.length]
}

export default function HomePage() {
  const router = useRouter()
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar)
  const [avatarName, setAvatarName] = useState("")
  const [avatarLoading, setAvatarLoading] = useState(true)

  useEffect(() => {
    loadHomeAvatar()
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

  const avatarImages = useMemo(
    () => getHomeAvatarImageSources(avatarConfig),
    [avatarConfig],
  )

  const dailyFunFact = useMemo(() => getDailyFunFact(), [])

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
      title: "Custom Tests",
      badge: "Premium Practice",
      icon: <CustomTestsIcon size={42} />,
      text: "Create focused tests by subject, topic, difficulty and time limit to match your child’s current goals.",
      button: "Build test",
      path: "/custom-tests",
    },
    {
      title: "Track Progress",
      badge: "Premium Insights",
      icon: <ProgressIcon size={42} />,
      text: "Monitor recent scores, success rates and improvement trends so practice stays targeted.",
      button: "View progress",
      path: "/progress",
    },
    {
      title: "Review Mistakes",
      badge: "Premium Review",
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

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroGrid}>
          <div style={styles.heroAvatarWrap}>
            <HomeAvatarPreview
              config={avatarConfig}
              imageSources={avatarImages}
            />
          </div>

          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>Member dashboard</div>

            <h1 style={styles.title}>
              {avatarName ? `Welcome back, ${avatarName}!` : "Welcome back!"}
            </h1>

            <p style={styles.subtitle}>
              {avatarName
                ? "Ready for today’s learning adventure?"
                : "Name your avatar and make your learning adventure more fun."}
            </p>

            <div style={styles.funFactCard}>
              <span style={styles.funFactIcon}>💡</span>
              <div>
                <p style={styles.funFactLabel}>YanBo fun fact</p>
                <p style={styles.funFactText}>{dailyFunFact}</p>
              </div>
            </div>

            <div style={styles.heroActions}>
              <button
                style={styles.primaryButton}
                onClick={() => router.push("/custom-tests")}
              >
                Build a custom test
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => router.push("/progress")}
              >
                View progress
              </button>

              {!avatarLoading && !avatarName && (
                <Link href="/avatar" style={styles.nameAvatarButton}>
                  Name my avatar
                </Link>
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
              <div style={styles.icon}>{card.icon}</div>

              <h2 style={styles.cardTitle}>{card.title}</h2>

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
              <div style={styles.toolTopRow}>
                <span style={styles.toolBadge}>{tool.badge}</span>
                <span style={styles.toolIcon}>{tool.icon}</span>
              </div>

              <h3 style={styles.toolTitle}>{tool.title}</h3>

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

      {/* STUDY TIP */}
      <section style={styles.tipSection}>
        <div style={styles.tipCard}>
          <div style={styles.tipIcon}>💡</div>

          <div>
            <h2 style={styles.tipTitle}>Today’s study idea</h2>
            <p style={styles.tipText}>
              Try one short practice session, then spend a few minutes reviewing
              mistakes. Small regular sessions are better than rushing through
              lots of questions at once.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function HomeAvatarPreview({
  config,
  imageSources,
}: {
  config: AvatarConfig
  imageSources: AvatarImageSources
}) {
  const builderEyeSources = builderOnlySources(imageSources.eyes)
  const builderGlassesSources = builderOnlySources(imageSources.glasses)
  const builderHatSources = builderOnlySources(imageSources.hat)
  const builderBadgeSources = builderOnlySources(imageSources.badge)

  return (
    <div style={styles.homeAvatarStage}>
      {imageSources.background.length > 0 && (
        <LayerImage
          srcs={imageSources.background}
          alt=""
          style={styles.homeAvatarBackgroundImage}
          fallback={null}
        />
      )}

      <div
        style={{
          ...styles.homeAvatarStageOverlay,
          background: profileBackgroundOverlay(config.background),
        }}
      />

      <div style={styles.homeAvatarGroundShadow} />

      <div style={styles.homeAvatarScaledBody}>
        <div style={styles.homeAvatarInner}>
          <LayerImage
            srcs={imageSources.base}
            alt={`${config.base === "yan" ? "Yan" : "Bo"} avatar`}
            style={styles.homeAvatarBaseImage}
            fallback={<HomeCssFallbackAvatar base={config.base} />}
          />

          <LayerImage
            srcs={builderEyeSources}
            alt={`${config.eyeColor} eyes`}
            style={styles.homeAvatarEyeLayer}
            fallback={null}
          />

          {config.hat !== "none" && (
            <div style={styles.homeAvatarHatLayer}>
              <LayerImage
                srcs={builderHatSources}
                alt="Avatar hat"
                style={styles.homeAvatarHatImage}
                fallback={<span style={styles.homeAvatarHatFallback}>🎩</span>}
              />
            </div>
          )}

          {config.glasses !== "none" && (
            <div style={styles.homeAvatarGlassesLayer}>
              <LayerImage
                srcs={builderGlassesSources}
                alt="Avatar glasses"
                style={styles.homeAvatarGlassesImage}
                fallback={<span style={styles.homeAvatarGlassesFallback}>👓</span>}
              />
            </div>
          )}

          {config.badge !== "none" && (
            <div style={styles.homeAvatarBadgeLayer}>
              <LayerImage
                srcs={builderBadgeSources}
                alt="Avatar badge"
                style={styles.homeAvatarBadgeImage}
                fallback={<span style={styles.homeAvatarBadgeFallback}>★</span>}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LayerImage({
  srcs,
  alt,
  style,
  fallback,
}: {
  srcs: string[]
  alt: string
  style: React.CSSProperties
  fallback: React.ReactNode
}) {
  const sourceKey = srcs.join("|")
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    setImageIndex(0)
  }, [sourceKey])

  const currentSource = srcs[imageIndex]

  if (!currentSource) {
    return <>{fallback}</>
  }

  return (
    <img
      src={currentSource}
      alt={alt}
      style={style}
      onError={() => setImageIndex((current) => current + 1)}
    />
  )
}

function HomeCssFallbackAvatar({ base }: { base: AvatarConfig["base"] }) {
  return (
    <div style={styles.homeAvatarFallbackWrap}>
      <div style={styles.homeAvatarFallbackHead}>
        {base === "yan" ? "😊" : "🙂"}
      </div>

      <div style={styles.homeAvatarFallbackJumper}>
        <span style={styles.yanboY}>Y</span>an
        <span style={styles.yanboB}>B</span>o
      </div>
    </div>
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
    justifyContent: "center",
  },

  heroContent: {
    minWidth: 0,
  },

  heroBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "16px",
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

  funFactCard: {
    marginTop: "18px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    maxWidth: "620px",
    borderRadius: "20px",
    background: "#ffffff",
    border: "1px solid #bbf7d0",
    padding: "14px 16px",
    boxShadow: "0 10px 24px rgba(22,163,74,0.10)",
  },

  funFactIcon: {
    fontSize: "26px",
    lineHeight: 1,
  },

  funFactLabel: {
    margin: "0 0 3px",
    color: "#16a34a",
    fontSize: "0.82rem",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  funFactText: {
    margin: 0,
    color: "#374151",
    fontSize: "1rem",
    fontWeight: 700,
    lineHeight: 1.45,
  },

  heroActions: {
    display: "flex",
    justifyContent: "flex-start",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "22px",
  },

  primaryButton: {
    padding: "13px 22px",
    borderRadius: "999px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "16px",
    boxShadow: "0 10px 24px rgba(22,163,74,0.25)",
  },

  secondaryButton: {
    padding: "13px 22px",
    borderRadius: "999px",
    border: "1px solid #bbf7d0",
    background: "white",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: "16px",
  },

  nameAvatarButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 22px",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: "16px",
    boxShadow: "0 10px 24px rgba(22,163,74,0.25)",
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
    alignItems: "center",
    border: "1px solid #e5e7eb",
  },

  icon: {
    width: "70px",
    height: "70px",
    borderRadius: "22px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  cardTitle: {
    fontSize: "24px",
    marginBottom: "10px",
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

  toolTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },

  toolBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
  },

  toolIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  toolTitle: {
    fontSize: "24px",
    margin: "0 0 10px",
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

  tipSection: {
    marginBottom: "20px",
  },

  tipCard: {
    background: "#064e3b",
    color: "white",
    borderRadius: "26px",
    padding: "28px",
    boxShadow: "0 14px 34px rgba(6,78,59,0.22)",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },

  tipIcon: {
    fontSize: "38px",
    lineHeight: 1,
  },

  tipTitle: {
    margin: "0 0 8px",
    fontSize: "26px",
    fontWeight: 800,
  },

  tipText: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "16px",
    lineHeight: 1.7,
  },
}
