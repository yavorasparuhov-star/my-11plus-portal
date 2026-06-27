import { RewardRule } from "./AvatarCommon"

export function AvatarRewardRules() {
  return (
    <section className="rounded-[2rem] bg-gradient-to-r from-yellow-50 via-white to-blue-50 p-5 shadow-sm ring-1 ring-yellow-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            How to earn YanBo Coins
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep practising and use your coins to unlock more avatar items.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <RewardRule amount="3" label="Daily login" />
          <RewardRule amount="1" label="50% to 74%" />
          <RewardRule amount="2" label="75% to 89%" />
          <RewardRule amount="3" label="90%+" />
        </div>
      </div>
    </section>
  )
}
