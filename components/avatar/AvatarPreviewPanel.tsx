"use client"

import { useEffect, useState, type ReactNode } from "react"
import type { AvatarConfig, PreviewImageSources } from "./avatarTypes"
import {
  CARD_CLASS,
  PANEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECTION_DIVIDER_CLASS,
} from "./avatarStyles"
import { StyleChip } from "./AvatarCommon"
import {
  backgroundEmoji,
  backgroundStyle,
  badgeDisplay,
  builderOnlySources,
  cn,
  eyeColourClass,
  formatEyeColourLabel,
  formatSkinToneLabel,
  getAvatarBaseEmoji,
  getAvatarBaseLabel,
  getSlotLabel,
  glassesDisplay,
  hatDisplay,
  previewBackgroundOverlay,
  skinToneClass,
} from "./avatarUtils"

export function AvatarPreviewPanel({
  avatarConfig,
  avatarName,
  previewImages,
  saving,
  onSave,
}: {
  avatarConfig: AvatarConfig
  avatarName: string
  previewImages: PreviewImageSources
  saving: boolean
  onSave: () => void
}) {
  return (
    <section className={cn(CARD_CLASS, "overflow-hidden")}>
      <div className={SECTION_DIVIDER_CLASS}>
        <div>
          <h2 className="text-xl font-black text-slate-900">Preview your look</h2>
          <p className="mt-1 text-sm text-slate-500">
            Try items on here. Press Save Avatar when you are happy.
          </p>
        </div>

        <button onClick={onSave} disabled={saving} className={PRIMARY_BUTTON_CLASS}>
          {saving ? "Saving..." : "Save Avatar"}
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[450px_minmax(0,1fr)]">
        <div
          className={`relative mx-auto h-[455px] w-full max-w-[430px] overflow-visible rounded-[2rem] p-0 shadow-inner ring-1 ${backgroundStyle(
            avatarConfig.background,
          )}`}
        >
          {previewImages.background.length > 0 && (
            <PreviewLayerImage
              srcs={previewImages.background}
              alt=""
              className="absolute inset-0 h-full w-full rounded-[2rem] object-cover"
              fallback={null}
            />
          )}

          <div
            className={`absolute inset-0 rounded-[2rem] bg-gradient-to-b ${previewBackgroundOverlay(
              avatarConfig.background,
            )}`}
          />

          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm ring-1 ring-slate-100">
            {backgroundEmoji(avatarConfig.background)} {getSlotLabel("background", avatarConfig.background)}
          </div>

          <div className="absolute inset-x-10 bottom-10 h-14 rounded-[50%] bg-slate-900/10 blur-sm" />

          <div className="relative z-10 flex h-full items-center justify-center pt-6">
            <AvatarPreviewBody config={avatarConfig} imageSources={previewImages} />
          </div>
        </div>

        <div className={cn(PANEL_CLASS, "flex flex-col justify-between")}>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Current look
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {getAvatarBaseLabel(avatarConfig.base)}
            </p>
            <p className="mt-1 text-xs font-bold capitalize text-slate-500">
              {avatarConfig.skinTone} skin • {avatarConfig.eyeColor} eyes
            </p>

            <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 shadow-sm ring-1 ring-slate-100">
              {avatarName || "Avatar nickname not chosen yet"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StyleChip icon="🎨" label="Skin" value={formatSkinToneLabel(avatarConfig.skinTone)} />
              <StyleChip icon="👁️" label="Eyes" value={formatEyeColourLabel(avatarConfig.eyeColor)} />
              <StyleChip icon="👓" label="Glasses" value={getSlotLabel("glasses", avatarConfig.glasses)} />
              <StyleChip icon="🧢" label="Hat" value={getSlotLabel("hat", avatarConfig.hat)} />
              <StyleChip icon="🖼️" label="Background" value={getSlotLabel("background", avatarConfig.background)} />
              <StyleChip icon="🏅" label="Badge" value={getSlotLabel("badge", avatarConfig.badge)} />
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-blue-50 px-3 py-3 text-xs font-bold leading-relaxed text-blue-900 ring-1 ring-blue-100">
            ✅ Items you equip are only kept after you press Save Avatar.
          </div>
        </div>
      </div>
    </section>
  )
}

function AvatarPreviewBody({
  config,
  imageSources,
}: {
  config: AvatarConfig
  imageSources: PreviewImageSources
}) {
  const builderEyeSources = builderOnlySources(imageSources.eyes)
  const builderGlassesSources = builderOnlySources(imageSources.glasses)
  const builderHatSources = builderOnlySources(imageSources.hat)
  const builderBadgeSources = builderOnlySources(imageSources.badge)

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[520px] w-[330px] sm:h-[560px] sm:w-[360px]">
        <PreviewLayerImage
          srcs={imageSources.base}
          alt={`${getAvatarBaseLabel(config.base)} avatar`}
          className="absolute inset-0 z-20 h-full w-full object-contain drop-shadow-2xl"
          fallback={<CssAvatarPreviewBody config={config} imageSources={imageSources} />}
        />

        <PreviewLayerImage
          srcs={builderEyeSources}
          alt={`${config.eyeColor} eyes`}
          className="absolute inset-0 z-40 h-full w-full object-contain"
          fallback={null}
        />

        {config.hat !== "none" && (
          <div className="absolute left-1/2 top-3 z-50 flex -translate-x-1/2 items-center justify-center sm:top-4">
            <PreviewLayerImage
              srcs={builderHatSources}
              alt={getSlotLabel("hat", config.hat)}
              className="h-20 w-28 object-contain drop-shadow-xl sm:h-24 sm:w-32"
              fallback={
                <span className="text-6xl drop-shadow-md sm:text-7xl">
                  {hatDisplay(config.hat)}
                </span>
              }
            />
          </div>
        )}

        {config.glasses !== "none" && (
          <div className="absolute left-1/2 top-[4.35rem] z-50 flex -translate-x-1/2 items-center justify-center sm:top-[4.75rem]">
            <PreviewLayerImage
              srcs={builderGlassesSources}
              alt={getSlotLabel("glasses", config.glasses)}
              className="h-12 w-24 object-contain drop-shadow-md sm:h-14 sm:w-28"
              fallback={
                <span className="text-4xl drop-shadow-sm sm:text-5xl">
                  {glassesDisplay(config.glasses)}
                </span>
              }
            />
          </div>
        )}

        {config.badge !== "none" && (
          <div className="absolute left-[7.6rem] top-[10.25rem] z-50 flex h-10 w-10 items-center justify-center sm:left-[8.3rem] sm:top-[10.9rem] sm:h-11 sm:w-11">
            <PreviewLayerImage
              srcs={builderBadgeSources}
              alt={getSlotLabel("badge", config.badge)}
              className="h-full w-full object-contain drop-shadow-lg"
              fallback={
                <span className="text-xs font-black text-white drop-shadow">
                  {badgeDisplay(config.badge)}
                </span>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CssAvatarPreviewBody({
  config,
  imageSources,
}: {
  config: AvatarConfig
  imageSources: PreviewImageSources
}) {
  return (
    <div className="relative flex flex-col items-center">
      {config.hat !== "none" && (
        <div className="z-40 -mb-4 flex h-24 items-end justify-center">
          <PreviewLayerImage
            srcs={imageSources.hat}
            alt={getSlotLabel("hat", config.hat)}
            className="h-24 w-28 object-contain drop-shadow-xl"
            fallback={<span className="text-7xl drop-shadow-md">{hatDisplay(config.hat)}</span>}
          />
        </div>
      )}

      <div className="relative z-30">
        <div
          className={`relative z-10 flex h-48 w-48 items-center justify-center rounded-full text-7xl shadow-xl ring-8 ring-white ${skinToneClass(
            config.skinTone,
          )}`}
        >
          <span className="mt-4">{getAvatarBaseEmoji(config.base)}</span>
        </div>

        <div className="absolute left-1/2 top-[6.2rem] z-30 flex -translate-x-1/2 gap-9">
          <span className={`h-3 w-3 rounded-full shadow-sm ${eyeColourClass(config.eyeColor)}`} />
          <span className={`h-3 w-3 rounded-full shadow-sm ${eyeColourClass(config.eyeColor)}`} />
        </div>

        {config.glasses !== "none" && (
          <div className="absolute left-1/2 top-[5rem] z-40 flex -translate-x-1/2 items-center justify-center">
            <PreviewLayerImage
              srcs={imageSources.glasses}
              alt={getSlotLabel("glasses", config.glasses)}
              className="h-16 w-28 object-contain drop-shadow-md"
              fallback={<span className="text-5xl drop-shadow-sm">{glassesDisplay(config.glasses)}</span>}
            />
          </div>
        )}
      </div>

      <div className="relative -mt-4 flex h-40 w-64 items-center justify-center overflow-hidden rounded-t-[2.75rem] border-4 border-white bg-slate-800 text-3xl font-black text-white shadow-xl">
        <div className="absolute inset-x-0 top-0 h-14 bg-white/10" />

        {config.badge !== "none" && (
          <div className="absolute left-7 top-10 flex h-10 w-10 items-center justify-center">
            <PreviewLayerImage
              srcs={imageSources.badge}
              alt={getSlotLabel("badge", config.badge)}
              className="h-full w-full object-contain drop-shadow-lg"
              fallback={<span className="text-xs font-black text-white drop-shadow">{badgeDisplay(config.badge)}</span>}
            />
          </div>
        )}

        <span className="relative z-10 drop-shadow-sm">
          <span className="text-pink-400">Y</span>an
          <span className="text-yellow-300">B</span>o
        </span>
      </div>
    </div>
  )
}

function PreviewLayerImage({
  srcs,
  alt,
  className,
  fallback,
}: {
  srcs: string[]
  alt: string
  className: string
  fallback: ReactNode
}) {
  const sourceKey = srcs.join("|")
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    setImageIndex(0)
  }, [sourceKey])

  const currentSource = srcs[imageIndex]

  if (!currentSource) {
    return <>{fallback}</>
  }

  return (
    <img
      src={currentSource}
      alt={alt}
      className={className}
      onError={() => setImageIndex((current) => current + 1)}
    />
  )
}
