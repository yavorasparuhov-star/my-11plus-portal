"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { getMainCategoryCatalog } from "../../../../lib/custom-tests/catalog"
import type {
  BuilderSubtopicMap,
  CustomTestBuilderConfig,
  DifficultyFilter,
  GenerateCustomTestResponse,
  MainCategory,
  TopicCatalogItem,
} from "../../../../lib/custom-tests/types"

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 60]
const TIME_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 60]

const DIFFICULTY_OPTIONS: Array<{
  value: DifficultyFilter
  label: string
}> = [
  { value: "all", label: "All difficulties" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Hard" },
]

function isMainCategory(value: string): value is MainCategory {
  return value === "english" || value === "math" || value === "vr" || value === "nvr"
}

function buildBuilderStorageKey(mainCategory: MainCategory) {
  return `custom-test-builder:${mainCategory}`
}

function buildGeneratedTestStorageKey(mainCategory: MainCategory) {
  return `custom-test-generated:${mainCategory}`
}

function renderDifficultyLabel(value: DifficultyFilter) {
  if (value === "all") return "All difficulties"
  if (value === 1) return "Easy"
  if (value === 2) return "Medium"
  return "Hard"
}

export default function CustomTestBuilderPage() {
  const params = useParams<{ mainCategory: string }>()
  const router = useRouter()

  const mainCategoryParam = Array.isArray(params?.mainCategory)
    ? params.mainCategory[0]
    : params?.mainCategory

  const catalog = useMemo(() => {
    if (!mainCategoryParam) return null
    return getMainCategoryCatalog(mainCategoryParam)
  }, [mainCategoryParam])

  const [selectedTopicKeys, setSelectedTopicKeys] = useState<string[]>([])
  const [subtopicMap, setSubtopicMap] = useState<BuilderSubtopicMap>({})
  const [questionCount, setQuestionCount] = useState<number>(20)
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(15)
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyFilter>("all")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  useEffect(() => {
    if (!mainCategoryParam || !isMainCategory(mainCategoryParam)) return

    try {
      const raw = sessionStorage.getItem(buildBuilderStorageKey(mainCategoryParam))
      if (!raw) return

      const parsed = JSON.parse(raw) as Partial<CustomTestBuilderConfig>

      if (parsed.mainCategory !== mainCategoryParam) return

      setSelectedTopicKeys(Array.isArray(parsed.topicKeys) ? parsed.topicKeys : [])
      setSubtopicMap(parsed.subtopicMap ?? {})
      setQuestionCount(
        typeof parsed.questionCount === "number" ? parsed.questionCount : 20
      )
      setTotalTimeMinutes(
        typeof parsed.totalTimeMinutes === "number" ? parsed.totalTimeMinutes : 15
      )
      setSelectedDifficulty(
        parsed.selectedDifficulty === 1 ||
          parsed.selectedDifficulty === 2 ||
          parsed.selectedDifficulty === 3 ||
          parsed.selectedDifficulty === "all"
          ? parsed.selectedDifficulty
          : "all"
      )
    } catch {
      // ignore bad session storage
    }
  }, [mainCategoryParam])

  const selectedTopics = useMemo(() => {
    if (!catalog) return []
    return catalog.topics.filter((topic) => selectedTopicKeys.includes(topic.key))
  }, [catalog, selectedTopicKeys])

  function toggleTopic(topic: TopicCatalogItem) {
    setErrorMessage("")
    setSuccessMessage("")

    setSelectedTopicKeys((prev) => {
      const exists = prev.includes(topic.key)

      if (exists) {
        setSubtopicMap((current) => {
          const next = { ...current }
          delete next[topic.key]
          return next
        })

        return prev.filter((key) => key !== topic.key)
      }

      return [...prev, topic.key]
    })
  }

  function toggleSubtopic(topicKey: string, subtopicKey: string) {
    setErrorMessage("")
    setSuccessMessage("")

    setSubtopicMap((prev) => {
      const current = prev[topicKey] ?? []
      const exists = current.includes(subtopicKey)

      return {
        ...prev,
        [topicKey]: exists
          ? current.filter((key) => key !== subtopicKey)
          : [...current, subtopicKey],
      }
    })
  }

  function buildConfig(): CustomTestBuilderConfig | null {
    if (!mainCategoryParam || !isMainCategory(mainCategoryParam)) {
      setErrorMessage("Invalid main category.")
      return null
    }

    if (!catalog || !catalog.enabled) {
      setErrorMessage("This custom test category is not available yet.")
      return null
    }

    if (selectedTopicKeys.length === 0) {
      setErrorMessage("Please choose at least one topic.")
      return null
    }

    return {
      mainCategory: mainCategoryParam,
      topicKeys: selectedTopicKeys,
      subtopicMap,
      questionCount,
      totalTimeMinutes,
      selectedDifficulty,
    }
  }

  function handleSaveBuilderConfig() {
    setErrorMessage("")
    setSuccessMessage("")

    const config = buildConfig()
    if (!config) return

    try {
      sessionStorage.setItem(
        buildBuilderStorageKey(config.mainCategory),
        JSON.stringify(config)
      )
      sessionStorage.setItem("custom-test-builder:last-config", JSON.stringify(config))

      setSuccessMessage("Builder settings saved.")
    } catch {
      setErrorMessage("Could not save builder settings in the browser.")
    }
  }

  async function handleGenerateCustomTest() {
    setErrorMessage("")
    setSuccessMessage("")

    const config = buildConfig()
    if (!config) return

    try {
      setIsGenerating(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setErrorMessage("Please sign in to use custom tests.")
        return
      }

      sessionStorage.setItem(
        buildBuilderStorageKey(config.mainCategory),
        JSON.stringify(config)
      )

      const response = await fetch("/api/custom-tests/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(config),
      })

      const rawText = await response.text()

      if (!rawText) {
        setErrorMessage(
          `Generate route returned an empty response (${response.status} ${response.statusText}). Check terminal output.`
        )
        return
      }

      let result: GenerateCustomTestResponse

      try {
        result = JSON.parse(rawText) as GenerateCustomTestResponse
      } catch {
        setErrorMessage(
          `Generate route did not return JSON. Status: ${response.status}. Check terminal output.`
        )
        return
      }

      if (!response.ok || !result.ok) {
        setErrorMessage(result.ok ? "Could not generate custom test." : result.error)
        return
      }

      sessionStorage.setItem(
        buildGeneratedTestStorageKey(config.mainCategory),
        JSON.stringify(result.data)
      )

      router.push(`/custom-tests/${config.mainCategory}/run`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unexpected error while generating the custom test."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function renderSelectedTopicSummary(topic: TopicCatalogItem) {
    const selectedSubtopics = subtopicMap[topic.key] ?? []

    if (!topic.childSubtopics || topic.childSubtopics.length === 0) {
      return topic.label
    }

    if (selectedSubtopics.length === 0) {
      return `${topic.label} (all subtopics)`
    }

    const labels = topic.childSubtopics
      .filter((sub) => selectedSubtopics.includes(sub.key))
      .map((sub) => sub.label)

    return `${topic.label}: ${labels.join(", ")}`
  }

  if (!mainCategoryParam || !catalog) {
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
            <h1 style={{ margin: "0 0 12px 0", color: "#111827" }}>
              Custom Test Builder
            </h1>

            <p style={{ margin: "0 0 20px 0", color: "#4b5563", lineHeight: 1.6 }}>
              This category does not exist.
            </p>

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
          </div>
        </div>
      </main>
    )
  }

  if (!catalog.enabled) {
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
            <h1 style={{ margin: "0 0 12px 0", color: "#111827" }}>
              {catalog.label} Custom Tests
            </h1>

            <p style={{ margin: "0 0 20px 0", color: "#4b5563", lineHeight: 1.6 }}>
              This section is not enabled yet. English is the first MVP.
            </p>

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
          </div>
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
              / {catalog.label}
            </p>

            <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>
              {catalog.label} Custom Test Builder
            </h1>
          </div>

          <div
            style={{
              background: "#ecfccb",
              color: "#365314",
              border: "1px solid #d9f99d",
              borderRadius: 999,
              padding: "8px 14px",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            One main category only
          </div>
        </div>

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
            <h2 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "1.25rem" }}>
              1. Choose topics
            </h2>

            <p style={{ margin: "0 0 20px 0", color: "#4b5563", lineHeight: 1.6 }}>
              Choose one or more topics inside {catalog.label}. Some topics allow optional
              subtopic filtering.
            </p>

            <div style={{ display: "grid", gap: 16 }}>
              {catalog.topics.map((topic) => {
                const isSelected = selectedTopicKeys.includes(topic.key)
                const selectedSubtopics = subtopicMap[topic.key] ?? []

                return (
                  <div
                    key={topic.key}
                    style={{
                      border: isSelected ? "2px solid #a3e635" : "1px solid #e5e7eb",
                      background: isSelected ? "#f7fee7" : "#ffffff",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTopic(topic)}
                        style={{ marginTop: 4, width: 18, height: 18 }}
                      />

                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: 4,
                          }}
                        >
                          {topic.label}
                        </div>

                        {topic.description ? (
                          <div
                            style={{
                              color: "#4b5563",
                              lineHeight: 1.5,
                              fontSize: "0.95rem",
                            }}
                          >
                            {topic.description}
                          </div>
                        ) : null}
                      </div>
                    </label>

                    {isSelected && topic.childSubtopics && topic.childSubtopics.length > 0 ? (
                      <div
                        style={{
                          marginTop: 14,
                          marginLeft: 30,
                          padding: 14,
                          borderRadius: 12,
                          border: "1px solid #d9f99d",
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#365314",
                            marginBottom: 10,
                          }}
                        >
                          Optional subtopics
                        </div>

                        <p
                          style={{
                            margin: "0 0 12px 0",
                            color: "#4b5563",
                            fontSize: "0.92rem",
                            lineHeight: 1.5,
                          }}
                        >
                          Leave all unchecked to use all {topic.label.toLowerCase()} questions.
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 10,
                          }}
                        >
                          {topic.childSubtopics.map((subtopic) => {
                            const checked = selectedSubtopics.includes(subtopic.key)

                            return (
                              <label
                                key={subtopic.key}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "10px 12px",
                                  borderRadius: 10,
                                  border: checked
                                    ? "1px solid #bef264"
                                    : "1px solid #e5e7eb",
                                  background: checked ? "#f7fee7" : "#ffffff",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSubtopic(topic.key, subtopic.key)}
                                />
                                <span style={{ color: "#111827", fontSize: "0.95rem" }}>
                                  {subtopic.label}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 28 }}>
              <h2 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: "1.25rem" }}>
                2. Choose test settings
              </h2>

              <p style={{ margin: "0 0 18px 0", color: "#4b5563", lineHeight: 1.6 }}>
                Choose the number of questions, total time, and difficulty level.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    htmlFor="questionCount"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Number of questions
                  </label>

                  <select
                    id="questionCount"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      fontSize: "1rem",
                    }}
                  >
                    {QUESTION_COUNT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} questions
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="totalTimeMinutes"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Total time
                  </label>

                  <select
                    id="totalTimeMinutes"
                    value={totalTimeMinutes}
                    onChange={(e) => setTotalTimeMinutes(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      fontSize: "1rem",
                    }}
                  >
                    {TIME_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} minutes
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="selectedDifficulty"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Difficulty
                  </label>

                  <select
                    id="selectedDifficulty"
                    value={String(selectedDifficulty)}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "all") {
                        setSelectedDifficulty("all")
                      } else {
                        setSelectedDifficulty(Number(value) as 1 | 2 | 3)
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      fontSize: "1rem",
                    }}
                  >
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {errorMessage ? (
              <div
                style={{
                  marginTop: 20,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div
                style={{
                  marginTop: 20,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                }}
              >
                {successMessage}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 24,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleSaveBuilderConfig}
                type="button"
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Builder Settings
              </button>

              <button
                onClick={handleGenerateCustomTest}
                type="button"
                disabled={isGenerating}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "1px solid #bef264",
                  background: isGenerating ? "#e5e7eb" : "#d9f99d",
                  color: isGenerating ? "#6b7280" : "#14532d",
                  fontWeight: 700,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                }}
              >
                {isGenerating ? "Generating..." : "Generate Custom Test"}
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
                Back
              </Link>
            </div>
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
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  Main category
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>{catalog.label}</div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  Selected topics
                </div>

                {selectedTopics.length === 0 ? (
                  <div style={{ color: "#9ca3af" }}>No topics selected yet</div>
                ) : (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: "#111827",
                      lineHeight: 1.7,
                    }}
                  >
                    {selectedTopics.map((topic) => (
                      <li key={topic.key}>{renderSelectedTopicSummary(topic)}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  Question count
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>{questionCount}</div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  Total time
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>
                  {totalTimeMinutes} minutes
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  Difficulty
                </div>
                <div style={{ color: "#111827", fontWeight: 700 }}>
                  {renderDifficultyLabel(selectedDifficulty)}
                </div>
              </div>
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
              This builder stays inside one main category only. Custom tests are available
              for monthly, annual and admin members.
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}