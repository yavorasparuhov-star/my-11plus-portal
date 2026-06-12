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
  glasses: "none" | "round" | "square"
  top: "yanbo_navy" | "yanbo_green"
  background: "plain" | "classroom" | "library"
}

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

const defaultAvatar: AvatarConfig = {
  base: "bo",
  skinTone: "light",
  hairStyle: "short",
  hairColor: "brown",
  eyeColor: "blue",
  glasses: "none",
  top: "yanbo_navy",
  background: "plain",
}

const freeStarterItemKeys = new Set(["yanbo_jumper_navy"])

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

function makeAvatarConfigSafe(
  config: AvatarConfig,
  unlockedItemKeys: string[]
): AvatarConfig {
  const unlocked = new Set(unlockedItemKeys)
  const safeConfig = { ...config }

  if (safeConfig.glasses === "round" && !unlocked.has("smart_glasses_round")) {
    safeConfig.glasses = "none"
  }

  if (safeConfig.glasses === "square" && !unlocked.has("smart_glasses_square")) {
    safeConfig.glasses = "none"
  }

  if (safeConfig.top === "yanbo_green" && !unlocked.has("yanbo_hoodie_green")) {
    safeConfig.top = "yanbo_navy"
  }

  if (
    safeConfig.background === "classroom" &&
    !unlocked.has("background_classroom")
  ) {
    safeConfig.background = "plain"
  }

  if (
    safeConfig.background === "library" &&
    !unlocked.has("background_library")
  ) {
    safeConfig.background = "plain"
  }

  return safeConfig
}

function getShopIcon(category: string) {
  if (category === "top") return "👕"
  if (category === "glasses") return "👓"
  if (category === "background") return "🖼️"
  if (category === "badge") return "🏅"
  return "⭐"
}

