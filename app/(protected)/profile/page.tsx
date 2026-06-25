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
  email: string;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  plan: string | null;
};

type CoinTransaction = {
  id: string;
  amount: number;
  reason: string | null;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
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
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(
    [],
  );

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
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
          email: user.email || "",
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
            email: user.email || "",
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
        email: safeProfile?.email || user.email || "",
      });

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

      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("yanbo_token_transactions")
          .select("id, amount, reason, source_type, source_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

      if (transactionsError) {
        console.error(
          "Error loading recent YanBo Coin activity:",
          transactionsError,
        );
      } else {
        setCoinTransactions((transactionsData || []) as CoinTransaction[]);
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
      email: formData.email.trim() || user.email || "",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving profile:", error);
      setMessage("There was a problem saving your profile. Please try again.");
    } else {
      setMessage(
        "Profile saved successfully. Refresh the page if the header name has not updated yet.",
      );
    }

    setSaving(false);
  }

  function handleChangePassword() {
    router.push("/forgot-password");
  }

  function isTodayTransaction(value: string) {
    const transactionDate = new Date(value);
    const today = new Date();

    return (
      transactionDate.getFullYear() === today.getFullYear() &&
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getDate() === today.getDate()
    );
  }

  const todayCoinSummary = coinTransactions.reduce(
    (summary, transaction) => {
      if (!isTodayTransaction(transaction.created_at)) {
        return summary;
      }

      if (transaction.amount > 0) {
        return {
          ...summary,
          earned: summary.earned + transaction.amount,
        };
      }

      if (transaction.amount < 0) {
        return {
          ...summary,
          spent: summary.spent + Math.abs(transaction.amount),
        };
      }

      return summary;
    },
    { earned: 0, spent: 0 },
  );

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

              {coinTransactions.length === 0 && (
                <p style={styles.emptyActivityText}>
                  No YanBo Coin activity yet.
                </p>
              )}
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

              <label style={styles.label}>
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
  );
}


function profileBackgroundOverlay(background: string) {
  switch (background) {
    case "classroom":
      return "linear-gradient(180deg, rgba(255, 251, 235, 0.65), rgba(239, 246, 255, 0.45))";
    case "library":
      return "linear-gradient(180deg, rgba(224, 242, 254, 0.58), rgba(255, 255, 255, 0.35))";
    case "science_lab":
      return "linear-gradient(180deg, rgba(237, 233, 254, 0.55), rgba(207, 250, 254, 0.38))";
    case "reading_corner":
      return "linear-gradient(180deg, rgba(255, 237, 213, 0.6), rgba(255, 255, 255, 0.35))";
    case "yanbo_stage":
      return "linear-gradient(180deg, rgba(254, 240, 138, 0.55), rgba(219, 234, 254, 0.35))";
    default:
      return "linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(239, 246, 255, 0.5))";
  }
}

function hatDisplay(hat: string) {
  switch (hat) {
    case "yanbo_cap":
      return "🧢";
    case "graduation":
      return "🎓";
    case "wizard":
      return "🧙‍♂️";
    case "crown":
      return "👑";
    case "explorer":
      return "🤠";
    case "blue_beanie":
      return "💙";
    default:
      return "";
  }
}

function glassesDisplay(glasses: string) {
  switch (glasses) {
    case "round":
      return "👓";
    case "square":
      return "▭▭";
    case "blue":
      return "🔵👓";
    case "green":
      return "🟢👓";
    case "star":
      return "⭐👓";
    case "silver":
      return "⚪👓";
    case "sport":
      return "🥽";
    case "rainbow":
      return "🌈👓";
    default:
      return "";
  }
}

