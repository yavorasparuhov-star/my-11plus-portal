"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../../../lib/supabaseClient"
import type {
  GeneratedCustomTest,
  MainCategory,
  OptionKey,
} from "../../../../../lib/custom-tests/types"

type AnswerMap = Record<string, OptionKey>

type SubmitCustomTestResponse =
  | {
      ok: true
      attemptId: string
    }
  | {
      ok: false
      error: string
    }

function isMainCategory(value: string): value is MainCategory {
  return value === "english" || value === "math" || value === "vr" || value === "nvr"
}

function buildGeneratedTestStorageKey(mainCategory: MainCategory) {
  return `custom-test-generated:${mainCategory}`
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function CustomTestRunPage() {
  const params = useParams<{ mainCategory: string }>()
  const router = useRouter()

  const mainCategoryParam = Array.isArray(params?.mainCategory)
    ? params.mainCategory[0]
    : params?.mainCategory

  const [generatedTest, setGeneratedTest] = useState<GeneratedCustomTest | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string>("")
  const [isSavingResult, setIsSavingResult] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string>("")
  const [savedAttemptId, setSavedAttemptId] = useState<string>("")
  const [saveStarted, setSaveStarted] = useState<boolean>(false)

  useEffect(() => {
    if (!mainCategoryParam || !isMainCategory(mainCategoryParam)) {
      setLoadError("Invalid main category.")
      return
    }

    try {
      const raw = sessionStorage.getItem(buildGeneratedTestStorageKey(mainCategoryParam))

      if (!raw) {
        setLoadError("No generated custom test was found. Please build a new test first.")
        return
      }

      const parsed = JSON.parse(raw) as GeneratedCustomTest

      if (!parsed?.config || parsed.config.mainCategory !== mainCategoryParam) {
        setLoadError("Generated test data does not match this category.")
        return
      }

      setGeneratedTest(parsed)
      setTimeLeftSeconds(parsed.config.totalTimeMinutes * 60)
    } catch {
      setLoadError("Could not load the generated custom test.")
    }
  }, [mainCategoryParam])

  useEffect(() => {
    if (!generatedTest || hasSubmitted) return

    if (timeLeftSeconds <= 0) {
      setHasSubmitted(true)
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [generatedTest, hasSubmitted, timeLeftSeconds])

  useEffect(() => {
    if (!generatedTest || !hasSubmitted || saveStarted) return

    const testToSave = generatedTest

    async function saveAttempt() {
      try {
        setSaveStarted(true)
        setIsSavingResult(true)
        setSaveError("")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.access_token) {
          setSaveError("Results were shown, but the logged-in session could not be verified.")
          return
        }

        const totalTimeSeconds = testToSave.config.totalTimeMinutes * 60
        const timeTakenSeconds = Math.max(0, totalTimeSeconds - timeLeftSeconds)

        const response = await fetch("/api/custom-tests/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            generatedTest: testToSave,
            answers,
            timeTakenSeconds,
          }),
        })

        const result = (await response.json()) as SubmitCustomTestResponse

        if (!response.ok || !result.ok) {
          setSaveError(result.ok ? "Could not save custom test." : result.error)
          return
        }

        setSavedAttemptId(result.attemptId)
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Unexpected error while saving the custom test."
        )
      } finally {
        setIsSavingResult(false)
      }
    }

    void saveAttempt()
  }, [answers, generatedTest, hasSubmitted, saveStarted, timeLeftSeconds])

  const questions = generatedTest?.questions ?? []
  const currentQuestion = questions[currentIndex] ?? null

  const correctCount = useMemo(() => {
    if (!generatedTest) return 0

    return generatedTest.questions.reduce((total, question) => {
      return total + (answers[question.runnerId] === question.correctAnswer ? 1 : 0)
    }, 0)
  }, [answers, generatedTest])

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length
  }, [answers])

  const scorePercent = useMemo(() => {
    if (!generatedTest || generatedTest.questions.length === 0) return 0
    return Math.round((correctCount / generatedTest.questions.length) * 100)
  }, [correctCount, generatedTest])

  function handleSelectAnswer(runnerId: string, optionKey: OptionKey) {
    if (hasSubmitted) return

    setAnswers((prev) => ({
      ...prev,
      [runnerId]: optionKey,
    }))
  }

  function handleSubmit() {
    const unansweredCount = questions.length - answeredCount

    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Do you want to submit the test anyway?`
      )

      if (!confirmed) {
        return
      }
    }

    setHasSubmitted(true)
  }

  function handleRestartBuilder() {
    if (!mainCategoryParam || !isMainCategory(mainCategoryParam)) return
    router.push(`/custom-tests/${mainCategoryParam}`)
  }

  if (loadError) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <h1 style={{ margin: "0 0 12px 0", color: "#111827" }}>Custom Test Runner</h1>

            <p style={{ margin: "0 0 20px 0", color: "#991b1b", lineHeight: 1.6 }}>
              {loadError}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/custom-tests"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#e5e7eb",
                  color: "#111827",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Back to Custom Tests
              </Link>

              {mainCategoryParam && isMainCategory(mainCategoryParam) ? (
                <Link
                  href={`/custom-tests/${mainCategoryParam}`}
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#d9f99d",
                    color: "#14532d",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Back to Builder
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!generatedTest || !currentQuestion) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", color: "#4b5563" }}>Loading...</div>
      </main>
    )
  }

  const test = generatedTest

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "32px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)",
            gap: 20,
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            {!hasSubmitted ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 6px 0", color: "#6b7280", fontSize: "0.95rem" }}>
                      Question {currentIndex + 1} of {questions.length}
                    </p>
                    <h1 style={{ margin: 0, color: "#111827", fontSize: "1.75rem" }}>
                      Custom Test
                    </h1>
                  </div>

                  <div
                    style={{
                      background: timeLeftSeconds <= 60 ? "#fef2f2" : "#ecfccb",
                      color: timeLeftSeconds <= 60 ? "#991b1b" : "#365314",
                      border:
                        timeLeftSeconds <= 60
                          ? "1px solid #fecaca"
                          : "1px solid #d9f99d",
                      borderRadius: 999,
                      padding: "10px 16px",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    {formatSeconds(timeLeftSeconds)}
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: 20,
                    padding: 18,
                    borderRadius: 14,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: "#6b7280",
                      marginBottom: 8,
                    }}
                  >
                    {currentQuestion.prompt}
                  </div>

                  {currentQuestion.passageText ? (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 16,
                        borderRadius: 12,
                        background: "#ffffff",
                        border: "1px solid #d1d5db",
                        color: "#374151",
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {currentQuestion.passageText}
                    </div>
                  ) : null}

                  {currentQuestion.questionText ? (
                    <div
                      style={{
                        color: "#111827",
                        fontSize: "1.1rem",
                        lineHeight: 1.7,
                        fontWeight: 600,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {currentQuestion.questionText}
                    </div>
                  ) : null}

                  {currentQuestion.imageUrl ? (
                    <div style={{ marginTop: 14 }}>
                      <img
                        src={currentQuestion.imageUrl}
                        alt="Question"
                        style={{
                          maxWidth: "100%",
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {currentQuestion.options.map((option) => {
                    const selected = answers[currentQuestion.runnerId] === option.key

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestion.runnerId, option.key)}
                        style={{
                          textAlign: "left",
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 12,
                          border: selected ? "2px solid #84cc16" : "1px solid #d1d5db",
                          background: selected ? "#f7fee7" : "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: option.text || option.imageUrl ? 6 : 0,
                          }}
                        >
                          {option.key}
                        </div>

                        {option.text ? (
                          <div style={{ color: "#374151", lineHeight: 1.6 }}>{option.text}</div>
                        ) : null}

                        {option.imageUrl ? (
                          <img
                            src={option.imageUrl}
                            alt={`Option ${option.key}`}
                            style={{
                              maxWidth: 180,
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              marginTop: option.text ? 10 : 0,
                            }}
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentIndex === 0}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: currentIndex === 0 ? "#f3f4f6" : "#ffffff",
                      color: currentIndex === 0 ? "#9ca3af" : "#111827",
                      fontWeight: 700,
                      cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    Previous
                  </button>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {currentIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
                        }
                        style={{
                          padding: "12px 18px",
                          borderRadius: 10,
                          border: "1px solid #bef264",
                          background: "#d9f99d",
                          color: "#14532d",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Next
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleSubmit}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 10,
                        border: "1px solid #86efac",
                        background: "#22c55e",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 style={{ margin: "0 0 16px 0", color: "#111827", fontSize: "1.9rem" }}>
                  Test Results
                </h1>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 14,
                    marginBottom: 22,
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 6 }}>
                      Score
                    </div>
                    <div style={{ color: "#111827", fontSize: "1.6rem", fontWeight: 800 }}>
                      {scorePercent}%
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 6 }}>
                      Correct answers
                    </div>
                    <div style={{ color: "#111827", fontSize: "1.6rem", fontWeight: 800 }}>
                      {correctCount} / {questions.length}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: 6 }}>
                      Answered
                    </div>
                    <div style={{ color: "#111827", fontSize: "1.6rem", fontWeight: 800 }}>
                      {answeredCount} / {questions.length}
                    </div>
                  </div>
                </div>

                {isSavingResult ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
                    }}
                  >
                    Saving custom test results...
                  </div>
                ) : null}

                {savedAttemptId ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                    }}
                  >
                    Results saved successfully.
                  </div>
                ) : null}

                {saveError ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                    }}
                  >
                    {saveError}
                  </div>
                ) : null}

                <div style={{ display: "grid", gap: 14 }}>
                  {questions.map((question, index) => {
                    const selectedAnswer = answers[question.runnerId]
                    const isCorrect = selectedAnswer === question.correctAnswer

                    return (
                      <div
                        key={question.runnerId}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 16,
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: 8,
                          }}
                        >
                          Question {index + 1}
                        </div>

                        {question.passageText ? (
                          <div
                            style={{
                              marginBottom: 12,
                              padding: 12,
                              borderRadius: 10,
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              color: "#4b5563",
                              lineHeight: 1.7,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {question.passageText}
                          </div>
                        ) : null}

                        {question.questionText ? (
                          <div
                            style={{
                              color: "#374151",
                              lineHeight: 1.6,
                              marginBottom: 12,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {question.questionText}
                          </div>
                        ) : null}

                        <div style={{ color: isCorrect ? "#166534" : "#991b1b", fontWeight: 700 }}>
                          Your answer: {selectedAnswer ?? "No answer"}
                        </div>

                        <div style={{ color: "#111827", marginTop: 4, fontWeight: 700 }}>
                          Correct answer: {question.correctAnswer}
                        </div>

                        {question.explanation ? (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 12,
                              borderRadius: 10,
                              background: "#f9fafb",
                              color: "#4b5563",
                              lineHeight: 1.6,
                            }}
                          >
                            {question.explanation}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleRestartBuilder}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 10,
                      border: "1px solid #bef264",
                      background: "#d9f99d",
                      color: "#14532d",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Build Another Test
                  </button>

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
              </>
            )}
          </section>

          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              alignSelf: "start",
              position: "sticky",
              top: 20,
            }}
          >
            <h2 style={{ margin: "0 0 14px 0", color: "#111827", fontSize: "1.2rem" }}>
              Test Summary
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
                  Main category
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>
                  {test.config.mainCategory.toUpperCase()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
                  Topics
                </div>
                <div style={{ color: "#111827", lineHeight: 1.7 }}>
                  {test.config.topicKeys.join(", ")}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
                  Question count
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>
                  {test.questions.length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
                  Answered
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>{answeredCount}</div>
              </div>

              {!hasSubmitted ? (
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
                    Progress
                  </div>
                  <div style={{ color: "#111827", fontWeight: 700 }}>
                    {currentIndex + 1} / {questions.length}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
                    Final score
                  </div>
                  <div style={{ color: "#111827", fontWeight: 700 }}>{scorePercent}%</div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 14,
                borderRadius: 12,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                color: "#4b5563",
                lineHeight: 1.6,
                fontSize: "0.95rem",
              }}
            >
              This runner now saves the finished custom test into your custom attempt tables.
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}