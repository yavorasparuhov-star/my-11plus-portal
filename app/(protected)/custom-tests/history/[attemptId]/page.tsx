"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "../../../../../lib/supabaseClient"
import type {
  DifficultyFilter,
  MainCategory,
  OptionKey,
} from "../../../../../lib/custom-tests/types"

type AttemptConfig = {
  mainCategory?: MainCategory
  topicKeys?: string[]
  subtopicMap?: Record<string, string[]>
  questionCount?: number
  totalTimeMinutes?: number
  selectedDifficulty?: DifficultyFilter
}

type AttemptRow = {
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

type QuestionSnapshotOption = {
  key: OptionKey
  text?: string | null
  imageUrl?: string | null
}

type QuestionSnapshot = {
  prompt?: string | null
  questionText?: string | null
  passageText?: string | null
  options?: QuestionSnapshotOption[]
  correctAnswer?: OptionKey
  explanation?: string | null
  topicKey?: string
  subtopicKey?: string | null
}

type AttemptItemRow = {
  question_index: number
  topic_key: string | null
  subtopic_key: string | null
  question_snapshot: unknown
  selected_answer: OptionKey | null
  correct_answer: OptionKey | null
  is_correct: boolean | null
}

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

function formatDifficulty(value: DifficultyFilter | undefined) {
  if (value === "all" || value === undefined) return "All difficulties"
  if (value === 1) return "Easy"
  if (value === 2) return "Medium"
  return "Hard"
}

function formatTopics(config: AttemptConfig) {
  if (!config.topicKeys || config.topicKeys.length === 0) return "—"

  return config.topicKeys
    .map((topic) => topic.replaceAll("_", " "))
    .map((topic) => topic.charAt(0).toUpperCase() + topic.slice(1))
    .join(", ")
}

function formatTopicLabel(value: string | null | undefined) {
  if (!value) return "—"
  const cleaned = value.replaceAll("_", " ")
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function parseAttemptConfig(value: unknown): AttemptConfig {
  if (!value || typeof value !== "object") return {}

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

function parseQuestionSnapshot(value: unknown): QuestionSnapshot {
  if (!value || typeof value !== "object") return {}

  const raw = value as Record<string, unknown>

  const options: QuestionSnapshotOption[] = Array.isArray(raw.options)
    ? raw.options
        .map((item) => {
          if (!item || typeof item !== "object") return null

          const option = item as Record<string, unknown>
          const key = option.key

          if (key !== "A" && key !== "B" && key !== "C" && key !== "D") {
            return null
          }

          return {
            key,
            text: typeof option.text === "string" ? option.text : null,
            imageUrl: typeof option.imageUrl === "string" ? option.imageUrl : null,
          } as QuestionSnapshotOption
        })
        .filter((item): item is QuestionSnapshotOption => item !== null)
    : []

  return {
    prompt: typeof raw.prompt === "string" ? raw.prompt : null,
    questionText: typeof raw.questionText === "string" ? raw.questionText : null,
    passageText: typeof raw.passageText === "string" ? raw.passageText : null,
    options,
    correctAnswer:
      raw.correctAnswer === "A" ||
      raw.correctAnswer === "B" ||
      raw.correctAnswer === "C" ||
      raw.correctAnswer === "D"
        ? raw.correctAnswer
        : undefined,
    explanation: typeof raw.explanation === "string" ? raw.explanation : null,
    topicKey: typeof raw.topicKey === "string" ? raw.topicKey : undefined,
    subtopicKey: typeof raw.subtopicKey === "string" ? raw.subtopicKey : null,
  }
}

export default function CustomTestAttemptDetailsPage() {
  const params = useParams<{ attemptId: string }>()
  const attemptId = Array.isArray(params?.attemptId)
    ? params.attemptId[0]
    : params?.attemptId

  const [attempt, setAttempt] = useState<AttemptRow | null>(null)
  const [items, setItems] = useState<AttemptItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function loadAttemptDetails() {
      if (!attemptId) {
        setErrorMessage("Invalid attempt id.")
        setLoading(false)
        return
      }

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

        const { data: attemptData, error: attemptError } = await supabase
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
          .eq("id", attemptId)
          .single()

        if (attemptError || !attemptData) {
          setErrorMessage(attemptError?.message || "Could not load custom test attempt.")
          return
        }

        const { data: itemData, error: itemError } = await supabase
          .from("custom_test_attempt_items")
          .select(
            `
            question_index,
            topic_key,
            subtopic_key,
            question_snapshot,
            selected_answer,
            correct_answer,
            is_correct
            `
          )
          .eq("attempt_id", attemptId)
          .order("question_index", { ascending: true })

        if (itemError) {
          setErrorMessage(itemError.message || "Could not load custom test items.")
          return
        }

        setAttempt(attemptData as AttemptRow)
        setItems((itemData ?? []) as AttemptItemRow[])
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unexpected error while loading attempt details."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadAttemptDetails()
  }, [attemptId])

  const parsedConfig = useMemo(() => parseAttemptConfig(attempt?.config), [attempt])
    if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              color: "#4b5563",
            }}
          >
            Loading attempt details...
          </section>
        </div>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
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
          </section>
        </div>
      </main>
    )
  }

  if (!attempt) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              color: "#4b5563",
            }}
          >
            Attempt not found.
          </section>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            <p style={{ margin: "0 0 6px 0", color: "#6b7280", fontSize: "0.95rem" }}>
              <Link
                href="/custom-tests"
                style={{ color: "#6b7280", textDecoration: "none" }}
              >
                Custom Tests
              </Link>{" "}
              /{" "}
              <Link
                href="/custom-tests/history"
                style={{ color: "#6b7280", textDecoration: "none" }}
              >
                History
              </Link>{" "}
              / Attempt Details
            </p>

            <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>
              Custom Test Attempt Details
            </h1>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/custom-tests/history"
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
              Back to History
            </Link>

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
        </div>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Main category
              </div>
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {formatMainCategory(attempt.main_category)}
              </div>
            </div>

            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Topics
              </div>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {formatTopics(parsedConfig)}
              </div>
            </div>

            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Difficulty
              </div>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {formatDifficulty(parsedConfig.selectedDifficulty)}
              </div>
            </div>

            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Score
              </div>
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {typeof attempt.score_percent === "number"
                  ? `${Math.round(attempt.score_percent)}%`
                  : "—"}
              </div>
            </div>

            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
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
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Time taken
              </div>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {formatSeconds(attempt.time_taken_seconds)}
              </div>
            </div>

            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Time limit
              </div>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {formatSeconds(attempt.time_limit_seconds)}
              </div>
            </div>

            <div>
              <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 4 }}>
                Completed
              </div>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {formatDateTime(attempt.completed_at ?? attempt.created_at)}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "1.25rem" }}>
            Questions
          </h2>

          <div style={{ display: "grid", gap: 14 }}>
            {items.map((item) => {
              const snapshot = parseQuestionSnapshot(item.question_snapshot)

              return (
                <div
                  key={item.question_index}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#111827" }}>
                      Question {item.question_index + 1}
                    </div>

                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: item.is_correct ? "#f0fdf4" : "#fef2f2",
                        border: item.is_correct
                          ? "1px solid #bbf7d0"
                          : "1px solid #fecaca",
                        color: item.is_correct ? "#166534" : "#991b1b",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {item.is_correct ? "Correct" : "Incorrect"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                      marginBottom: 12,
                      color: "#4b5563",
                      fontSize: "0.92rem",
                    }}
                  >
                    <div>
                      <strong>Topic:</strong> {formatTopicLabel(item.topic_key)}
                    </div>

                    <div>
                      <strong>Subtopic:</strong> {formatTopicLabel(item.subtopic_key)}
                    </div>
                  </div>

                  {snapshot.prompt ? (
                    <div
                      style={{
                        color: "#6b7280",
                        marginBottom: 8,
                        fontSize: "0.95rem",
                      }}
                    >
                      {snapshot.prompt}
                    </div>
                  ) : null}

                  {snapshot.passageText ? (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: 14,
                        borderRadius: 12,
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {snapshot.passageText}
                    </div>
                  ) : null}

                  {snapshot.questionText ? (
                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 600,
                        lineHeight: 1.7,
                        marginBottom: 12,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {snapshot.questionText}
                    </div>
                  ) : null}

                  {snapshot.options && snapshot.options.length > 0 ? (
                    <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                      {snapshot.options.map((option) => {
                        const isSelected = item.selected_answer === option.key
                        const isCorrect = item.correct_answer === option.key

                        return (
                          <div
                            key={option.key}
                            style={{
                              padding: "12px 14px",
                              borderRadius: 12,
                              border: isCorrect
                                ? "2px solid #86efac"
                                : isSelected
                                ? "2px solid #fca5a5"
                                : "1px solid #d1d5db",
                              background: isCorrect
                                ? "#f0fdf4"
                                : isSelected
                                ? "#fef2f2"
                                : "#ffffff",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#111827",
                                marginBottom: option.text ? 6 : 0,
                              }}
                            >
                              {option.key}
                              {isCorrect ? " — Correct answer" : ""}
                              {!isCorrect && isSelected ? " — Your answer" : ""}
                            </div>

                            {option.text ? (
                              <div style={{ color: "#374151", lineHeight: 1.6 }}>
                                {option.text}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  <div style={{ color: "#111827", fontWeight: 600 }}>
                    Your answer: {item.selected_answer ?? "No answer"}
                  </div>

                  <div style={{ color: "#111827", fontWeight: 600, marginTop: 4 }}>
                    Correct answer: {item.correct_answer ?? snapshot.correctAnswer ?? "—"}
                  </div>

                  {snapshot.explanation ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 10,
                        background: "#f9fafb",
                        color: "#4b5563",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {snapshot.explanation}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}