"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    nickname: "",
    phone: "",
    email: "",
    email_notifications: true,
  })

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const currentUser = session?.user

      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error)
      }

      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: currentUser.id,
          email: currentUser.email,
        })

        if (insertError) {
          console.error("Error creating profile:", insertError)
        }

        setFormData({
          first_name: "",
          last_name: "",
          nickname: "",
          phone: "",
          email: currentUser.email || "",
          email_notifications: true,
        })
      } else {
        setFormData({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          nickname: profile.nickname || "",
          phone: profile.phone || "",
          email: profile.email || currentUser.email || "",
          email_notifications:
            profile.email_notifications !== null
              ? profile.email_notifications
              : true,
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage("")

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        nickname: formData.nickname,
        phone: formData.phone,
        email: formData.email,
        email_notifications: formData.email_notifications,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (error) {
      console.error("Error saving profile:", error)
      setMessage("Failed to save profile.")
    } else {
      setMessage("Profile updated successfully.")
    }

    setSaving(false)
  }

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading profile...</p>
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
     

      <div style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 20px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "18px",
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#86efac",
                color: "#065f46",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "24px",
              }}
            >
              {formData.first_name?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "U"}
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: "30px", color: "#111827" }}>
                My Profile
              </h1>
              <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
                Manage your personal details and preferences
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nick Name</label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={{ ...inputStyle, backgroundColor: "#f3f4f6", color: "#6b7280" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Email Notifications</label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "14px",
                  color: "#374151",
                }}
              >
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={formData.email_notifications}
                  onChange={handleChange}
                  style={{ transform: "scale(1.2)" }}
                />
                Enable notifications
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "14px 16px",
              borderRadius: "12px",
              backgroundColor: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#166534",
            }}
          >
            Keep your profile details up to date for a better experience.
          </div>

          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "12px 20px",
                borderRadius: "999px",
                border: "none",
                background: "#065f46",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 8px 18px rgba(6,95,70,0.18)",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {message && (
              <span style={{ color: "#166534", fontWeight: 500 }}>{message}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
  color: "#1f2937",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  outline: "none",
  backgroundColor: "#fff",
  color: "#111827",
}