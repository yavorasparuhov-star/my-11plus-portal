"use client"

import Link from "next/link"

export default function Header({ user, onLogout }: any) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px" }}>
        <div style={{ fontWeight: "bold" }}>11+ Trainer</div>

        <div style={{ display: "flex", gap: "15px" }}>
       <Link href="/home">🏠 Home</Link>
          <Link href="/dashboard">📊 Progress</Link>
          <Link href="/revision">📚 Review</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{user?.email}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
    </div>
  )
}