"use client"

import { useEffect, useState } from "react"
import type { AvatarConfig, ShopGalleryPrimaryAction, ShopItem } from "./avatarTypes"
import { cn, getShopItemEmoji, getShopItemImageSources } from "./avatarUtils"

export function ShopGalleryItemCard({
  item,
  base,
  unlocked,
  equipped,
  canAfford,
  priceLabel,
  primaryAction,
}: {
  item: ShopItem
  base: AvatarConfig["base"]
  unlocked: boolean
  equipped: boolean
  canAfford: boolean
  priceLabel?: string
  primaryAction?: ShopGalleryPrimaryAction
}) {
  const locked = !unlocked && !canAfford
  const readyToBuy = !unlocked && canAfford

  return (
    <div
      className={cn(
        "relative flex min-h-[184px] flex-col items-center justify-between overflow-hidden rounded-2xl border p-2.5 text-center transition",
        equipped && "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100",
        !equipped && unlocked && "border-emerald-300 bg-white shadow-sm",
        readyToBuy &&
          "border-emerald-400 bg-emerald-50 shadow-sm ring-2 ring-emerald-100 hover:bg-emerald-100/70",
        locked && "border-slate-200 bg-slate-50 opacity-95",
      )}
    >
      {equipped && (
        <span className="absolute right-3 top-3 z-30 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">
          ✓ Equipped
        </span>
      )}

      {!equipped && unlocked && (
        <span className="absolute right-3 top-3 z-30 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-black text-white shadow-sm">
          ✓ Owned
        </span>
      )}

      {readyToBuy && (
        <span className="absolute right-3 top-3 z-30 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">
          Ready
        </span>
      )}

      <ShopGalleryItemImage item={item} base={base} dimmed={locked} />

      <div className="relative z-20 mt-1.5 w-full min-w-0">
        <h3 className="line-clamp-2 min-h-[2rem] text-xs font-black leading-tight text-slate-900">
          {item.name}
        </h3>

        {priceLabel && (
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black",
              readyToBuy && "bg-emerald-100 text-emerald-800",
              locked && "bg-slate-200 text-slate-500",
            )}
          >
            {priceLabel}
          </span>
        )}
      </div>

      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={cn(
            "relative z-20 mt-2 w-full rounded-2xl px-3 py-1.5 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
            primaryAction.variant === "green" &&
              "bg-emerald-600 text-white hover:bg-emerald-700",
            primaryAction.variant === "light" &&
              "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50",
            primaryAction.variant === "success" && "bg-blue-100 text-blue-700",
          )}
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  )
}

function ShopGalleryItemImage({
  item,
  base,
  dimmed,
}: {
  item: ShopItem
  base: AvatarConfig["base"]
  dimmed: boolean
}) {
  const emoji = getShopItemEmoji(item.item_key, item.category)
  const imageSources = getShopItemImageSources(item, base)
  const sourceKey = imageSources.join("|")
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    setImageIndex(0)
  }, [sourceKey])

  const currentSource = imageSources[imageIndex]

  return (
    <div
      className={cn(
        "relative z-10 mt-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-slate-100",
        dimmed && "bg-slate-100",
      )}
    >
      {currentSource ? (
        <img
          src={currentSource}
          alt=""
          className={cn(
            "h-[4.5rem] w-[4.5rem] object-contain drop-shadow-sm transition",
            dimmed && "grayscale opacity-35",
          )}
          onError={() => setImageIndex((current) => current + 1)}
        />
      ) : (
        <span
          className={cn("text-4xl drop-shadow-sm", dimmed && "grayscale opacity-35")}
          aria-hidden="true"
        >
          {emoji}
        </span>
      )}
      <span className="sr-only">{item.name}</span>
    </div>
  )
}
