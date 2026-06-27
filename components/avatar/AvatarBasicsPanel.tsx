import type { AvatarConfig, UpdateAvatarFn } from "./avatarTypes"
import { AVATAR_NAME_MAX_LENGTH, avatarBaseOptions } from "./avatarOptions"
import { CARD_CLASS, CHOICE_ACTIVE_CLASS, CHOICE_IDLE_CLASS } from "./avatarStyles"
import { cn } from "./avatarUtils"
import { SectionHeader } from "./AvatarCommon"

export function AvatarBasicsPanel({
  avatarConfig,
  avatarName,
  onAvatarNameChange,
  onUpdateAvatar,
}: {
  avatarConfig: AvatarConfig
  avatarName: string
  onAvatarNameChange: (value: string) => void
  onUpdateAvatar: UpdateAvatarFn
}) {
  return (
    <section className={cn(CARD_CLASS, "xl:sticky xl:top-5 xl:self-start")}>
      <SectionHeader
        title="Customise basics"
        subtitle="Choose the nickname, character, skin tone and eyes."
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
            onChange={(event) => onAvatarNameChange(event.target.value)}
            placeholder="e.g. Puzzle Hero"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <span className="mt-1.5 block text-xs font-semibold leading-relaxed text-slate-500">
            Use a fun nickname, not a full real name. 2–20 characters.
          </span>
        </label>

        <div>
          <p className="mb-2 text-sm font-black text-slate-700">Choose your character</p>
          <div className="grid grid-cols-2 gap-2">
            {avatarBaseOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                active={avatarConfig.base === option.value}
                title={option.label}
                imageSrc={option.imageSrc}
                emoji={option.emoji}
                onClick={() => onUpdateAvatar("base", option.value)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-black text-slate-700">Skin tone</p>
            <div className="flex gap-2">
              <SkinToneButton
                active={avatarConfig.skinTone === "light"}
                tone="light"
                label="Light"
                onClick={() => onUpdateAvatar("skinTone", "light")}
              />
              <SkinToneButton
                active={avatarConfig.skinTone === "medium"}
                tone="medium"
                label="Medium"
                onClick={() => onUpdateAvatar("skinTone", "medium")}
              />
              <SkinToneButton
                active={avatarConfig.skinTone === "dark"}
                tone="dark"
                label="Dark"
                onClick={() => onUpdateAvatar("skinTone", "dark")}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-black text-slate-700">Eye colour</p>
            <div className="flex gap-2">
              <EyeColourButton
                active={avatarConfig.eyeColor === "blue"}
                colour="blue"
                label="Blue"
                onClick={() => onUpdateAvatar("eyeColor", "blue")}
              />
              <EyeColourButton
                active={avatarConfig.eyeColor === "brown"}
                colour="brown"
                label="Brown"
                onClick={() => onUpdateAvatar("eyeColor", "brown")}
              />
              <EyeColourButton
                active={avatarConfig.eyeColor === "black"}
                colour="black"
                label="Black"
                onClick={() => onUpdateAvatar("eyeColor", "black")}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
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
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none"
            }}
          />
        )}
      </div>
      <div>
        <p className="font-black text-slate-900">{title}</p>
        {subtitle && <p className="text-xs font-semibold text-slate-500">{subtitle}</p>}
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
      <span className={`h-7 w-7 shrink-0 rounded-full shadow-inner ring-2 ring-white ${toneClass}`} />
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
