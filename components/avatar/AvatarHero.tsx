import Link from "next/link"
import { SMALL_PRIMARY_BUTTON_CLASS, LINK_BUTTON_SLATE_CLASS } from "./avatarStyles"
import { CompactStat } from "./AvatarCommon"

export function AvatarHero({
  coins,
  unlockedCount,
  claimingDailyCoins,
  onClaimDailyCoins,
}: {
  coins: number
  unlockedCount: number
  claimingDailyCoins: boolean
  onClaimDailyCoins: () => void
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-blue-50 to-yellow-50 p-5 shadow-sm ring-1 ring-blue-100">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-yellow-200/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-pink-200/30 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Your <span className="text-pink-500">Y</span>an<span className="text-yellow-400">B</span>o Avatar
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            Make your learning character feel like yours. Try a look, equip your favourite items and save it for the portal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onClaimDailyCoins}
            disabled={claimingDailyCoins}
            className={SMALL_PRIMARY_BUTTON_CLASS}
          >
            {claimingDailyCoins ? "Checking..." : "Claim +3 coins"}
          </button>

          <Link href="/profile" className={LINK_BUTTON_SLATE_CLASS}>
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <CompactStat icon="🪙" value={`${coins}`} label="YanBo Coins" />
        <CompactStat icon="🎒" value={`${unlockedCount}`} label="Items unlocked" />
      </div>
    </section>
  )
}
