"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import ReportQuestionButton from "../../../../../components/ReportQuestionButton";
import type {
  DifficultyFilter,
  GeneratedCustomTest,
  MainCategory,
  OptionKey,
} from "../../../../../lib/custom-tests/types";

type AnswerMap = Record<string, OptionKey>;

type ReportSubject = "english" | "math" | "vr" | "nvr";

type ReportableCustomQuestion = {
  sourceType?: string | null;
  sourceId?: string | number | null;
  mainCategory?: MainCategory | string | null;
  topicKey?: string | null;
  subtopicKey?: string | null;
  meta?: {
    test_id?: string | number | null;
    category?: string | null;
    subcategory?: string | null;
  } | null;
};

function getReportSubject(
  question: ReportableCustomQuestion,
  fallback: MainCategory,
): ReportSubject {
  if (
    question.sourceType === "math_question" ||
    question.mainCategory === "math"
  ) {
    return "math";
  }

  if (question.sourceType === "vr_question" || question.mainCategory === "vr") {
    return "vr";
  }

  if (
    question.sourceType === "nvr_question" ||
    question.mainCategory === "nvr"
  ) {
    return "nvr";
  }

  return fallback === "math" || fallback === "vr" || fallback === "nvr"
    ? fallback
    : "english";
}

function getReportCategory(question: ReportableCustomQuestion) {
  return (
    question.subtopicKey ??
    question.meta?.subcategory ??
    question.topicKey ??
    question.meta?.category ??
    null
  );
}

function normalizeReportNumber(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getReportTestId(question: ReportableCustomQuestion) {
  return normalizeReportNumber(question.meta?.test_id);
}

function getReportQuestionId(question: ReportableCustomQuestion) {
  return normalizeReportNumber(question.sourceId);
}

type SubmitCustomTestResponse =
  | {
      ok: true;
      attemptId: string;
      coinsAwarded: number;
    }
  | {
      ok: false;
      error: string;
    };

type CustomTestQuestion = GeneratedCustomTest["questions"][number];

type AdaptiveDifficultyLevel = 1 | 2 | 3;
type AdaptivePoolKey = "easy" | "medium" | "hard";

type AdaptiveMode = {
  enabled?: boolean;
  startingDifficulty?: AdaptiveDifficultyLevel;
  currentDifficulty?: AdaptiveDifficultyLevel;
  questionCount?: number;
  pools?: Partial<Record<AdaptivePoolKey, CustomTestQuestion[]>>;
};

type RuntimeGeneratedCustomTest = Omit<GeneratedCustomTest, "config"> & {
  config: Omit<GeneratedCustomTest["config"], "selectedDifficulty"> & {
    selectedDifficulty: DifficultyFilter | "adaptive";
  };
  adaptiveMode?: AdaptiveMode;
};

type AdaptiveGeneratedCustomTest = RuntimeGeneratedCustomTest & {
  adaptiveMode?: AdaptiveMode;
};

const ADAPTIVE_DIFFICULTY_LABELS: Record<AdaptiveDifficultyLevel, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

function isAdaptiveTest(test: RuntimeGeneratedCustomTest | null): test is AdaptiveGeneratedCustomTest {
  if (!test) return false;

  const adaptiveTest = test as AdaptiveGeneratedCustomTest;

  return (
    adaptiveTest.adaptiveMode?.enabled === true ||
    adaptiveTest.config.selectedDifficulty === "adaptive"
  );
}

function getAdaptivePoolKey(difficulty: AdaptiveDifficultyLevel): AdaptivePoolKey {
  if (difficulty === 1) return "easy";
  if (difficulty === 2) return "medium";
  return "hard";
}

function getAdaptiveSearchOrder(
  desiredDifficulty: AdaptiveDifficultyLevel,
): AdaptiveDifficultyLevel[] {
  if (desiredDifficulty === 1) return [1, 2, 3];
  if (desiredDifficulty === 2) return [2, 1, 3];
  return [3, 2, 1];
}

function chooseNextAdaptiveQuestion({
  test,
  desiredDifficulty,
  usedRunnerIds,
}: {
  test: AdaptiveGeneratedCustomTest;
  desiredDifficulty: AdaptiveDifficultyLevel;
  usedRunnerIds: Set<string>;
}): { question: CustomTestQuestion; difficulty: AdaptiveDifficultyLevel } | null {
  const pools = test.adaptiveMode?.pools ?? {};

  for (const difficulty of getAdaptiveSearchOrder(desiredDifficulty)) {
    const poolKey = getAdaptivePoolKey(difficulty);
    const question = (pools[poolKey] ?? []).find(
      (item) => !usedRunnerIds.has(item.runnerId),
    );

    if (question) {
      return { question, difficulty };
    }
  }

  return null;
}

function calculateNextAdaptiveState({
  currentDifficulty,
  correctStreak,
  wrongStreak,
  isCorrect,
}: {
  currentDifficulty: AdaptiveDifficultyLevel;
  correctStreak: number;
  wrongStreak: number;
  isCorrect: boolean;
}) {
  let nextDifficulty = currentDifficulty;
  let nextCorrectStreak = isCorrect ? correctStreak + 1 : 0;
  let nextWrongStreak = isCorrect ? 0 : wrongStreak + 1;

  if (isCorrect && nextCorrectStreak >= 2) {
    nextDifficulty = Math.min(
      3,
      currentDifficulty + 1,
    ) as AdaptiveDifficultyLevel;
    nextCorrectStreak = 0;
    nextWrongStreak = 0;
  }

  if (!isCorrect && nextWrongStreak >= 2) {
    nextDifficulty = Math.max(
      1,
      currentDifficulty - 1,
    ) as AdaptiveDifficultyLevel;
    nextCorrectStreak = 0;
    nextWrongStreak = 0;
  }

  return {
    nextDifficulty,
    nextCorrectStreak,
    nextWrongStreak,
  };
}

function getQuestionSnapshotDifficulty(question: CustomTestQuestion) {
  const rawDifficulty = question.difficulty;

  if (rawDifficulty === 1 || rawDifficulty === 2 || rawDifficulty === 3) {
    return rawDifficulty;
  }

  if (typeof rawDifficulty === "string") {
    const parsed = Number(rawDifficulty);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed;
    }
  }

  return null;
}


