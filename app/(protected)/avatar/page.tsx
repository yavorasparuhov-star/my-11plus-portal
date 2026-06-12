"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "../../../lib/supabaseClient"

type AvatarConfig = {
  base: "yan" | "bo"
  skinTone: "light" | "medium" | "dark"
  hairStyle: "short" | "medium" | "long"
  hairColor: "brown" | "black" | "blonde" | "ginger"
  eyeColor: "brown" | "blue" | "green"
  glasses: string
  top: string
  background: string
  hat: string
  accessory: string
  badge: string
}

type AvatarSlot =
  | "glasses"
  | "top"
  | "background"
  | "hat"
  | "accessory"
  | "badge"

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
  hairStyle: "short",
  hairColor: "brown",
  eyeColor: "blue",
  glasses: "none",
  top: "yanbo_navy",
  background: "plain",
  hat: "none",
  accessory: "none",
  badge: "none",
}

const freeStarterItemKeys = new Set(["yanbo_jumper_navy"])

const shopCategoryOrder = [
  "top",
  "glasses",
  "hat",
  "accessory",
  "background",
  "badge",
]

const slotOptions: Record<AvatarSlot, SlotOption[]> = {
  top: [
    {
      value: "yanbo_navy",
      label: "YanBo Navy Jumper — free",
      itemKey: "yanbo_jumper_navy",
    },
    {
      value: "yanbo_green",
      label: "YanBo Green Hoodie",
      itemKey: "yanbo_hoodie_green",
    },
    {
      value: "yellow_hoodie",
      label: "YanBo Yellow Hoodie",
      itemKey: "top_yanbo_yellow_hoodie",
    },
    {
      value: "pink_hoodie",
      label: "Pink Learning Hoodie",
      itemKey: "top_pink_learning_hoodie",
    },
    {
      value: "blue_jacket",
      label: "Blue Study Jacket",
      itemKey: "top_blue_study_jacket",
    },
    {
      value: "green_star_tshirt",
      label: "Green Star T-Shirt",
      itemKey: "top_green_star_tshirt",
    },
    {
      value: "maths_champion",
      label: "Maths Champion T-Shirt",
      itemKey: "top_maths_champion_tshirt",
    },
    {
      value: "english_reader",
      label: "English Reader T-Shirt",
      itemKey: "top_english_reader_tshirt",
    },
    {
      value: "vr_puzzle",
      label: "VR Puzzle T-Shirt",
      itemKey: "top_vr_puzzle_tshirt",
    },
    {
      value: "nvr_shapes",
      label: "NVR Shapes T-Shirt",
      itemKey: "top_nvr_shapes_tshirt",
    },
    {
      value: "space_explorer",
      label: "Space Explorer Jacket",
      itemKey: "top_space_explorer_jacket",
    },
    {
      value: "library_cardigan",
      label: "Library Cardigan",
      itemKey: "top_library_cardigan",
    },
    {
      value: "gold_champion",
      label: "Gold Champion Hoodie",
      itemKey: "top_gold_champion_hoodie",
    },
  ],
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
    { value: "space", label: "Space", itemKey: "background_space" },
    { value: "forest", label: "Forest", itemKey: "background_forest" },
    { value: "beach", label: "Beach", itemKey: "background_beach" },
    {
      value: "football",
      label: "Football Pitch",
      itemKey: "background_football_pitch",
    },
    {
      value: "science_lab",
      label: "Science Lab",
      itemKey: "background_science_lab",
    },
    { value: "art_room", label: "Art Room", itemKey: "background_art_room" },
    {
      value: "puzzle_wall",
      label: "Puzzle Wall",
      itemKey: "background_puzzle_wall",
    },
    {
      value: "reading_corner",
      label: "Reading Corner",
      itemKey: "background_reading_corner",
    },
    { value: "castle", label: "Castle", itemKey: "background_castle" },
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
    {
      value: "headphones",
      label: "Study Headphones",
      itemKey: "hat_headphones",
    },
    {
      value: "star_headband",
      label: "Star Headband",
      itemKey: "hat_star_headband",
    },
    { value: "blue_beanie", label: "Blue Beanie", itemKey: "hat_blue_beanie" },
  ],
  accessory: [
    { value: "none", label: "No accessory — free" },
    { value: "book", label: "Favourite Book", itemKey: "accessory_book" },
    { value: "pencil", label: "Super Pencil", itemKey: "accessory_pencil" },
    {
      value: "calculator",
      label: "Calculator Buddy",
      itemKey: "accessory_calculator",
    },
    { value: "trophy", label: "Winner Trophy", itemKey: "accessory_trophy" },
    {
      value: "backpack",
      label: "Learning Backpack",
      itemKey: "accessory_backpack",
    },
    {
      value: "magnifier",
      label: "Detective Magnifier",
      itemKey: "accessory_magnifier",
    },
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
    ...defaultAvatar,
    ...savedConfig,
    base,
  } as AvatarConfig
}

