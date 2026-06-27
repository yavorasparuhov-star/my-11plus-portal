import type { AvatarConfig, AvatarSlot, ShopItem, UpdateAvatarFn, WardrobeResetOption } from "./avatarTypes"
import { shopCategoryOrder } from "./avatarOptions"
import { CARD_CLASS } from "./avatarStyles"
import { SectionHeader, ShopFilterButton } from "./AvatarCommon"
import { ShopGalleryItemCard } from "./ShopGalleryItemCard"
import {
  cn,
  formatCategoryName,
  getShopIcon,
  getSlotMatchFromItemKey,
  getWardrobeResetOption,
} from "./avatarUtils"

export function AvatarWardrobeSection({
  avatarConfig,
  activeWardrobeCategory,
  filteredWardrobeItems,
  onActiveWardrobeCategoryChange,
  onUpdateAvatar,
  isShopItemEquipped,
  onEquipShopItem,
}: {
  avatarConfig: AvatarConfig
  activeWardrobeCategory: AvatarSlot
  filteredWardrobeItems: ShopItem[]
  onActiveWardrobeCategoryChange: (category: AvatarSlot) => void
  onUpdateAvatar: UpdateAvatarFn
  isShopItemEquipped: (itemKey: string) => boolean
  onEquipShopItem: (itemKey: string) => void
}) {
  const wardrobeResetOption = getWardrobeResetOption(activeWardrobeCategory)

  return (
    <section className={cn(CARD_CLASS, "bg-gradient-to-b from-white to-blue-50/30")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeader
          title="My Wardrobe"
          subtitle="Your unlocked items live here. Equip favourites, then save your avatar."
          icon="🎒"
        />

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {shopCategoryOrder.map((category) => (
            <ShopFilterButton
              key={category}
              active={activeWardrobeCategory === category}
              label={formatCategoryName(category)}
              icon={getShopIcon(category)}
              onClick={() => onActiveWardrobeCategoryChange(category)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {wardrobeResetOption && (
          <WardrobeResetCard
            option={wardrobeResetOption}
            active={avatarConfig[wardrobeResetOption.slot] === wardrobeResetOption.value}
            onClick={() =>
              onUpdateAvatar(wardrobeResetOption.slot, wardrobeResetOption.value)
            }
          />
        )}

        {filteredWardrobeItems.map((item) => {
          const equipped = isShopItemEquipped(item.item_key)
          const canEquip = Boolean(getSlotMatchFromItemKey(item.item_key))

          return (
            <ShopGalleryItemCard
              key={item.item_key}
              item={item}
              base={avatarConfig.base}
              unlocked={true}
              equipped={equipped}
              canAfford={true}
              primaryAction={
                canEquip
                  ? {
                      label: equipped ? "Equipped" : "Equip",
                      disabled: equipped,
                      onClick: () => onEquipShopItem(item.item_key),
                      variant: equipped ? "success" : "light",
                    }
                  : undefined
              }
            />
          )
        })}
      </div>
    </section>
  )
}

function WardrobeResetCard({
  option,
  active,
  onClick,
}: {
  option: WardrobeResetOption
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[184px] flex-col items-center justify-between overflow-hidden rounded-2xl border p-2.5 text-center transition",
        active
          ? "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100"
          : "border-slate-200 bg-white shadow-sm hover:border-blue-200 hover:bg-blue-50/40",
      )}
    >
      {active && (
        <span className="absolute right-3 top-3 z-30 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">
          ✓ Active
        </span>
      )}

      <div className="relative z-10 mt-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white text-4xl shadow-inner ring-1 ring-slate-100">
        {option.icon}
      </div>

      <div className="relative z-20 mt-1.5 w-full min-w-0">
        <h3 className="line-clamp-2 min-h-[2rem] text-xs font-black leading-tight text-slate-900">
          {option.name}
        </h3>
        <span className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
          Free
        </span>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={active}
        className={cn(
          "relative z-20 mt-2 w-full rounded-2xl px-3 py-1.5 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
          active
            ? "bg-blue-100 text-blue-700"
            : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50",
        )}
      >
        {active ? "Active" : "Use"}
      </button>
    </div>
  )
}
