"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import {
  StudentAvatarPortrait,
  defaultAvatar,
  normaliseAvatarConfig,
  normaliseAvatarName,
  type AvatarConfig,
} from "../../../components/avatar/StudentAvatarPortrait";

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin";

type ProfileFormData = {
  first_name: string;
  last_name: string;
  phone: string;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  plan: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<UserPlan>("free");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar);
  const [avatarName, setAvatarName] = useState("");
  const [coins, setCoins] = useState(0);
  const [loginEmail, setLoginEmail] = useState("");
  const [todayCoinSummary, setTodayCoinSummary] = useState({
    earned: 0,
    spent: 0,
  });

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    phone: "",
  });

  function normalisePlan(value: string | null | undefined): UserPlan {
    if (
      value === "free" ||
      value === "monthly" ||
      value === "annual" ||
      value === "admin"
    ) {
      return value;
    }

    return "free";
  }

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setLoginEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, email, plan")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setMessage("There was a problem loading your profile.");

        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
        });

        setPlan("free");
        setLoading(false);
        return;
      }

      let safeProfile = profile as ProfileRow | null;

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
              phone: "",
              updated_at: new Date().toISOString(),
            })
            .select("first_name, last_name, phone, email, plan")
            .single();

        if (!mounted) return;

        if (createProfileError) {
          console.error("Error creating profile row:", createProfileError);
          setMessage(
            "Your account is active, but there was a problem creating your profile.",
          );

          setFormData({
            first_name: "",
            last_name: "",
            phone: "",
          });

          setPlan("free");
          setLoading(false);
          return;
        }

        safeProfile = createdProfile as ProfileRow;
      }

      setFormData({
        first_name: safeProfile?.first_name || "",
        last_name: safeProfile?.last_name || "",
        phone: safeProfile?.phone || "",
      });

      setLoginEmail(user.email || safeProfile?.email || "");
      setPlan(normalisePlan(safeProfile?.plan));

      const { data: avatarData, error: avatarError } = await supabase
        .from("student_avatars")
        .select("avatar_config, avatar_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (avatarError) {
        console.error("Error loading YanBo avatar:", avatarError);
      } else {
        setAvatarName(normaliseAvatarName(avatarData?.avatar_name));

        if (avatarData?.avatar_config) {
          setAvatarConfig(
            normaliseAvatarConfig(
              avatarData.avatar_config as Record<string, unknown>,
            ),
          );
        } else {
          setAvatarConfig(defaultAvatar);
        }
      }

      const { data: walletData, error: walletError } = await supabase
        .from("yanbo_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) {
        console.error("Error loading YanBo Coins:", walletError);
      } else if (
        walletData?.balance !== undefined &&
        walletData?.balance !== null
      ) {
        setCoins(walletData.balance);
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

      const { data: todayTransactionsData, error: todayTransactionsError } =
        await supabase
          .from("yanbo_token_transactions")
          .select("amount")
          .eq("user_id", user.id)
          .gte("created_at", startOfToday.toISOString())
          .lt("created_at", startOfTomorrow.toISOString());

      if (todayTransactionsError) {
        console.error(
          "Error loading today's YanBo Coin summary:",
          todayTransactionsError,
        );
      } else {
        const summary = (todayTransactionsData || []).reduce(
          (runningSummary, transaction) => {
            const amount = Number(transaction.amount) || 0;

            if (amount > 0) {
              return {
                ...runningSummary,
                earned: runningSummary.earned + amount,
              };
            }

            if (amount < 0) {
              return {
                ...runningSummary,
                spent: runningSummary.spent + Math.abs(amount),
              };
            }

            return runningSummary;
          },
          { earned: 0, spent: 0 },
        );

        setTodayCoinSummary(summary);
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name !== "first_name" && name !== "last_name" && name !== "phone") {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving profile:", error);
      setMessage("There was a problem saving your profile. Please try again.");
    } else {
      setMessage("Profile saved successfully.");
    }

    setSaving(false);
  }

  function handleChangePassword() {
    router.push("/forgot-password");
  }

  const planLabel =
    plan === "admin"
      ? "Admin"
      : plan === "monthly"
        ? "Monthly"
        : plan === "annual"
          ? "Annual"
          : "Free";

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.loadingCard}>
          <p style={styles.loadingText}>Loading your profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.contentGrid}>
          <div style={styles.leftColumn}>
            <div style={styles.avatarCard}>
              <div style={styles.avatarBody}>
                <StudentAvatarPortrait
                  config={avatarConfig}
                  size={214}
                  ariaLabel={`${avatarName || "Saved YanBo"} avatar`}
                />

                <div style={styles.avatarTextWrap}>
                  <div style={styles.avatarTextTop}>
                    {!avatarName && <h2 style={styles.cardTitle}>My Avatar</h2>}

                    <div style={styles.avatarSpeechBubble}>
                      <span style={styles.avatarSpeechTail} />
                      <p style={styles.avatarGreeting}>
                        {avatarName ? (
                          <>
                            Hi, my name is{" "}
                            <span style={styles.avatarGreetingName}>
                              {avatarName}
                            </span>
                            !
                          </>
                        ) : (
                          "Please choose my nickname."
                        )}
                      </p>
                    </div>
                  </div>

                  <Link href="/avatar" style={styles.avatarButton}>
                    {avatarName ? "Edit my avatar" : "Name my avatar"}
                  </Link>
                </div>
              </div>
            </div>

            <div style={styles.coinActivityCard}>
              <div style={styles.coinActivityHeader}>
                <h2 style={styles.cardTitle}>YanBo Coins</h2>

                <div style={styles.coinBadge}>
                  <span style={styles.coinIcon}>🪙</span>
                  <span>{coins} coins</span>
                </div>
              </div>

              <div style={styles.todayInlineRow}>
                <span style={styles.todayInlineTitle}>Today:</span>

                <span style={styles.todayCoinSummaryEarned}>
                  +{todayCoinSummary.earned}
                </span>
                <span style={styles.todayCoinSummaryLabel}>Collected</span>

                <span style={styles.todayCoinSummarySpent}>
                  -{todayCoinSummary.spent}
                </span>
                <span style={styles.todayCoinSummaryLabel}>Spent</span>
              </div>
            </div>

            <div style={styles.securityCard}>
              <div style={styles.securityHeader}>
                <div style={styles.securityIcon}>🔐</div>

                <h2 style={styles.cardTitle}>Account security</h2>
              </div>

              <p style={styles.cardText}>
                Need to change your password? We will send a secure password
                reset link to your email address.
              </p>

              <div style={styles.securityActionRow}>
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
                Phone
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Phone number"
                />
              </label>

              <label style={styles.label}>
                Login email
                <input
                  value={loginEmail}
                  readOnly
                  style={styles.readOnlyInput}
                  placeholder="Email address"
                  type="email"
                />
                <span style={styles.inputHelpText}>
                  This is your secure login email. To change it, please contact
                  YanBo Learning support for now.
                </span>
              </label>

              <label style={styles.label}>
                Membership plan
                <input
                  value={planLabel}
                  readOnly
                  style={styles.readOnlyInput}
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
  );
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
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 320px)",
    gap: 22,
    alignItems: "start",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  avatarCard: {
    background: "#ffffff",
    borderRadius: 22,
    padding: "14px 16px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid rgba(16, 185, 129, 0.18)",
  },
  coinBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    padding: "8px 12px",
    fontSize: "0.85rem",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  coinIcon: {
    fontSize: "1rem",
  },
  avatarBody: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  avatarTextWrap: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  avatarTextTop: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 18,
  },
  avatarSpeechBubble: {
    position: "relative",
    borderRadius: 22,
    background: "#ffffff",
    border: "2px solid #16a34a",
    padding: "12px 14px",
    boxShadow: "0 10px 24px rgba(22, 163, 74, 0.12)",
    maxWidth: 225,
  },
  avatarSpeechTail: {
    position: "absolute",
    left: -8,
    top: 28,
    width: 15,
    height: 15,
    transform: "rotate(45deg)",
    background: "#ffffff",
    borderLeft: "2px solid #16a34a",
    borderBottom: "2px solid #16a34a",
  },
  avatarGreeting: {
    position: "relative",
    zIndex: 1,
    margin: 0,
    color: "#16a34a",
    fontWeight: 900,
    fontSize: "1rem",
    lineHeight: 1.42,
  },
  avatarGreetingName: {
    color: "#16a34a",
    fontWeight: 950,
    wordBreak: "break-word",
  },
  avatarButton: {
    marginTop: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "11px 16px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "0.92rem",
    textDecoration: "none",
    boxShadow: "0 10px 22px rgba(22, 163, 74, 0.22)",
  },
  coinActivityCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "12px 16px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
  },
  coinActivityHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  todayInlineRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    borderRadius: 12,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: "7px 9px",
  },
  todayInlineTitle: {
    color: "#374151",
    fontSize: "0.78rem",
    fontWeight: 900,
  },
  todayCoinSummaryLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "0.76rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  todayCoinSummaryEarned: {
    margin: 0,
    color: "#047857",
    fontSize: "1.05rem",
    fontWeight: 900,
    lineHeight: 1,
  },
  todayCoinSummarySpent: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "1.05rem",
    fontWeight: 900,
    lineHeight: 1,
  },
  securityCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
  },
  securityHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  securityIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    background: "#eef2ff",
    color: "#3730a3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  securityActionRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  securityNote: {
    margin: 0,
    color: "#6b7280",
    fontSize: "0.85rem",
    lineHeight: 1.4,
  },
  passwordButton: {
    marginTop: 0,
    border: "none",
    borderRadius: 999,
    padding: "11px 18px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "0.92rem",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(22, 163, 74, 0.25)",
  },
  formCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: "18px 18px 20px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    width: "100%",
    maxWidth: 320,
    justifySelf: "end",
    alignSelf: "start",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 900,
    color: "#111827",
  },
  cardText: {
    margin: "8px 0 0",
    color: "#6b7280",
    lineHeight: 1.45,
    fontSize: "0.88rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 800,
    color: "#111827",
    fontSize: "0.84rem",
  },
  input: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: "10px 13px",
    fontSize: "0.92rem",
    fontWeight: 750,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  readOnlyInput: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: "10px 13px",
    fontSize: "0.92rem",
    fontWeight: 750,
    color: "#6b7280",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
    cursor: "not-allowed",
  },
  inputHelpText: {
    color: "#6b7280",
    fontSize: "0.76rem",
    fontWeight: 700,
    lineHeight: 1.35,
  },
  message: {
    margin: "14px 0 0",
    border: "1px solid",
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: "0.86rem",
  },
  actions: {
    marginTop: 16,
    display: "flex",
    justifyContent: "flex-start",
  },
  saveButton: {
    border: "none",
    borderRadius: 999,
    padding: "11px 22px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: "0.92rem",
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
};
