"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "../../../../../components/Header";
import { supabase } from "../../../../../lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const MAIN_CATEGORY = "grammar";
const SUBCATEGORY = "primary_word_classes";
const RESULT_CATEGORY = "primary_word_classes";
const REVIEW_STORAGE_KEY = "primary_word_classes_review_ids";
const QUESTION_TIME = 60;
const TIMER_STORAGE_KEY = "primary_word_classes_timer_enabled";

type AnswerOption = "A" | "B" | "C" | "D";

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin";

type PrimaryWordClassesTest = {
  id: number;
  title: string;
  description: string | null;
  difficulty: number | null;
  created_at: string;
  is_free: boolean | null;
};

type PrimaryWordClassesQuestion = {
  id: number;
  test_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: AnswerOption;
  explanation: string | null;
  difficulty: number | null;
  question_order: number;
  created_at: string;
};

type UserAnswerMap = {
  [questionId: number]: AnswerOption;
};

type SavedQuestionReview = {
  question_id: number;
  question_order: number;
  question_text: string;
  question_image_url?: string | null;
  options: Record<AnswerOption, string>;
  option_images?: Partial<Record<AnswerOption, string | null>>;
  user_answer: AnswerOption | null;
  correct_answer: AnswerOption;
  user_answer_text: string | null;
  correct_answer_text: string;
  user_answer_image_url?: string | null;
  correct_answer_image_url?: string | null;
  is_correct: boolean;
  explanation: string | null;
  explanation_image_url?: string | null;
  difficulty: number | null;
};

function hasFullAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin";
}

function isFreeTest(test: PrimaryWordClassesTest) {
  return test.is_free === true;
}

