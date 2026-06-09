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

    if (avatarData?.avatar_config) {
      setAvatarConfig(
        normaliseAvatarConfig(
          avatarData.avatar_config as Record<string, unknown>
        )
      )
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

    setUnlockedItems((unlockedData || []).map((item) => item.item_key))

    setLoading(false)
  }

  async function saveAvatar() {
    if (!userId) return

    setSaving(true)
    setMessage(null)
    setError(null)
    setShopMessage(null)
    setShopError(null)

    const { error: saveError } = await supabase.from("student_avatars").upsert(
      {
        user_id: userId,
        avatar_config: avatarConfig,
        selected_base: avatarConfig.base,
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

  const groupedShopItems = useMemo(() => {
    return shopItems.reduce<Record<string, ShopItem[]>>((groups, item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
      return groups
    }, {})
  }, [shopItems])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-700">Loading your YanBo avatar...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                YanBo Learning
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                My Avatar
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Choose Yan or Bo, build your learning character, save your
                style, and unlock new items with YanBo Coins.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center ring-1 ring-emerald-100">
              <p className="text-sm font-medium text-emerald-700">
                YanBo Coins
              </p>
              <p className="text-3xl font-bold text-emerald-900">{coins}</p>

              <button
                onClick={claimDailyCoins}
                disabled={claimingDailyCoins}
                className="mt-3 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claimingDailyCoins
                  ? "Claiming..."
                  : "Claim today’s 3 coins"}
              </button>
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

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <h2 className="text-xl font-bold text-slate-900">Preview</h2>

            <div className="mt-5 flex justify-center">
              <div
                className={`relative flex h-72 w-72 items-center justify-center overflow-hidden rounded-full border-8 border-white shadow-lg ring-4 ${
                  avatarConfig.background === "classroom"
                    ? "bg-amber-100 ring-amber-200"
                    : avatarConfig.background === "library"
                    ? "bg-sky-100 ring-sky-200"
                    : "bg-emerald-100 ring-emerald-200"
                }`}
              >
                <div className="absolute inset-0 flex items-end justify-center text-7xl opacity-20">
                  {avatarConfig.background === "classroom"
                    ? "📚"
                    : avatarConfig.background === "library"
                    ? "🏛️"
                    : "✨"}
                </div>

                <div className="relative flex flex-col items-center">
                  <div
                    className={`flex h-32 w-32 items-center justify-center rounded-full text-6xl shadow-md ${
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
                    className={`-mt-28 mb-16 h-10 rounded-full ${
                      avatarConfig.hairStyle === "long"
                        ? "w-28"
                        : avatarConfig.hairStyle === "medium"
                        ? "w-24"
                        : "w-20"
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
                    <div className="-mt-14 mb-10 text-4xl">
                      {avatarConfig.glasses === "round" ? "👓" : "▭▭"}
                    </div>
                  )}

                  <div
                    className={`mt-2 flex h-24 w-36 items-center justify-center rounded-t-3xl text-xl font-black shadow-md ${
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

                  <div className="mt-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {avatarConfig.base === "yan" ? "Yan" : "Bo"} avatar • Eyes:{" "}
                    {avatarConfig.eyeColor}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={saveAvatar}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Avatar"}
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <h2 className="text-xl font-bold text-slate-900">
              Avatar Builder
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Yan — girl avatar. Bo — boy avatar. Choose one to start building
              your YanBo Learning character.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <SelectBox
                label="Base avatar"
                value={avatarConfig.base}
                onChange={(value) =>
                  updateAvatar("base", value as AvatarConfig["base"])
                }
                options={[
                  ["yan", "Yan — girl avatar"],
                  ["bo", "Bo — boy avatar"],
                ]}
              />

              <SelectBox
                label="Skin tone"
                value={avatarConfig.skinTone}
                onChange={(value) =>
                  updateAvatar("skinTone", value as AvatarConfig["skinTone"])
                }
                options={[
                  ["light", "Light"],
                  ["medium", "Medium"],
                  ["dark", "Dark"],
                ]}
              />

              <SelectBox
                label="Hair style"
                value={avatarConfig.hairStyle}
                onChange={(value) =>
                  updateAvatar("hairStyle", value as AvatarConfig["hairStyle"])
                }
                options={[
                  ["short", "Short"],
                  ["medium", "Medium"],
                  ["long", "Long"],
                ]}
              />

              <SelectBox
                label="Hair colour"
                value={avatarConfig.hairColor}
                onChange={(value) =>
                  updateAvatar("hairColor", value as AvatarConfig["hairColor"])
                }
                options={[
                  ["brown", "Brown"],
                  ["black", "Black"],
                  ["blonde", "Blonde"],
                  ["ginger", "Ginger"],
                ]}
              />

              <SelectBox
                label="Eye colour"
                value={avatarConfig.eyeColor}
                onChange={(value) =>
                  updateAvatar("eyeColor", value as AvatarConfig["eyeColor"])
                }
                options={[
                  ["brown", "Brown"],
                  ["blue", "Blue"],
                  ["green", "Green"],
                ]}
              />

              <SelectBox
                label="Glasses"
                value={avatarConfig.glasses}
                onChange={(value) =>
                  updateAvatar("glasses", value as AvatarConfig["glasses"])
                }
                options={[
                  ["none", "No glasses"],
                  ["round", "Round glasses"],
                  ["square", "Square glasses"],
                ]}
              />

              <SelectBox
                label="Top"
                value={avatarConfig.top}
                onChange={(value) =>
                  updateAvatar("top", value as AvatarConfig["top"])
                }
                options={[
                  ["yanbo_navy", "YanBo Navy Jumper"],
                  ["yanbo_green", "YanBo Green Hoodie"],
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
                  ["plain", "Plain"],
                  ["classroom", "Classroom"],
                  ["library", "Library"],
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Avatar Shop Preview
              </h2>
              <p className="mt-1 text-slate-600">
                These are the first shop items from Supabase. Students can buy
                them with YanBo Coins.
              </p>
            </div>

            <Link
              href="/custom-tests"
              className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Practise to earn coins
            </Link>
          </div>

          {shopError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {shopError}
            </div>
          )}

          {shopMessage && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              {shopMessage}
            </div>
          )}

          <div className="mt-6 space-y-6">
            {Object.entries(groupedShopItems).map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  {category}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((item) => {
                    const unlocked = unlockedItems.includes(item.item_key)

                    return (
                      <div
                        key={item.item_key}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex h-24 items-center justify-center rounded-xl bg-white text-4xl shadow-sm">
                          {item.category === "top"
                            ? "👕"
                            : item.category === "glasses"
                            ? "👓"
                            : item.category === "background"
                            ? "🖼️"
                            : item.category === "badge"
                            ? "🏅"
                            : "⭐"}
                        </div>

                        <h4 className="mt-3 font-bold text-slate-900">
                          {item.name}
                        </h4>

                        <p className="mt-1 text-sm text-slate-600">
                          {item.price} YanBo Coins
                        </p>

                        {unlocked ? (
                          <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => purchaseAvatarItem(item.item_key)}
                            disabled={purchasingItemKey === item.item_key}
                            className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>
    </main>
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
  options: [string, string][]
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}