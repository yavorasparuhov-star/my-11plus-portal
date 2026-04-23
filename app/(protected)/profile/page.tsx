"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

type ProfileFormData = {
  first_name: string
  last_name: string
  nickname: string
  phone: string
  email: string
}

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    nickname: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setMessage("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push("/login")
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, nickname, phone, email")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError)
        setMessage("There was a problem loading your profile.")
      }

      setFormData({
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        nickname: profile?.nickname || "",
        phone: profile?.phone || "",
        email: profile?.email || user.email || "",
      })

      setLoading(false)
    }

    loadProfile()
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
      first_name: formData.first_name,
      last_name: formData.last_name,
      nickname: formData.nickname,
      phone: formData.phone,
      email: formData.email,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving profile:", error)
      setMessage("There was a problem saving your profile. Please try again.")
    } else {
      setMessage("Profile saved successfully.")
    }

    setSaving(false)
  }

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

          <div>
            <p style={styles.eyebrow}>Student profile</p>
            <h1 style={styles.brandTitle}>YanBo Learning</h1>
            <p style={styles.brandSubtitle}>
              Manage your learning details and keep your 11+ progress connected
              to your account.
            </p>
          </div>
        </section>

        <section style={styles.contentGrid}>
          <div style={styles.infoCard}>
            <h2 style={styles.cardTitle}>Your account</h2>
            <p style={styles.cardText}>
              These details help personalise the YanBo Learning experience across
              tests, progress tracking and review pages.
            </p>

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

          <form onSubmit={handleSave} style={styles.formCard}>
            <div style={styles.formHeader}>
              <div>
                <h2 style={styles.cardTitle}>Profile details</h2>
                <p style={styles.cardText}>
                  Update your personal details below.
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

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 0.8fr) minmax(320px, 1.5fr)",
    gap: 24,
  },

  infoCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    alignSelf: "start",
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