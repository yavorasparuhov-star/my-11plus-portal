import type {
  AvatarBase,
  AvatarConfig,
  AvatarSlot,
  ShopItem,
  WardrobeResetOption,
} from "./avatarTypes"
import {
  AVATAR_NAME_MAX_LENGTH,
  avatarBaseOptions,
  defaultAvatar,
  freeStarterItemKeys,
  shopCategoryOrder,
  slotOptions,
} from "./avatarOptions"

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function normaliseAvatarName(value: unknown) {
  if (typeof value !== "string") return ""

  return value.replace(/\s+/g, " ").trim().slice(0, AVATAR_NAME_MAX_LENGTH)
}

export function isAvatarNameValid(value: string) {
  if (!value) return true

  if (value.length < 2 || value.length > AVATAR_NAME_MAX_LENGTH) {
    return false
  }

  if (/@|https?:\/\//i.test(value) || /www\./i.test(value)) {
    return false
  }

  return /^[A-Za-z0-9][A-Za-z0-9 '\-]{0,18}[A-Za-z0-9]$/.test(value)
}

export function isSupportedShopCategory(category: string): category is AvatarSlot {
  return shopCategoryOrder.includes(category as AvatarSlot)
}

function normaliseEyeColor(value: unknown): AvatarConfig["eyeColor"] {
  if (value === "brown" || value === "blue" || value === "black") {
    return value
  }

  return defaultAvatar.eyeColor
}

function normaliseAvatarBase(value: unknown): AvatarBase {
  if (value === "yan" || value === "girl") return "yan"
  if (value === "bo" || value === "boy") return "bo"
  if (value === "ken") return "ken"
  if (value === "kiko") return "kiko"

  return defaultAvatar.base
}

export function getAvatarBaseLabel(base: AvatarBase) {
  return avatarBaseOptions.find((option) => option.value === base)?.label || "Bo"
}

export function getAvatarBaseEmoji(base: AvatarBase) {
  return avatarBaseOptions.find((option) => option.value === base)?.emoji || "🙂"
}

export function normaliseAvatarConfig(savedConfig: Record<string, unknown> | null) {
  if (!savedConfig) return defaultAvatar

  return {
    base: normaliseAvatarBase(savedConfig.base),
    skinTone:
      savedConfig.skinTone === "medium" || savedConfig.skinTone === "dark"
        ? savedConfig.skinTone
        : defaultAvatar.skinTone,
    eyeColor: normaliseEyeColor(savedConfig.eyeColor),
    glasses:
      typeof savedConfig.glasses === "string"
        ? savedConfig.glasses
        : defaultAvatar.glasses,
    background:
      typeof savedConfig.background === "string"
        ? savedConfig.background
        : defaultAvatar.background,
    hat: typeof savedConfig.hat === "string" ? savedConfig.hat : defaultAvatar.hat,
    badge:
      typeof savedConfig.badge === "string" ? savedConfig.badge : defaultAvatar.badge,
  }
}

export function getSlotOption(slot: AvatarSlot, value: string) {
  return slotOptions[slot].find((option) => option.value === value)
}

export function getSlotItemKey(slot: AvatarSlot, value: string) {
  return getSlotOption(slot, value)?.itemKey
}

export function isItemKeyUnlocked(
  itemKey: string | undefined,
  unlockedItemKeys: string[],
) {
  if (!itemKey) return true
  return freeStarterItemKeys.has(itemKey) || unlockedItemKeys.includes(itemKey)
}

export function isSlotValueUnlocked(
  slot: AvatarSlot,
  value: string,
  unlockedItemKeys: string[],
) {
  const option = getSlotOption(slot, value)

  if (!option) return false

  return isItemKeyUnlocked(option.itemKey, unlockedItemKeys)
}

export function makeAvatarConfigSafe(
  config: AvatarConfig,
  unlockedItemKeys: string[],
): AvatarConfig {
  const safeConfig = { ...defaultAvatar, ...config }

  ;(["glasses", "background", "hat", "badge"] as AvatarSlot[]).forEach((slot) => {
    if (!isSlotValueUnlocked(slot, safeConfig[slot], unlockedItemKeys)) {
      safeConfig[slot] = defaultAvatar[slot]
    }
  })

  return safeConfig
}

export function getShopIcon(category: string) {
  if (category === "glasses") return "👓"
  if (category === "background") return "🖼️"
  if (category === "badge") return "🏅"
  if (category === "hat") return "🧢"
  return "⭐"
}

export function getShopItemEmoji(itemKey: string, category: string) {
  if (itemKey.includes("yellow")) return "💛"
  if (itemKey.includes("pink")) return "🌸"
  if (itemKey.includes("blue")) return "💙"
  if (itemKey.includes("green")) return "💚"
  if (itemKey.includes("maths")) return "🧮"
  if (itemKey.includes("english")) return "📚"
  if (itemKey.includes("vr")) return "🧩"
  if (itemKey.includes("nvr")) return "🔷"
  if (itemKey.includes("space")) return "🚀"
  if (itemKey.includes("library")) return "📖"
  if (itemKey.includes("gold") || itemKey.includes("crown")) return "👑"
  if (itemKey.includes("star")) return "⭐"
  if (itemKey.includes("classroom")) return "🏫"
  if (itemKey.includes("forest")) return "🌳"
  if (itemKey.includes("beach")) return "🏖️"
  if (itemKey.includes("football")) return "⚽"
  if (itemKey.includes("science")) return "🔬"
  if (itemKey.includes("art")) return "🎨"
  if (itemKey.includes("castle")) return "🏰"
  if (itemKey.includes("stage")) return "🌟"
  if (itemKey.includes("wizard")) return "🪄"
  if (itemKey.includes("graduation")) return "🎓"
  if (itemKey.includes("explorer")) return "🧭"
  if (itemKey.includes("headphones")) return "🎧"
  if (itemKey.includes("beanie")) return "🧢"
  if (itemKey.includes("book")) return "📘"
  if (itemKey.includes("pencil")) return "✏️"
  if (itemKey.includes("calculator")) return "🧮"
  if (itemKey.includes("trophy")) return "🏆"
  if (itemKey.includes("backpack")) return "🎒"
  if (itemKey.includes("magnifier")) return "🔎"
  if (itemKey.includes("rainbow")) return "🌈"
  if (itemKey.includes("silver")) return "⚪"
  if (itemKey.includes("sport")) return "🥽"

  return getShopIcon(category)
}

export function formatCategoryName(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function backgroundStyle(background: string) {
  switch (background) {
    case "classroom":
      return "bg-amber-50 ring-amber-100"
    case "library":
      return "bg-sky-50 ring-sky-100"
    case "space":
      return "bg-indigo-50 ring-indigo-100"
    case "forest":
      return "bg-emerald-50 ring-emerald-100"
    case "beach":
      return "bg-cyan-50 ring-cyan-100"
    case "football":
      return "bg-green-50 ring-green-100"
    case "science_lab":
      return "bg-violet-50 ring-violet-100"
    case "art_room":
      return "bg-pink-50 ring-pink-100"
    case "puzzle_wall":
      return "bg-blue-50 ring-blue-100"
    case "reading_corner":
      return "bg-orange-50 ring-orange-100"
    case "castle":
      return "bg-purple-50 ring-purple-100"
    case "yanbo_stage":
      return "bg-yellow-50 ring-yellow-100"
    default:
      return "bg-white ring-blue-100"
  }
}

export function backgroundEmoji(background: string) {
  switch (background) {
    case "classroom":
      return "📚"
    case "library":
      return "🏛️"
    case "space":
      return "🚀"
    case "forest":
      return "🌳"
    case "beach":
      return "🏖️"
    case "football":
      return "⚽"
    case "science_lab":
      return "🔬"
    case "art_room":
      return "🎨"
    case "puzzle_wall":
      return "🧩"
    case "reading_corner":
      return "📖"
    case "castle":
      return "🏰"
    case "yanbo_stage":
      return "🌟"
    default:
      return "✨"
  }
}

export function glassesDisplay(glasses: string) {
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

export function hatDisplay(hat: string) {
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
    case "headphones":
      return "🎧"
    case "star_headband":
      return "⭐"
    case "blue_beanie":
      return "💙"
    default:
      return ""
  }
}

export function badgeDisplay(badge: string) {
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

export function skinToneClass(skinTone: string) {
  if (skinTone === "medium") return "bg-orange-200"
  if (skinTone === "dark") return "bg-orange-300"
  return "bg-orange-100"
}

export function eyeColourClass(eyeColor: string) {
  if (eyeColor === "black") return "bg-slate-950"
  if (eyeColor === "blue") return "bg-sky-500"
  return "bg-amber-700"
}

export function formatSkinToneLabel(skinTone: AvatarConfig["skinTone"]) {
  if (skinTone === "medium") return "Medium"
  if (skinTone === "dark") return "Dark"
  return "Light"
}

export function formatEyeColourLabel(eyeColor: AvatarConfig["eyeColor"]) {
  if (eyeColor === "black") return "Black"
  if (eyeColor === "brown") return "Brown"
  return "Blue"
}

export function getSlotLabel(slot: AvatarSlot, value: string) {
  return (
    slotOptions[slot]
      .find((option) => option.value === value)
      ?.label.replace(" — free", "") || value
  )
}

export function getSlotMatchFromItemKey(itemKey: string) {
  const slots: AvatarSlot[] = ["glasses", "hat", "background", "badge"]

  for (const slot of slots) {
    const option = slotOptions[slot].find(
      (currentOption) => currentOption.itemKey === itemKey,
    )

    if (option) {
      return {
        slot,
        value: option.value,
      }
    }
  }

  return null
}

const avatarLayerFolders: Record<AvatarSlot, string> = {
  glasses: "glasses",
  background: "backgrounds",
  hat: "hats",
  badge: "badges",
}

function itemKeyToAssetFileName(itemKey: string) {
  return itemKey.replace(/_/g, "-")
}

function uniqueImageSources(sources: Array<string | null | undefined>) {
  return sources.filter((source, index, allSources): source is string => {
    return Boolean(source) && allSources.indexOf(source) === index
  })
}

export function getShopItemImageSources(
  item: ShopItem,
  base: AvatarConfig["base"] = "bo",
) {
  const fileName = itemKeyToAssetFileName(item.item_key)
  const localImageFromItemKey = `/avatars/items/${fileName}.png`
  const slotMatch = getSlotMatchFromItemKey(item.item_key)

  if (slotMatch) {
    const folder = avatarLayerFolders[slotMatch.slot]

    if (slotMatch.slot === "hat" || slotMatch.slot === "glasses") {
      return uniqueImageSources([
        `/avatars/builder/${folder}/${base}/${fileName}.png`,
        `/avatars/builder/${folder}/${fileName}.png`,
        item.image_url,
        localImageFromItemKey,
      ])
    }

    return uniqueImageSources([
      `/avatars/builder/${folder}/${fileName}.png`,
      item.image_url,
      localImageFromItemKey,
    ])
  }

  return uniqueImageSources([item.image_url, localImageFromItemKey])
}

export function getBaseAvatarImageSources(
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

export function getEyeOverlayImageSources(
  base: AvatarConfig["base"],
  eyeColor: AvatarConfig["eyeColor"],
) {
  return uniqueImageSources([
    `/avatars/builder/eyes/${base}/eyes-${eyeColor}.png`,
    `/avatars/builder/eyes/eyes-${eyeColor}.png`,
  ])
}

export function getPreviewLayerImageSources(
  shopItems: ShopItem[],
  slot: AvatarSlot,
  value: string,
  base: AvatarConfig["base"],
) {
  const itemKey = getSlotItemKey(slot, value)
  if (!itemKey) return []

  const item = shopItems.find((currentItem) => currentItem.item_key === itemKey)
  const folder = avatarLayerFolders[slot]
  const fileName = itemKeyToAssetFileName(itemKey)

  if (slot === "background") {
    return uniqueImageSources([
      `/avatars/builder/${folder}/${fileName}.png`,
      item?.image_url,
      `/avatars/items/${fileName}.png`,
    ])
  }

  if (slot === "badge") {
    return uniqueImageSources([
      `/avatars/builder/${folder}/${fileName}.png`,
      item?.image_url,
      `/avatars/items/${fileName}.png`,
    ])
  }

  return uniqueImageSources([
    `/avatars/builder/${folder}/${base}/${fileName}.png`,
    `/avatars/builder/${folder}/${fileName}.png`,
    item?.image_url,
    `/avatars/items/${fileName}.png`,
  ])
}

export function builderOnlySources(sources: string[]) {
  return sources.filter((source) => source.startsWith("/avatars/builder/"))
}

export function previewBackgroundOverlay(background: string) {
  switch (background) {
    case "space":
      return "from-indigo-200/40 via-white/30 to-sky-100/50"
    case "forest":
      return "from-emerald-200/40 via-white/30 to-lime-100/50"
    case "beach":
      return "from-cyan-200/40 via-white/30 to-yellow-100/50"
    case "football":
      return "from-green-200/40 via-white/30 to-lime-100/50"
    case "science_lab":
      return "from-violet-200/40 via-white/30 to-cyan-100/50"
    case "art_room":
      return "from-pink-200/40 via-white/30 to-yellow-100/50"
    case "castle":
      return "from-purple-200/40 via-white/30 to-yellow-100/50"
    case "yanbo_stage":
      return "from-yellow-200/50 via-white/30 to-blue-100/50"
    default:
      return "from-white via-blue-50/40 to-white"
  }
}

export function getWardrobeResetOption(category: string): WardrobeResetOption | null {
  if (category === "glasses") {
    return {
      slot: "glasses",
      value: "none",
      name: "No glasses",
      icon: "👓",
    }
  }

  if (category === "hat") {
    return {
      slot: "hat",
      value: "none",
      name: "No hat",
      icon: "🧢",
    }
  }

  if (category === "background") {
    return {
      slot: "background",
      value: "plain",
      name: "Plain background",
      icon: "✨",
    }
  }

  if (category === "badge") {
    return {
      slot: "badge",
      value: "none",
      name: "No badge",
      icon: "🏅",
    }
  }

  return null
}
