"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"
import { AvatarBasicsPanel } from "../../../components/avatar/AvatarBasicsPanel"
import { AvatarHero } from "../../../components/avatar/AvatarHero"
import { AvatarPreviewPanel } from "../../../components/avatar/AvatarPreviewPanel"
import { AvatarRewardRules } from "../../../components/avatar/AvatarRewardRules"
import { AvatarShopSection } from "../../../components/avatar/AvatarShopSection"
import { AvatarWardrobeSection } from "../../../components/avatar/AvatarWardrobeSection"
import { defaultAvatar, freeStarterItemKeys, hiddenAvatarItemKeys } from "../../../components/avatar/avatarOptions"
import {
  ALERT_ERROR_CLASS,
  ALERT_SUCCESS_CLASS,
  PAGE_CLASS,
  PAGE_INNER_CLASS,
} from "../../../components/avatar/avatarStyles"
import type { AvatarConfig, AvatarSlot, PreviewImageSources, ShopItem } from "../../../components/avatar/avatarTypes"
import {
  getPreviewLayerImageSources,
  getBaseAvatarImageSources,
  getEyeOverlayImageSources,
  getSlotMatchFromItemKey,
  isSupportedShopCategory,
  makeAvatarConfigSafe,
  normaliseAvatarConfig,
  normaliseAvatarName,
  isAvatarNameValid,
} from "../../../components/avatar/avatarUtils"

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
  const [activeShopCategory, setActiveShopCategory] = useState<AvatarSlot>("glasses")
  const [activeWardrobeCategory, setActiveWardrobeCategory] =
    useState<AvatarSlot>("glasses")

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

  const filteredShopItems = useMemo(() => {
    return shopItems.filter((item) => item.category === activeShopCategory)
  }, [activeShopCategory, shopItems])

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
      const indexA = ["glasses", "hat", "background", "badge"].indexOf(categoryA)
      const indexB = ["glasses", "hat", "background", "badge"].indexOf(categoryB)
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
        <AvatarHero
          coins={coins}
          unlockedCount={unlockedCount}
          claimingDailyCoins={claimingDailyCoins}
          onClaimDailyCoins={claimDailyCoins}
        />

        {error && <div className={ALERT_ERROR_CLASS}>{error}</div>}
        {message && <div className={ALERT_SUCCESS_CLASS}>{message}</div>}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <AvatarPreviewPanel
            avatarConfig={avatarConfig}
            avatarName={avatarName}
            previewImages={previewImages}
            saving={saving}
            onSave={saveAvatar}
          />

          <AvatarBasicsPanel
            avatarConfig={avatarConfig}
            avatarName={avatarName}
            onAvatarNameChange={setAvatarName}
            onUpdateAvatar={updateAvatar}
          />
        </section>

        <AvatarWardrobeSection
          avatarConfig={avatarConfig}
          activeWardrobeCategory={activeWardrobeCategory}
          filteredWardrobeItems={filteredWardrobeItems}
          onActiveWardrobeCategoryChange={setActiveWardrobeCategory}
          onUpdateAvatar={updateAvatar}
          isShopItemEquipped={isShopItemEquipped}
          onEquipShopItem={equipShopItem}
        />

        <AvatarShopSection
          activeShopCategory={activeShopCategory}
          filteredShopItems={filteredShopItems}
          groupedFilteredShopItems={groupedFilteredShopItems}
          sortedFilteredShopCategories={sortedFilteredShopCategories}
          avatarBase={avatarConfig.base}
          coins={coins}
          purchasingItemKey={purchasingItemKey}
          shopError={shopError}
          shopMessage={shopMessage}
          onActiveShopCategoryChange={setActiveShopCategory}
          isShopItemUnlocked={isShopItemUnlocked}
          isShopItemEquipped={isShopItemEquipped}
          onEquipShopItem={equipShopItem}
          onPurchaseAvatarItem={purchaseAvatarItem}
        />

        <AvatarRewardRules />
      </div>
    </main>
  )
}
