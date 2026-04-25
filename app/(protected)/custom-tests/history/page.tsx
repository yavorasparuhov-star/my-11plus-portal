"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import type {
  DifficultyFilter,
  MainCategory,
} from "../../../../lib/custom-tests/types"

type CustomTestAttemptRow = {
  id: string
  main_category: string | null
  status: string | null
  config: unknown
  question_count: number | null
  time_limit_seconds: number | null
  time_taken_seconds: number | null
  correct_answers: number | null
  score_percent: number | null
  started_at: string | null
  completed_at: string | null
  created_at?: string | null
}

type AttemptConfig = {
  mainCategory?: MainCategory
  topicKeys?: string[]
  subtopicMap?: Record<string, string[]>
  questionCount?: number
  totalTimeMinutes?: number
  selectedDifficulty?: DifficultyFilter
}

type TimeFilter = "all" | "7d" | "30d" | "90d"

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatSeconds(totalSeconds: number | null | undefined) {
  if (typeof totalSeconds !== "number" || totalSeconds < 0) return "—"

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`
}

function formatMainCategory(value: string | null | undefined) {
  if (!value) return "—"
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function parseAttemptConfig(value: unknown): AttemptConfig {
  if (!value || typeof value !== "object") {
    return {}
  }

  const raw = value as Record<string, unknown>

  const selectedDifficulty =
    raw.selectedDifficulty === "all" ||
    raw.selectedDifficulty === 1 ||
    raw.selectedDifficulty === 2 ||
    raw.selectedDifficulty === 3
      ? raw.selectedDifficulty
      : undefined

  return {
    mainCategory:
      raw.mainCategory === "english" ||
      raw.mainCategory === "math" ||
      raw.mainCategory === "vr" ||
      raw.mainCategory === "nvr"
        ? raw.mainCategory
        : undefined,
    topicKeys: Array.isArray(raw.topicKeys)
      ? raw.topicKeys.filter((item): item is string => typeof item === "string")
      : [],
    subtopicMap:
      raw.subtopicMap && typeof raw.subtopicMap === "object"
        ? (raw.subtopicMap as Record<string, string[]>)
        : {},
    questionCount:
      typeof raw.questionCount === "number" ? raw.questionCount : undefined,
    totalTimeMinutes:
      typeof raw.totalTimeMinutes === "number" ? raw.totalTimeMinutes : undefined,
    selectedDifficulty,
  }
}

function formatDifficulty(value: DifficultyFilter | undefined) {
  if (value === "all" || value === undefined) return "All difficulties"
  if (value === 1) return "Easy"
  if (value === 2) return "Medium"
  return "Hard"
}

function formatTopics(config: AttemptConfig) {
  if (!config.topicKeys || config.topicKeys.length === 0) {
    return "—"
  }

  return config.topicKeys
    .map((topic) => topic.replaceAll("_", " "))
    .map((topic) => topic.charAt(0).toUpperCase() + topic.slice(1))
    .join(", ")
}

function getAttemptDate(attempt: CustomTestAttemptRow) {
  return attempt.completed_at ?? attempt.created_at ?? attempt.started_at ?? null
}

function matchesTimeFilter(
  attempt: CustomTestAttemptRow,
  timeFilter: TimeFilter
) {
  if (timeFilter === "all") return true

  const attemptDateValue = getAttemptDate(attempt)
  if (!attemptDateValue) return false

  const attemptDate = new Date(attemptDateValue)
  if (Number.isNaN(attemptDate.getTime())) return false

  const now = new Date()
  const days = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 90

  const fromDate = new Date()
  fromDate.setDate(now.getDate() - days)

  return attemptDate >= fromDate
}

function matchesDifficultyFilter(
  attempt: CustomTestAttemptRow,
  difficultyFilter: DifficultyFilter
) {
  if (difficultyFilter === "all") return true

  const config = parseAttemptConfig(attempt.config)

  return config.selectedDifficulty === difficultyFilter
}

const selectStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 600,
  outline: "none",
}

export default function CustomTestHistoryPage() {
  const [attempts, setAttempts] = useState<CustomTestAttemptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")

  useEffect(() => {
    async function loadAttempts() {
      try {
        setLoading(true)
        setErrorMessage("")

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setErrorMessage("Could not verify the logged-in user.")
          return
        }

        const { data, error } = await supabase
          .from("custom_test_attempts")
          .select(
            `
            id,
            main_category,
            status,
            config,
            question_count,
            time_limit_seconds,
            time_taken_seconds,
            correct_answers,
            score_percent,
            started_at,
            completed_at,
            created_at
            `
          )
          .order("completed_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false, nullsFirst: false })
          .limit(100)

        if (error) {
          setErrorMessage(error.message || "Could not load custom test history.")
          return
        }

        setAttempts((data ?? []) as CustomTestAttemptRow[])
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unexpected error while loading custom test history."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadAttempts()
  }, [])

  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      return (
        matchesTimeFilter(attempt, timeFilter) &&
        matchesDifficultyFilter(attempt, difficultyFilter)
      )
    })
  }, [attempts, timeFilter, difficultyFilter])

  const summary = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        totalQuestions: 0,
      }
    }

    const totalAttempts = filteredAttempts.length

    const totalQuestions = filteredAttempts.reduce(
      (sum, item) => sum + (item.question_count ?? 0),
      0
    )

    const scoredAttempts = filteredAttempts.filter(
      (item) => typeof item.score_percent === "number"
    )

    const averageScore =
      scoredAttempts.length > 0
        ? Math.round(
            scoredAttempts.reduce(
              (sum, item) => sum + (item.score_percent ?? 0),
              0
            ) / scoredAttempts.length
          )
        : 0

    return {
      totalAttempts,
      averageScore,
      totalQuestions,
    }
  }, [filteredAttempts])

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px 0",
                color: "#6b7280",
                fontSize: "0.95rem",
              }}
            >
              <Link
                href="/custom-tests"
                style={{ color: "#6b7280", textDecoration: "none" }}
              >
                Custom Tests
              </Link>{" "}
              / History
            </p>

            <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>
              Custom Test History
            </h1>
          </div>

          <Link
            href="/custom-tests"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Back to Custom Tests
          </Link>
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 6px 0",
                  color: "#111827",
                  fontSize: "1.2rem",
                }}
              >
                Filters
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                }}
              >
                Filter your custom test history by time and difficulty.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTimeFilter("all")
                setDifficultyFilter("all")
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reset filters
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label
                htmlFor="time-filter"
                style={{
                  display: "block",
                  color: "#374151",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Time
              </label>

              <select
                id="time-filter"
                value={timeFilter}
                onChange={(event) =>
                  setTimeFilter(event.target.value as TimeFilter)
                }
                style={selectStyle}
              >
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="difficulty-filter"
                style={{
                  display: "block",
                  color: "#374151",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Difficulty
              </label>

              <select
                id="difficulty-filter"
                value={String(difficultyFilter)}
                onChange={(event) => {
                  const value = event.target.value

                  setDifficultyFilter(
                    value === "all" ? "all" : (Number(value) as 1 | 2 | 3)
                  )
                }}
                style={selectStyle}
              >
                <option value="all">All difficulties</option>
                <option value="1">Easy</option>
                <option value="2">Medium</option>
                <option value="3">Hard</option>
              </select>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 6 }}
            >
              Filtered custom tests
            </div>
            <div
              style={{ color: "#111827", fontSize: "1.8rem", fontWeight: 800 }}
            >
              {summary.totalAttempts}
            </div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 6 }}>
              From {attempts.length} total loaded attempts
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 6 }}
            >
              Average score
            </div>
            <div
              style={{ color: "#111827", fontSize: "1.8rem", fontWeight: 800 }}
            >
              {summary.averageScore}%
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 6 }}
            >
              Total questions completed
            </div>
            <div
              style={{ color: "#111827", fontSize: "1.8rem", fontWeight: 800 }}
            >
              {summary.totalQuestions}
            </div>
          </div>
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px 0",
              color: "#111827",
              fontSize: "1.25rem",
            }}
          >
            Attempts
          </h2>

          {loading ? (
            <div style={{ color: "#4b5563" }}>Loading custom test history...</div>
          ) : errorMessage ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
              }}
            >
              {errorMessage}
            </div>
          ) : attempts.length === 0 ? (
            <div
              style={{
                padding: "18px 16px",
                borderRadius: 12,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#4b5563",
                lineHeight: 1.6,
              }}
            >
              No custom tests have been completed yet.
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div
              style={{
                padding: "18px 16px",
                borderRadius: 12,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#4b5563",
                lineHeight: 1.6,
              }}
            >
              No custom tests match the selected filters.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredAttempts.map((attempt) => {
                const config = parseAttemptConfig(attempt.config)

                return (
                  <div
                    key={attempt.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 18,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#111827",
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            marginBottom: 4,
                          }}
                        >
                          {formatMainCategory(attempt.main_category)} Custom Test
                        </div>
                        <div style={{ color: "#6b7280", fontSize: "0.92rem" }}>
                          Completed:{" "}
                          {formatDateTime(
                            attempt.completed_at ?? attempt.created_at
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          color: "#166534",
                          fontWeight: 700,
                        }}
                      >
                        {typeof attempt.score_percent === "number"
                          ? `${Math.round(attempt.score_percent)}%`
                          : "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Topics
                        </div>
                        <div style={{ color: "#111827", lineHeight: 1.6 }}>
                          {formatTopics(config)}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Difficulty
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {formatDifficulty(config.selectedDifficulty)}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Questions
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {attempt.question_count ?? config.questionCount ?? "—"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Correct answers
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {attempt.correct_answers ?? "—"}
                          {typeof attempt.question_count === "number"
                            ? ` / ${attempt.question_count}`
                            : ""}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Time taken
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {formatSeconds(attempt.time_taken_seconds)}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Time limit
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {formatSeconds(attempt.time_limit_seconds)}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Status
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {attempt.status ?? "—"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: "0.85rem",
                            marginBottom: 4,
                          }}
                        >
                          Started
                        </div>
                        <div style={{ color: "#111827", fontWeight: 600 }}>
                          {formatDateTime(attempt.started_at)}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/custom-tests/history/${attempt.id}`}
                      style={{
                        display: "inline-block",
                        marginTop: 14,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                        color: "#111827",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}