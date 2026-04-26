"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type ProfileFormData = {
  first_name: string
  last_name: string
  nickname: string
  phone: string
  email: string
}

type ProfileRow = {
  first_name: string | null
  last_name: string | null
  nickname: string | null
  phone: string | null
  email: string | null
  plan: string | null
}

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [plan, setPlan] = useState<UserPlan>("free")

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    nickname: "",
    phone: "",
    email: "",
  })

  function normalisePlan(value: string | null | undefined): UserPlan {
    if (
      value === "free" ||
      value === "monthly" ||
      value === "annual" ||
      value === "admin"
    ) {
      return value
    }

    return "free"
  }

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      setLoading(true)
      setMessage("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (userError || !user) {
        router.replace("/login")
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, nickname, phone, email, plan")
        .eq("id", user.id)
        .maybeSingle()

      if (!mounted) return

      if (profileError) {
        console.error("Error loading profile:", profileError)
        setMessage("There was a problem loading your profile.")

        setFormData({
          first_name: "",
          last_name: "",
          nickname: "",
          phone: "",
          email: user.email || "",
        })

        setPlan("free")
        setLoading(false)
        return
      }

      let safeProfile = profile as ProfileRow | null

      if (!safeProfile) {
        const { data: createdProfile, error: createProfileError } =
          await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email || "",
              plan: "free",
              first_name: "",
              last_name: "",
              nickname: "",
              phone: "",
              updated_at: new Date().toISOString(),
            })
            .select("first_name, last_name, nickname, phone, email, plan")
            .single()

        if (!mounted) return

        if (createProfileError) {
          console.error("Error creating profile row:", createProfileError)
          setMessage(
            "Your account is active, but there was a problem creating your profile."
          )

          setFormData({
            first_name: "",
            last_name: "",
            nickname: "",
            phone: "",
            email: user.email || "",
          })

          setPlan("free")
          setLoading(false)
          return
        }

        safeProfile = createdProfile as ProfileRow
      }

      setFormData({
        first_name: safeProfile?.first_name || "",
        last_name: safeProfile?.last_name || "",
        nickname: safeProfile?.nickname || "",
        phone: safeProfile?.phone || "",
        email: safeProfile?.email || user.email || "",
      })

      setPlan(normalisePlan(safeProfile?.plan))
      setLoading(false)
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [router])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) return

    setSaving(true)
    setMessage("")

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      nickname: formData.nickname.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || user.email || "",
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving profile:", error)
      setMessage("There was a problem saving your profile. Please try again.")
    } else {
      setMessage("Profile saved successfully. Refresh the page if the header name has not updated yet.")
    }

    setSaving(false)
  }

  function handleChangePassword() {
    router.push("/forgot-password")
  }

  const planLabel =
    plan === "admin"
      ? "Admin"
      : plan === "monthly"
        ? "Monthly"
        : plan === "annual"
          ? "Annual"
          : "Free"

  const planStyle =
    plan === "admin"
      ? styles.adminPlanBadge
      : plan === "monthly" || plan === "annual"
        ? styles.paidPlanBadge
        : styles.freePlanBadge

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading your profile...</p>
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.brandHero}>
          <div style={styles.logoWrap}>
            <Image
              src="/logo.png"
              alt="YanBo Learning logo"
              width={86}
              height={86}
              priority
              style={styles.logo}
            />
          </div>

          <div style={styles.heroTextWrap}>
            <p style={styles.eyebrow}>Your Profile</p>
            <h1 style={styles.brandTitle}>YanBo Learning</h1>
            <p style={styles.brandSubtitle}>
              Manage your learning details and keep your 11+ progress connected
              to your account.
            </p>
          </div>

          <div style={{ ...styles.planBadge, ...planStyle }}>
            {planLabel}
          </div>
        </section>

        <section style={styles.contentGrid}>
          <div style={styles.leftColumn}>
            <div style={styles.infoCard}>
              <h2 style={styles.cardTitle}>Your account</h2>
              <p style={styles.cardText}>
                These details help personalise the YanBo Learning experience
                across tests, progress tracking and review pages.
              </p>

              <div style={styles.accountSummary}>
                <div>
                  <p style={styles.summaryLabel}>Current plan</p>
                  <p style={styles.summaryValue}>{planLabel}</p>
                </div>

                <div>
                  <p style={styles.summaryLabel}>Account email</p>
                  <p style={styles.summaryValue}>
                    {formData.email || user?.email || "Not set"}
                  </p>
                </div>
              </div>

              <div style={styles.brandMiniCard}>
                <div style={styles.miniLogoWrap}>
                  <Image
                    src="/logo.png"
                    alt="YanBo Learning logo"
                    width={42}
                    height={42}
                    style={styles.miniLogo}
                  />
                </div>

                <div>
                  <p style={styles.miniBrandName}>YanBo Learning</p>
                  <p style={styles.miniBrandText}>11+ Practice Portal</p>
                </div>
              </div>
            </div>

            <div style={styles.securityCard}>
              <div style={styles.securityIcon}>🔐</div>

              <h2 style={styles.cardTitle}>Account security</h2>

              <p style={styles.cardText}>
                Need to change your password? We will send a secure password
                reset link to your email address.
              </p>

              <button
                type="button"
                onClick={handleChangePassword}
                style={styles.passwordButton}
              >
                Change password
              </button>

              <p style={styles.securityNote}>
                You will be taken to the password reset page.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} style={styles.formCard}>
            <div style={styles.formHeader}>
              <div>
                <h2 style={styles.cardTitle}>Profile details</h2>
                <p style={styles.cardText}>
                  Update the details shown in your account and header menu.
                </p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.label}>
                First name
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="First name"
                />
              </label>

              <label style={styles.label}>
                Last name
                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Last name"
                />
              </label>

              <label style={styles.label}>
                Nickname
                <input
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Nickname"
                />
              </label>

              <label style={styles.label}>
                Phone
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Phone number"
                />
              </label>

              <label style={{ ...styles.label, ...styles.fullWidth }}>
                Email
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Email address"
                  type="email"
                />
              </label>

              <label style={{ ...styles.label, ...styles.fullWidth }}>
                Membership plan
                <input
                  value={planLabel}
                  readOnly
                  style={{
                    ...styles.input,
                    background: "#f9fafb",
                    color: "#6b7280",
                    cursor: "not-allowed",
                  }}
                />
              </label>
            </div>

            {message && (
              <p
                style={{
                  ...styles.message,
                  color: message.includes("successfully")
                    ? "#047857"
                    : "#b91c1c",
                  background: message.includes("successfully")
                    ? "#ecfdf5"
                    : "#fef2f2",
                  borderColor: message.includes("successfully")
                    ? "#a7f3d0"
                    : "#fecaca",
                }}
              >
                {message}
              </p>
            )}

            <div style={styles.actions}>
              <button type="submit" disabled={saving} style={styles.saveButton}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f6f8fb 0%, #eef6f2 45%, #f6f8fb 100%)",
    padding: "32px 16px",
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto",
  },

  brandHero: {
    display: "flex",
    alignItems: "center",
    gap: 22,
    background: "#ffffff",
    borderRadius: 28,
    padding: "28px 30px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    marginBottom: 24,
    position: "relative",
  },

  heroTextWrap: {
    flex: 1,
  },

  logoWrap: {
    width: 104,
    height: 104,
    minWidth: 104,
    borderRadius: 28,
    background: "linear-gradient(135deg, #ecfdf5, #eff6ff)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px rgba(16, 185, 129, 0.12)",
  },

  logo: {
    objectFit: "contain",
    borderRadius: 20,
  },

  eyebrow: {
    margin: "0 0 6px",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#059669",
  },

  brandTitle: {
    margin: 0,
    fontSize: "2.25rem",
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#111827",
  },

  brandSubtitle: {
    margin: "10px 0 0",
    maxWidth: 620,
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#4b5563",
  },

  planBadge: {
    padding: "9px 14px",
    borderRadius: 999,
    fontSize: "0.85rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
    border: "1px solid",
  },

  freePlanBadge: {
    background: "#eef2ff",
    color: "#3730a3",
    borderColor: "#c7d2fe",
  },

  paidPlanBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderColor: "#86efac",
  },

  adminPlanBadge: {
    background: "#fef3c7",
    color: "#92400e",
    borderColor: "#fcd34d",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 0.8fr) minmax(320px, 1.5fr)",
    gap: 24,
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  infoCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    alignSelf: "stretch",
  },

  securityCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
  },

  securityIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    background: "#eef2ff",
    color: "#3730a3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: 14,
  },

  securityNote: {
    margin: "12px 0 0",
    color: "#6b7280",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },

  passwordButton: {
    marginTop: 18,
    border: "none",
    borderRadius: 999,
    padding: "11px 18px",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(79, 70, 229, 0.16)",
  },

  accountSummary: {
    marginTop: 20,
    display: "grid",
    gap: 12,
  },

  summaryLabel: {
    margin: "0 0 4px",
    fontSize: "0.8rem",
    color: "#6b7280",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  summaryValue: {
    margin: 0,
    color: "#111827",
    fontWeight: 800,
    fontSize: "0.95rem",
    wordBreak: "break-word",
  },

  formCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 22,
  },

  cardTitle: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#111827",
  },

  cardText: {
    margin: "8px 0 0",
    color: "#6b7280",
    lineHeight: 1.6,
    fontSize: "0.95rem",
  },

  brandMiniCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  miniLogoWrap: {
    width: 54,
    height: 54,
    minWidth: 54,
    borderRadius: 18,
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
  },

  miniLogo: {
    objectFit: "contain",
    borderRadius: 12,
  },

  miniBrandName: {
    margin: 0,
    fontWeight: 800,
    color: "#111827",
  },

  miniBrandText: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "0.9rem",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 700,
    color: "#374151",
    fontSize: "0.95rem",
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  input: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: "1rem",
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },

  message: {
    margin: "20px 0 0",
    border: "1px solid",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
  },

  actions: {
    marginTop: 22,
    display: "flex",
    justifyContent: "flex-end",
  },

  saveButton: {
    border: "none",
    borderRadius: 999,
    padding: "12px 22px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "0.98rem",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(22, 163, 74, 0.25)",
  },

  loadingCard: {
    maxWidth: 520,
    margin: "80px auto",
    background: "#ffffff",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    textAlign: "center",
  },

  loadingText: {
    margin: 0,
    color: "#4b5563",
    fontWeight: 700,
  },
}