function isMainCategory(value: string): value is MainCategory {
  return (
    value === "english" || value === "math" || value === "vr" || value === "nvr"
  );
}

function buildGeneratedTestStorageKey(mainCategory: MainCategory) {
  return `custom-test-generated:${mainCategory}`;
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
export default function CustomTestRunPage() {
  const params = useParams<{ mainCategory: string }>();
  const router = useRouter();

  const mainCategoryParam = Array.isArray(params?.mainCategory)
    ? params.mainCategory[0]
    : params?.mainCategory;

  const [generatedTest, setGeneratedTest] =
    useState<RuntimeGeneratedCustomTest | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");
  const [isSavingResult, setIsSavingResult] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");
  const [savedAttemptId, setSavedAttemptId] = useState<string>("");
  const [coinsAwarded, setCoinsAwarded] = useState<number | null>(null);
  const [saveStarted, setSaveStarted] = useState<boolean>(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] =
    useState<AdaptiveDifficultyLevel>(2);
  const [adaptiveCorrectStreak, setAdaptiveCorrectStreak] = useState<number>(0);
  const [adaptiveWrongStreak, setAdaptiveWrongStreak] = useState<number>(0);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string>("");
  const [adaptiveQuestionDifficulties, setAdaptiveQuestionDifficulties] =
    useState<Record<string, AdaptiveDifficultyLevel>>({});

  useEffect(() => {
    if (!mainCategoryParam || !isMainCategory(mainCategoryParam)) {
      setLoadError("Invalid main category.");
      return;
    }

    try {
      const raw = sessionStorage.getItem(
        buildGeneratedTestStorageKey(mainCategoryParam),
      );

      if (!raw) {
        setLoadError(
          "No generated custom test was found. Please build a new test first.",
        );
        return;
      }

      const parsed = JSON.parse(raw) as RuntimeGeneratedCustomTest;

      if (!parsed?.config || parsed.config.mainCategory !== mainCategoryParam) {
        setLoadError("Generated test data does not match this category.");
        return;
      }

      const loadedTest = parsed as AdaptiveGeneratedCustomTest;

      if (isAdaptiveTest(loadedTest)) {
        const firstQuestion = loadedTest.questions[0];

        if (!firstQuestion) {
          setLoadError("No adaptive question was found. Please build a new test first.");
          return;
        }

        const startingDifficulty =
          loadedTest.adaptiveMode?.startingDifficulty === 1 ||
          loadedTest.adaptiveMode?.startingDifficulty === 2 ||
          loadedTest.adaptiveMode?.startingDifficulty === 3
            ? loadedTest.adaptiveMode.startingDifficulty
            : 2;

        setAdaptiveDifficulty(startingDifficulty);
        setAdaptiveCorrectStreak(0);
        setAdaptiveWrongStreak(0);
        setAdaptiveQuestionDifficulties({
          [firstQuestion.runnerId]: startingDifficulty,
        });
      }

      setGeneratedTest(loadedTest);
      setTimeLeftSeconds(parsed.config.totalTimeMinutes * 60);
    } catch {
      setLoadError("Could not load the generated custom test.");
    }
  }, [mainCategoryParam]);

  useEffect(() => {
    if (!generatedTest || hasSubmitted) return;

    if (timeLeftSeconds <= 0) {
      setHasSubmitted(true);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [generatedTest, hasSubmitted, timeLeftSeconds]);

  useEffect(() => {
    if (!generatedTest || !hasSubmitted || saveStarted) return;

    const testToSave = generatedTest;

    async function saveAttempt() {
      try {
        setSaveStarted(true);
        setIsSavingResult(true);
        setSaveError("");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          setSaveError(
            "Results were shown, but the logged-in session could not be verified.",
          );
          return;
        }

        const totalTimeSeconds = testToSave.config.totalTimeMinutes * 60;
        const timeTakenSeconds = Math.max(
          0,
          totalTimeSeconds - timeLeftSeconds,
        );

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
        });

        const result = (await response.json()) as SubmitCustomTestResponse;

        if (!response.ok || !result.ok) {
          setSaveError(
            result.ok ? "Could not save custom test." : result.error,
          );
          return;
        }

        setSavedAttemptId(result.attemptId);
        setCoinsAwarded(result.coinsAwarded);
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Unexpected error while saving the custom test.",
        );
      } finally {
        setIsSavingResult(false);
      }
    }

    void saveAttempt();
  }, [answers, generatedTest, hasSubmitted, saveStarted, timeLeftSeconds]);

  const questions = generatedTest?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const adaptiveTest = isAdaptiveTest(generatedTest) ? generatedTest : null;
  const targetQuestionCount =
    adaptiveTest?.adaptiveMode?.questionCount ?? generatedTest?.config.questionCount ?? questions.length;
  const canMoveToNextQuestion = adaptiveTest
    ? currentIndex < targetQuestionCount - 1
    : currentIndex < questions.length - 1;

  const correctCount = useMemo(() => {
    if (!generatedTest) return 0;

    return generatedTest.questions.reduce((total, question) => {
      return (
        total + (answers[question.runnerId] === question.correctAnswer ? 1 : 0)
      );
    }, 0);
  }, [answers, generatedTest]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const scorePercent = useMemo(() => {
    if (!generatedTest || generatedTest.questions.length === 0) return 0;
    return Math.round((correctCount / generatedTest.questions.length) * 100);
  }, [correctCount, generatedTest]);

  function handleSelectAnswer(runnerId: string, optionKey: OptionKey) {
    if (hasSubmitted) return;

    setAdaptiveMessage("");

    setAnswers((prev) => ({
      ...prev,
      [runnerId]: optionKey,
    }));
  }

  function handleAdaptiveNextQuestion() {
    if (!adaptiveTest || !currentQuestion) return;

    const selectedAnswer = answers[currentQuestion.runnerId];

    if (!selectedAnswer) {
      setAdaptiveMessage("Please choose an answer before moving to the next adaptive question.");
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const nextState = calculateNextAdaptiveState({
      currentDifficulty: adaptiveDifficulty,
      correctStreak: adaptiveCorrectStreak,
      wrongStreak: adaptiveWrongStreak,
      isCorrect,
    });

    const usedRunnerIds = new Set(questions.map((question) => question.runnerId));
    const nextQuestionResult = chooseNextAdaptiveQuestion({
      test: adaptiveTest,
      desiredDifficulty: nextState.nextDifficulty,
      usedRunnerIds,
    });

    if (!nextQuestionResult) {
      setHasSubmitted(true);
      return;
    }

    setAdaptiveDifficulty(nextQuestionResult.difficulty);
    setAdaptiveCorrectStreak(nextState.nextCorrectStreak);
    setAdaptiveWrongStreak(nextState.nextWrongStreak);
    setAdaptiveQuestionDifficulties((prev) => ({
      ...prev,
      [nextQuestionResult.question.runnerId]: nextQuestionResult.difficulty,
    }));

    setGeneratedTest((prev) => {
      if (!prev) return prev;

      return {
        ...(prev as AdaptiveGeneratedCustomTest),
        questions: [...prev.questions, nextQuestionResult.question],
      };
    });

    setCurrentIndex((prev) => prev + 1);
  }

  function handleSubmit() {
    if (adaptiveTest && currentQuestion) {
      const selectedAnswer = answers[currentQuestion.runnerId];

      if (!selectedAnswer) {
        setAdaptiveMessage("Please choose an answer before finishing the adaptive test.");
        return;
      }

      const finalState = calculateNextAdaptiveState({
        currentDifficulty: adaptiveDifficulty,
        correctStreak: adaptiveCorrectStreak,
        wrongStreak: adaptiveWrongStreak,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      });

      setAdaptiveDifficulty(finalState.nextDifficulty);
      setAdaptiveCorrectStreak(finalState.nextCorrectStreak);
      setAdaptiveWrongStreak(finalState.nextWrongStreak);
      setHasSubmitted(true);
      return;
    }

    const unansweredCount = questions.length - answeredCount;

    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Do you want to finish the test anyway?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setHasSubmitted(true);
  }

  function handleRestartBuilder() {
    if (!mainCategoryParam || !isMainCategory(mainCategoryParam)) return;
    router.push(`/custom-tests/${mainCategoryParam}`);
  }

  if (loadError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          padding: "32px 16px",
        }}
      >
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
              Custom Test Runner
            </h1>

            <p
              style={{
                margin: "0 0 20px 0",
                color: "#991b1b",
                lineHeight: 1.6,
              }}
            >
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
                Back to Build a Test
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
    );
  }

  if (!generatedTest || !currentQuestion) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          padding: "32px 16px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", color: "#4b5563" }}>
          Loading...
        </div>
      </main>
    );
  }

  const test = generatedTest;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
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
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        color: "#6b7280",
                        fontSize: "0.95rem",
                      }}
                    >
                      Question {currentIndex + 1} of {targetQuestionCount}
                    </p>
                    <h1
                      style={{
                        margin: 0,
                        color: "#111827",
                        fontSize: "1.75rem",
                      }}
                    >
                      {adaptiveTest ? "Adaptive Custom Test" : "Custom Test"}
                    </h1>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {adaptiveTest ? (
                      <div
                        style={{
                          background: "#eff6ff",
                          color: "#1e3a8a",
                          border: "1px solid #bfdbfe",
                          borderRadius: 999,
                          padding: "10px 16px",
                          fontWeight: 800,
                          fontSize: "1rem",
                        }}
                      >
                        Current level: {ADAPTIVE_DIFFICULTY_LABELS[adaptiveDifficulty]}
                      </div>
                    ) : null}

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
                </div>

                {adaptiveMessage ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      fontWeight: 700,
                    }}
                  >
                    {adaptiveMessage}
                  </div>
                ) : null}

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
                    const selected =
                      answers[currentQuestion.runnerId] === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          handleSelectAnswer(
                            currentQuestion.runnerId,
                            option.key,
                          )
                        }
                        style={{
                          textAlign: "left",
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 12,
                          border: selected
                            ? "2px solid #84cc16"
                            : "1px solid #d1d5db",
                          background: selected ? "#f7fee7" : "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom:
                              option.text || option.imageUrl ? 6 : 0,
                          }}
                        >
                          {option.key}
                        </div>

                        {option.text ? (
                          <div style={{ color: "#374151", lineHeight: 1.6 }}>
                            {option.text}
                          </div>
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
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={adaptiveTest !== null || currentIndex === 0}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        background: adaptiveTest !== null || currentIndex === 0 ? "#f3f4f6" : "#ffffff",
                        color: adaptiveTest !== null || currentIndex === 0 ? "#9ca3af" : "#111827",
                        fontWeight: 700,
                        cursor: adaptiveTest !== null || currentIndex === 0 ? "not-allowed" : "pointer",
                        minWidth: 120,
                      }}
                    >
                      Previous
                    </button>

                    {canMoveToNextQuestion ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (adaptiveTest) {
                            handleAdaptiveNextQuestion();
                            return;
                          }

                          setCurrentIndex((prev) =>
                            Math.min(prev + 1, questions.length - 1),
                          );
                        }}
                        style={{
                          padding: "12px 18px",
                          borderRadius: 10,
                          border: "1px solid #bef264",
                          background: "#d9f99d",
                          color: "#14532d",
                          fontWeight: 700,
                          cursor: "pointer",
                          minWidth: 120,
                        }}
                      >
                        Next
                      </button>
                    ) : (
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
                          minWidth: 120,
                        }}
                      >
                        Finish Test
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(220px, 1fr) auto minmax(220px, 1fr)",
                      alignItems: "start",
                      gap: 12,
                      marginTop: 18,
                    }}
                  >
                    <div
                      style={{
                        justifySelf: "start",
                        width: "100%",
                        maxWidth: 560,
                      }}
                    >
                      <ReportQuestionButton
                        key={currentQuestion.runnerId}
                        subject={getReportSubject(
                          currentQuestion,
                          test.config.mainCategory,
                        )}
                        category={getReportCategory(currentQuestion)}
                        testId={getReportTestId(currentQuestion)}
                        questionId={getReportQuestionId(currentQuestion)}
                      />
                    </div>

                    <div />

                    <div />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1
                  style={{
                    margin: "0 0 16px 0",
                    color: "#111827",
                    fontSize: "1.9rem",
                  }}
                >
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
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "0.9rem",
                        marginBottom: 6,
                      }}
                    >
                      Score
                    </div>
                    <div
                      style={{
                        color: "#111827",
                        fontSize: "1.6rem",
                        fontWeight: 800,
                      }}
                    >
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
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "0.9rem",
                        marginBottom: 6,
                      }}
                    >
                      Correct answers
                    </div>
                    <div
                      style={{
                        color: "#111827",
                        fontSize: "1.6rem",
                        fontWeight: 800,
                      }}
                    >
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
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "0.9rem",
                        marginBottom: 6,
                      }}
                    >
                      Answered
                    </div>
                    <div
                      style={{
                        color: "#111827",
                        fontSize: "1.6rem",
                        fontWeight: 800,
                      }}
                    >
                      {answeredCount} / {questions.length}
                    </div>
                  </div>

                  {adaptiveTest ? (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: "0.9rem",
                          marginBottom: 6,
                        }}
                      >
                        Final adaptive level
                      </div>
                      <div
                        style={{
                          color: "#111827",
                          fontSize: "1.6rem",
                          fontWeight: 800,
                        }}
                      >
                        {ADAPTIVE_DIFFICULTY_LABELS[adaptiveDifficulty]}
                      </div>
                    </div>
                  ) : null}
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
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      Results saved successfully.
                    </div>
                    {coinsAwarded !== null && coinsAwarded > 0 ? (
                      <div style={{ marginTop: 6 }}>
                        Brilliant work — you earned{" "}
                        <strong>
                          {coinsAwarded} YanBo{" "}
                          {coinsAwarded === 1 ? "Coin" : "Coins"}
                        </strong>
                        !
                      </div>
                    ) : coinsAwarded !== null ? (
                      <div style={{ marginTop: 6 }}>
                        Score 50% or more next time to earn YanBo Coins.
                      </div>
                    ) : null}
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
                    const selectedAnswer = answers[question.runnerId];
                    const isCorrect = selectedAnswer === question.correctAnswer;
                    const passageText = question.passageText?.trim() ?? "";
                    const firstPassageIndex = passageText
                      ? questions.findIndex(
                          (item) => item.passageText?.trim() === passageText,
                        )
                      : -1;
                    const shouldShowPassage =
                      passageText.length > 0 && firstPassageIndex === index;

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
                        {shouldShowPassage ? (
                          <div
                            style={{
                              marginBottom: 14,
                              padding: 14,
                              borderRadius: 12,
                              background: "#f9fafb",
                              border: "1px solid #d1d5db",
                              color: "#374151",
                              lineHeight: 1.75,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: 8,
                              }}
                            >
                              Comprehension passage
                            </div>
                            {passageText}
                          </div>
                        ) : null}

                        <div
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: 8,
                          }}
                        >
                          Question {index + 1}
                          {adaptiveTest ? (
                            <span
                              style={{
                                marginLeft: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                background: "#eff6ff",
                                color: "#1e3a8a",
                                fontSize: "0.8rem",
                              }}
                            >
                              {ADAPTIVE_DIFFICULTY_LABELS[
                                adaptiveQuestionDifficulties[question.runnerId] ??
                                  getQuestionSnapshotDifficulty(question) ??
                                  2
                              ]}
                            </span>
                          ) : null}
                        </div>

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

                        <div
                          style={{
                            color: isCorrect ? "#166534" : "#991b1b",
                            fontWeight: 700,
                          }}
                        >
                          Your answer: {selectedAnswer ?? "No answer"}
                        </div>

                        <div
                          style={{
                            color: "#111827",
                            marginTop: 4,
                            fontWeight: 700,
                          }}
                        >
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

                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid #f3f4f6",
                          }}
                        >
                          <ReportQuestionButton
                            subject={getReportSubject(
                              question,
                              test.config.mainCategory,
                            )}
                            category={getReportCategory(question)}
                            testId={getReportTestId(question)}
                            questionId={getReportQuestionId(question)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 22,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
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
                    Back to Build a Test
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
