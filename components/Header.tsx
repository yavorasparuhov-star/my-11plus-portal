"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabaseClient"

type HeaderProps = {
  user?: any
  onLogout?: () => void
}

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type HeaderProfile = {
  plan: UserPlan
  nickname: string
  first_name: string
  email: string
}

export default function Header({ user: propUser, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(propUser ?? null)
  const [loadingUser, setLoadingUser] = useState(!propUser)
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [profile, setProfile] = useState<HeaderProfile>({
    plan: "guest",
    nickname: "",
    first_name: "",
    email: "",
  })

  useEffect(() => {
    setMenuOpen(false)
    setProfileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    function normalisePlan(value: string | null | undefined): UserPlan {
      if (
        value === "monthly" ||
        value === "annual" ||
        value === "admin" ||
        value === "free"
      ) {
        return value
      }

      return "free"
    }

    async function loadProfile(userToLoad: any) {
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, nickname, first_name, email")
        .eq("id", userToLoad.id)
        .maybeSingle()

      if (error) {
        console.error("Error loading header profile:", error)
      }

      if (!mounted) return

      const safePlan = normalisePlan(data?.plan)

      setPlan(safePlan)

      setProfile({
        plan: safePlan,
        nickname: data?.nickname || "",
        first_name: data?.first_name || "",
        email: data?.email || userToLoad.email || "",
      })
    }

    async function loadUserAndProfile(sessionUser?: any) {
      try {
        const userToLoad = propUser ?? sessionUser

        if (userToLoad) {
          if (!mounted) return

          setCurrentUser(userToLoad)
          await loadProfile(userToLoad)

          if (!mounted) return
          setLoadingUser(false)
          return
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting auth session:", sessionError)
        }

        if (!mounted) return

        const sessionUserFromClient = session?.user ?? null
        setCurrentUser(sessionUserFromClient)

        if (!sessionUserFromClient) {
          setPlan("guest")
          setProfile({
            plan: "guest",
            nickname: "",
            first_name: "",
            email: "",
          })
          setLoadingUser(false)
          return
        }

        await loadProfile(sessionUserFromClient)

        if (!mounted) return
        setLoadingUser(false)
      } catch (error) {
        console.error("Error loading header user:", error)

        if (!mounted) return

        setCurrentUser(null)
        setPlan("guest")
        setProfile({
          plan: "guest",
          nickname: "",
          first_name: "",
          email: "",
        })
        setLoadingUser(false)
      }
    }

    loadUserAndProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      loadUserAndProfile(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [propUser])

  const activeUser = propUser ?? currentUser
  const isGuest = !activeUser

  const homeHref = isGuest ? "/" : "/home"
  const englishHref = "/english"
  const mathHref = "/math"
  const vrHref = "/vr"
  const nvrHref = "/nvr"
  const customTestsHref = "/custom-tests"
  const membershipHref = "/"

  const handleLogoutClick = async () => {
    setMenuOpen(false)
    setProfileMenuOpen(false)

    if (onLogout) {
      onLogout()
      return
    }

    await supabase.auth.signOut()

    setCurrentUser(null)
    setPlan("guest")
    setProfile({
      plan: "guest",
      nickname: "",
      first_name: "",
      email: "",
    })

    router.replace("/login")
    router.refresh()
  }

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
    profile.nickname ||
    profile.first_name ||
    profile.email ||
    activeUser?.email ||
    "Profile"

  const initial = (
    profile.nickname?.[0] ||
    profile.first_name?.[0] ||
    profile.email?.[0] ||
    activeUser?.email?.[0] ||
    "U"
  ).toUpperCase()

  const planBadgeText =
    plan === "admin"
      ? "Admin"
      : plan === "monthly"
        ? "Monthly"
        : plan === "annual"
          ? "Annual"
          : plan === "free"
            ? "Free"
            : "Guest"

  const planBadgeStyle: React.CSSProperties =
    plan === "admin"
      ? {
          background: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
        }
      : plan === "monthly" || plan === "annual"
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

          <Link href={customTestsHref} style={linkStyle(customTestsHref)}>
            🛠️ Custom Tests
          </Link>

          {isGuest && (
            <Link href={membershipHref} style={linkStyle(membershipHref)}>
              💎 Membership
            </Link>
          )}

          {!isGuest && (
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

              <div
                ref={dropdownRef}
                style={{
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-label="Open profile menu"
                  title={displayName}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    border: "2px solid rgba(6,95,70,0.18)",
                    background: "white",
                    color: "#065f46",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "16px",
                    cursor: "pointer",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                  }}
                >
                  {initial}
                </button>

                {profileMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "48px",
                      width: "230px",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      boxShadow: "0 18px 38px rgba(0,0,0,0.14)",
                      padding: "10px",
                      zIndex: 2000,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 10px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Signed in as
                      </div>

                      <div
                        title={displayName}
                        style={{
                          fontSize: "15px",
                          fontWeight: 800,
                          color: "#111827",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayName}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "#1f2937",
                        fontWeight: 700,
                        padding: "10px 12px",
                        borderRadius: "12px",
                      }}
                    >
                      👤 Profile
                    </Link>

                    <Link
                      href="/home"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "#1f2937",
                        fontWeight: 700,
                        padding: "10px 12px",
                        borderRadius: "12px",
                      }}
                    >
                      🏠 Member home
                    </Link>

                    <button
                      onClick={handleLogoutClick}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: "none",
                        background: "transparent",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: "15px",
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
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

              <Link
                href={customTestsHref}
                style={linkStyle(customTestsHref)}
                onClick={() => setMenuOpen(false)}
              >
                🛠️ Custom Tests
              </Link>

              {isGuest && (
                <Link
                  href={membershipHref}
                  style={linkStyle(membershipHref)}
                  onClick={() => setMenuOpen(false)}
                >
                  💎 Membership
                </Link>
              )}

              {!isGuest && (
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

                  <Link
                    href="/profile"
                    style={linkStyle("/profile")}
                    onClick={() => setMenuOpen(false)}
                  >
                    👤 Profile
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "white",
                      color: "#065f46",
                      border: "2px solid rgba(6,95,70,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>

                  <span
                    title={displayName}
                    style={{
                      fontSize: "14px",
                      color: "#1f2937",
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </span>
                </div>

                <button
                  onClick={handleLogoutClick}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #fecaca",
                    background: "#fff7f7",
                    color: "#b91c1c",
                    cursor: "pointer",
                    fontWeight: 800,
                    width: "fit-content",
                  }}
                >
                  🚪 Logout
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