function getSlotItemKey(slot: AvatarSlot, value: string) {
  return slotOptions[slot].find((option) => option.value === value)?.itemKey
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
  return isItemKeyUnlocked(getSlotItemKey(slot, value), unlockedItemKeys)
}

function makeAvatarConfigSafe(
  config: AvatarConfig,
  unlockedItemKeys: string[],
): AvatarConfig {
  const safeConfig = { ...defaultAvatar, ...config }

  ;(
    [
      "glasses",
      "top",
      "background",
      "hat",
      "accessory",
      "badge",
    ] as AvatarSlot[]
  ).forEach((slot) => {
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
  if (category === "top") return "👕"
  if (category === "glasses") return "👓"
  if (category === "background") return "🖼️"
  if (category === "badge") return "🏅"
  if (category === "hat") return "🧢"
  if (category === "accessory") return "🎒"
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

function getShopItemTone(category: string, itemKey: string) {
  if (itemKey.includes("pink")) {
    return {
      frame: "bg-gradient-to-br from-pink-100 via-white to-rose-100 ring-pink-200",
      blob: "bg-pink-300",
      sparkle: "bg-rose-300",
    }
  }

  if (itemKey.includes("yellow") || itemKey.includes("gold")) {
    return {
      frame: "bg-gradient-to-br from-yellow-100 via-white to-amber-100 ring-yellow-200",
      blob: "bg-yellow-300",
      sparkle: "bg-amber-300",
    }
  }

  if (itemKey.includes("green") || itemKey.includes("forest")) {
    return {
      frame: "bg-gradient-to-br from-emerald-100 via-white to-green-100 ring-emerald-200",
      blob: "bg-emerald-300",
      sparkle: "bg-green-300",
    }
  }

  if (itemKey.includes("space") || itemKey.includes("vr")) {
    return {
      frame: "bg-gradient-to-br from-indigo-100 via-white to-violet-100 ring-indigo-200",
      blob: "bg-indigo-300",
      sparkle: "bg-violet-300",
    }
  }

  if (itemKey.includes("blue") || itemKey.includes("nvr")) {
    return {
      frame: "bg-gradient-to-br from-sky-100 via-white to-blue-100 ring-sky-200",
      blob: "bg-sky-300",
      sparkle: "bg-blue-300",
    }
  }

  if (category === "top") {
    return {
      frame: "bg-gradient-to-br from-blue-100 via-white to-pink-100 ring-blue-200",
      blob: "bg-blue-300",
      sparkle: "bg-pink-300",
    }
  }

  if (category === "glasses") {
    return {
      frame: "bg-gradient-to-br from-cyan-100 via-white to-slate-100 ring-cyan-200",
      blob: "bg-cyan-300",
      sparkle: "bg-slate-300",
    }
  }

  if (category === "hat") {
    return {
      frame: "bg-gradient-to-br from-purple-100 via-white to-pink-100 ring-purple-200",
      blob: "bg-purple-300",
      sparkle: "bg-pink-300",
    }
  }

  if (category === "accessory") {
    return {
      frame: "bg-gradient-to-br from-orange-100 via-white to-yellow-100 ring-orange-200",
      blob: "bg-orange-300",
      sparkle: "bg-yellow-300",
    }
  }

  if (category === "background") {
    return {
      frame: "bg-gradient-to-br from-teal-100 via-white to-emerald-100 ring-teal-200",
      blob: "bg-teal-300",
      sparkle: "bg-emerald-300",
    }
  }

  return {
    frame: "bg-gradient-to-br from-slate-100 via-white to-blue-100 ring-slate-200",
    blob: "bg-slate-300",
    sparkle: "bg-blue-300",
  }
}

function formatCategoryName(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function backgroundStyle(background: string) {
  switch (background) {
    case "classroom":
      return "bg-amber-100 ring-amber-200"
    case "library":
      return "bg-sky-100 ring-sky-200"
    case "space":
      return "bg-indigo-100 ring-indigo-200"
    case "forest":
      return "bg-emerald-100 ring-emerald-200"
    case "beach":
      return "bg-cyan-100 ring-cyan-200"
    case "football":
      return "bg-green-100 ring-green-200"
    case "science_lab":
      return "bg-violet-100 ring-violet-200"
    case "art_room":
      return "bg-pink-100 ring-pink-200"
    case "puzzle_wall":
      return "bg-blue-100 ring-blue-200"
    case "reading_corner":
      return "bg-orange-100 ring-orange-200"
    case "castle":
      return "bg-purple-100 ring-purple-200"
    case "yanbo_stage":
      return "bg-yellow-100 ring-yellow-200"
    default:
      return "bg-emerald-100 ring-emerald-200"
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

function topStyle(top: string) {
  switch (top) {
    case "yanbo_green":
      return "bg-emerald-700 text-white"
    case "yellow_hoodie":
      return "bg-yellow-400 text-slate-900"
    case "pink_hoodie":
      return "bg-pink-500 text-white"
    case "blue_jacket":
      return "bg-blue-700 text-white"
    case "green_star_tshirt":
      return "bg-green-600 text-white"
    case "maths_champion":
      return "bg-red-600 text-white"
    case "english_reader":
      return "bg-purple-700 text-white"
    case "vr_puzzle":
      return "bg-pink-600 text-white"
    case "nvr_shapes":
      return "bg-cyan-700 text-white"
    case "space_explorer":
      return "bg-indigo-800 text-white"
    case "library_cardigan":
      return "bg-orange-700 text-white"
    case "gold_champion":
      return "bg-yellow-500 text-slate-950"
    default:
      return "bg-slate-800 text-white"
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

function accessoryDisplay(accessory: string) {
  switch (accessory) {
    case "book":
      return "📘"
    case "pencil":
      return "✏️"
    case "calculator":
      return "🧮"
    case "trophy":
      return "🏆"
    case "backpack":
      return "🎒"
    case "magnifier":
      return "🔎"
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

function hairColourClass(hairColor: string) {
  if (hairColor === "black") return "bg-slate-900"
  if (hairColor === "blonde") return "bg-yellow-300"
  if (hairColor === "ginger") return "bg-orange-500"
  return "bg-amber-900"
}

function hairStyleClass(hairStyle: string) {
  if (hairStyle === "long") return "h-20 w-36 rounded-b-[2rem]"
  if (hairStyle === "medium") return "h-16 w-32 rounded-b-3xl"
  return "h-14 w-28 rounded-b-2xl"
}

function eyeColourClass(eyeColor: string) {
  if (eyeColor === "green") return "bg-emerald-500"
  if (eyeColor === "blue") return "bg-sky-500"
  return "bg-amber-700"
}

function getSlotLabel(slot: AvatarSlot, value: string) {
  return (
    slotOptions[slot]
      .find((option) => option.value === value)
      ?.label.replace(" — free", "") || value
  )
}

function getSlotMatchFromItemKey(itemKey: string) {
  const slots: AvatarSlot[] = [
    "top",
    "glasses",
    "hat",
    "accessory",
    "background",
    "badge",
  ]

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

function getSlotImageUrl(
  shopItems: ShopItem[],
  slot: AvatarSlot,
  value: string,
) {
  const itemKey = getSlotItemKey(slot, value)
  if (!itemKey) return null

  return (
    shopItems.find((item) => item.item_key === itemKey)?.image_url || null
  )
}

function previewBackgroundOverlay(background: string) {
  switch (background) {
    case "space":
      return "from-indigo-900/20 via-violet-400/10 to-sky-300/20"
    case "forest":
      return "from-emerald-700/20 via-green-300/10 to-lime-300/20"
    case "beach":
      return "from-cyan-500/20 via-sky-200/10 to-yellow-200/30"
    case "football":
      return "from-green-700/20 via-emerald-300/10 to-lime-200/20"
    case "science_lab":
      return "from-violet-700/20 via-blue-300/10 to-cyan-200/20"
    case "art_room":
      return "from-pink-600/20 via-rose-200/10 to-yellow-200/20"
    case "castle":
      return "from-purple-700/20 via-violet-200/10 to-yellow-200/20"
    case "yanbo_stage":
      return "from-yellow-500/25 via-pink-200/10 to-blue-300/20"
    default:
      return "from-white/70 via-white/20 to-white/70"
  }
}

export default function AvatarPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar)
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
      .select("avatar_config")
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

    setShopItems(itemsData || [])

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

    const { error: saveError } = await supabase.from("student_avatars").upsert(
      {
        user_id: userId,
        avatar_config: safeAvatarConfig,
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
    return new Set([...Array.from(freeStarterItemKeys), ...unlockedItems]).size
  }, [unlockedItems])

  const shopItemCount = shopItems.length
  const affordableCount = shopItems.filter(
    (item) => !isShopItemUnlocked(item.item_key) && coins >= item.price,
  ).length

  const previewImages = useMemo(
    () => ({
      top: getSlotImageUrl(shopItems, "top", avatarConfig.top),
      glasses: getSlotImageUrl(shopItems, "glasses", avatarConfig.glasses),
      hat: getSlotImageUrl(shopItems, "hat", avatarConfig.hat),
      accessory: getSlotImageUrl(shopItems, "accessory", avatarConfig.accessory),
      badge: getSlotImageUrl(shopItems, "badge", avatarConfig.badge),
      background: getSlotImageUrl(
        shopItems,
        "background",
        avatarConfig.background,
      ),
    }),
    [
      avatarConfig.accessory,
      avatarConfig.background,
      avatarConfig.badge,
      avatarConfig.glasses,
      avatarConfig.hat,
      avatarConfig.top,
      shopItems,
    ],
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-blue-100">
          <p className="text-slate-700">Loading your YanBo avatar...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-blue-100">
          <div className="relative px-6 py-8 sm:px-8">
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-yellow-100 blur-3xl" />
            <div className="absolute -left-20 top-20 h-56 w-56 rounded-full bg-pink-100 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                  YanBo Learning rewards
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  <span className="text-pink-500">Yan</span>
                  <span className="text-yellow-400">Bo</span> Avatar Studio
                </h1>
                <p className="mt-3 max-w-2xl text-lg font-medium text-slate-600">
                  Create your learning hero, unlock new styles, and spend YanBo
                  Coins on avatar items.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
                <StatCard
                  title="YanBo Coins"
                  value={coins}
                  icon="🪙"
                  tone="yellow"
                  subtitle="Current balance"
                />
                <StatCard
                  title="Unlocked"
                  value={unlockedCount}
                  icon="🎒"
                  tone="blue"
                  subtitle="Items collected"
                />
                <StatCard
                  title="Shop items"
                  value={shopItemCount}
                  icon="🛒"
                  tone="pink"
                  subtitle={`${affordableCount} affordable now`}
                />
              </div>
            </div>

            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={claimDailyCoins}
                disabled={claimingDailyCoins}
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claimingDailyCoins
                  ? "Checking..."
                  : "Daily check-in: collect 3 coins"}
              </button>

              <Link
                href="/custom-tests"
                className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                Practise to earn coins
              </Link>

              <Link
                href="/profile"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Back to profile
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            {message}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-blue-100">
              <div className="flex flex-col gap-3 border-b border-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Your avatar
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Preview your current YanBo Learning hero before saving.
                  </p>
                </div>

                <button
                  onClick={saveAvatar}
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Avatar"}
                </button>
              </div>

              <div className="grid gap-6 bg-gradient-to-br from-blue-50 via-white to-pink-50 p-6 lg:grid-cols-[1fr_260px]">
                <div
                  className={`relative min-h-[560px] overflow-hidden rounded-[2rem] p-6 shadow-inner ring-1 ${backgroundStyle(
                    avatarConfig.background,
                  )}`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${previewBackgroundOverlay(
                      avatarConfig.background,
                    )}`}
                  />

                  {previewImages.background && (
                    <PreviewLayerImage
                      src={previewImages.background}
                      alt=""
                      className="absolute right-8 top-20 h-40 w-40 object-contain opacity-25 drop-shadow-md"
                      fallback={null}
                    />
                  )}

                  <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
                  <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/40 blur-2xl" />
                  <div className="absolute left-6 top-6 rounded-2xl bg-white/85 px-4 py-2 text-sm font-black text-slate-700 shadow-sm backdrop-blur">
                    {backgroundEmoji(avatarConfig.background)} {getSlotLabel("background", avatarConfig.background)}
                  </div>
                  <div className="absolute right-8 top-9 text-3xl">✨</div>
                  <div className="absolute bottom-10 left-8 text-4xl opacity-80">📘</div>
                  <div className="absolute bottom-12 right-10 text-4xl opacity-80">🏆</div>

                  <div className="absolute inset-x-10 bottom-20 h-20 rounded-[50%] bg-slate-900/10 blur-sm" />

                  <div className="relative z-10 flex min-h-[510px] items-center justify-center">
                    <div className="relative flex flex-col items-center">
                      {avatarConfig.hat !== "none" && (
                        <div className="z-40 -mb-4 flex h-24 items-end justify-center">
                          <PreviewLayerImage
                            src={previewImages.hat}
                            alt={getSlotLabel("hat", avatarConfig.hat)}
                            className="h-24 w-28 object-contain drop-shadow-xl"
                            fallback={
                              <span className="text-7xl drop-shadow-md">
                                {hatDisplay(avatarConfig.hat)}
                              </span>
                            }
                          />
                        </div>
                      )}

                      <div className="relative z-30">
                        <div
                          className={`absolute left-1/2 top-1 z-20 -translate-x-1/2 rounded-t-full shadow-sm ${hairStyleClass(
                            avatarConfig.hairStyle,
                          )} ${hairColourClass(avatarConfig.hairColor)}`}
                        />
                        <div
                          className={`relative z-10 flex h-48 w-48 items-center justify-center rounded-full text-7xl shadow-xl ring-8 ring-white ${skinToneClass(
                            avatarConfig.skinTone,
                          )}`}
                        >
                          <span className="mt-4">
                            {avatarConfig.base === "yan" ? "😊" : "🙂"}
                          </span>
                        </div>

                        <div className="absolute left-1/2 top-[6.2rem] z-30 flex -translate-x-1/2 gap-9">
                          <span
                            className={`h-3 w-3 rounded-full shadow-sm ${eyeColourClass(
                              avatarConfig.eyeColor,
                            )}`}
                          />
                          <span
                            className={`h-3 w-3 rounded-full shadow-sm ${eyeColourClass(
                              avatarConfig.eyeColor,
                            )}`}
                          />
                        </div>

                        {avatarConfig.glasses !== "none" && (
                          <div className="absolute left-1/2 top-[5rem] z-40 flex -translate-x-1/2 items-center justify-center">
                            <PreviewLayerImage
                              src={previewImages.glasses}
                              alt={getSlotLabel("glasses", avatarConfig.glasses)}
                              className="h-16 w-28 object-contain drop-shadow-md"
                              fallback={
                                <span className="text-5xl drop-shadow-sm">
                                  {glassesDisplay(avatarConfig.glasses)}
                                </span>
                              }
                            />
                          </div>
                        )}
                      </div>

                      <div
                        className={`relative -mt-4 flex h-40 w-64 items-center justify-center overflow-hidden rounded-t-[2.75rem] border-4 border-white text-3xl font-black shadow-xl ${topStyle(
                          avatarConfig.top,
                        )}`}
                      >
                        <div className="absolute inset-x-0 top-0 h-14 bg-white/10" />

                        {previewImages.top && (
                          <PreviewLayerImage
                            src={previewImages.top}
                            alt={getSlotLabel("top", avatarConfig.top)}
                            className="absolute left-5 top-5 h-24 w-24 object-contain opacity-95 drop-shadow-lg"
                            fallback={null}
                          />
                        )}

                        {avatarConfig.badge !== "none" && (
                          <div className="absolute right-5 top-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-100">
                            <PreviewLayerImage
                              src={previewImages.badge}
                              alt={getSlotLabel("badge", avatarConfig.badge)}
                              className="h-12 w-12 object-contain drop-shadow-sm"
                              fallback={
                                <span className="text-xs font-black text-slate-900">
                                  {badgeDisplay(avatarConfig.badge)}
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

                      {avatarConfig.accessory !== "none" && (
                        <div className="absolute -bottom-2 -right-20 z-50 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white p-3 shadow-xl ring-1 ring-slate-100">
                          <PreviewLayerImage
                            src={previewImages.accessory}
                            alt={getSlotLabel("accessory", avatarConfig.accessory)}
                            className="h-20 w-20 object-contain drop-shadow-md"
                            fallback={
                              <span className="text-6xl">
                                {accessoryDisplay(avatarConfig.accessory)}
                              </span>
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                      Current style
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                      {avatarConfig.base === "yan" ? "Yan" : "Bo"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {avatarConfig.eyeColor} eyes • {avatarConfig.hairColor} hair
                    </p>
                  </div>

                  <EquippedMiniCard
                    icon="👕"
                    label="Top"
                    value={getSlotLabel("top", avatarConfig.top)}
                  />
                  <EquippedMiniCard
                    icon="👓"
                    label="Glasses"
                    value={getSlotLabel("glasses", avatarConfig.glasses)}
                  />
                  <EquippedMiniCard
                    icon="🧢"
                    label="Hat"
                    value={getSlotLabel("hat", avatarConfig.hat)}
                  />
                  <EquippedMiniCard
                    icon="🎒"
                    label="Accessory"
                    value={getSlotLabel("accessory", avatarConfig.accessory)}
                  />
                  <EquippedMiniCard
                    icon="🏅"
                    label="Badge"
                    value={getSlotLabel("badge", avatarConfig.badge)}
                  />

                  <div className="rounded-[1.75rem] bg-yellow-50 p-4 text-sm font-bold text-yellow-900 ring-1 ring-yellow-200">
                    Use <span className="font-black">Equip</span> in the shop to try items on, then press
                    <span className="font-black"> Save Avatar</span> to keep the look.
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Customise
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose your avatar style.
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-100 px-3 py-2 text-xl">
                  ✨
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-700">
                    Base avatar
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceButton
                      active={avatarConfig.base === "yan"}
                      title="Yan"
                      subtitle="Girl avatar"
                      emoji="😊"
                      onClick={() => updateAvatar("base", "yan")}
                    />
                    <ChoiceButton
                      active={avatarConfig.base === "bo"}
                      title="Bo"
                      subtitle="Boy avatar"
                      emoji="🙂"
                      onClick={() => updateAvatar("base", "bo")}
                    />
                  </div>
                </div>

                <SelectBox
                  label="Skin tone"
                  value={avatarConfig.skinTone}
                  onChange={(value) =>
                    updateAvatar("skinTone", value as AvatarConfig["skinTone"])
                  }
                  options={[
                    { value: "light", label: "Light" },
                    { value: "medium", label: "Medium" },
                    { value: "dark", label: "Dark" },
                  ]}
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <SelectBox
                    label="Hair style"
                    value={avatarConfig.hairStyle}
                    onChange={(value) =>
                      updateAvatar(
                        "hairStyle",
                        value as AvatarConfig["hairStyle"],
                      )
                    }
                    options={[
                      { value: "short", label: "Short" },
                      { value: "medium", label: "Medium" },
                      { value: "long", label: "Long" },
                    ]}
                  />

                  <SelectBox
                    label="Hair colour"
                    value={avatarConfig.hairColor}
                    onChange={(value) =>
                      updateAvatar(
                        "hairColor",
                        value as AvatarConfig["hairColor"],
                      )
                    }
                    options={[
                      { value: "brown", label: "Brown" },
                      { value: "black", label: "Black" },
                      { value: "blonde", label: "Blonde" },
                      { value: "ginger", label: "Ginger" },
                    ]}
                  />
                </div>

                <SelectBox
                  label="Eye colour"
                  value={avatarConfig.eyeColor}
                  onChange={(value) =>
                    updateAvatar("eyeColor", value as AvatarConfig["eyeColor"])
                  }
                  options={[
                    { value: "brown", label: "Brown" },
                    { value: "blue", label: "Blue" },
                    { value: "green", label: "Green" },
                  ]}
                />

                <SelectBox
                  label="Top"
                  value={avatarConfig.top}
                  onChange={(value) => updateAvatar("top", value)}
                  options={getSelectOptions("top", unlockedItems)}
                />
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
                  label="Accessory"
                  value={avatarConfig.accessory}
                  onChange={(value) => updateAvatar("accessory", value)}
                  options={getSelectOptions("accessory", unlockedItems)}
                />
                <SelectBox
                  label="Badge"
                  value={avatarConfig.badge}
                  onChange={(value) => updateAvatar("badge", value)}
                  options={getSelectOptions("badge", unlockedItems)}
                />
                <SelectBox
                  label="Background"
                  value={avatarConfig.background}
                  onChange={(value) => updateAvatar("background", value)}
                  options={getSelectOptions("background", unlockedItems)}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Avatar Shop
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick bright outfits, accessories and backgrounds.
                  </p>
                </div>
                <div className="rounded-2xl bg-yellow-100 px-3 py-2 text-xl">
                  🛒
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

              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    Category
                  </p>
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
                </div>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    Show
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <ShopStatusButton
                      active={activeShopStatus === "all"}
                      label="All items"
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

              <div className="mt-5 space-y-5 xl:max-h-[680px] xl:overflow-y-auto xl:pr-1">
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
                          {formatCategoryName(category)}
                        </h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                          {items.length} items
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {items.map((item) => {
                          const unlocked = isShopItemUnlocked(item.item_key)
                          const canAfford = coins >= item.price
                          const equipped = isShopItemEquipped(item.item_key)

                          return (
                            <div
                              key={item.item_key}
                              className={`rounded-3xl border p-3 transition ${
                                unlocked
                                  ? "border-emerald-200 bg-emerald-50"
                                  : canAfford
                                    ? "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/40"
                                    : "border-slate-200 bg-slate-50 opacity-80"
                              }`}
                            >
                              <ShopItemThumbnail
                                item={item}
                                unlocked={unlocked}
                                equipped={equipped}
                              />

                              <h4 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-black text-slate-900">
                                {item.name}
                              </h4>

                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-black text-yellow-800">
                                  {item.price} coins
                                </p>
                                {!unlocked && !canAfford && (
                                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                                    Need more
                                  </span>
                                )}
                              </div>

                              {unlocked ? (
                                <button
                                  type="button"
                                  onClick={() => equipShopItem(item.item_key)}
                                  disabled={equipped}
                                  className={`mt-2 w-full rounded-xl px-3 py-2 text-xs font-black shadow-sm transition disabled:cursor-not-allowed ${
                                    equipped
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
                                  }`}
                                >
                                  {equipped ? "Equipped" : "Equip"}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    purchaseAvatarItem(item.item_key)
                                  }
                                  disabled={
                                    purchasingItemKey === item.item_key ||
                                    !canAfford
                                  }
                                  className={`mt-2 w-full rounded-xl px-3 py-2 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    canAfford
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {purchasingItemKey === item.item_key
                                    ? "Buying..."
                                    : canAfford
                                      ? "Buy"
                                      : "Not enough"}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-black text-slate-900">
                Earn by learning
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A simple guide for collecting YanBo Coins.
              </p>

              <div className="mt-4 grid gap-3">
                <RewardRule amount="3" label="Daily login reward" />
                <RewardRule amount="1" label="50% to 74% in a test" />
                <RewardRule amount="2" label="75% to 89% in a test" />
                <RewardRule amount="3" label="90%+ in a test" />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}


function PreviewLayerImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string | null
  alt: string
  className: string
  fallback: React.ReactNode
}) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!src || imageFailed) {
    return <>{fallback}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageFailed(true)}
    />
  )
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
  const tone = getShopItemTone(item.category, item.item_key)
  const emoji = getShopItemEmoji(item.item_key, item.category)
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(item.image_url) && !imageFailed

  return (
    <div
      className={`relative flex h-24 items-center justify-center overflow-hidden rounded-2xl shadow-sm ring-1 ${tone.frame}`}
    >
      <div
        className={`absolute -left-6 -top-6 h-20 w-20 rounded-full opacity-70 blur-sm ${tone.blob}`}
      />
      <div
        className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-60 blur-sm ${tone.sparkle}`}
      />
      <div className="absolute left-2 top-2 text-sm opacity-70">✦</div>
      <div className="absolute bottom-2 right-3 text-sm opacity-70">✧</div>

      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 shadow-md ring-1 ring-white/80 backdrop-blur">
        {showImage ? (
          <img
            src={item.image_url || ""}
            alt=""
            className="h-14 w-14 object-contain drop-shadow-sm"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-5xl drop-shadow-sm" aria-hidden="true">
            {emoji}
          </span>
        )}
        <span className="sr-only">{item.name}</span>
      </div>

      <span className="absolute left-2 bottom-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">
        {formatCategoryName(item.category)}
      </span>

      {equipped && (
        <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">
          Equipped
        </span>
      )}

      {!equipped && unlocked && (
        <span className="absolute right-2 top-2 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700 shadow-sm">
          ✓
        </span>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  tone,
}: {
  title: string
  value: number
  icon: string
  subtitle: string
  tone: "yellow" | "blue" | "pink"
}) {
  const toneClass =
    tone === "yellow"
      ? "bg-yellow-50 ring-yellow-200 text-yellow-800"
      : tone === "blue"
        ? "bg-blue-50 ring-blue-100 text-blue-800"
        : "bg-pink-50 ring-pink-100 text-pink-800"

  return (
    <div className={`rounded-3xl p-5 ring-1 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{title}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xl shadow-sm">
          {icon}
        </span>
      </div>
      <p className="mt-1 text-4xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
    </div>
  )
}

function AvatarStyleChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-100">
      {label}
    </span>
  )
}

function EquippedMiniCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-black text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function ChoiceButton({
  active,
  title,
  subtitle,
  emoji,
  onClick,
}: {
  active: boolean
  title: string
  subtitle: string
  emoji: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-blue-400 bg-blue-50 shadow-sm ring-4 ring-blue-100"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="text-3xl">{emoji}</div>
      <p className="mt-2 font-black text-slate-900">{title}</p>
      <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
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
      className={`rounded-full px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
      }`}
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
      className={`rounded-2xl px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  )
}

function RewardRule({ amount, label }: { amount: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-black text-yellow-800">
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
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
