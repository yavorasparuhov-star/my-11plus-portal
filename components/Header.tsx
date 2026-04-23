"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

type HeaderProps = {
  user?: any
  onLogout?: () => void
}

type UserPlan = "guest" | "free" | "monthly" | "annual"

export default function Header({ user: propUser, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(propUser ?? null)
  const [loadingUser, setLoadingUser] = useState(!propUser)
  const [plan, setPlan] = useState<UserPlan>("guest")

  useEffect(() => {
    let mounted = true

    async function loadUserAndPlan(sessionUser?: any) {
      const userToLoad = propUser ?? sessionUser

      if (userToLoad) {
        setCurrentUser(userToLoad)

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userToLoad.id)
          .maybeSingle()

        if (error) {
          console.error("Error loading profile plan:", error)
        }

        if (!mounted) return

        const dbPlan = profile?.plan
        setPlan(
          dbPlan === "monthly" || dbPlan === "annual" || dbPlan === "free"
            ? dbPlan
            : "free"
        )
        setLoadingUser(false)
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting authenticated user:", userError)
      }

      if (!mounted) return

      setCurrentUser(user ?? null)

      if (!user) {
        setPlan("guest")
        setLoadingUser(false)
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("Error loading profile plan:", error)
      }

      if (!mounted) return

      const dbPlan = profile?.plan
      setPlan(
        dbPlan === "monthly" || dbPlan === "annual" || dbPlan === "free"
          ? dbPlan
          : "free"
      )
      setLoadingUser(false)
    }

    loadUserAndPlan()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      loadUserAndPlan(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [propUser])

  const handleLogoutClick = async () => {
    setMenuOpen(false)

    if (onLogout) {
      onLogout()
      return
    }

    await supabase.auth.signOut()
    setCurrentUser(null)
    setPlan("guest")
    router.push("/login")
    router.refresh()
  }

  const activeUser = propUser ?? currentUser
  const isGuest = !activeUser

  const homeHref = "/"
  const englishHref = "/english"
  const mathHref = "/math"
  const vrHref = "/vr"
  const nvrHref = "/nvr"
  const customTestsHref = "/custom-tests"
  const pricingHref = "/pricing"

  const isActivePath = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname === path || pathname.startsWith(path + "/")
  }

  const linkStyle = (path: string): React.CSSProperties => ({
    textDecoration: "none",
    borderBottom: isActivePath(path)
      ? "2px solid #065f46"
      : "2px solid transparent",
    color: isActivePath(path) ? "#065f46" : "#1f2937",
    fontWeight: isActivePath(path) ? 700 : 500,
    backgroundColor: "transparent",
    padding: "8px 6px",
    borderRadius: "0",
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

  const planBadgeText =
    plan === "monthly"
      ? "Monthly"
      : plan === "annual"
        ? "Annual"
        : plan === "free"
          ? "Free"
          : "Guest"

  const planBadgeStyle: React.CSSProperties =
    plan === "monthly" || plan === "annual"
      ? {
          background: "#dcfce7",
          color: "#166534",
          border: "1px solid #86efac",
        }
      : plan === "free"
        ? {
            background: "#eef2ff",
            color: "#3730a3",
            border: "1px solid #c7d2fe",
          }
        : {
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
          }

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
          padding: "12px 22px",
          gap: "12px",
          minHeight: "72px",
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
            gap: "12px",
            zIndex: 2,
            whiteSpace: "nowrap",
          }}
        >
<div
  style={{
    width: "58px",
    height: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  }}
>
  <Image
    src="/logo.png"
    alt="YanBo Learning logo"
    width={58}
    height={58}
    priority
    style={{
      objectFit: "contain",
      display: "block",
    }}
  />
</div>

          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
  style={{
    fontSize: "18px",
    fontWeight: 900,
    color: "#111827",
    letterSpacing: "-0.02em",
  }}
>
  <span style={{ color: "#ec4899" }}>Y</span>
  an
  <span style={{ color: "#eab308" }}>B</span>
  o Learning
</span>
            <span
              style={{
                fontSize: "12px",
                color: "#111827",
                fontWeight: 700,
              }}
            >
              11+ Practice Portal
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

          <Link href={englishHref} style={linkStyle(englishHref)}>
            📘 English
          </Link>

          <Link href={mathHref} style={linkStyle(mathHref)}>
            ➗ Math
          </Link>

          <Link href={vrHref} style={linkStyle(vrHref)}>
            🧠 VR
          </Link>

          <Link href={nvrHref} style={linkStyle(nvrHref)}>
            🔷 NVR
          </Link>

          {isGuest && (
            <Link href={pricingHref} style={linkStyle(pricingHref)}>
              💎 Pricing
            </Link>
          )}

          {!isGuest && (
            <>
              <Link href={customTestsHref} style={linkStyle(customTestsHref)}>
                🛠️ Custom Tests
              </Link>

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
              <div
                style={{
                  ...planBadgeStyle,
                  padding: "7px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {planBadgeText}
              </div>

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
                    color: "#111827",
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
                href={englishHref}
                style={linkStyle(englishHref)}
                onClick={() => setMenuOpen(false)}
              >
                📘 English
              </Link>

              <Link
                href={mathHref}
                style={linkStyle(mathHref)}
                onClick={() => setMenuOpen(false)}
              >
                ➗ Math
              </Link>

              <Link
                href={vrHref}
                style={linkStyle(vrHref)}
                onClick={() => setMenuOpen(false)}
              >
                🧠 VR
              </Link>

              <Link
                href={nvrHref}
                style={linkStyle(nvrHref)}
                onClick={() => setMenuOpen(false)}
              >
                🔷 NVR
              </Link>

              {isGuest && (
                <Link
                  href={pricingHref}
                  style={linkStyle(pricingHref)}
                  onClick={() => setMenuOpen(false)}
                >
                  💎 Pricing
                </Link>
              )}

              {!isGuest && (
                <>
                  <Link
                    href={customTestsHref}
                    style={linkStyle(customTestsHref)}
                    onClick={() => setMenuOpen(false)}
                  >
                    🛠️ Custom Tests
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
                <div
                  style={{
                    ...planBadgeStyle,
                    padding: "7px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    width: "fit-content",
                  }}
                >
                  {planBadgeText}
                </div>

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

        @media (max-width: 480px) {
          .mobile-menu-button {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  )
}