function formatCategoryName(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
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
  const [purchasingItemKey, setPurchasingItemKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shopMessage, setShopMessage] = useState<string | null>(null)
  const [shopError, setShopError] = useState<string | null>(null)

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
      ? normaliseAvatarConfig(avatarData.avatar_config as Record<string, unknown>)
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
      }
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
          : "Could not claim today’s YanBo Coins."
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
        current.includes(result.itemKey) ? current : [...current, result.itemKey]
      )
      setShopMessage("Item unlocked successfully.")
    } catch (error) {
      setShopError(
        error instanceof Error
          ? error.message
          : "Could not buy this avatar item."
      )
    }

    setPurchasingItemKey(null)
  }

  function updateAvatar<K extends keyof AvatarConfig>(
    key: K,
    value: AvatarConfig[K]
  ) {
    setAvatarConfig((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function isShopItemUnlocked(itemKey: string) {
    return freeStarterItemKeys.has(itemKey) || unlockedItems.includes(itemKey)
  }

  const canUseRoundGlasses = unlockedItems.includes("smart_glasses_round")
  const canUseSquareGlasses = unlockedItems.includes("smart_glasses_square")
  const canUseGreenHoodie = unlockedItems.includes("yanbo_hoodie_green")
  const canUseClassroomBackground = unlockedItems.includes("background_classroom")
  const canUseLibraryBackground = unlockedItems.includes("background_library")

  const groupedShopItems = useMemo(() => {
    return shopItems.reduce<Record<string, ShopItem[]>>((groups, item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
      return groups
    }, {})
  }, [shopItems])

  const unlockedCount = useMemo(() => {
    return new Set([...Array.from(freeStarterItemKeys), ...unlockedItems]).size
  }, [unlockedItems])

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
                  YanBo Learning
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  <span className="text-pink-500">Yan</span>
                  <span className="text-yellow-400">Bo</span> Avatar Builder
                </h1>
                <p className="mt-3 max-w-2xl text-lg font-medium text-slate-600">
                  Build your learning hero, save your style, and unlock fun
                  items with YanBo Coins.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[430px]">
                <div className="rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
                  <p className="text-sm font-bold text-yellow-800">
                    YanBo Coins
                  </p>
                  <p className="mt-1 text-4xl font-black text-slate-900">
                    {coins}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Earn by learning. Spend in the shop.
                  </p>
                </div>

                <div className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100">
                  <p className="text-sm font-bold text-blue-800">
                    Items unlocked
                  </p>
                  <p className="mt-1 text-4xl font-black text-slate-900">
                    {unlockedCount}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Keep practising to unlock more.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={claimDailyCoins}
                disabled={claimingDailyCoins}
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claimingDailyCoins ? "Claiming..." : "Claim today’s 3 coins"}
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

        <section className="grid gap-6 xl:grid-cols-[330px_1fr_360px]">
          <aside className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Customise
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the look for your learning hero.
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
                    updateAvatar("hairStyle", value as AvatarConfig["hairStyle"])
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
                    updateAvatar("hairColor", value as AvatarConfig["hairColor"])
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
                label="Glasses"
                value={avatarConfig.glasses}
                onChange={(value) =>
                  updateAvatar("glasses", value as AvatarConfig["glasses"])
                }
                options={[
                  { value: "none", label: "No glasses — free" },
                  {
                    value: "round",
                    label: canUseRoundGlasses
                      ? "Round glasses — unlocked"
                      : "Round glasses — locked",
                    disabled: !canUseRoundGlasses,
                  },
                  {
                    value: "square",
                    label: canUseSquareGlasses
                      ? "Square glasses — unlocked"
                      : "Square glasses — locked",
                    disabled: !canUseSquareGlasses,
                  },
                ]}
              />

              <SelectBox
                label="Top"
                value={avatarConfig.top}
                onChange={(value) =>
                  updateAvatar("top", value as AvatarConfig["top"])
                }
                options={[
                  { value: "yanbo_navy", label: "YanBo Navy Jumper — free" },
                  {
                    value: "yanbo_green",
                    label: canUseGreenHoodie
                      ? "YanBo Green Hoodie — unlocked"
                      : "YanBo Green Hoodie — locked",
                    disabled: !canUseGreenHoodie,
                  },
                ]}
              />

              <SelectBox
                label="Background"
                value={avatarConfig.background}
                onChange={(value) =>
                  updateAvatar(
                    "background",
                    value as AvatarConfig["background"]
                  )
                }
                options={[
                  { value: "plain", label: "Plain — free" },
                  {
                    value: "classroom",
                    label: canUseClassroomBackground
                      ? "Classroom — unlocked"
                      : "Classroom — locked",
                    disabled: !canUseClassroomBackground,
                  },
                  {
                    value: "library",
                    label: canUseLibraryBackground
                      ? "Library — unlocked"
                      : "Library — locked",
                    disabled: !canUseLibraryBackground,
                  },
                ]}
              />
            </div>
          </aside>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-blue-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Your avatar
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Preview your current YanBo Learning style.
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

            <div className="mt-6 flex min-h-[520px] items-center justify-center rounded-[2rem] bg-gradient-to-b from-blue-50 via-white to-pink-50 p-6 ring-1 ring-blue-100">
              <div className="relative flex w-full max-w-xl flex-col items-center">
                <div className="absolute left-8 top-10 text-3xl">⭐</div>
                <div className="absolute right-10 top-16 text-2xl">✨</div>
                <div className="absolute bottom-16 left-12 text-3xl">📘</div>
                <div className="absolute bottom-20 right-12 text-3xl">🏆</div>

                <div
                  className={`relative flex h-80 w-80 items-center justify-center overflow-hidden rounded-full border-8 border-white shadow-xl ring-8 ${
                    avatarConfig.background === "classroom"
                      ? "bg-amber-100 ring-amber-200"
                      : avatarConfig.background === "library"
                        ? "bg-sky-100 ring-sky-200"
                        : "bg-emerald-100 ring-emerald-200"
                  }`}
                >
                  <div className="absolute inset-0 flex items-end justify-center text-8xl opacity-20">
                    {avatarConfig.background === "classroom"
                      ? "📚"
                      : avatarConfig.background === "library"
                        ? "🏛️"
                        : "✨"}
                  </div>

                  <div className="relative flex flex-col items-center">
                    <div
                      className={`flex h-36 w-36 items-center justify-center rounded-full text-7xl shadow-md ${
                        avatarConfig.skinTone === "light"
                          ? "bg-orange-100"
                          : avatarConfig.skinTone === "medium"
                            ? "bg-orange-200"
                            : "bg-orange-300"
                      }`}
                    >
                      {avatarConfig.base === "yan" ? "😊" : "🙂"}
                    </div>

                    <div
                      className={`-mt-32 mb-20 h-12 rounded-full ${
                        avatarConfig.hairStyle === "long"
                          ? "w-32"
                          : avatarConfig.hairStyle === "medium"
                            ? "w-28"
                            : "w-24"
                      } ${
                        avatarConfig.hairColor === "brown"
                          ? "bg-amber-900"
                          : avatarConfig.hairColor === "black"
                            ? "bg-slate-900"
                            : avatarConfig.hairColor === "blonde"
                              ? "bg-yellow-300"
                              : "bg-orange-500"
                      }`}
                    />

                    {avatarConfig.glasses !== "none" && (
                      <div className="-mt-16 mb-12 text-5xl">
                        {avatarConfig.glasses === "round" ? "👓" : "▭▭"}
                      </div>
                    )}

                    <div
                      className={`mt-2 flex h-28 w-44 items-center justify-center rounded-t-[2rem] text-2xl font-black shadow-md ${
                        avatarConfig.top === "yanbo_green"
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      <span>
                        <span className="text-pink-400">Y</span>an
                        <span className="text-yellow-300">B</span>o
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-slate-100">
                  <p className="font-black text-slate-900">
                    {avatarConfig.base === "yan" ? "Yan" : "Bo"} avatar
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {avatarConfig.background} background • {avatarConfig.eyeColor} eyes
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Avatar Shop
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Unlock new looks with YanBo Coins.
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

              <div className="mt-5 space-y-5">
                {Object.entries(groupedShopItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                      {formatCategoryName(category)}
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      {items.map((item) => {
                        const unlocked = isShopItemUnlocked(item.item_key)

                        return (
                          <div
                            key={item.item_key}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex h-20 items-center justify-center rounded-xl bg-white text-3xl shadow-sm">
                              {getShopIcon(item.category)}
                            </div>

                            <h4 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-black text-slate-900">
                              {item.name}
                            </h4>

                            <p className="mt-1 text-xs font-bold text-yellow-700">
                              {item.price} YanBo Coins
                            </p>

                            {unlocked ? (
                              <div className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-center text-xs font-black text-emerald-700">
                                Unlocked
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  purchaseAvatarItem(item.item_key)
                                }
                                disabled={purchasingItemKey === item.item_key}
                                className="mt-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {purchasingItemKey === item.item_key
                                  ? "Buying..."
                                  : "Buy"}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
              <h2 className="text-lg font-black text-slate-900">
                Earn by learning
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                YanBo Coins reward steady practice, not just perfect scores.
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