function badgeDisplay(badge: string) {
  switch (badge) {
    case "english":
      return "E★";
    case "maths":
      return "M★";
    case "vr":
      return "VR";
    case "nvr":
      return "NVR";
    default:
      return "";
  }
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

  avatarHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 18,
  },

  avatarEyebrow: {
    margin: "0 0 6px",
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#059669",
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

  profileAvatarStage: {
    position: "relative",
    width: 214,
    height: 214,
    minWidth: 214,
    overflow: "hidden",
    borderRadius: "9999px",
    background: "linear-gradient(180deg, #ffffff, #eff6ff)",
    border: "6px solid #ffffff",
    outline: "4px solid #d1fae5",
    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.14)",
  },

  profileAvatarBackgroundImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  profileAvatarStageOverlay: {
    position: "absolute",
    inset: 0,
  },

  profileAvatarGroundShadow: {
    position: "absolute",
    left: 46,
    right: 46,
    bottom: 18,
    height: 22,
    borderRadius: "50%",
    background: "rgba(15, 23, 42, 0.12)",
    filter: "blur(7px)",
  },

  profileAvatarScaledBody: {
    position: "absolute",
    left: "50%",
    top: -20,
    width: 330,
    height: 520,
    transform: "translateX(-50%) scale(1.06)",
    transformOrigin: "top center",
  },

  profileAvatarInner: {
    position: "relative",
    width: 330,
    height: 520,
  },

  profileAvatarBaseImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 18px 18px rgba(15, 23, 42, 0.26))",
    zIndex: 20,
  },

  profileAvatarEyeLayer: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    zIndex: 40,
  },

  profileAvatarHatLayer: {
    position: "absolute",
    left: "50%",
    top: 12,
    zIndex: 50,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarHatImage: {
    width: 128,
    height: 96,
    objectFit: "contain",
    filter: "drop-shadow(0 8px 7px rgba(15, 23, 42, 0.24))",
  },

  profileAvatarHatFallback: {
    fontSize: "4.5rem",
    filter: "drop-shadow(0 8px 7px rgba(15, 23, 42, 0.24))",
  },

  profileAvatarGlassesLayer: {
    position: "absolute",
    left: "50%",
    top: 70,
    zIndex: 50,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarGlassesImage: {
    width: 112,
    height: 56,
    objectFit: "contain",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.18))",
  },

  profileAvatarGlassesFallback: {
    fontSize: "3rem",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.18))",
  },

  profileAvatarBadgeLayer: {
    position: "absolute",
    left: 122,
    top: 164,
    zIndex: 50,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarBadgeImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 4px 4px rgba(15, 23, 42, 0.2))",
  },

  profileAvatarBadgeFallback: {
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 900,
    textShadow: "0 2px 4px rgba(15, 23, 42, 0.3)",
  },

  profileAvatarFallbackWrap: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarFallbackHead: {
    width: 132,
    height: 132,
    borderRadius: "50%",
    border: "8px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4rem",
    boxShadow: "0 16px 24px rgba(15, 23, 42, 0.18)",
  },

  profileAvatarFallbackJumper: {
    marginTop: -8,
    minWidth: 160,
    borderRadius: "28px 28px 8px 8px",
    background: "#1f2937",
    color: "#ffffff",
    padding: "16px 18px",
    textAlign: "center",
    fontSize: "1.4rem",
    fontWeight: 900,
    lineHeight: 1,
  },

  avatarPreviewCircle: {
    width: 116,
    height: 116,
    minWidth: 116,
    borderRadius: "50%",
    border: "6px solid #ffffff",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    outline: "4px solid #d1fae5",
  },

  avatarFace: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "#fed7aa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    boxShadow: "0 6px 12px rgba(15, 23, 42, 0.12)",
  },

  avatarJumper: {
    marginTop: 4,
    minWidth: 72,
    borderRadius: "16px 16px 6px 6px",
    background: "#1f2937",
    color: "#ffffff",
    padding: "8px 10px",
    textAlign: "center",
    fontSize: "0.88rem",
    fontWeight: 900,
    lineHeight: 1,
  },

  yanboY: {
    color: "#f472b6",
  },

  yanboB: {
    color: "#facc15",
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

  avatarName: {
    margin: "0 0 6px",
    color: "#111827",
    fontWeight: 900,
    fontSize: "1.05rem",
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

  todayCoinSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    marginTop: 8,
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

  todayCoinSummaryBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "7px 10px",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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

  compactActivityWrap: {
    marginTop: 7,
    borderRadius: 12,
    padding: "7px 9px",
    background: "#fffbeb",
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  compactActivityTitle: {
    margin: 0,
    color: "#92400e",
    fontSize: "0.76rem",
    fontWeight: 900,
  },

  compactActivityRow: {
    display: "grid",
    gridTemplateColumns: "48px 1fr auto",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
  },

  compactActivityAmount: {
    fontWeight: 900,
    fontSize: "0.8rem",
  },

  compactActivityReason: {
    color: "#111827",
    fontWeight: 750,
    fontSize: "0.78rem",
    minWidth: 0,
  },

  compactActivityDate: {
    color: "#6b7280",
    fontSize: "0.72rem",
    fontWeight: 650,
    whiteSpace: "nowrap",
  },

  emptyActivityText: {
    margin: "8px 0 0",
    color: "#6b7280",
    lineHeight: 1.4,
    fontSize: "0.82rem",
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 18,
  },

  activityRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "12px 14px",
    background: "#ffffff",
  },

  activityAmount: {
    minWidth: 48,
    borderRadius: 999,
    padding: "7px 10px",
    textAlign: "center",
    fontWeight: 900,
    fontSize: "0.95rem",
  },

  activityDetails: {
    flex: 1,
    minWidth: 0,
  },

  activityReason: {
    margin: 0,
    color: "#111827",
    fontWeight: 800,
    fontSize: "0.95rem",
  },

  activityDate: {
    margin: "3px 0 0",
    color: "#6b7280",
    fontSize: "0.82rem",
    fontWeight: 600,
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

  fullWidth: {
    gridColumn: "1 / -1",
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
