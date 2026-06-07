import React from "react"

type IconProps = {
  size?: number
}

const baseSvgStyle: React.CSSProperties = {
  display: "block",
  flexShrink: 0,
}

export function HomeIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <path d="M3 10.8 12 3l9 7.8" fill="none" stroke="#065f46" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.7 10.5V20h12.6v-9.5" fill="#dcfce7" stroke="#065f46" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M9.4 20v-6.2h5.2V20" fill="#bbf7d0" stroke="#065f46" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export function EnglishIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <path d="M5 4.2h9.3c1.2 0 2.2 1 2.2 2.2v13.4H7.2A2.2 2.2 0 0 1 5 17.6V4.2Z" fill="#2563eb" />
      <path d="M7.2 4.2h9.6A2.2 2.2 0 0 1 19 6.4v13.4H8.4A2.2 2.2 0 0 1 6.2 17.6V5.2c0-.6.4-1 1-1Z" fill="#60a5fa" />
      <path d="M8.6 6.7h7.9v10.6H8.6Z" fill="#eff6ff" />
      <path d="M10.1 9h5M10.1 11.2h5M10.1 13.4h3.7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.2 17.6c0 1.2 1 2.2 2.2 2.2H19" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function MathsIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <path d="M5.4 4.5v15M18.6 4.5v15" stroke="#8b5a2b" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M4 7.5h16M4 11.5h16M4 15.5h16" stroke="#b45309" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="8" cy="7.5" r="1.45" fill="#ef4444" />
      <circle cx="11.5" cy="7.5" r="1.45" fill="#ef4444" />
      <circle cx="15" cy="7.5" r="1.45" fill="#ef4444" />
      <circle cx="9.6" cy="11.5" r="1.45" fill="#f59e0b" />
      <circle cx="13.1" cy="11.5" r="1.45" fill="#f59e0b" />
      <circle cx="16.6" cy="11.5" r="1.45" fill="#f59e0b" />
      <circle cx="7.7" cy="15.5" r="1.45" fill="#22c55e" />
      <circle cx="11.2" cy="15.5" r="1.45" fill="#22c55e" />
      <circle cx="14.7" cy="15.5" r="1.45" fill="#22c55e" />
      <path d="M4 20h16" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function VRIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <rect x="3.5" y="4.5" width="12" height="11" rx="3" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.8" />
      <rect x="8.5" y="8.5" width="12" height="11" rx="3" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.8" />
      <path d="M7.1 12.6 9 7.4h1.3l1.9 5.2" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.8 11h3.7" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15.2 13.1c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5Z" fill="none" stroke="#16a34a" strokeWidth="1.5" />
      <path d="m16.7 17.1 1.2 1.1" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function NVRIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="4.2" fill="#0ea5e9" />
      <path d="M4.8 4.8h7.1v5.1c1.6-.1 2.9 1.1 2.9 2.6s-1.3 2.7-2.9 2.6v4.1H4.8v-6.1c1.7.2 3.1-.9 3.1-2.5S6.5 7.9 4.8 8.1V4.8Z" fill="#bae6fd" />
      <path d="M12.1 4.8h7.1v7.1h-4.1c.1-1.6-1.1-2.9-2.6-2.9-.1 0-.3 0-.4.1V4.8Z" fill="#38bdf8" />
      <path d="M19.2 12.1v7.1h-7.1v-4.1c.1 0 .3.1.4.1 1.5 0 2.7-1.3 2.6-3.1h4.1Z" fill="#bae6fd" />
      <path d="M4.8 12.1h3.3c-.2 1.7.9 3.1 2.5 3.1.5 0 1-.1 1.5-.4v4.4H4.8v-7.1Z" fill="#0ea5e9" />
      <path d="M12 4.8v14.4M4.8 12h14.4" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="4.2" fill="none" stroke="#0284c7" strokeWidth="1.8" />
    </svg>
  )
}

export function CustomTestsIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <rect x="4" y="5" width="13" height="15" rx="2.5" fill="#fef3c7" stroke="#d97706" strokeWidth="1.8" />
      <path d="M7.2 9h6.5M7.2 12h5.2M7.2 15h3.5" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.8 4.3 20 8.5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
      <path d="m17.2 9.6 1.7-1.7 1.2 1.2-1.7 1.7Z" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.2" />
      <path d="M18.4 5.1h2M19.4 4.1v2" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function ProgressIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={baseSvgStyle}
    >
      <rect
        x="3"
        y="3.5"
        width="18"
        height="17"
        rx="3"
        fill="#ecfdf5"
        stroke="#86efac"
        strokeWidth="1.4"
      />

      <path
        d="M5.8 17.2h12.7"
        stroke="#9ca3af"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      <path
        d="M6.2 15.8 9 13.1l2.4 1.7 2.7-3.5 2.1 1.4 3.1-5"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16.9 7.8h2.7v2.7"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="6.2" cy="15.8" r="1" fill="#ef4444" />
      <circle cx="9" cy="13.1" r="1" fill="#ef4444" />
      <circle cx="11.4" cy="14.8" r="1" fill="#ef4444" />
      <circle cx="14.1" cy="11.3" r="1" fill="#ef4444" />
      <circle cx="16.2" cy="12.7" r="1" fill="#ef4444" />
    </svg>
  )
}

export function ReviewIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <path d="M5 4.8h9.5A2.5 2.5 0 0 1 17 7.3v12H7.3A2.3 2.3 0 0 1 5 17V4.8Z" fill="#fce7f3" stroke="#db2777" strokeWidth="1.8" />
      <path d="M8 8.2h5.8M8 11.1h5.8M8 14h3.6" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m15.2 15.5 1.4 1.4 3.2-3.8" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ProfileIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <circle cx="12" cy="8.3" r="3.4" fill="#d1fae5" stroke="#059669" strokeWidth="1.8" />
      <path d="M5.7 19.3c.7-3.3 3-5.2 6.3-5.2s5.6 1.9 6.3 5.2" fill="#ecfdf5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function LogoutIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={baseSvgStyle}>
      <path d="M10.2 5.2H6.8A1.8 1.8 0 0 0 5 7v10a1.8 1.8 0 0 0 1.8 1.8h3.4" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
      <path d="M11.5 12h7.2" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
      <path d="m16 8.8 3.2 3.2-3.2 3.2" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}