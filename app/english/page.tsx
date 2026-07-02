"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const hoverCardStyle: CSSProperties = {
  transition: "all 0.25s ease",
  cursor: "pointer",
};

export default function EnglishPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsLoggedIn(!!user);
      }
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  function openCategory(path: string) {
    router.push(path);
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>English</h1>
          <p style={styles.subtitle}>
            Practise core English skills to build confidence for 11+ entrance
            exams.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/vocabulary")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
            }}
          >
            <h2 style={styles.cardTitle}>Vocabulary</h2>

            <p style={styles.cardText}>
              Strengthen word meaning, synonyms, antonyms, and precise language
              knowledge for 11+ English.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Word meaning</span>
              </div>

              {isLoggedIn && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Last result:</span>
                  <Link
                    href="/results/english/vocabulary/0"
                    style={styles.resultLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openCategory("/english/vocabulary");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0";
              }}
              style={styles.button}
            >
              Open Vocabulary
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/spelling")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
            }}
          >
            <h2 style={styles.cardTitle}>Spelling</h2>

            <p style={styles.cardText}>
              Practise accurate spelling, spot common mistakes, and improve word
              recognition under test conditions.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Correct spelling</span>
              </div>

              {isLoggedIn && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Last result:</span>
                  <Link
                    href="/results/english/spelling/0"
                    style={styles.resultLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openCategory("/english/spelling");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0";
              }}
              style={styles.button}
            >
              Open Spelling
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/comprehension")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
            }}
          >
            <h2 style={styles.cardTitle}>Comprehension</h2>

            <p style={styles.cardText}>
              Develop reading skills, inference, retrieval, and understanding of
              fiction and non-fiction passages.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Reading skills</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openCategory("/english/comprehension");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0";
              }}
              style={styles.button}
            >
              Open Comprehension
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/grammar")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
            }}
          >
            <h2 style={styles.cardTitle}>Grammar</h2>

            <p style={styles.cardText}>
              Build confidence with sentence structure, tenses, word classes,
              agreement, and key grammar rules for 11+ exams.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Grammar rules</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openCategory("/english/grammar");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0";
              }}
              style={styles.button}
            >
              Open Grammar
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/punctuation")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
            }}
          >
            <h2 style={styles.cardTitle}>Punctuation</h2>

            <p style={styles.cardText}>
              Practise full stops, commas, apostrophes, speech marks, colons,
              semicolons, and other punctuation used in 11+ English.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Punctuation accuracy</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openCategory("/english/punctuation");
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0";
              }}
              style={styles.button}
            >
              Open Punctuation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4fbf4",
    padding: "28px 20px 48px",
  },

  hero: {
    maxWidth: "1000px",
    margin: "0 auto 28px",
    textAlign: "center",
  },

  title: {
    fontSize: "42px",
    fontWeight: 800,
    color: "#064e3b",
    margin: "0 0 10px",
  },

  subtitle: {
    fontSize: "18px",
    lineHeight: 1.5,
    color: "#374151",
    maxWidth: "820px",
    margin: "0 auto",
  },

  grid: {
    maxWidth: "1150px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "270px",
  },

  cardTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 8px",
  },

  cardText: {
    fontSize: "16px",
    lineHeight: 1.5,
    color: "#4b5563",
    margin: "0 0 14px",
  },

  infoBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "10px 12px",
    marginTop: "auto",
    marginBottom: "14px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    marginBottom: "4px",
  },

  infoLabel: {
    fontWeight: 700,
    color: "#065f46",
  },

  infoValue: {
    color: "#374151",
    textAlign: "right",
  },

  resultLink: {
    color: "#047857",
    fontWeight: 700,
    textDecoration: "underline",
  },

  button: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
