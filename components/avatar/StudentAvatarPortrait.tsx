"use client"

import React, { useEffect, useId, useMemo, useState } from "react"

export type AvatarConfig = {
  base: "yan" | "bo"
  skinTone: "light" | "medium" | "dark"
  eyeColor: "brown" | "blue" | "black"
  glasses: string
  background: string
  hat: string
  badge: string
}

type AvatarSlot = "glasses" | "background" | "hat" | "badge"

type SlotOption = {
  value: string
  label: string
  itemKey?: string
}

type AvatarImageSources = Record<AvatarSlot | "base" | "eyes", string[]>

type StudentAvatarPortraitProps = {
  config?: AvatarConfig
  name?: string
  showNameArc?: boolean
  size?: number
  borderWidth?: number
  ariaLabel?: string
  style?: React.CSSProperties
}

export const defaultAvatar: AvatarConfig = {
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

const slotOptions: Record<AvatarSlot, SlotOption[]> = {
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

function normaliseEyeColor(value: unknown): AvatarConfig["eyeColor"] {
  if (value === "brown" || value === "blue" || value === "black") {
    return value
  }

  return defaultAvatar.eyeColor
}

function getSlotOption(slot: AvatarSlot, value: string) {
  return slotOptions[slot].find((option) => option.value === value)
}

function getSlotItemKey(slot: AvatarSlot, value: string) {
  return getSlotOption(slot, value)?.itemKey
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

export function normaliseAvatarConfig(
  savedConfig: Partial<AvatarConfig> | Record<string, unknown> | null,
): AvatarConfig {
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

export function normaliseAvatarName(value: unknown) {
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

function getAvatarLayerImageSources(
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

function getAvatarImageSources(config: AvatarConfig): AvatarImageSources {
  return {
    base: getBaseAvatarImageSources(config.base, config.skinTone),
    eyes: getEyeOverlayImageSources(config.base, config.eyeColor),
    glasses: getAvatarLayerImageSources("glasses", config.glasses, config.base),
    hat: getAvatarLayerImageSources("hat", config.hat, config.base),
    badge: getAvatarLayerImageSources("badge", config.badge, config.base),
    background: getAvatarLayerImageSources(
      "background",
      config.background,
      config.base,
    ),
  }
}

function builderOnlySources(sources: string[]) {
  return sources.filter((source) => source.startsWith("/avatars/builder/"))
}

function portraitBackgroundOverlay(background: string) {
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

function hatDisplay(hat: string) {
  switch (hat) {
    case "yanbo_cap":
      return "🧢"
    case "graduation":
      return "🎓"
    case "wizard":
      return "🧙‍♂️"
    case "crown":
      return "👑"
    case "explorer":
      return "🤠"
    case "blue_beanie":
      return "💙"
    default:
      return ""
  }
}

function glassesDisplay(glasses: string) {
  switch (glasses) {
    case "round":
      return "👓"
    case "square":
      return "▭▭"
    case "blue":
      return "🔵👓"
    case "green":
      return "🟢👓"
    case "star":
      return "⭐👓"
    case "silver":
      return "⚪👓"
    case "sport":
      return "🥽"
    case "rainbow":
      return "🌈👓"
    default:
      return ""
  }
}

function badgeDisplay(badge: string) {
  switch (badge) {
    case "english":
      return "E★"
    case "maths":
      return "M★"
    case "vr":
      return "VR"
    case "nvr":
      return "NVR"
    default:
      return ""
  }
}

export default function StudentAvatarPortrait({
  config = defaultAvatar,
  name,
  showNameArc = false,
  size = 214,
  borderWidth = 6,
  ariaLabel,
  style,
}: StudentAvatarPortraitProps) {
  const safeConfig = useMemo(() => normaliseAvatarConfig(config), [config])
  const imageSources = useMemo(
    () => getAvatarImageSources(safeConfig),
    [safeConfig],
  )
  const rawArcId = useId()
  const arcId = `studentAvatarNameArc${rawArcId.replace(/[^A-Za-z0-9_-]/g, "")}`

  const builderEyeSources = builderOnlySources(imageSources.eyes)
  const builderGlassesSources = builderOnlySources(imageSources.glasses)
  const builderHatSources = builderOnlySources(imageSources.hat)
  const builderBadgeSources = builderOnlySources(imageSources.badge)
  const safeName = normaliseAvatarName(name)
  const label =
    ariaLabel || `${safeName || (safeConfig.base === "yan" ? "Yan" : "Bo")} avatar`

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        ...styles.stage,
        width: size,
        height: size,
        minWidth: size,
        border: `${borderWidth}px solid #ffffff`,
        ...style,
      }}
    >
      {imageSources.background.length > 0 && (
        <LayerImage
          srcs={imageSources.background}
          alt=""
          style={styles.backgroundImage}
          fallback={null}
        />
      )}

      <div
        style={{
          ...styles.stageOverlay,
          background: portraitBackgroundOverlay(safeConfig.background),
        }}
      />

      <div style={styles.groundShadow} />

      <div style={styles.scaledBody}>
        <div style={styles.inner}>
          <LayerImage
            srcs={imageSources.base}
            alt=""
            style={styles.baseImage}
            fallback={
              <CssFallbackAvatar
                base={safeConfig.base}
                skinTone={safeConfig.skinTone}
              />
            }
          />

          <LayerImage
            srcs={builderEyeSources}
            alt=""
            style={styles.eyeLayer}
            fallback={null}
          />

          {safeConfig.hat !== "none" && (
            <div style={styles.hatLayer}>
              <LayerImage
                srcs={builderHatSources}
                alt=""
                style={styles.hatImage}
                fallback={
                  <span style={styles.hatFallback}>
                    {hatDisplay(safeConfig.hat)}
                  </span>
                }
              />
            </div>
          )}

          {safeConfig.glasses !== "none" && (
            <div style={styles.glassesLayer}>
              <LayerImage
                srcs={builderGlassesSources}
                alt=""
                style={styles.glassesImage}
                fallback={
                  <span style={styles.glassesFallback}>
                    {glassesDisplay(safeConfig.glasses)}
                  </span>
                }
              />
            </div>
          )}

          {safeConfig.badge !== "none" && (
            <div style={styles.badgeLayer}>
              <LayerImage
                srcs={builderBadgeSources}
                alt=""
                style={styles.badgeImage}
                fallback={
                  <span style={styles.badgeFallback}>
                    {badgeDisplay(safeConfig.badge)}
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>

      {showNameArc && safeName && (
        <svg
          viewBox="0 0 222 222"
          aria-hidden="true"
          style={styles.nameArcSvg}
        >
          <defs>
            <path id={arcId} d="M 28 184 Q 111 248 194 184" />
          </defs>

          <text style={styles.nameArcText}>
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              {safeName}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  )
}

export { StudentAvatarPortrait }

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

function CssFallbackAvatar({
  base,
  skinTone,
}: {
  base: AvatarConfig["base"]
  skinTone: AvatarConfig["skinTone"]
}) {
  const skinBackground =
    skinTone === "dark"
      ? "#8b5a3c"
      : skinTone === "medium"
        ? "#d6a06f"
        : "#f1c9a5"

  return (
    <div style={styles.fallbackWrap}>
      <div
        style={{
          ...styles.fallbackHead,
          background: skinBackground,
        }}
      >
        {base === "yan" ? "😊" : "🙂"}
      </div>

      <div style={styles.fallbackJumper}>
        <span style={styles.yanboY}>Y</span>an
        <span style={styles.yanboB}>B</span>o
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  stage: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "9999px",
    background: "linear-gradient(180deg, #ffffff, #eff6ff)",
    outline: "4px solid #d1fae5",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.14)",
  },

  backgroundImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  stageOverlay: {
    position: "absolute",
    inset: 0,
  },

  groundShadow: {
    position: "absolute",
    left: 46,
    right: 46,
    bottom: 18,
    height: 22,
    borderRadius: "50%",
    background: "rgba(15, 23, 42, 0.12)",
    filter: "blur(7px)",
  },

  scaledBody: {
    position: "absolute",
    left: "50%",
    top: -20,
    width: 330,
    height: 520,
    transform: "translateX(-50%) scale(1.06)",
    transformOrigin: "top center",
  },

  inner: {
    position: "relative",
    width: 330,
    height: 520,
  },

  baseImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 18px 18px rgba(15, 23, 42, 0.26))",
    zIndex: 20,
  },

  eyeLayer: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    zIndex: 40,
  },

  hatLayer: {
    position: "absolute",
    left: "50%",
    top: 12,
    zIndex: 50,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  hatImage: {
    width: 128,
    height: 96,
    objectFit: "contain",
    filter: "drop-shadow(0 8px 7px rgba(15, 23, 42, 0.24))",
  },

  hatFallback: {
    fontSize: "4.5rem",
    filter: "drop-shadow(0 8px 7px rgba(15, 23, 42, 0.24))",
  },

  glassesLayer: {
    position: "absolute",
    left: "50%",
    top: 70,
    zIndex: 50,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  glassesImage: {
    width: 112,
    height: 56,
    objectFit: "contain",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.18))",
  },

  glassesFallback: {
    fontSize: "3rem",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.18))",
  },

  badgeLayer: {
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

  badgeImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.2))",
  },

  badgeFallback: {
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 900,
    textShadow: "0 2px 4px rgba(15, 23, 42, 0.3)",
  },

  nameArcSvg: {
    position: "absolute",
    inset: 0,
    zIndex: 80,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },

  nameArcText: {
    fill: "#064e3b",
    fontSize: "13px",
    fontWeight: 950,
    letterSpacing: "0.04em",
    paintOrder: "stroke",
    stroke: "#ffffff",
    strokeWidth: 4,
    strokeLinejoin: "round",
  },

  fallbackWrap: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  fallbackHead: {
    width: 132,
    height: 132,
    borderRadius: "50%",
    border: "8px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4rem",
    boxShadow: "0 16px 24px rgba(15, 23, 42, 0.18)",
  },

  fallbackJumper: {
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
}