export default function PrimaryWordClassesTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const testId = Number(rawId);

  const [userId, setUserId] = useState<string | null>(null);
  const [test, setTest] = useState<PrimaryWordClassesTest | null>(null);
  const [questions, setQuestions] = useState<PrimaryWordClassesQuestion[]>([]);

  const [answers, setAnswers] = useState<UserAnswerMap>({});
  const [finalReviewAnswers, setFinalReviewAnswers] = useState<UserAnswerMap>(
    {},
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(
    null,
  );
  const [showFeedback, setShowFeedback] = useState(false);

  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerPreferenceLoaded, setTimerPreferenceLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [timeUpMessage, setTimeUpMessage] = useState("");
  const [timeExpiredProcessing, setTimeExpiredProcessing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [resultSaved, setResultSaved] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState<
    "guest" | "upgrade" | null
  >(null);

  const currentQuestion = questions[currentIndex];

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const shouldWarnBeforeLeaving = answeredCount > 0 && !finished && !submitting;

  const selectedAnswerText = useMemo(() => {
    if (!currentQuestion || !selectedAnswer) return "";
    return getOptionText(currentQuestion, selectedAnswer);
  }, [currentQuestion, selectedAnswer]);

  useEffect(() => {
    if (mode !== "review") {
      setReviewIds([]);
      return;
    }

    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);

    if (!raw) {
      setReviewIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        setReviewIds(parsed.filter((id) => typeof id === "number"));
      } else {
        setReviewIds([]);
      }
    } catch {
      setReviewIds([]);
    }
  }, [mode]);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      setErrorMessage("");
      setAccessBlocked(null);
      setFinished(false);
      setSubmitting(false);
      setCurrentIndex(0);
      setAnswers({});
      setFinalReviewAnswers({});
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(QUESTION_TIME);
      setTimeUpMessage("");
      setTimeExpiredProcessing(false);
      setScore(0);
      setQuestions([]);
      setResultSaved(false);

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid Primary Word Classes test ID.");
        setLoading(false);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting auth session:", sessionError);
      }

      const user = session?.user ?? null;

      if (!user) {
        setAccessBlocked("guest");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading profile plan:", profileError);
      }

      const dbPlan = profile?.plan;

      const safePlan: UserPlan =
        dbPlan === "monthly" ||
        dbPlan === "annual" ||
        dbPlan === "admin" ||
        dbPlan === "free"
          ? dbPlan
          : "free";

      const { data: testData, error: testError } = await supabase
        .from("english_tests")
        .select("id, title, description, difficulty, created_at, is_free")
        .eq("id", testId)
        .eq("main_category", MAIN_CATEGORY)
        .eq("subcategory", SUBCATEGORY)
        .single();

      if (testError) {
        console.error("Error loading primary word classes test:", {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code,
          full: testError,
          testId,
        });

        setErrorMessage("Could not load this Primary Word Classes test.");
        setLoading(false);
        return;
      }

      const loadedTest = testData as PrimaryWordClassesTest;
      setTest(loadedTest);

      const canOpenTest =
        hasFullAccess(safePlan) ||
        (safePlan === "free" && isFreeTest(loadedTest));

      if (!canOpenTest) {
        setAccessBlocked("upgrade");
        setLoading(false);
        return;
      }

      let questionQuery = supabase
        .from("english_questions")
        .select(
          "id, test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, question_order, created_at",
        )
        .eq("test_id", testId)
        .eq("main_category", MAIN_CATEGORY)
        .eq("subcategory", SUBCATEGORY)
        .order("question_order", { ascending: true });

      if (mode === "review") {
        if (reviewIds.length === 0) {
          setQuestions([]);
          setLoading(false);
          return;
        }

        questionQuery = questionQuery.in("id", reviewIds);
      }

      const { data: questionData, error: questionError } = await questionQuery;

      if (questionError) {
        console.error("Error loading primary word classes questions:", {
          message: questionError.message,
          details: questionError.details,
          hint: questionError.hint,
          code: questionError.code,
          full: questionError,
        });

        setErrorMessage("Could not load the questions for this test.");
        setLoading(false);
        return;
      }

      setQuestions((questionData || []) as PrimaryWordClassesQuestion[]);
      setLoading(false);
    }

    loadPage();
  }, [rawId, testId, mode, reviewIds.join(",")]);

  useEffect(() => {
    const savedTimerSetting = window.localStorage.getItem(TIMER_STORAGE_KEY);

    if (savedTimerSetting !== null) {
      setTimerEnabled(savedTimerSetting === "true");
    }

    setTimerPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    if (!timerPreferenceLoaded) return;

    window.localStorage.setItem(TIMER_STORAGE_KEY, String(timerEnabled));
  }, [timerEnabled, timerPreferenceLoaded]);

  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setTimeUpMessage("");
    setTimeExpiredProcessing(false);
  }, [currentIndex, timerEnabled]);

  useEffect(() => {
    if (!timerEnabled) return;
    if (!currentQuestion) return;
    if (finished || submitting || showFeedback || timeExpiredProcessing) return;

    if (timeLeft <= 0) {
      void handleTimeUp();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    timerEnabled,
    currentQuestion,
    finished,
    submitting,
    showFeedback,
    timeExpiredProcessing,
    timeLeft,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeLeaving) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarnBeforeLeaving]);

  function confirmLeaveIfNeeded() {
    if (!shouldWarnBeforeLeaving) return true;

    return window.confirm(
      "Not all questions have been finished. Are you sure you want to leave this test?",
    );
  }

  function goBackSafely() {
    const confirmed = confirmLeaveIfNeeded();

    if (!confirmed) return;

    if (mode === "review") {
      router.push("/english/grammar/primary-word-classes?mode=review");
      return;
    }

    router.push("/english/grammar/primary-word-classes");
  }

  function handleSelectAnswer(option: AnswerOption) {
    if (showFeedback || finished || submitting || timeExpiredProcessing) return;
    setSelectedAnswer(option);
  }

  function handleCheckAnswer() {
    if (
      !currentQuestion ||
      !selectedAnswer ||
      submitting ||
      finished ||
      timeExpiredProcessing
    )
      return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }));

    setShowFeedback(true);
  }

  async function handleNext() {
    if (
      !currentQuestion ||
      !selectedAnswer ||
      !showFeedback ||
      submitting ||
      timeExpiredProcessing
    ) {
      return;
    }

    const isLastQuestion = currentIndex === questions.length - 1;

    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: selectedAnswer,
    };

    if (isLastQuestion) {
      await submitResults(finalAnswers);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTimeLeft(QUESTION_TIME);
    setTimeUpMessage("");
    setTimeExpiredProcessing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleTimeUp() {
    if (!currentQuestion || submitting || finished || timeExpiredProcessing)
      return;

    setTimeExpiredProcessing(true);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTimeUpMessage("Time’s up!");

    const isLastQuestion = currentIndex === questions.length - 1;
    const finalAnswers = { ...answers };

    await new Promise((resolve) => window.setTimeout(resolve, 900));

    if (isLastQuestion) {
      await submitResults(finalAnswers);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTimeLeft(QUESTION_TIME);
    setTimeUpMessage("");
    setTimeExpiredProcessing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveLatestTestResult(
    finalAnswers: UserAnswerMap,
    correctAnswers: number,
    successRate: number,
  ) {
    if (!userId || !test) return;

    const completedAt = new Date().toISOString();

    const answersForResult: SavedQuestionReview[] = questions.map(
      (question, index) => {
        const userAnswer = finalAnswers[question.id] ?? null;
        const correctAnswer = question.correct_answer;

        return {
          question_id: question.id,
          question_order: question.question_order || index + 1,
          question_text: question.question_text,
          question_image_url: null,
          options: {
            A: question.option_a,
            B: question.option_b,
            C: question.option_c,
            D: question.option_d,
          },
          option_images: {},
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          user_answer_text: userAnswer
            ? getOptionText(question, userAnswer)
            : null,
          correct_answer_text: getOptionText(question, correctAnswer),
          user_answer_image_url: null,
          correct_answer_image_url: null,
          is_correct: userAnswer === correctAnswer,
          explanation: question.explanation,
          explanation_image_url: null,
          difficulty: question.difficulty ?? test.difficulty ?? null,
        };
      },
    );

    const payload = {
      user_id: userId,
      subject: "english",
      category: RESULT_CATEGORY,
      subcategory: "",
      subcategory_two: "",
      subcategory_three: "",
      test_id: test.id,
      test_title: test.title,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      success_rate: successRate,
      difficulty: test.difficulty ?? null,
      answers: answersForResult,
      completed_at: completedAt,
      updated_at: completedAt,
    };

    const { error } = await supabase
      .from("latest_test_results")
      .upsert([payload], {
        onConflict:
          "user_id,subject,category,subcategory,subcategory_two,subcategory_three,test_id",
      });

    if (error) {
      console.error("Error saving latest primary word classes result:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });

      setErrorMessage(
        "The test was completed, but the full result could not be saved.",
      );
      return;
    }

    setResultSaved(true);
  }

  async function submitResults(finalAnswers: UserAnswerMap) {
    if (submitting) return;
    if (!userId || !test) return;
    if (questions.length === 0) return;

    setSubmitting(true);
    setErrorMessage("");
    setResultSaved(false);

    let correctAnswers = 0;

    const wrongAnswersForReview: {
      user_id: string;
      test_id: number;
      question_id: number;
      main_category: string;
      subcategory: string;
      question_text: string;
      user_answer: AnswerOption | null;
      correct_answer: AnswerOption;
      difficulty: number | null;
    }[] = [];

    const correctlyAnsweredReviewQuestionIds: number[] = [];

    for (const question of questions) {
      const selected = finalAnswers[question.id];

      if (selected === question.correct_answer) {
        correctAnswers += 1;

        if (mode === "review") {
          correctlyAnsweredReviewQuestionIds.push(question.id);
        }
      } else {
        wrongAnswersForReview.push({
          user_id: userId,
          test_id: test.id,
          question_id: question.id,
          main_category: MAIN_CATEGORY,
          subcategory: SUBCATEGORY,
          question_text: question.question_text,
          user_answer: selected ?? null,
          correct_answer: question.correct_answer,
          difficulty: question.difficulty ?? test.difficulty ?? null,
        });
      }
    }

    const totalQuestions = questions.length;
    const successRate =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    const progressPayload = {
      user_id: userId,
      test_id: test.id,
      main_category: MAIN_CATEGORY,
      subcategory: SUBCATEGORY,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      success_rate: successRate,
      difficulty: test.difficulty ?? null,
    };

    const { error: progressError } = await supabase
      .from("english_progress")
      .insert([progressPayload]);

    if (progressError) {
      console.error("Error saving primary word classes progress:", {
        message: progressError.message,
        details: progressError.details,
        hint: progressError.hint,
        code: progressError.code,
        payload: progressPayload,
      });

      setErrorMessage(
        progressError.message ||
          "Could not save your progress. Please try again.",
      );
      setSubmitting(false);
      return;
    }

    await saveLatestTestResult(finalAnswers, correctAnswers, successRate);

    if (mode === "review") {
      if (correctlyAnsweredReviewQuestionIds.length > 0) {
        const { error: deleteReviewError } = await supabase
          .from("english_review")
          .delete()
          .eq("user_id", userId)
          .eq("main_category", MAIN_CATEGORY)
          .eq("subcategory", SUBCATEGORY)
          .in("question_id", correctlyAnsweredReviewQuestionIds);

        if (deleteReviewError) {
          console.error(
            "Error removing correctly answered primary word classes review items:",
            {
              message: deleteReviewError.message,
              details: deleteReviewError.details,
              hint: deleteReviewError.hint,
              code: deleteReviewError.code,
            },
          );
        }
      }

      const remainingIds = reviewIds.filter(
        (id) => !correctlyAnsweredReviewQuestionIds.includes(id),
      );

      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(remainingIds));
    } else if (wrongAnswersForReview.length > 0) {
      const { error: reviewError } = await supabase
        .from("english_review")
        .insert(wrongAnswersForReview);

      if (reviewError) {
        console.error("Error saving primary word classes review:", {
          message: reviewError.message,
          details: reviewError.details,
          hint: reviewError.hint,
          code: reviewError.code,
        });
      }

      const existingReviewIds = Array.from(new Set(reviewIds));
      const newWrongIds = wrongAnswersForReview.map((row) => row.question_id);
      const updatedReviewIds = Array.from(
        new Set([...existingReviewIds, ...newWrongIds]),
      );

      localStorage.setItem(
        REVIEW_STORAGE_KEY,
        JSON.stringify(updatedReviewIds),
      );
    }

    setFinalReviewAnswers(finalAnswers);
    setScore(correctAnswers);
    setFinished(true);
    setSubmitting(false);
    setTimeExpiredProcessing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getOptionText(
    question: PrimaryWordClassesQuestion,
    option: AnswerOption,
  ) {
    if (option === "A") return question.option_a;
    if (option === "B") return question.option_b;
    if (option === "C") return question.option_c;
    return question.option_d;
  }

  function restartSameTest() {
    setAnswers({});
    setFinalReviewAnswers({});
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTimeLeft(QUESTION_TIME);
    setTimeUpMessage("");
    setTimeExpiredProcessing(false);
    setFinished(false);
    setScore(0);
    setErrorMessage("");
    setResultSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getDifficultyLabel(difficulty: number | null) {
    if (difficulty === 1) return "Easy";
    if (difficulty === 2) return "Medium";
    if (difficulty === 3) return "Hard";
    return "Not set";
  }

  function getDifficultyColors(difficulty: number | null) {
    if (difficulty === 1) {
      return { background: "#ecfdf5", color: "#065f46" };
    }

    if (difficulty === 2) {
      return { background: "#eff6ff", color: "#1d4ed8" };
    }

    if (difficulty === 3) {
      return { background: "#fef2f2", color: "#b91c1c" };
    }

    return { background: "#f3f4f6", color: "#374151" };
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>
          {mode === "review"
            ? "Loading Primary Word Classes review..."
            : "Loading Primary Word Classes test..."}
        </p>
      </>
    );
  }

  if (accessBlocked === "guest") {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Please sign in</h1>

            <p style={styles.subtitle}>
              Guests can browse the tests, but you need to sign in before
              starting a test.
            </p>

            <div style={styles.resultButtons}>
              <button
                onClick={() => router.push("/login")}
                style={styles.primaryButton}
              >
                Sign In
              </button>

              <button onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Primary Word Classes
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (accessBlocked === "upgrade") {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Members-only test</h1>

            <p style={styles.subtitle}>
              This test is not included in the free plan. Upgrade your plan to
              unlock it.
            </p>

            <div style={styles.resultButtons}>
              <button
                onClick={() => router.push("/profile")}
                style={styles.primaryButton}
              >
                View Membership
              </button>

              <button onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Primary Word Classes
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (errorMessage && !test) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Could not open test</h1>
            <p>{errorMessage}</p>

            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Primary Word Classes
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!test) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Primary Word Classes test not found</h1>

            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Primary Word Classes
            </button>
          </div>
        </div>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2>
                {mode === "review"
                  ? "No review questions found"
                  : "No questions found"}
              </h2>

              <p>
                {mode === "review"
                  ? "There are no saved review questions for this test."
                  : "Add questions in Supabase for this test."}
              </p>

              <button onClick={goBackSafely} style={styles.primaryButton}>
                Back to Primary Word Classes
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const percentage =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const badgeColors = getDifficultyColors(test.difficulty);

  if (finished) {
    return (
      <>
        <Header />

        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.heroCard}>
              <h1 style={styles.title}>
                {mode === "review"
                  ? "📝 Review Complete"
                  : "📝 Primary Word Classes Test Complete"}
              </h1>

              <p style={styles.subtitle}>{test.title}</p>
            </div>

            <div style={styles.resultBanner}>
              <div style={styles.cardTop}>
                <h2 style={styles.sectionTitle}>Your Results</h2>

                <span
                  style={{
                    ...styles.badge,
                    background: badgeColors.background,
                    color: badgeColors.color,
                  }}
                >
                  {getDifficultyLabel(test.difficulty)}
                </span>
              </div>

              <div style={styles.resultBox}>
                <p style={styles.resultText}>
                  <strong>Score:</strong> {score} / {questions.length}
                </p>

                <p style={styles.resultText}>
                  <strong>Success Rate:</strong> {percentage}%
                </p>

                <p style={styles.resultText}>
                  <strong>Category:</strong> Primary Word Classes
                </p>

                {resultSaved && (
                  <p style={styles.savedText}>Full result saved.</p>
                )}

                {submitting && (
                  <p style={styles.resultText}>Saving results...</p>
                )}

                {errorMessage && (
                  <p style={styles.inlineError}>{errorMessage}</p>
                )}
              </div>

              <div style={styles.resultButtons}>
                <button
                  onClick={restartSameTest}
                  style={styles.secondaryButton}
                >
                  Retry This Set
                </button>

                <button onClick={goBackSafely} style={styles.primaryButton}>
                  Back to Primary Word Classes
                </button>
              </div>

              <div style={styles.reviewSection}>
                <h2 style={styles.sectionTitle}>Answer Review</h2>

                {questions.map((question, index) => {
                  const userAnswer = finalReviewAnswers[question.id] ?? null;
                  const isQuestionCorrect =
                    userAnswer === question.correct_answer;

                  return (
                    <div
                      key={question.id}
                      style={{
                        ...styles.reviewQuestionCard,
                        borderColor: isQuestionCorrect ? "#86efac" : "#fecaca",
                        background: isQuestionCorrect ? "#f0fdf4" : "#fef2f2",
                      }}
                    >
                      <div style={styles.reviewQuestionTop}>
                        <h3 style={styles.reviewQuestionTitle}>
                          Question {index + 1}
                        </h3>

                        <span
                          style={{
                            ...styles.reviewStatusBadge,
                            background: isQuestionCorrect
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: isQuestionCorrect ? "#166534" : "#991b1b",
                          }}
                        >
                          {isQuestionCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      <p style={styles.reviewQuestionText}>
                        {question.question_text}
                      </p>

                      <div style={styles.reviewOptionsGrid}>
                        {(["A", "B", "C", "D"] as const).map((option) => {
                          const isUserAnswer = userAnswer === option;
                          const isCorrectAnswer =
                            question.correct_answer === option;

                          let background = "white";
                          let borderColor = "#e5e7eb";

                          if (isCorrectAnswer) {
                            background = "#dcfce7";
                            borderColor = "#16a34a";
                          }

                          if (isUserAnswer && !isCorrectAnswer) {
                            background = "#fee2e2";
                            borderColor = "#dc2626";
                          }

                          return (
                            <div
                              key={option}
                              style={{
                                ...styles.reviewOption,
                                background,
                                borderColor,
                              }}
                            >
                              <strong>{option}.</strong>{" "}
                              {getOptionText(question, option)}
                              <div>
                                {isCorrectAnswer && (
                                  <span style={styles.optionTag}>
                                    Correct answer
                                  </span>
                                )}

                                {isUserAnswer && (
                                  <span style={styles.optionTag}>
                                    Your answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={styles.reviewAnswerBox}>
                        <p>
                          <strong>Your answer:</strong>{" "}
                          {userAnswer
                            ? `${userAnswer} — ${getOptionText(question, userAnswer)}`
                            : "No answer"}
                        </p>

                        <p>
                          <strong>Correct answer:</strong>{" "}
                          {question.correct_answer} —{" "}
                          {getOptionText(question, question.correct_answer)}
                        </p>

                        {question.explanation &&
                          question.explanation.trim() !== "" && (
                            <p>
                              <strong>Explanation:</strong>{" "}
                              {question.explanation}
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <div style={styles.heroTop}>
              <div>
                <h1 style={styles.title}>
                  {mode === "review" ? "📝 Review:" : "📝"} {test.title}
                </h1>
              </div>

              <div
                style={{
                  ...styles.badge,
                  background: badgeColors.background,
                  color: badgeColors.color,
                }}
              >
                {getDifficultyLabel(test.difficulty)}
              </div>
            </div>

            {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
          </div>

          <div style={styles.questionsCard}>
            <div style={styles.progressRow}>
              <span style={styles.progressText}>
                Question {currentIndex + 1} / {questions.length}
              </span>

              <div style={styles.timerControls}>
                <button
                  type="button"
                  onClick={() => {
                    setTimerEnabled((prev) => !prev);
                    setTimeLeft(QUESTION_TIME);
                    setTimeUpMessage("");
                    setTimeExpiredProcessing(false);
                  }}
                  disabled={submitting || timeExpiredProcessing}
                  style={{
                    ...styles.timerButton,
                    opacity: submitting || timeExpiredProcessing ? 0.6 : 1,
                    cursor:
                      submitting || timeExpiredProcessing
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Timer: {timerEnabled ? "ON" : "OFF"}
                </button>

                {timerEnabled && (
                  <span
                    style={{
                      ...styles.timerText,
                      color: timeLeft <= 10 ? "#b91c1c" : "#374151",
                    }}
                  >
                    Time left: {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            </div>

            {timeUpMessage && <p style={styles.timeUpText}>{timeUpMessage}</p>}

            <h2 style={styles.questionTitle}>
              {currentQuestion.question_text}
            </h2>

            <div style={styles.optionsGrid}>
              {(["A", "B", "C", "D"] as const).map((option) => {
                const optionText = getOptionText(currentQuestion, option);

                let backgroundColor = "#f3f4f6";
                let borderColor = "transparent";

                if (selectedAnswer === option) {
                  backgroundColor = "#e0e7ff";
                  borderColor = "#4f46e5";
                }

                if (showFeedback) {
                  if (option === currentQuestion.correct_answer) {
                    backgroundColor = "#dcfce7";
                    borderColor = "#16a34a";
                  } else if (
                    selectedAnswer === option &&
                    option !== currentQuestion.correct_answer
                  ) {
                    backgroundColor = "#fee2e2";
                    borderColor = "#dc2626";
                  }
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={
                      showFeedback || submitting || timeExpiredProcessing
                    }
                    style={{
                      ...styles.optionButton,
                      backgroundColor,
                      borderColor,
                      cursor:
                        showFeedback || submitting || timeExpiredProcessing
                          ? "default"
                          : "pointer",
                    }}
                  >
                    <span style={styles.optionLetter}>{option}.</span>
                    <span>{optionText}</span>
                  </button>
                );
              })}
            </div>

            {!showFeedback ? (
              <div style={styles.submitRow}>
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={
                    !selectedAnswer || submitting || timeExpiredProcessing
                  }
                  style={{
                    ...styles.primaryButton,
                    opacity:
                      selectedAnswer && !submitting && !timeExpiredProcessing
                        ? 1
                        : 0.6,
                    cursor:
                      selectedAnswer && !submitting && !timeExpiredProcessing
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  Check Answer
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...styles.feedbackBox,
                    backgroundColor: isCorrect ? "#f0fdf4" : "#fef2f2",
                    borderColor: isCorrect ? "#86efac" : "#fecaca",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>{isCorrect ? "Correct!" : "Not quite."}</strong>
                  </p>

                  {!isCorrect && (
                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Correct answer:</strong>{" "}
                      {currentQuestion.correct_answer} —{" "}
                      {getOptionText(
                        currentQuestion,
                        currentQuestion.correct_answer,
                      )}
                    </p>
                  )}

                  {selectedAnswer && (
                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Your answer:</strong> {selectedAnswer} —{" "}
                      {selectedAnswerText}
                    </p>
                  )}

                  {currentQuestion.explanation &&
                    currentQuestion.explanation.trim() !== "" && (
                      <p style={{ margin: "8px 0 0 0" }}>
                        <strong>Explanation:</strong>{" "}
                        {currentQuestion.explanation}
                      </p>
                    )}
                </div>

                <div style={styles.submitRow}>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting || timeExpiredProcessing}
                    style={{
                      ...styles.primaryButton,
                      opacity: submitting || timeExpiredProcessing ? 0.7 : 1,
                      cursor:
                        submitting || timeExpiredProcessing
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {submitting
                      ? "Saving..."
                      : currentIndex === questions.length - 1
                        ? "Finish Test"
                        : "Next Question"}
                  </button>
                </div>
              </>
            )}

            <div style={styles.backRow}>
              <button onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Primary Word Classes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
    background: "#f9fafb",
    minHeight: "calc(100vh - 70px)",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  heroCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  title: {
    fontSize: "36px",
    margin: "0 0 8px 0",
    color: "#111827",
  },

  subtitle: {
    margin: 0,
    color: "#555",
    lineHeight: 1.6,
  },

  badge: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  progressInfo: {
    marginTop: "20px",
    color: "#444",
    fontWeight: 600,
  },

  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },

  progressText: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#374151",
  },

  timerControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  timerButton: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 700,
    fontSize: "14px",
  },

  timerText: {
    fontSize: "15px",
    fontWeight: 700,
  },

  timeUpText: {
    margin: "0 0 18px 0",
    color: "#b91c1c",
    fontWeight: 700,
    fontSize: "18px",
  },

  inlineError: {
    marginTop: "12px",
    marginBottom: 0,
    color: "#b91c1c",
    lineHeight: 1.6,
    fontWeight: 600,
  },

  savedText: {
    margin: "10px 0",
    fontSize: "16px",
    color: "#166534",
    fontWeight: 700,
  },

  resultBanner: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  resultBox: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "18px",
    margin: "24px 0",
  },

  resultText: {
    margin: "10px 0",
    fontSize: "18px",
    color: "#111827",
  },

  resultButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  questionsCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "28px",
    color: "#111827",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },

  questionTitle: {
    marginTop: 0,
    marginBottom: "24px",
    fontSize: "26px",
    lineHeight: 1.5,
    color: "#111827",
  },

  optionsGrid: {
    display: "grid",
    gap: "12px",
  },

  optionButton: {
    width: "100%",
    textAlign: "left",
    padding: "16px",
    borderRadius: "14px",
    border: "2px solid transparent",
    fontSize: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    transition: "all 0.2s ease",
    lineHeight: 1.5,
  },

  optionLetter: {
    fontWeight: 700,
    minWidth: "24px",
  },

  feedbackBox: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid",
    lineHeight: 1.5,
  },

  submitRow: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "center",
  },

  backRow: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
  },

  primaryButton: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "180px",
  },

  secondaryButton: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "180px",
  },

  centerCard: {
    maxWidth: "700px",
    margin: "80px auto",
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  reviewSection: {
    marginTop: "28px",
  },

  reviewQuestionCard: {
    border: "2px solid",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "18px",
  },

  reviewQuestionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  reviewQuestionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  reviewStatusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "14px",
  },

  reviewQuestionText: {
    fontSize: "18px",
    lineHeight: 1.6,
    color: "#111827",
    marginBottom: "16px",
  },

  reviewOptionsGrid: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px",
  },

  reviewOption: {
    border: "2px solid",
    borderRadius: "12px",
    padding: "12px",
    lineHeight: 1.5,
  },

  optionTag: {
    display: "inline-block",
    marginTop: "8px",
    marginRight: "8px",
    fontSize: "13px",
    fontWeight: 700,
  },

  reviewAnswerBox: {
    background: "rgba(255,255,255,0.75)",
    borderRadius: "12px",
    padding: "14px",
    lineHeight: 1.6,
  },

  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
};
