"use client"

import Link from "next/link"

export default function Header({ user, onLogout }: any) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 20px",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <Link href="/home" style={{ fontWeight: "bold", textDecoration: "none", color: "black" }}>
  11+ Trainer
</Link>

        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <Link href="/home">🏠 Home</Link>
          <Link href="/progress">📊 Progress</Link>
          <Link href="/review">📚 Review</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{user?.email}</span>
          <button
  onClick={onLogout}
  style={{
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  }}
>
  Logout
</button>
        </div>
      </div>
    </div>
  )
}