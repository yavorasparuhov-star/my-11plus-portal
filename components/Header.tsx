"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

type HeaderProps = {
  user?: any
  onLogout?: () => void
}

export default function Header({ user: propUser, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(propUser ?? null)
  const [loadingUser, setLoadingUser] = useState(!propUser)

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser)
      setLoadingUser(false)
      return
    }

    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setCurrentUser(data.user ?? null)
        setLoadingUser(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setCurrentUser(session?.user ?? null)
        setLoadingUser(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [propUser])

  const handleLogoutClick = async () => {
    if (onLogout) {
      onLogout()
      return
    }

    await supabase.auth.signOut()
    setCurrentUser(null)
    router.push("/login")
  }

  const activeUser = propUser ?? currentUser
  const homeHref = activeUser ? "/home" : "/"

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

  const displayName =
    activeUser?.user_metadata?.nickname ||
    activeUser?.user_metadata?.first_name ||
    activeUser?.email ||
    "User"

  const initial = (
    activeUser?.user_metadata?.nickname?.[0] ||
    activeUser?.user_metadata?.first_name?.[0] ||
    activeUser?.email?.[0] ||
    "U"
  ).toUpperCase()

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
        <Link
          href={homeHref}
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
            flexWrap: "wrap",
          }}
        >
          <Link href={homeHref} style={linkStyle(homeHref)}>
            🏠 Home
          </Link>

          <Link href="/english" style={linkStyle("/english")}>
            📘 English
          </Link>

          <Link href="/math" style={linkStyle("/math")}>
            ➗ Math
          </Link>

          {activeUser && (
            <>
              <Link href="/progress" style={linkStyle("/progress")}>
                📊 Progress
              </Link>
              <Link href="/review" style={linkStyle("/review")}>
                📚 Review
              </Link>
            </>
          )}
        </div>

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
          {loadingUser ? null : activeUser ? (
            <>
              <Link
                href="/profile"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(255,255,255,0.65)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  maxWidth: "190px",
                  transition: "all 0.2s ease",
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
                  {initial}
                </div>

                <span
                  title={displayName}
                  style={{
                    fontSize: "13px",
                    color: "#1f2937",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "120px",
                    display: "inline-block",
                    fontWeight: 600,
                  }}
                >
                  {displayName}
                </span>
              </Link>

              <button
                onClick={handleLogoutClick}
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
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  textDecoration: "none",
                  color: "#1f2937",
                  fontWeight: 600,
                  padding: "8px 14px",
                  borderRadius: "999px",
                  display: "inline-block",
                }}
              >
                Login
              </Link>

              <Link
                href="/signup"
                style={{
                  textDecoration: "none",
                  color: "#065f46",
                  fontWeight: 700,
                  background: "#bbf7d0",
                  padding: "10px 16px",
                  borderRadius: "999px",
                  display: "inline-block",
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

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
                marginBottom: activeUser ? "14px" : "0",
              }}
            >
              <Link
                href={homeHref}
                style={linkStyle(homeHref)}
                onClick={() => setMenuOpen(false)}
              >
                🏠 Home
              </Link>

              <Link
                href="/english"
                style={linkStyle("/english")}
                onClick={() => setMenuOpen(false)}
              >
                📘 English
              </Link>

              <Link
                href="/math"
                style={linkStyle("/math")}
                onClick={() => setMenuOpen(false)}
              >
                ➗ Math
              </Link>

              {activeUser && (
                <>
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
                </>
              )}

              {!loadingUser && !activeUser && (
                <>
                  <Link
                    href="/login"
                    style={linkStyle("/login")}
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    style={linkStyle("/signup")}
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {activeUser && (
              <div
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.07)",
                  paddingTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    textDecoration: "none",
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
                    {initial}
                  </div>

                  <span
                    style={{
                      fontSize: "14px",
                      color: "#1f2937",
                      wordBreak: "break-all",
                    }}
                  >
                    {displayName}
                  </span>
                </Link>

                <button
                  onClick={handleLogoutClick}
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
            )}
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