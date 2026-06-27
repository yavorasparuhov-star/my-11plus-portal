import type { AvatarConfig, AvatarSlot, ShopItem } from "./avatarTypes"
import { shopCategoryOrder } from "./avatarOptions"
import { CARD_CLASS } from "./avatarStyles"
import { SectionHeader, ShopFilterButton } from "./AvatarCommon"
import { ShopGalleryItemCard } from "./ShopGalleryItemCard"
import { formatCategoryName, getShopIcon } from "./avatarUtils"

export function AvatarShopSection({
  activeShopCategory,
  filteredShopItems,
  groupedFilteredShopItems,
  sortedFilteredShopCategories,
  avatarBase,
  coins,
  purchasingItemKey,
  shopError,
  shopMessage,
  onActiveShopCategoryChange,
  isShopItemUnlocked,
  isShopItemEquipped,
  onEquipShopItem,
  onPurchaseAvatarItem,
}: {
  activeShopCategory: AvatarSlot
  filteredShopItems: ShopItem[]
  groupedFilteredShopItems: Record<string, ShopItem[]>
  sortedFilteredShopCategories: string[]
  avatarBase: AvatarConfig["base"]
  coins: number
  purchasingItemKey: string | null
  shopError: string | null
  shopMessage: string | null
  onActiveShopCategoryChange: (category: AvatarSlot) => void
  isShopItemUnlocked: (itemKey: string) => boolean
  isShopItemEquipped: (itemKey: string) => boolean
  onEquipShopItem: (itemKey: string) => void
  onPurchaseAvatarItem: (itemKey: string) => void
}) {
  return (
    <section className={CARD_CLASS}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeader
          title="Unlock more items"
          subtitle="Spend YanBo Coins on glasses, hats, backgrounds and badges."
          icon="🛒"
        />

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {shopCategoryOrder.map((category) => (
            <ShopFilterButton
              key={category}
              active={activeShopCategory === category}
              label={formatCategoryName(category)}
              icon={getShopIcon(category)}
              onClick={() => onActiveShopCategoryChange(category)}
            />
          ))}
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

              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((item) => {
                  const unlocked = isShopItemUnlocked(item.item_key)
                  const canAfford = coins >= item.price
                  const equipped = isShopItemEquipped(item.item_key)
                  const isPurchasing = purchasingItemKey === item.item_key

                  return (
                    <ShopGalleryItemCard
                      key={item.item_key}
                      item={item}
                      base={avatarBase}
                      unlocked={unlocked}
                      equipped={equipped}
                      canAfford={canAfford}
                      priceLabel={unlocked ? undefined : `${item.price} coins`}
                      primaryAction={
                        unlocked
                          ? {
                              label: equipped ? "Equipped" : "Equip",
                              disabled: equipped,
                              onClick: () => onEquipShopItem(item.item_key),
                              variant: equipped ? "success" : "light",
                            }
                          : canAfford
                            ? {
                                label: isPurchasing ? "Buying..." : "Buy",
                                disabled: isPurchasing,
                                onClick: () => onPurchaseAvatarItem(item.item_key),
                                variant: "green",
                              }
                            : undefined
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
  )
}
