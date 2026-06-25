"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import {
  CustomTestsIcon,
  EnglishIcon,
  HomeIcon,
  LogoutIcon,
  MathsIcon,
  NVRIcon,
  ProfileIcon,
  ProgressIcon,
  ReviewIcon,
  VRIcon,
} from "./icons/PortalIcons"
import { supabase } from "../lib/supabaseClient"
import {
  StudentAvatarPortrait,
  defaultAvatar,
  normaliseAvatarConfig,
  normaliseAvatarName,
  type AvatarConfig,
} from "./avatar/StudentAvatarPortrait"

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

function NavText({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      <span>{label}</span>
    </span>
  )
}

export default function Header({ user: propUser, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(propUser ?? null)
  const [loadingUser, setLoadingUser] = useState(!propUser)
  const [profile, setProfile] = useState<HeaderProfile>({
    plan: "guest",
    nickname: "",
    first_name: "",
    email: "",
  })
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar)
  const [avatarName, setAvatarName] = useState("")

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
      const [{ data, error }, { data: avatarData, error: avatarError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("plan, nickname, first_name, email")
            .eq("id", userToLoad.id)
            .maybeSingle(),
          supabase
            .from("student_avatars")
            .select("avatar_config, avatar_name")
            .eq("user_id", userToLoad.id)
            .maybeSingle(),
        ])

      if (error) {
        console.error("Error loading header profile:", error)
      }

      if (avatarError) {
        console.error("Error loading header avatar:", avatarError)
      }

      if (!mounted) return

      const safePlan = normalisePlan(data?.plan)

      setProfile({
        plan: safePlan,
        nickname: data?.nickname || "",
        first_name: data?.first_name || "",
        email: data?.email || userToLoad.email || "",
      })

      setAvatarConfig(
        avatarData?.avatar_config
          ? normaliseAvatarConfig(
              avatarData.avatar_config as Record<string, unknown>,
            )
          : defaultAvatar,
      )
      setAvatarName(normaliseAvatarName(avatarData?.avatar_name))
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
          setProfile({
            plan: "guest",
            nickname: "",
            first_name: "",
            email: "",
          })
          setAvatarConfig(defaultAvatar)
          setAvatarName("")
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
        setProfile({
          plan: "guest",
          nickname: "",
          first_name: "",
          email: "",
        })
        setAvatarConfig(defaultAvatar)
        setAvatarName("")
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

  const handleLogoutClick = async () => {
    setMenuOpen(false)
    setProfileMenuOpen(false)

    if (onLogout) {
      onLogout()
      return
    }

    await supabase.auth.signOut()

    setCurrentUser(null)
    setProfile({
      plan: "guest",
      nickname: "",
      first_name: "",
      email: "",
    })
    setAvatarConfig(defaultAvatar)
    setAvatarName("")

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
      ? "2px solid #facc15"
      : "2px solid transparent",
    color: "#ffffff",
    fontWeight: isActivePath(path) ? 800 : 700,
    backgroundColor: "transparent",
    padding: "8px 6px",
    borderRadius: "0",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  })

  const displayName =
    profile.nickname ||
    profile.first_name ||
    profile.email ||
    activeUser?.email ||
    "Profile"

  const avatarDisplayName = avatarName || displayName

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#064e3b",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.16)",
        boxShadow: "0 8px 22px rgba(6, 78, 59, 0.28)",
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <span
              style={{
                fontSize: "19px",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "#ec4899" }}>Y</span>
              an
              <span style={{ color: "#facc15" }}>B</span>
              o
            </span>

            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.86)",
                fontWeight: 800,
              }}
            >
              Practice Portal
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
            <NavText icon={<HomeIcon />} label="Home" />
          </Link>

          <Link href={englishHref} style={linkStyle(englishHref)}>
            <NavText icon={<EnglishIcon />} label="English" />
          </Link>

          <Link href={mathHref} style={linkStyle(mathHref)}>
            <NavText icon={<MathsIcon />} label="Maths" />
          </Link>

          <Link href={vrHref} style={linkStyle(vrHref)}>
            <NavText icon={<VRIcon />} label="VR" />
          </Link>

          <Link href={nvrHref} style={linkStyle(nvrHref)}>
            <NavText icon={<NVRIcon />} label="NVR" />
          </Link>

          <Link href={customTestsHref} style={linkStyle(customTestsHref)}>
            <NavText icon={<CustomTestsIcon />} label="Custom Tests" />
          </Link>

          {!isGuest && (
            <>
              <Link href="/progress" style={linkStyle("/progress")}>
                <NavText icon={<ProgressIcon />} label="Progress" />
              </Link>

              <Link href="/review" style={linkStyle("/review")}>
                <NavText icon={<ReviewIcon />} label="Review" />
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
                ref={dropdownRef}
                style={{
                  position: "relative",
                }}
              >
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-label="Open YanBo Portal menu"
                  title={displayName}
                  style={{
                    minHeight: "48px",
                    borderRadius: "999px",
                    border: "2px solid #eab308",
                    background: "#facc15",
                    color: "#111827",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "3px 3px 3px 16px",
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(234,179,8,0.22)",
                    fontWeight: 900,
                    fontSize: "14px",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>
                    <span style={{ color: "#ec4899" }}>Y</span>
                    <span style={{ color: "#064e3b" }}>an</span>
                    <span style={{ color: "#ffffff" }}>B</span>
                    <span style={{ color: "#064e3b" }}>o Portal</span>
                  </span>

                  <StudentAvatarPortrait
                    config={avatarConfig}
                    name={avatarDisplayName}
                    size={42}
                    borderWidth={2}
                    displayMode="icon"
                    ariaLabel={`${avatarDisplayName} avatar`}
                    style={{
                      outline: "2px solid rgba(255,255,255,0.92)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.16)",
                      marginLeft: "2px",
                    }}
                  />
                </button>

                {profileMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "50px",
                      width: "270px",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "18px",
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
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                        color: "#1f2937",
                        fontWeight: 700,
                        padding: "10px 12px",
                        borderRadius: "12px",
                      }}
                    >
                      <ProfileIcon />
                      <span>Membership & profile</span>
                    </Link>

                    <Link
                      href="/home"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        textDecoration: "none",
                        color: "#1f2937",
                        fontWeight: 700,
                        padding: "10px 12px",
                        borderRadius: "12px",
                      }}
                    >
                      <HomeIcon />
                      <span>Member home</span>
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
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <LogoutIcon />
                      <span>Log out</span>
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
                <NavText icon={<HomeIcon />} label="Home" />
              </Link>

              <Link
                href={englishHref}
                style={linkStyle(englishHref)}
                onClick={() => setMenuOpen(false)}
              >
                <NavText icon={<EnglishIcon />} label="English" />
              </Link>

              <Link
                href={mathHref}
                style={linkStyle(mathHref)}
                onClick={() => setMenuOpen(false)}
              >
                <NavText icon={<MathsIcon />} label="Maths" />
              </Link>

              <Link
                href={vrHref}
                style={linkStyle(vrHref)}
                onClick={() => setMenuOpen(false)}
              >
                <NavText icon={<VRIcon />} label="VR" />
              </Link>

              <Link
                href={nvrHref}
                style={linkStyle(nvrHref)}
                onClick={() => setMenuOpen(false)}
              >
                <NavText icon={<NVRIcon />} label="NVR" />
              </Link>

              <Link
                href={customTestsHref}
                style={linkStyle(customTestsHref)}
                onClick={() => setMenuOpen(false)}
              >
                <NavText icon={<CustomTestsIcon />} label="Custom Tests" />
              </Link>

              {!isGuest && (
                <>
                  <Link
                    href="/progress"
                    style={linkStyle("/progress")}
                    onClick={() => setMenuOpen(false)}
                  >
                    <NavText icon={<ProgressIcon />} label="Progress" />
                  </Link>

                  <Link
                    href="/review"
                    style={linkStyle("/review")}
                    onClick={() => setMenuOpen(false)}
                  >
                    <NavText icon={<ReviewIcon />} label="Review" />
                  </Link>

                  <Link
                    href="/profile"
                    style={linkStyle("/profile")}
                    onClick={() => setMenuOpen(false)}
                  >
                    <NavText icon={<ProfileIcon />} label="Profile" />
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
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                    color: "#1f2937",
                    background: "#facc15",
                    border: "2px solid #eab308",
                    borderRadius: "999px",
                    padding: "5px 12px 5px 5px",
                    width: "fit-content",
                    maxWidth: "100%",
                  }}
                >
                  <StudentAvatarPortrait
                    config={avatarConfig}
                    name={avatarDisplayName}
                    size={40}
                    borderWidth={2}
                    displayMode="icon"
                    ariaLabel={`${avatarDisplayName} avatar`}
                    style={{
                      flexShrink: 0,
                      outline: "2px solid rgba(255,255,255,0.92)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                    }}
                  />

                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ color: "#ec4899" }}>Y</span>
                      <span style={{ color: "#064e3b" }}>an</span>
                      <span style={{ color: "#ffffff" }}>B</span>
                      <span style={{ color: "#064e3b" }}>o Portal</span>
                    </span>

                    <span
                      title={displayName}
                      style={{
                        fontSize: "12px",
                        color: "#374151",
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "190px",
                      }}
                    >
                      {displayName}
                    </span>
                  </span>
                </Link>

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
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <LogoutIcon />
                  <span>Log out</span>
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