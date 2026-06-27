import { FILTER_ACTIVE_CLASS, FILTER_IDLE_CLASS } from "./avatarStyles"
import { cn } from "./avatarUtils"

export function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl shadow-sm ring-1 ring-blue-100">
        {icon}
      </div>
    </div>
  )
}

export function CompactStat({
  icon,
  value,
  label,
}: {
  icon: string
  value: string
  label: string
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-blue-100">
      <span>{icon}</span>
      <span className="font-black text-slate-950">{value}</span>
      <span>{label}</span>
    </div>
  )
}

export function StyleChip({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-100">
      <span>{icon}</span>
      <span className="text-slate-400">{label}:</span>
      <span className="truncate font-black text-slate-800">{value}</span>
    </span>
  )
}

export function ShopFilterButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2 text-xs font-black transition",
        active ? FILTER_ACTIVE_CLASS : FILTER_IDLE_CLASS,
      )}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  )
}

export function RewardRule({ amount, label }: { amount: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-yellow-100">
      <span>{label}</span>
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-black text-yellow-800">
        +{amount}
      </span>
    </div>
  )
}
