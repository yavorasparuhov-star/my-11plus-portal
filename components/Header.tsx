"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Header({ user, onLogout }: any) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkStyle = (path: string): React.CSSProperties => ({
    textDecoration: "none",
    color: pathname === path ? "#065f46" : "#1f2937",
    fontWeight: pathname === path ? 700 : 500,
    backgroundColor: pathname === path ? "#bbf7d0" : "transparent",
    padding: "8px 14px",
    borderRadius: "999px",
    display: "inline-block",
    transition: "all 0.2s ease",
  })

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(212, 245, 208, 0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(6, 95, 70, 0.12)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "14px 22px",
          gap: "12px",
          minHeight: "70px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Logo */}
<Link
  href="/home"
  style={{
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    zIndex: 2,
    whiteSpace: "nowrap",
  }}
>
  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
    <span
      style={{
        fontSize: "18px",
        fontWeight: 800,
        color: "#111827",
      }}
    >
      11+ Trainer
    </span>
    <span
      style={{
        fontSize: "12px",
        color: "#4b5563",
        fontWeight: 500,
      }}
    >
      Learning Portal
    </span>
  </div>
</Link>

        {/* Desktop Nav */}
        <div
          className="desktop-nav"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Link href="/home" style={linkStyle("/home")}>
            🏠 Home
          </Link>
          <Link href="/progress" style={linkStyle("/progress")}>
            📊 Progress
          </Link>
          <Link href="/review" style={linkStyle("/review")}>
            📚 Review
          </Link>
        </div>

        {/* Desktop Right Side */}
        <div
          className="desktop-user"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(0,0,0,0.05)",
              padding: "8px 12px",
              borderRadius: "999px",
              maxWidth: "170px",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#86efac",
                color: "#065f46",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "13px",
                flexShrink: 0,
              }}
            >
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>

            <span
  title={user?.email}
  style={{
    fontSize: "13px",
    color: "#1f2937",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "110px",
    display: "inline-block",
  }}
>
  {user?.email}
</span>
          </div>

          <button
            onClick={onLogout}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "none",
              background: "#ef4444",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 6px 14px rgba(239,68,68,0.22)",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)"
              e.currentTarget.style.boxShadow = "0 10px 18px rgba(239,68,68,0.28)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 6px 14px rgba(239,68,68,0.22)"
            }}
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
          style={{
            marginLeft: "auto",
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            cursor: "pointer",
            display: "none",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            zIndex: 2,
          }}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            display: "none",
            flexDirection: "column",
            padding: "0 22px 18px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: "18px",
              padding: "14px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <Link
                href="/home"
                style={linkStyle("/home")}
                onClick={() => setMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link
                href="/progress"
                style={linkStyle("/progress")}
                onClick={() => setMenuOpen(false)}
              >
                📊 Progress
              </Link>
              <Link
                href="/review"
                style={linkStyle("/review")}
                onClick={() => setMenuOpen(false)}
              >
                📚 Review
              </Link>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.07)",
                paddingTop: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#86efac",
                    color: "#065f46",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                    flexShrink: 0,
                  }}
                >
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>

                <span
                  style={{
                    fontSize: "14px",
                    color: "#1f2937",
                    wordBreak: "break-all",
                  }}
                >
                  {user?.email}
                </span>
              </div>

              <button
                onClick={onLogout}
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  width: "fit-content",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 820px) {
          .desktop-nav,
          .desktop-user {
            display: none !important;
          }

          .mobile-menu-button {
            display: block !important;
          }

          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}