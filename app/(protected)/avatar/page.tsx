"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "../../../lib/supabaseClient"

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

type ShopStatusFilter = "all" | "affordable" | "owned" | "locked"

type ShopItem = {
  item_key: string
  name: string
  category: string
  price: number
  image_url: string | null
  is_active: boolean
}

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

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

const AVATAR_NAME_MAX_LENGTH = 20

function normaliseAvatarName(value: unknown) {
  if (typeof value !== "string") return ""

  return value.replace(/\s+/g, " ").trim().slice(0, AVATAR_NAME_MAX_LENGTH)
}

function isAvatarNameValid(value: string) {
  if (!value) return true

  if (value.length < 2 || value.length > AVATAR_NAME_MAX_LENGTH) {
    return false
  }

  if (/@|https?:\/\//i.test(value) || /www\./i.test(value)) {
    return false
  }

  return /^[A-Za-z0-9][A-Za-z0-9 '\-]{0,18}[A-Za-z0-9]$/.test(value)
}

const freeStarterItemKeys = new Set<string>()

const hiddenAvatarItemKeys = new Set<string>([
  "hat_headphones",
  "hat_star_headband",
])

const shopCategoryOrder = ["glasses", "hat", "background", "badge"]

const PAGE_CLASS = "min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white px-4 py-6"
const PAGE_INNER_CLASS = "mx-auto max-w-7xl space-y-6"
const CARD_CLASS = "rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-blue-100"
const PANEL_CLASS = "rounded-[1.75rem] bg-gradient-to-b from-slate-50 to-white p-4 ring-1 ring-slate-100"
const SECTION_DIVIDER_CLASS =
  "flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"
const PRIMARY_BUTTON_CLASS =
  "rounded-full bg-green-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-green-200/40 transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
const SMALL_PRIMARY_BUTTON_CLASS =
  "rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white shadow-md shadow-green-200/40 transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
const LINK_BUTTON_BLUE_CLASS =
  "rounded-2xl border border-blue-200 bg-white px-4 py-2 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-50"
const LINK_BUTTON_SLATE_CLASS =
  "rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
const ALERT_ERROR_CLASS =
  "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
const ALERT_SUCCESS_CLASS =
  "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
const CHOICE_ACTIVE_CLASS = "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100"
const CHOICE_IDLE_CLASS = "border-slate-200 bg-white hover:bg-slate-50"
const FILTER_ACTIVE_CLASS = "bg-blue-600 text-white shadow-sm"
const FILTER_IDLE_CLASS = "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
const STATUS_ACTIVE_CLASS = "bg-slate-900 text-white shadow-sm"
const STATUS_IDLE_CLASS = "bg-slate-100 text-slate-600 hover:bg-slate-200"

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function isSupportedShopCategory(category: string) {
  return shopCategoryOrder.includes(category)
}

const slotOptions: Record<AvatarSlot, SlotOption[]> = {
  glasses: [
    { value: "none", label: "No glasses — free" },
    {
      value: "round",
      label: "Round Smart Glasses",
      itemKey: "smart_glasses_round",
    },
    {
      value: "square",
      label: "Square Smart Glasses",
      itemKey: "smart_glasses_square",
    },
    {
      value: "blue",
      label: "Blue Frame Glasses",
      itemKey: "glasses_blue_frames",
    },
    {
      value: "green",
      label: "Green Frame Glasses",
      itemKey: "glasses_green_frames",
    },
    {
      value: "star",
      label: "Star Frame Glasses",
      itemKey: "glasses_star_frames",
    },
    {
      value: "silver",
      label: "Silver Reading Glasses",
      itemKey: "glasses_reading_silver",
    },
    {
      value: "sport",
      label: "Sport Goggles",
      itemKey: "glasses_sport_goggles",
    },
    {
      value: "rainbow",
      label: "Rainbow Frame Glasses",
      itemKey: "glasses_rainbow_frames",
    },
  ],
  background: [
    { value: "plain", label: "Plain — free" },
    { value: "classroom", label: "Classroom", itemKey: "background_classroom" },
    { value: "library", label: "Library", itemKey: "background_library" },
    {
      value: "science_lab",
      label: "Science Lab",
      itemKey: "background_science_lab",
    },
    {
      value: "reading_corner",
      label: "Reading Corner",
      itemKey: "background_reading_corner",
    },
    {
      value: "yanbo_stage",
      label: "YanBo Stage",
      itemKey: "background_yanbo_stage",
    },
  ],
  hat: [
    { value: "none", label: "No hat — free" },
    { value: "yanbo_cap", label: "YanBo Cap", itemKey: "hat_yanbo_cap" },
    {
      value: "graduation",
      label: "Graduation Cap",
      itemKey: "hat_graduation_cap",
    },
    { value: "wizard", label: "Wizard Hat", itemKey: "hat_wizard_hat" },
    { value: "crown", label: "Champion Crown", itemKey: "hat_crown" },
    { value: "explorer", label: "Explorer Hat", itemKey: "hat_explorer_hat" },
    { value: "blue_beanie", label: "Blue Beanie", itemKey: "hat_blue_beanie" },
  ],
  badge: [
    { value: "none", label: "No badge — free" },
    {
      value: "english",
      label: "English Star Badge",
      itemKey: "badge_english_star",
    },
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

function normaliseAvatarConfig(savedConfig: Record<string, unknown> | null) {
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

function getSlotOption(slot: AvatarSlot, value: string) {
  return slotOptions[slot].find((option) => option.value === value)
}

function getSlotItemKey(slot: AvatarSlot, value: string) {
  return getSlotOption(slot, value)?.itemKey
}

function isItemKeyUnlocked(
  itemKey: string | undefined,
  unlockedItemKeys: string[],
) {
  if (!itemKey) return true
  return freeStarterItemKeys.has(itemKey) || unlockedItemKeys.includes(itemKey)
}

function isSlotValueUnlocked(
  slot: AvatarSlot,
  value: string,
  unlockedItemKeys: string[],
) {
  const option = getSlotOption(slot, value)

  if (!option) return false

  return isItemKeyUnlocked(option.itemKey, unlockedItemKeys)
}

function makeAvatarConfigSafe(
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

function getSelectOptions(
  slot: AvatarSlot,
  unlockedItemKeys: string[],
): SelectOption[] {
  return slotOptions[slot].map((option) => {
    const unlocked = isItemKeyUnlocked(option.itemKey, unlockedItemKeys)
    const suffix = option.itemKey
      ? unlocked
        ? " — unlocked"
        : " — locked"
      : ""

    return {
      value: option.value,
      label: `${option.label}${suffix}`,
      disabled: !unlocked,
    }
  })
}

function getShopIcon(category: string) {
  if (category === "glasses") return "👓"
  if (category === "background") return "🖼️"
  if (category === "badge") return "🏅"
  if (category === "hat") return "🧢"
  return "⭐"
}

function getShopItemEmoji(itemKey: string, category: string) {
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

function formatCategoryName(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function backgroundStyle(background: string) {
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

function backgroundEmoji(background: string) {
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

function skinToneClass(skinTone: string) {
  if (skinTone === "medium") return "bg-orange-200"
  if (skinTone === "dark") return "bg-orange-300"
  return "bg-orange-100"
}

function eyeColourClass(eyeColor: string) {
  if (eyeColor === "black") return "bg-slate-950"
  if (eyeColor === "blue") return "bg-sky-500"
  return "bg-amber-700"
}

function formatSkinToneLabel(skinTone: AvatarConfig["skinTone"]) {
  if (skinTone === "medium") return "Medium"
  if (skinTone === "dark") return "Dark"
  return "Light"
}

function formatEyeColourLabel(eyeColor: AvatarConfig["eyeColor"]) {
  if (eyeColor === "black") return "Black"
  if (eyeColor === "brown") return "Brown"
  return "Blue"
}

function getSlotLabel(slot: AvatarSlot, value: string) {
  return (
    slotOptions[slot]
      .find((option) => option.value === value)
      ?.label.replace(" — free", "") || value
  )
}

function getSlotMatchFromItemKey(itemKey: string) {
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

type PreviewImageSources = Record<AvatarSlot | "base" | "eyes", string[]>

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

function getShopItemImageSources(item: ShopItem) {
  const localImageFromItemKey = `/avatars/items/${itemKeyToAssetFileName(
    item.item_key,
  )}.png`

  return uniqueImageSources([item.image_url, localImageFromItemKey])
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

function getPreviewLayerImageSources(
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

function builderOnlySources(sources: string[]) {
  return sources.filter((source) => source.startsWith("/avatars/builder/"))
}

function previewBackgroundOverlay(background: string) {
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

export default function AvatarPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar)
  const [avatarName, setAvatarName] = useState("")
  const [coins, setCoins] = useState(0)
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [unlockedItems, setUnlockedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [claimingDailyCoins, setClaimingDailyCoins] = useState(false)
  const [purchasingItemKey, setPurchasingItemKey] = useState<string | null>(
    null,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shopMessage, setShopMessage] = useState<string | null>(null)
  const [shopError, setShopError] = useState<string | null>(null)
  const [activeShopCategory, setActiveShopCategory] = useState<string>("all")
  const [activeShopStatus, setActiveShopStatus] =
    useState<ShopStatusFilter>("all")
  const [activeWardrobeCategory, setActiveWardrobeCategory] =
    useState<string>("all")

  useEffect(() => {
    loadAvatarPage()
  }, [])

  async function loadAvatarPage() {
    setLoading(true)
    setError(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError("You need to be logged in to view your avatar.")
      setLoading(false)
      return
    }

    setUserId(user.id)

    const { data: avatarData, error: avatarError } = await supabase
      .from("student_avatars")
      .select("avatar_config, avatar_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (avatarError) {
      setError(`Could not load avatar: ${avatarError.message}`)
      setLoading(false)
      return
    }

    const { data: walletData } = await supabase
      .from("yanbo_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()

    if (walletData?.balance !== undefined && walletData?.balance !== null) {
      setCoins(walletData.balance)
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("avatar_shop_items")
      .select("item_key, name, category, price, image_url, is_active")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("price", { ascending: true })

    if (itemsError) {
      setError(`Could not load shop items: ${itemsError.message}`)
      setLoading(false)
      return
    }

    setShopItems(
      (itemsData || []).filter(
        (item) =>
          isSupportedShopCategory(item.category) &&
          !hiddenAvatarItemKeys.has(item.item_key),
      ),
    )

    const { data: unlockedData } = await supabase
      .from("user_avatar_items")
      .select("item_key")
      .eq("user_id", user.id)

    const unlockedKeys = (unlockedData || []).map((item) => item.item_key)
    setUnlockedItems(unlockedKeys)

    const loadedAvatar = avatarData?.avatar_config
      ? normaliseAvatarConfig(
          avatarData.avatar_config as Record<string, unknown>,
        )
      : defaultAvatar

    setAvatarName(normaliseAvatarName(avatarData?.avatar_name))
    setAvatarConfig(makeAvatarConfigSafe(loadedAvatar, unlockedKeys))
    setLoading(false)
  }

  async function saveAvatar() {
    if (!userId) return

    setSaving(true)
    setMessage(null)
    setError(null)
    setShopMessage(null)
    setShopError(null)

    const safeAvatarConfig = makeAvatarConfigSafe(avatarConfig, unlockedItems)
    const safeAvatarName = normaliseAvatarName(avatarName)

    if (!isAvatarNameValid(safeAvatarName)) {
      setError(
        "Avatar nickname must be 2–20 characters and cannot include email or website links.",
      )
      setSaving(false)
      return
    }

    const { error: saveError } = await supabase.from("student_avatars").upsert(
      {
        user_id: userId,
        avatar_config: safeAvatarConfig,
        avatar_name: safeAvatarName || null,
        selected_base: safeAvatarConfig.base,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (saveError) {
      setError(`Could not save avatar: ${saveError.message}`)
      setSaving(false)
      return
    }

    setAvatarConfig(safeAvatarConfig)
    setAvatarName(safeAvatarName)
    setMessage("Avatar saved successfully.")
    setSaving(false)
  }

  async function claimDailyCoins() {
    setClaimingDailyCoins(true)
    setMessage(null)
    setError(null)
    setShopMessage(null)
    setShopError(null)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        setError("You need to be logged in to claim YanBo Coins.")
        setClaimingDailyCoins(false)
        return
      }

      const response = await fetch("/api/tokens/daily-login", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Could not claim today’s YanBo Coins.")
        setClaimingDailyCoins(false)
        return
      }

      if (result.awarded) {
        setCoins((current) => current + result.amount)
        setMessage(`Well done! You claimed ${result.amount} YanBo Coins today.`)
      } else {
        setMessage("You have already claimed today’s YanBo Coins.")
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not claim today’s YanBo Coins.",
      )
    }

    setClaimingDailyCoins(false)
  }

  async function purchaseAvatarItem(itemKey: string) {
    setPurchasingItemKey(itemKey)
    setMessage(null)
    setError(null)
    setShopMessage(null)
    setShopError(null)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        setShopError("You need to be logged in to buy avatar items.")
        setPurchasingItemKey(null)
        return
      }

      const response = await fetch("/api/avatar/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          itemKey,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setShopError(result.error || "Could not buy this avatar item.")
        setPurchasingItemKey(null)
        return
      }

      setCoins(result.newBalance)
      setUnlockedItems((current) =>
        current.includes(result.itemKey)
          ? current
          : [...current, result.itemKey],
      )
      setShopMessage("Item unlocked successfully. Use Equip to try it on.")
    } catch (error) {
      setShopError(
        error instanceof Error
          ? error.message
          : "Could not buy this avatar item.",
      )
    }

    setPurchasingItemKey(null)
  }

  function updateAvatar<K extends keyof AvatarConfig>(
    key: K,
    value: AvatarConfig[K],
  ) {
    setAvatarConfig((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function isShopItemUnlocked(itemKey: string) {
    return freeStarterItemKeys.has(itemKey) || unlockedItems.includes(itemKey)
  }

  function isShopItemEquipped(itemKey: string) {
    const match = getSlotMatchFromItemKey(itemKey)
    if (!match) return false
    return avatarConfig[match.slot] === match.value
  }

  function equipShopItem(itemKey: string) {
    const match = getSlotMatchFromItemKey(itemKey)

    if (!match) {
      setShopError("This item is unlocked, but it cannot be equipped yet.")
      return
    }

    setAvatarConfig((current) => ({
      ...current,
      [match.slot]: match.value,
    }))
    setMessage(null)
    setError(null)
    setShopError(null)
    setShopMessage("Item equipped. Remember to save your avatar.")
  }

  const groupedShopItems = useMemo(() => {
    return shopItems.reduce<Record<string, ShopItem[]>>(
      (currentGroups, item) => {
        if (!currentGroups[item.category]) currentGroups[item.category] = []
        currentGroups[item.category].push(item)
        return currentGroups
      },
      {},
    )
  }, [shopItems])

  const sortedShopCategories = useMemo(() => {
    return Object.keys(groupedShopItems).sort((categoryA, categoryB) => {
      const indexA = shopCategoryOrder.indexOf(categoryA)
      const indexB = shopCategoryOrder.indexOf(categoryB)
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })
  }, [groupedShopItems])

  const filteredShopItems = useMemo(() => {
    return shopItems.filter((item) => {
      const unlocked = isShopItemUnlocked(item.item_key)
      const affordable = !unlocked && coins >= item.price

      if (activeShopCategory !== "all" && item.category !== activeShopCategory) {
        return false
      }

      if (activeShopStatus === "owned") return unlocked
      if (activeShopStatus === "affordable") return affordable
      if (activeShopStatus === "locked") return !unlocked

      return true
    })
  }, [activeShopCategory, activeShopStatus, coins, shopItems, unlockedItems])

  const groupedFilteredShopItems = useMemo(() => {
    return filteredShopItems.reduce<Record<string, ShopItem[]>>(
      (currentGroups, item) => {
        if (!currentGroups[item.category]) currentGroups[item.category] = []
        currentGroups[item.category].push(item)
        return currentGroups
      },
      {},
    )
  }, [filteredShopItems])

  const sortedFilteredShopCategories = useMemo(() => {
    return Object.keys(groupedFilteredShopItems).sort((categoryA, categoryB) => {
      const indexA = shopCategoryOrder.indexOf(categoryA)
      const indexB = shopCategoryOrder.indexOf(categoryB)
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })
  }, [groupedFilteredShopItems])

  const unlockedCount = useMemo(() => {
    return shopItems.filter((item) => isShopItemUnlocked(item.item_key)).length
  }, [shopItems, unlockedItems])

  const wardrobeItems = useMemo(() => {
    return shopItems.filter(
      (item) =>
        freeStarterItemKeys.has(item.item_key) ||
        unlockedItems.includes(item.item_key),
    )
  }, [shopItems, unlockedItems])

  const filteredWardrobeItems = useMemo(() => {
    if (activeWardrobeCategory === "all") return wardrobeItems

    return wardrobeItems.filter(
      (item) => item.category === activeWardrobeCategory,
    )
  }, [activeWardrobeCategory, wardrobeItems])

  const previewImages = useMemo<PreviewImageSources>(
    () => ({
      base: getBaseAvatarImageSources(
        avatarConfig.base,
        avatarConfig.skinTone,
      ),
      eyes: getEyeOverlayImageSources(avatarConfig.base, avatarConfig.eyeColor),
      glasses: getPreviewLayerImageSources(
        shopItems,
        "glasses",
        avatarConfig.glasses,
        avatarConfig.base,
      ),
      hat: getPreviewLayerImageSources(
        shopItems,
        "hat",
        avatarConfig.hat,
        avatarConfig.base,
      ),
      badge: getPreviewLayerImageSources(
        shopItems,
        "badge",
        avatarConfig.badge,
        avatarConfig.base,
      ),
      background: getPreviewLayerImageSources(
        shopItems,
        "background",
        avatarConfig.background,
        avatarConfig.base,
      ),
    }),
    [
      avatarConfig.background,
      avatarConfig.badge,
      avatarConfig.base,
      avatarConfig.eyeColor,
      avatarConfig.skinTone,
      avatarConfig.glasses,
      avatarConfig.hat,
      shopItems,
    ],
  )

  if (loading) {
    return (
      <main className={PAGE_CLASS}>
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100">
          <p className="text-sm font-semibold text-slate-700">
            Loading your YanBo avatar...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={PAGE_CLASS}>
      <div className={PAGE_INNER_CLASS}>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-blue-50 to-yellow-50 p-5 shadow-sm ring-1 ring-blue-100">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-yellow-200/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-pink-200/30 blur-2xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Your <span className="text-pink-500">Y</span>an<span className="text-yellow-400">B</span>o Avatar
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
                Make your learning character feel like yours. Try a look, equip your favourite items and save it for the portal.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={claimDailyCoins}
                disabled={claimingDailyCoins}
                className={SMALL_PRIMARY_BUTTON_CLASS}
              >
                {claimingDailyCoins ? "Checking..." : "Claim +3 coins"}
              </button>

              <Link
                href="/profile"
                className={LINK_BUTTON_SLATE_CLASS}
              >
                Back to Profile
              </Link>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <CompactStat icon="🪙" value={`${coins}`} label="YanBo Coins" />
            <CompactStat icon="🎒" value={`${unlockedCount}`} label="Items unlocked" />
          </div>
        </section>

        {error && (
          <div className={ALERT_ERROR_CLASS}>
            {error}
          </div>
        )}

        {message && (
          <div className={ALERT_SUCCESS_CLASS}>
            {message}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className={cn(CARD_CLASS, "overflow-hidden")}>
            <div className={SECTION_DIVIDER_CLASS}>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Preview your look
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Try items on here. Press Save Avatar when you are happy.
                </p>
              </div>

              <button
                onClick={saveAvatar}
                disabled={saving}
                className={PRIMARY_BUTTON_CLASS}
              >
                {saving ? "Saving..." : "Save Avatar"}
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[450px_minmax(0,1fr)]">
              <div
                className={`relative mx-auto h-[455px] w-full max-w-[430px] overflow-visible rounded-[2rem] p-0 shadow-inner ring-1 ${backgroundStyle(
                  avatarConfig.background,
                )}`}
              >
                {previewImages.background.length > 0 && (
                  <PreviewLayerImage
                    srcs={previewImages.background}
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-[2rem] object-cover"
                    fallback={null}
                  />
                )}

                <div
                  className={`absolute inset-0 rounded-[2rem] bg-gradient-to-b ${previewBackgroundOverlay(
                    avatarConfig.background,
                  )}`}
                />

                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm ring-1 ring-slate-100">
                  {backgroundEmoji(avatarConfig.background)} {getSlotLabel("background", avatarConfig.background)}
                </div>

                <div className="absolute inset-x-10 bottom-10 h-14 rounded-[50%] bg-slate-900/10 blur-sm" />

                <div className="relative z-10 flex h-full items-center justify-center pt-6">
                  <AvatarPreviewBody
                    config={avatarConfig}
                    imageSources={previewImages}
                  />
                </div>
              </div>

              <div className={cn(PANEL_CLASS, "flex flex-col justify-between")}>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                    Current look
                  </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {avatarConfig.base === "yan" ? "Yan" : "Bo"}
                </p>
                <p className="mt-1 text-xs font-bold capitalize text-slate-500">
                  {avatarConfig.skinTone} skin • {avatarConfig.eyeColor} eyes
                </p>

                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 shadow-sm ring-1 ring-slate-100">
                  {avatarName || "Avatar nickname not chosen yet"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StyleChip
                    icon="🎨"
                    label="Skin"
                    value={formatSkinToneLabel(avatarConfig.skinTone)}
                  />
                  <StyleChip
                    icon="👁️"
                    label="Eyes"
                    value={formatEyeColourLabel(avatarConfig.eyeColor)}
                  />
                  <StyleChip
                    icon="👓"
                    label="Glasses"
                    value={getSlotLabel("glasses", avatarConfig.glasses)}
                  />
                  <StyleChip
                    icon="🧢"
                    label="Hat"
                    value={getSlotLabel("hat", avatarConfig.hat)}
                  />
                  <StyleChip
                    icon="🖼️"
                    label="Background"
                    value={getSlotLabel("background", avatarConfig.background)}
                  />
                  <StyleChip
                    icon="🏅"
                    label="Badge"
                    value={getSlotLabel("badge", avatarConfig.badge)}
                  />
                </div>

                </div>

                <div className="mt-5 rounded-2xl bg-blue-50 px-3 py-3 text-xs font-bold leading-relaxed text-blue-900 ring-1 ring-blue-100">
                  ✅ Items you equip are only kept after you press Save Avatar.
                </div>
              </div>
            </div>
          </section>

          <section className={cn(CARD_CLASS, "xl:sticky xl:top-5 xl:self-start")}>
            <SectionHeader
              title="Customise basics"
              subtitle="Choose the character, nickname and unlocked extras."
              icon="✨"
            />

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Avatar nickname
                </span>
                <input
                  type="text"
                  value={avatarName}
                  maxLength={AVATAR_NAME_MAX_LENGTH}
                  onChange={(event) => setAvatarName(event.target.value)}
                  placeholder="e.g. Puzzle Hero"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <span className="mt-1.5 block text-xs font-semibold leading-relaxed text-slate-500">
                  Use a fun nickname, not a full real name. 2–20 characters.
                </span>
              </label>

              <div>
                <p className="mb-2 text-sm font-black text-slate-700">
                  Base avatar
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ChoiceButton
                    active={avatarConfig.base === "yan"}
                    title="Yan"
                    imageSrc="/avatars/builder/base/yan-icon.png"
                    emoji="😊"
                    onClick={() => updateAvatar("base", "yan")}
                  />
                  <ChoiceButton
                    active={avatarConfig.base === "bo"}
                    title="Bo"
                    imageSrc="/avatars/builder/base/bo-icon.png"
                    emoji="🙂"
                    onClick={() => updateAvatar("base", "bo")}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-black text-slate-700">
                    Skin tone
                  </p>
                  <div className="flex gap-2">
                    <SkinToneButton
                      active={avatarConfig.skinTone === "light"}
                      tone="light"
                      label="Light"
                      onClick={() => updateAvatar("skinTone", "light")}
                    />
                    <SkinToneButton
                      active={avatarConfig.skinTone === "medium"}
                      tone="medium"
                      label="Medium"
                      onClick={() => updateAvatar("skinTone", "medium")}
                    />
                    <SkinToneButton
                      active={avatarConfig.skinTone === "dark"}
                      tone="dark"
                      label="Dark"
                      onClick={() => updateAvatar("skinTone", "dark")}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-black text-slate-700">
                    Eye colour
                  </p>
                  <div className="flex gap-2">
                    <EyeColourButton
                      active={avatarConfig.eyeColor === "blue"}
                      colour="blue"
                      label="Blue"
                      onClick={() => updateAvatar("eyeColor", "blue")}
                    />
                    <EyeColourButton
                      active={avatarConfig.eyeColor === "brown"}
                      colour="brown"
                      label="Brown"
                      onClick={() => updateAvatar("eyeColor", "brown")}
                    />
                    <EyeColourButton
                      active={avatarConfig.eyeColor === "black"}
                      colour="black"
                      label="Black"
                      onClick={() => updateAvatar("eyeColor", "black")}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <SelectBox
                  label="Glasses"
                  value={avatarConfig.glasses}
                  onChange={(value) => updateAvatar("glasses", value)}
                  options={getSelectOptions("glasses", unlockedItems)}
                />
                <SelectBox
                  label="Hat"
                  value={avatarConfig.hat}
                  onChange={(value) => updateAvatar("hat", value)}
                  options={getSelectOptions("hat", unlockedItems)}
                />
                <SelectBox
                  label="Background"
                  value={avatarConfig.background}
                  onChange={(value) => updateAvatar("background", value)}
                  options={getSelectOptions("background", unlockedItems)}
                />
                <SelectBox
                  label="Badge"
                  value={avatarConfig.badge}
                  onChange={(value) => updateAvatar("badge", value)}
                  options={getSelectOptions("badge", unlockedItems)}
                />
              </div>
            </div>
          </section>
        </section>

        <section className={cn(CARD_CLASS, "bg-gradient-to-b from-white to-blue-50/30")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              title="My Wardrobe"
              subtitle="Your unlocked items live here. Equip favourites, then save your avatar."
              icon="🎒"
            />

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ShopFilterButton
                active={activeWardrobeCategory === "all"}
                label="All"
                icon="✨"
                onClick={() => setActiveWardrobeCategory("all")}
              />
              {shopCategoryOrder.map((category) => (
                <ShopFilterButton
                  key={category}
                  active={activeWardrobeCategory === category}
                  label={formatCategoryName(category)}
                  icon={getShopIcon(category)}
                  onClick={() => setActiveWardrobeCategory(category)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredWardrobeItems.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500 ring-1 ring-slate-100 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5">
                {activeWardrobeCategory === "all"
                  ? "Your wardrobe is empty for now. Unlock items from the shop to see them here."
                  : `No ${formatCategoryName(activeWardrobeCategory).toLowerCase()} items unlocked yet.`}
              </div>
            )}

            {filteredWardrobeItems.map((item) => {
              const equipped = isShopItemEquipped(item.item_key)
              const canEquip = Boolean(getSlotMatchFromItemKey(item.item_key))

              return (
                <CompactItemCard
                  key={item.item_key}
                  item={item}
                  unlocked={true}
                  equipped={equipped}
                  primaryAction={
                    canEquip
                      ? {
                          label: equipped ? "Equipped" : "Equip",
                          disabled: equipped,
                          onClick: () => equipShopItem(item.item_key),
                          variant: equipped ? "success" : "dark",
                        }
                      : undefined
                  }
                />
              )
            })}
          </div>
        </section>

        <section className={CARD_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeader
              title="Unlock more items"
              subtitle="Spend YanBo Coins on glasses, hats, backgrounds and badges."
              icon="🛒"
            />

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2">
                <ShopFilterButton
                  active={activeShopCategory === "all"}
                  label="All"
                  icon="✨"
                  onClick={() => setActiveShopCategory("all")}
                />
                {sortedShopCategories.map((category) => (
                  <ShopFilterButton
                    key={category}
                    active={activeShopCategory === category}
                    label={formatCategoryName(category)}
                    icon={getShopIcon(category)}
                    onClick={() => setActiveShopCategory(category)}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <ShopStatusButton
                  active={activeShopStatus === "all"}
                  label="All"
                  onClick={() => setActiveShopStatus("all")}
                />
                <ShopStatusButton
                  active={activeShopStatus === "affordable"}
                  label="Ready to buy"
                  onClick={() => setActiveShopStatus("affordable")}
                />
                <ShopStatusButton
                  active={activeShopStatus === "owned"}
                  label="Unlocked"
                  onClick={() => setActiveShopStatus("owned")}
                />
                <ShopStatusButton
                  active={activeShopStatus === "locked"}
                  label="Locked"
                  onClick={() => setActiveShopStatus("locked")}
                />
              </div>
            </div>
          </div>

          {shopError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {shopError}
            </div>
          )}

          {shopMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {shopMessage}
            </div>
          )}

          <div className="mt-6 space-y-7">
            {filteredShopItems.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                No shop items match this filter yet.
              </div>
            )}

            {sortedFilteredShopCategories.map((category) => {
              const items = groupedFilteredShopItems[category] || []

              return (
                <div key={category}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
                      {getShopIcon(category)} {formatCategoryName(category)}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                      {items.length} items
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {items.map((item) => {
                      const unlocked = isShopItemUnlocked(item.item_key)
                      const canAfford = coins >= item.price
                      const equipped = isShopItemEquipped(item.item_key)

                      return (
                        <CompactItemCard
                          key={item.item_key}
                          item={item}
                          unlocked={unlocked}
                          equipped={equipped}
                          priceLabel={unlocked ? undefined : `${item.price} coins`}
                          primaryAction={
                            unlocked
                              ? {
                                  label: equipped ? "Equipped" : "Equip",
                                  disabled: equipped,
                                  onClick: () => equipShopItem(item.item_key),
                                  variant: equipped ? "success" : "light",
                                }
                              : {
                                  label:
                                    purchasingItemKey === item.item_key
                                      ? "Buying..."
                                      : canAfford
                                        ? "Buy"
                                        : "Not enough",
                                  disabled:
                                    purchasingItemKey === item.item_key ||
                                    !canAfford,
                                  onClick: () =>
                                    purchaseAvatarItem(item.item_key),
                                  variant: canAfford ? "blue" : "muted",
                                }
                          }
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-gradient-to-r from-yellow-50 via-white to-blue-50 p-5 shadow-sm ring-1 ring-yellow-100">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                How to earn YanBo Coins
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep practising and use your coins to unlock more avatar items.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <RewardRule amount="3" label="Daily login" />
              <RewardRule amount="1" label="50% to 74%" />
              <RewardRule amount="2" label="75% to 89%" />
              <RewardRule amount="3" label="90%+" />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AvatarPreviewBody({
  config,
  imageSources,
}: {
  config: AvatarConfig
  imageSources: PreviewImageSources
}) {
  const builderEyeSources = builderOnlySources(imageSources.eyes)
  const builderGlassesSources = builderOnlySources(imageSources.glasses)
  const builderHatSources = builderOnlySources(imageSources.hat)
  const builderBadgeSources = builderOnlySources(imageSources.badge)

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[520px] w-[330px] sm:h-[560px] sm:w-[360px]">
        <PreviewLayerImage
          srcs={imageSources.base}
          alt={`${config.base === "yan" ? "Yan" : "Bo"} avatar`}
          className="absolute inset-0 z-20 h-full w-full object-contain drop-shadow-2xl"
          fallback={<CssAvatarPreviewBody config={config} imageSources={imageSources} />}
        />

        <PreviewLayerImage
          srcs={builderEyeSources}
          alt={`${config.eyeColor} eyes`}
          className="absolute inset-0 z-40 h-full w-full object-contain"
          fallback={null}
        />

        {config.hat !== "none" && (
          <div className="absolute left-1/2 top-3 z-50 flex -translate-x-1/2 items-center justify-center sm:top-4">
            <PreviewLayerImage
              srcs={builderHatSources}
              alt={getSlotLabel("hat", config.hat)}
              className="h-20 w-28 object-contain drop-shadow-xl sm:h-24 sm:w-32"
              fallback={
                <span className="text-6xl drop-shadow-md sm:text-7xl">
                  {hatDisplay(config.hat)}
                </span>
              }
            />
          </div>
        )}

        {config.glasses !== "none" && (
          <div className="absolute left-1/2 top-[4.35rem] z-50 flex -translate-x-1/2 items-center justify-center sm:top-[4.75rem]">
            <PreviewLayerImage
              srcs={builderGlassesSources}
              alt={getSlotLabel("glasses", config.glasses)}
              className="h-12 w-24 object-contain drop-shadow-md sm:h-14 sm:w-28"
              fallback={
                <span className="text-4xl drop-shadow-sm sm:text-5xl">
                  {glassesDisplay(config.glasses)}
                </span>
              }
            />
          </div>
        )}

        {config.badge !== "none" && (
          <div className="absolute left-[7.6rem] top-[10.25rem] z-50 flex h-10 w-10 items-center justify-center sm:left-[8.3rem] sm:top-[10.9rem] sm:h-11 sm:w-11">
            <PreviewLayerImage
              srcs={builderBadgeSources}
              alt={getSlotLabel("badge", config.badge)}
              className="h-full w-full object-contain drop-shadow-lg"
              fallback={
                <span className="text-xs font-black text-white drop-shadow">
                  {badgeDisplay(config.badge)}
                </span>
              }
            />
          </div>
        )}

      </div>
    </div>
  )
}

function CssAvatarPreviewBody({
  config,
  imageSources,
}: {
  config: AvatarConfig
  imageSources: PreviewImageSources
}) {
  return (
    <div className="relative flex flex-col items-center">
      {config.hat !== "none" && (
        <div className="z-40 -mb-4 flex h-24 items-end justify-center">
          <PreviewLayerImage
            srcs={imageSources.hat}
            alt={getSlotLabel("hat", config.hat)}
            className="h-24 w-28 object-contain drop-shadow-xl"
            fallback={
              <span className="text-7xl drop-shadow-md">
                {hatDisplay(config.hat)}
              </span>
            }
          />
        </div>
      )}

      <div className="relative z-30">
        <div
          className={`relative z-10 flex h-48 w-48 items-center justify-center rounded-full text-7xl shadow-xl ring-8 ring-white ${skinToneClass(
            config.skinTone,
          )}`}
        >
          <span className="mt-4">{config.base === "yan" ? "😊" : "🙂"}</span>
        </div>

        <div className="absolute left-1/2 top-[6.2rem] z-30 flex -translate-x-1/2 gap-9">
          <span
            className={`h-3 w-3 rounded-full shadow-sm ${eyeColourClass(
              config.eyeColor,
            )}`}
          />
          <span
            className={`h-3 w-3 rounded-full shadow-sm ${eyeColourClass(
              config.eyeColor,
            )}`}
          />
        </div>

        {config.glasses !== "none" && (
          <div className="absolute left-1/2 top-[5rem] z-40 flex -translate-x-1/2 items-center justify-center">
            <PreviewLayerImage
              srcs={imageSources.glasses}
              alt={getSlotLabel("glasses", config.glasses)}
              className="h-16 w-28 object-contain drop-shadow-md"
              fallback={
                <span className="text-5xl drop-shadow-sm">
                  {glassesDisplay(config.glasses)}
                </span>
              }
            />
          </div>
        )}
      </div>

      <div className="relative -mt-4 flex h-40 w-64 items-center justify-center overflow-hidden rounded-t-[2.75rem] border-4 border-white bg-slate-800 text-3xl font-black text-white shadow-xl">
        <div className="absolute inset-x-0 top-0 h-14 bg-white/10" />

        {config.badge !== "none" && (
          <div className="absolute left-7 top-10 flex h-10 w-10 items-center justify-center">
            <PreviewLayerImage
              srcs={imageSources.badge}
              alt={getSlotLabel("badge", config.badge)}
              className="h-full w-full object-contain drop-shadow-lg"
              fallback={
                <span className="text-xs font-black text-white drop-shadow">
                  {badgeDisplay(config.badge)}
                </span>
              }
            />
          </div>
        )}

        <span className="relative z-10 drop-shadow-sm">
          <span className="text-pink-400">Y</span>an
          <span className="text-yellow-300">B</span>o
        </span>
      </div>
    </div>
  )
}


function PreviewLayerImage({
  srcs,
  alt,
  className,
  fallback,
}: {
  srcs: string[]
  alt: string
  className: string
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
      className={className}
      onError={() => setImageIndex((current) => current + 1)}
    />
  )
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl shadow-sm ring-1 ring-blue-100">
        {icon}
      </div>
    </div>
  )
}

function CompactStat({
  icon,
  value,
  label,
}: {
  icon: string
  value: string
  label: string
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-blue-100">
      <span>{icon}</span>
      <span className="font-black text-slate-950">{value}</span>
      <span>{label}</span>
    </div>
  )
}

function StyleChip({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-100">
      <span>{icon}</span>
      <span className="text-slate-400">{label}:</span>
      <span className="truncate font-black text-slate-800">{value}</span>
    </span>
  )
}

function CompactItemCard({
  item,
  unlocked,
  equipped,
  priceLabel,
  primaryAction,
}: {
  item: ShopItem
  unlocked: boolean
  equipped: boolean
  priceLabel?: string
  primaryAction?: {
    label: string
    disabled?: boolean
    onClick: () => void
    variant: "blue" | "dark" | "light" | "success" | "muted"
  }
}) {
  return (
    <div
      className={cn(
        "flex min-h-[58px] items-center gap-2 rounded-2xl border p-2 transition",
        equipped && "border-blue-300 bg-blue-50 shadow-sm",
        !equipped && unlocked && "border-emerald-200 bg-white",
        !equipped && !unlocked &&
          "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30",
      )}
    >
      <ShopItemThumbnail item={item} unlocked={unlocked} equipped={equipped} />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xs font-black leading-tight text-slate-900">
          {item.name}
        </h3>
        {priceLabel && (
          <span className="mt-0.5 inline-block rounded-full bg-yellow-100 px-1.5 py-0.5 text-[9px] font-black text-yellow-800">
            {priceLabel}
          </span>
        )}
      </div>

      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={`flex min-w-[52px] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center text-[10px] font-black leading-none shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariantClass(
            primaryAction.variant,
          )}`}
        >
          {primaryAction.label === "Not enough" ? (
            <>
              <span>Not</span>
              <span className="mt-0.5">enough</span>
            </>
          ) : (
            primaryAction.label
          )}
        </button>
      )}
    </div>
  )
}

function buttonVariantClass(
  variant: "blue" | "dark" | "light" | "success" | "muted",
) {
  if (variant === "blue") return "bg-blue-600 text-white hover:bg-blue-700"
  if (variant === "dark") return "bg-slate-900 text-white hover:bg-blue-700"
  if (variant === "light") return "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
  if (variant === "success") return "bg-emerald-100 text-emerald-700"
  return "bg-slate-200 text-slate-500"
}

function ShopItemThumbnail({
  item,
  unlocked,
  equipped,
}: {
  item: ShopItem
  unlocked: boolean
  equipped: boolean
}) {
  const emoji = getShopItemEmoji(item.item_key, item.category)
  const imageSources = getShopItemImageSources(item)
  const sourceKey = imageSources.join("|")
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    setImageIndex(0)
  }, [sourceKey])

  const currentSource = imageSources[imageIndex]

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
      {currentSource ? (
        <img
          src={currentSource}
          alt=""
          className="h-8 w-8 object-contain drop-shadow-sm"
          onError={() => setImageIndex((current) => current + 1)}
        />
      ) : (
        <span className="text-xl drop-shadow-sm" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span className="sr-only">{item.name}</span>

      {equipped && (
        <span className="absolute right-0 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-black text-white shadow-sm">
          ✓
        </span>
      )}

      {!equipped && unlocked && (
        <span className="absolute right-0 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white shadow-sm">
          ✓
        </span>
      )}
    </div>
  )
}

function ChoiceButton({
  active,
  title,
  subtitle,
  emoji,
  imageSrc,
  onClick,
}: {
  active: boolean
  title: string
  subtitle?: string
  emoji?: string
  imageSrc?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-2.5 text-left transition",
        active ? CHOICE_ACTIVE_CLASS : CHOICE_IDLE_CLASS,
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl">{emoji}</span>
        )}
      </div>
      <div>
        <p className="font-black text-slate-900">{title}</p>
        {subtitle && (
          <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
        )}
      </div>
    </button>
  )
}

function SkinToneButton({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean
  tone: AvatarConfig["skinTone"]
  label: string
  onClick: () => void
}) {
  const toneClass =
    tone === "dark"
      ? "bg-[#8b5a3c]"
      : tone === "medium"
        ? "bg-[#d6a06f]"
        : "bg-[#f1c9a5]"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Skin tone: ${label}`}
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-2xl border transition",
        active ? CHOICE_ACTIVE_CLASS : CHOICE_IDLE_CLASS,
      )}
    >
      <span
        className={`h-7 w-7 shrink-0 rounded-full shadow-inner ring-2 ring-white ${toneClass}`}
      />
    </button>
  )
}

function EyeColourButton({
  active,
  colour,
  label,
  onClick,
}: {
  active: boolean
  colour: AvatarConfig["eyeColor"]
  label: string
  onClick: () => void
}) {
  const colourClass =
    colour === "black"
      ? "bg-slate-950"
      : colour === "brown"
        ? "bg-amber-700"
        : "bg-sky-500"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Eye colour: ${label}`}
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-2xl border transition",
        active ? CHOICE_ACTIVE_CLASS : CHOICE_IDLE_CLASS,
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
        <span className={`h-4 w-4 rounded-full ${colourClass}`} />
      </span>
    </button>
  )
}

function ShopFilterButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2 text-xs font-black transition",
        active ? FILTER_ACTIVE_CLASS : FILTER_IDLE_CLASS,
      )}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  )
}

function ShopStatusButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2 text-xs font-black transition",
        active ? STATUS_ACTIVE_CLASS : STATUS_IDLE_CLASS,
      )}
    >
      {label}
    </button>
  )
}

function RewardRule({ amount, label }: { amount: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-yellow-100">
      <span>{label}</span>
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-black text-yellow-800">
        +{amount}
      </span>
    </div>
  )
}

function SelectBox({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
