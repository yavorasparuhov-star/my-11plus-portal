export type AvatarBase = "yan" | "bo" | "ken" | "kiko"

export type AvatarConfig = {
  base: AvatarBase
  skinTone: "light" | "medium" | "dark"
  eyeColor: "brown" | "blue" | "black"
  glasses: string
  background: string
  hat: string
  badge: string
}

export type AvatarSlot = "glasses" | "background" | "hat" | "badge"

export type ShopItem = {
  item_key: string
  name: string
  category: string
  price: number
  image_url: string | null
  is_active: boolean
}

export type SlotOption = {
  value: string
  label: string
  itemKey?: string
}

export type AvatarBaseOption = {
  value: AvatarBase
  label: string
  imageSrc: string
  emoji: string
}

export type PreviewImageSources = Record<AvatarSlot | "base" | "eyes", string[]>

export type WardrobeResetOption = {
  slot: AvatarSlot
  value: string
  name: string
  icon: string
}

export type UpdateAvatarFn = <K extends keyof AvatarConfig>(
  key: K,
  value: AvatarConfig[K],
) => void

export type ShopGalleryPrimaryAction = {
  label: string
  disabled?: boolean
  onClick: () => void
  variant: "green" | "light" | "success"
}
