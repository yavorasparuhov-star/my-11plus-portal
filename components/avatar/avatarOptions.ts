import type { AvatarConfig, AvatarSlot, SlotOption } from "./avatarTypes"

export const defaultAvatar: AvatarConfig = {
  base: "bo",
  skinTone: "light",
  eyeColor: "blue",
  glasses: "none",
  background: "plain",
  hat: "none",
  badge: "none",
}

export const AVATAR_NAME_MAX_LENGTH = 20

export const freeStarterItemKeys = new Set<string>()

export const hiddenAvatarItemKeys = new Set<string>([
  "hat_headphones",
  "hat_star_headband",
])

export const shopCategoryOrder: AvatarSlot[] = [
  "glasses",
  "hat",
  "background",
  "badge",
]

export const slotOptions: Record<AvatarSlot, SlotOption[]> = {
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
