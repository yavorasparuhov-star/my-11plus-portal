"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabaseClient";
import ReportQuestionButton from "../../../../../components/ReportQuestionButton";
import StudentAvatarPortrait from "../../../../../components/avatar/StudentAvatarPortrait";
import { getTopicByKey } from "../../../../../lib/custom-tests/catalog";
import type {
  DifficultyFilter,
  MainCategory,
  OptionKey,
} from "../../../../../lib/custom-tests/types";

type AttemptConfig = {
  mainCategory?: MainCategory;
  topicKeys?: string[];
  subtopicMap?: Record<string, string[]>;
  questionCount?: number;
  totalTimeMinutes?: number;
  selectedDifficulty?: DifficultyFilter;
};

type AttemptRow = {
  id: string;
  main_category: string | null;
  status: string | null;
  config: unknown;
  question_count: number | null;
  time_limit_seconds: number | null;
  time_taken_seconds: number | null;
  correct_answers: number | null;
  score_percent: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at?: string | null;
};

type AttemptNumberRow = {
  id: string;
  created_at: string | null;
};

type QuestionSnapshotOption = {
  key: OptionKey;
  text?: string | null;
  imageUrl?: string | null;
};

type QuestionSnapshot = {
  prompt?: string | null;
  questionText?: string | null;
  passageText?: string | null;
  options?: QuestionSnapshotOption[];
  correctAnswer?: OptionKey;
  explanation?: string | null;
  topicKey?: string;
  subtopicKey?: string | null;
  sourceId?: string | number | null;
  sourceType?: string | null;
  mainCategory?: MainCategory | string | null;
  meta?: {
    test_id?: string | number | null;
    category?: string | null;
    subcategory?: string | null;
  } | null;
};

type AttemptItemRow = {
  question_index: number;
  source_id: string | number | null;
  topic_key: string | null;
  subtopic_key: string | null;
  question_snapshot: unknown;
  selected_answer: OptionKey | null;
  correct_answer: OptionKey | null;
  is_correct: boolean | null;
};

type SubmitPrintableResultsResponse =
  | {
      ok: true;
      attemptId: string;
      coinsAwarded: number;
      correctAnswers?: number;
      questionCount?: number;
      scorePercent?: number;
    }
  | {
      ok: false;
      error: string;
    };

type AvatarBase = "yan" | "bo";
type SkinTone = "light" | "medium" | "dark";
type EyeColor = "brown" | "blue" | "black";

type AvatarConfig = {
  base: AvatarBase;
  skinTone: SkinTone;
  eyeColor: EyeColor;
  glasses: string;
  background: string;
  hat: string;
  accessory: string;
  badge: string;
};

type StudentAvatarRow = {
  selected_base: string | null;
  avatar_config: unknown;
  avatar_name: string | null;
};

const defaultAvatar: AvatarConfig = {
  base: "bo",
  skinTone: "light",
  eyeColor: "blue",
  glasses: "none",
  background: "plain",
  hat: "none",
  accessory: "none",
  badge: "none",
};

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

type ReportSubject = "english" | "math" | "vr" | "nvr";

function normalizeAvatarBase(value: unknown): AvatarBase {
  if (value === "yan" || value === "girl") return "yan";
  if (value === "bo" || value === "boy") return "bo";

  return defaultAvatar.base;
}

function normalizeSkinTone(value: unknown): SkinTone {
  if (value === "light" || value === "medium" || value === "dark") return value;

  return defaultAvatar.skinTone;
}

function normalizeEyeColor(value: unknown): EyeColor {
  if (value === "brown" || value === "blue" || value === "black") return value;

  return defaultAvatar.eyeColor;
}

function normalizeAvatarString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeSavedAvatar(row: StudentAvatarRow | null | undefined) {
  if (!row) {
    return { avatarConfig: defaultAvatar, avatarName: "Bo" };
  }

  const rawConfig =
    row.avatar_config && typeof row.avatar_config === "object"
      ? (row.avatar_config as Record<string, unknown>)
      : {};

  const base = normalizeAvatarBase(rawConfig.base ?? row.selected_base);

  return {
    avatarConfig: {
      base,
      skinTone: normalizeSkinTone(rawConfig.skinTone),
      eyeColor: normalizeEyeColor(rawConfig.eyeColor),
      glasses: normalizeAvatarString(rawConfig.glasses, defaultAvatar.glasses),
      background: normalizeAvatarString(
        rawConfig.background,
        defaultAvatar.background,
      ),
      hat: normalizeAvatarString(rawConfig.hat, defaultAvatar.hat),
      accessory: normalizeAvatarString(
        rawConfig.accessory,
        defaultAvatar.accessory,
      ),
      badge: normalizeAvatarString(rawConfig.badge, defaultAvatar.badge),
    },
    avatarName:
      typeof row.avatar_name === "string" && row.avatar_name.trim()
        ? row.avatar_name.trim()
        : base === "yan"
          ? "Yan"
          : "Bo",
  };
}

function getReportSubjectFromCategory(
  mainCategory: MainCategory | string | null | undefined,
): ReportSubject {
  if (mainCategory === "math") return "math";
  if (mainCategory === "vr") return "vr";
  if (mainCategory === "nvr") return "nvr";

  return "english";
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

function getReportCategoryForItem(
  item: AttemptItemRow,
  snapshot: QuestionSnapshot,
) {
  return (
    item.subtopic_key ??
    snapshot.subtopicKey ??
    snapshot.meta?.subcategory ??
    item.topic_key ??
    snapshot.topicKey ??
    snapshot.meta?.category ??
    null
  );
}

function getReportTestIdForSnapshot(snapshot: QuestionSnapshot) {
  return normalizeReportNumber(snapshot.meta?.test_id);
}

function getReportQuestionIdForItem(
  item: AttemptItemRow,
  snapshot: QuestionSnapshot,
) {
  return normalizeReportNumber(item.source_id ?? snapshot.sourceId);
}

function isOptionKey(value: unknown): value is OptionKey {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSeconds(totalSeconds: number | null | undefined) {
  if (typeof totalSeconds !== "number" || totalSeconds < 0) return "—";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatMainCategory(value: string | null | undefined) {
  if (!value) return "—";
  if (value === "math") return "Maths";
  if (value === "vr") return "VR";
  if (value === "nvr") return "NVR";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatCustomTestTitle(
  mainCategory: string | null | undefined,
  sequenceNumber: number | null,
) {
  const categoryLabel = formatMainCategory(mainCategory);
  const numberLabel =
    typeof sequenceNumber === "number" && sequenceNumber > 0
      ? ` ${sequenceNumber}`
      : "";

  if (categoryLabel === "—") {
    return `Test${numberLabel}`;
  }

  return `${categoryLabel} Test${numberLabel}`;
}

function formatDifficulty(value: DifficultyFilter | undefined) {
  if (value === "all" || value === undefined) return "All difficulties";
  if (value === 1) return "Easy";
  if (value === 2) return "Medium";
  return "Hard";
}

function formatTopicKey(topicKey: string, mainCategory?: MainCategory) {
  if (mainCategory) {
    const topic = getTopicByKey(mainCategory, topicKey);

    if (topic) {
      return topic.label;
    }
  }

  return topicKey
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTopics(config: AttemptConfig) {
  if (!config.topicKeys || config.topicKeys.length === 0) return "—";

  return config.topicKeys
    .map((topicKey) => formatTopicKey(topicKey, config.mainCategory))
    .join(", ");
}

function formatTopicLabel(
  value: string | null | undefined,
  mainCategory?: MainCategory,
) {
  if (!value) return "—";

  if (mainCategory) {
    const topic = getTopicByKey(mainCategory, value);

    if (topic) {
      return topic.label;
    }
  }

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseAttemptConfig(value: unknown): AttemptConfig {
  if (!value || typeof value !== "object") return {};

  const raw = value as Record<string, unknown>;

  const selectedDifficulty =
    raw.selectedDifficulty === "all" ||
    raw.selectedDifficulty === 1 ||
    raw.selectedDifficulty === 2 ||
    raw.selectedDifficulty === 3
      ? raw.selectedDifficulty
      : undefined;

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
      typeof raw.totalTimeMinutes === "number"
        ? raw.totalTimeMinutes
        : undefined,
    selectedDifficulty,
  };
}

function parseQuestionSnapshot(value: unknown): QuestionSnapshot {
  if (!value || typeof value !== "object") return {};

  const raw = value as Record<string, unknown>;

  const options: QuestionSnapshotOption[] = Array.isArray(raw.options)
    ? raw.options
        .map((item) => {
          if (!item || typeof item !== "object") return null;

          const option = item as Record<string, unknown>;
          const key = option.key;

          if (!isOptionKey(key)) {
            return null;
          }

          return {
            key,
            text: typeof option.text === "string" ? option.text : null,
            imageUrl:
              typeof option.imageUrl === "string" ? option.imageUrl : null,
          } as QuestionSnapshotOption;
        })
        .filter((item): item is QuestionSnapshotOption => item !== null)
    : [];

  const meta =
    raw.meta && typeof raw.meta === "object"
      ? (raw.meta as Record<string, unknown>)
      : null;

  return {
    prompt: typeof raw.prompt === "string" ? raw.prompt : null,
    questionText:
      typeof raw.questionText === "string" ? raw.questionText : null,
    passageText: typeof raw.passageText === "string" ? raw.passageText : null,
    options,
    correctAnswer: isOptionKey(raw.correctAnswer)
      ? raw.correctAnswer
      : undefined,
    explanation: typeof raw.explanation === "string" ? raw.explanation : null,
    topicKey: typeof raw.topicKey === "string" ? raw.topicKey : undefined,
    subtopicKey: typeof raw.subtopicKey === "string" ? raw.subtopicKey : null,
    sourceId:
      typeof raw.sourceId === "string" || typeof raw.sourceId === "number"
        ? raw.sourceId
        : null,
    sourceType: typeof raw.sourceType === "string" ? raw.sourceType : null,
    mainCategory:
      typeof raw.mainCategory === "string" ? raw.mainCategory : null,
    meta: meta
      ? {
          test_id:
            typeof meta.test_id === "string" || typeof meta.test_id === "number"
              ? meta.test_id
              : null,
          category: typeof meta.category === "string" ? meta.category : null,
          subcategory:
            typeof meta.subcategory === "string" ? meta.subcategory : null,
        }
      : null,
  };
}

function isDownloadedAttempt(attempt: AttemptRow) {
  const normalized = (attempt.status ?? "").toLowerCase();

  return normalized.includes("download") || normalized.includes("print");
}

function formatAttemptStatus(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();

  if (normalized.includes("download")) return "Downloaded";
  if (normalized.includes("print")) return "Printable marked";
  if (normalized === "completed") return "Completed";
  if (normalized === "in_progress") return "In progress";
  if (normalized === "started") return "Started";
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getOptionText(option: QuestionSnapshotOption) {
  return option.text?.trim() ? option.text : `Option ${option.key}`;
}

export default function CustomTestAttemptDetailsPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = Array.isArray(params?.attemptId)
    ? params.attemptId[0]
    : params?.attemptId;

  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [attemptSequenceNumber, setAttemptSequenceNumber] = useState<
    number | null
  >(null);
  const [items, setItems] = useState<AttemptItemRow[]>([]);
  const [answerSelections, setAnswerSelections] = useState<
    Record<number, OptionKey | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar);
  const [avatarName, setAvatarName] = useState("Bo");

  useEffect(() => {
    async function loadAttemptDetails() {
      if (!attemptId) {
        setErrorMessage("Invalid attempt id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        setAttemptSequenceNumber(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setErrorMessage("Could not verify the logged-in user.");
          return;
        }

        const { data: avatarData } = await supabase
          .from("student_avatars")
          .select("selected_base, avatar_config, avatar_name")
          .eq("user_id", user.id)
          .maybeSingle();

        const normalizedAvatar = normalizeSavedAvatar(
          avatarData as StudentAvatarRow | null,
        );

        setAvatarConfig(normalizedAvatar.avatarConfig);
        setAvatarName(normalizedAvatar.avatarName);

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
            `,
          )
          .eq("id", attemptId)
          .single();

        if (attemptError || !attemptData) {
          setErrorMessage(
            attemptError?.message || "Could not load test attempt.",
          );
          return;
        }

        let calculatedAttemptSequenceNumber: number | null = null;

        if (attemptData.main_category) {
          const { data: attemptNumberData } = await supabase
            .from("custom_test_attempts")
            .select("id, created_at")
            .eq("user_id", user.id)
            .eq("main_category", attemptData.main_category)
            .order("created_at", { ascending: true })
            .order("id", { ascending: true });

          const attemptNumberRows = (attemptNumberData ??
            []) as AttemptNumberRow[];
          const attemptIndex = attemptNumberRows.findIndex(
            (row) => row.id === attemptData.id,
          );

          calculatedAttemptSequenceNumber =
            attemptIndex >= 0 ? attemptIndex + 1 : null;
        }

        const { data: itemData, error: itemError } = await supabase
          .from("custom_test_attempt_items")
          .select(
            `
            question_index,
            source_id,
            topic_key,
            subtopic_key,
            question_snapshot,
            selected_answer,
            correct_answer,
            is_correct
            `,
          )
          .eq("attempt_id", attemptId)
          .order("question_index", { ascending: true });

        if (itemError) {
          setErrorMessage(
            itemError.message || "Could not load test questions.",
          );
          return;
        }

        const loadedItems = (itemData ?? []) as AttemptItemRow[];
        const initialAnswers: Record<number, OptionKey | null> = {};

        loadedItems.forEach((item) => {
          initialAnswers[item.question_index] = isOptionKey(
            item.selected_answer,
          )
            ? item.selected_answer
            : null;
        });

        setAttempt(attemptData as AttemptRow);
        setAttemptSequenceNumber(calculatedAttemptSequenceNumber);
        setItems(loadedItems);
        setAnswerSelections(initialAnswers);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unexpected error while loading attempt details.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAttemptDetails();
  }, [attemptId, reloadKey]);

  const parsedConfig = useMemo(
    () => parseAttemptConfig(attempt?.config),
    [attempt],
  );

  const attemptDisplayName = formatCustomTestTitle(
    attempt?.main_category,
    attemptSequenceNumber,
  );

  const canEnterPrintableResults =
    attempt !== null && isDownloadedAttempt(attempt);

  const printableResultSaved =
    attempt !== null &&
    isDownloadedAttempt(attempt) &&
    (typeof attempt.score_percent === "number" ||
      typeof attempt.correct_answers === "number" ||
      items.some(
        (item) => item.selected_answer !== null || item.is_correct !== null,
      ));

  const answeredCount = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total + (isOptionKey(answerSelections[item.question_index]) ? 1 : 0)
      );
    }, 0);
  }, [items, answerSelections]);

  const unansweredCount = Math.max(items.length - answeredCount, 0);

  async function handleSubmitPrintableResults() {
    if (!attemptId || !attempt || submitting) return;

    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `There ${unansweredCount === 1 ? "is" : "are"} ${unansweredCount} unanswered question${
          unansweredCount === 1 ? "" : "s"
        }. Blank answers will be counted as incorrect. Do you still want to submit the results?`,
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setSubmitErrorMessage("");
      setSubmitSuccessMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setSubmitErrorMessage("Could not verify the logged-in user.");
        return;
      }

      const response = await fetch("/api/custom-tests/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          attemptId,
          answers: answerSelections,
        }),
      });

      const result = (await response.json()) as SubmitPrintableResultsResponse;

      if (!response.ok || !result.ok) {
        setSubmitErrorMessage(
          result.ok ? "Could not save printable results." : result.error,
        );
        return;
      }

      const savedScore =
        typeof result.scorePercent === "number"
          ? ` Result: ${result.correctAnswers ?? "—"} / ${
              result.questionCount ?? items.length
            } (${Math.round(result.scorePercent)}%).`
          : "";

      setSubmitSuccessMessage(
        result.coinsAwarded > 0
          ? `Printable results saved.${savedScore} The student earned ${
              result.coinsAwarded
            } YanBo Coin${result.coinsAwarded === 1 ? "" : "s"}.`
          : `Printable results saved.${savedScore} Score 50% or more next time to earn YanBo Coins.`,
      );
      setReloadKey((value) => value + 1);
    } catch (error) {
      setSubmitErrorMessage(
        error instanceof Error
          ? error.message
          : "Unexpected error while saving printable results.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          padding: "32px 16px",
        }}
      >
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
    );
  }

  if (errorMessage) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          padding: "32px 16px",
        }}
      >
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
    );
  }

  if (!attempt) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f8fb",
          padding: "32px 16px",
        }}
      >
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
    );
  }

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
                Build a Test
              </Link>{" "}
              /{" "}
              <Link
                href="/custom-tests/history"
                style={{ color: "#6b7280", textDecoration: "none" }}
              >
                Test History
              </Link>{" "}
              / {canEnterPrintableResults ? "Enter Results" : "Attempt Details"}
            </p>

            <h1 style={{ margin: 0, color: "#111827", fontSize: "2rem" }}>
              {canEnterPrintableResults
                ? "Enter Printable Test Results"
                : "Test Attempt Details"}
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
              Back to Test History
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
              Back to Build a Test
            </Link>
          </div>
        </div>

        {canEnterPrintableResults ? (
          <section
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 16,
              padding: 18,
              marginBottom: 24,
              color: "#1e3a8a",
              lineHeight: 1.6,
            }}
          >
            <strong>
              {printableResultSaved
                ? "This downloaded printable test already has saved results."
                : "This downloaded printable test can be marked here."}
            </strong>{" "}
            Enter or update the student&apos;s answers below. Blank answers are
            allowed and will be counted as incorrect. The score will appear
            after results are saved.
          </section>
        ) : null}

        {submitSuccessMessage ? (
          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              color: "#166534",
              fontWeight: 700,
            }}
          >
            <div style={{ flex: "0 0 auto" }}>
              <StudentAvatarPortrait
                config={avatarConfig}
                name={avatarName}
                size={92}
              />
            </div>

            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div
                style={{
                  color: "#14532d",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {submitSuccessMessage}
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: "#166534",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                }}
              >
                Great effort — your saved avatar is cheering you on!
              </div>
            </div>
          </section>
        ) : null}

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
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "0.85rem",
                  marginBottom: 4,
                }}
              >
                {canEnterPrintableResults ? "Printable test" : "Test name"}
              </div>
              <div style={{ color: "#111827", fontWeight: 800 }}>
                {attemptDisplayName}
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
                Main category
              </div>
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {formatMainCategory(attempt.main_category)}
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
                Topics
              </div>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {formatTopics(parsedConfig)}
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
                {formatDifficulty(parsedConfig.selectedDifficulty)}
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
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {formatAttemptStatus(attempt.status)}
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
                Score
              </div>
              <div style={{ color: "#111827", fontWeight: 700 }}>
                {typeof attempt.score_percent === "number"
                  ? `${Math.round(attempt.score_percent)}%`
                  : "Not marked yet"}
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
                {isDownloadedAttempt(attempt) && !attempt.completed_at
                  ? "Downloaded"
                  : "Completed"}
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
            padding: canEnterPrintableResults ? 18 : 24,
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
            {canEnterPrintableResults ? "Printable Answer Sheet" : "Questions"}
          </h2>

          {canEnterPrintableResults ? (
            <>
              <p
                style={{
                  margin: "0 0 16px 0",
                  color: "#6b7280",
                  lineHeight: 1.5,
                }}
              >
                Select the student&apos;s answer for each question. Use
                <strong> Unanswered</strong> when the question was left blank.
              </p>

              <div style={{ display: "grid", gap: 8 }}>
                {items.map((item, displayIndex) => {
                  const currentAnswer =
                    answerSelections[item.question_index] ?? null;
                  const snapshot = parseQuestionSnapshot(
                    item.question_snapshot,
                  );
                  const correctAnswer =
                    item.correct_answer ?? snapshot.correctAnswer ?? null;
                  const hasSavedMark =
                    printableResultSaved &&
                    (item.selected_answer !== null || item.is_correct !== null);
                  const rowIsCorrect =
                    hasSavedMark &&
                    currentAnswer !== null &&
                    currentAnswer === correctAnswer;
                  const rowIsIncorrect = hasSavedMark && !rowIsCorrect;

                  return (
                    <div
                      key={`${item.question_index}-${displayIndex}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(92px, 120px) 1fr auto",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background:
                          displayIndex % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#111827" }}>
                        Question {displayIndex + 1}
                      </div>

                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {OPTION_KEYS.map((optionKey) => {
                          const selected = currentAnswer === optionKey;

                          return (
                            <button
                              key={optionKey}
                              type="button"
                              onClick={() =>
                                setAnswerSelections((current) => ({
                                  ...current,
                                  [item.question_index]: optionKey,
                                }))
                              }
                              style={{
                                width: 44,
                                height: 38,
                                borderRadius: 10,
                                border: selected
                                  ? "2px solid #2563eb"
                                  : "1px solid #d1d5db",
                                background: selected ? "#dbeafe" : "#ffffff",
                                color: selected ? "#1d4ed8" : "#111827",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {optionKey}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() =>
                            setAnswerSelections((current) => ({
                              ...current,
                              [item.question_index]: null,
                            }))
                          }
                          style={{
                            height: 38,
                            padding: "0 12px",
                            borderRadius: 10,
                            border:
                              currentAnswer === null
                                ? "2px solid #6b7280"
                                : "1px solid #d1d5db",
                            background:
                              currentAnswer === null ? "#f3f4f6" : "#ffffff",
                            color: "#111827",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Unanswered
                        </button>
                      </div>

                      {hasSavedMark ? (
                        <div
                          style={{
                            justifySelf: "end",
                            padding: "5px 9px",
                            borderRadius: 999,
                            background: rowIsCorrect ? "#f0fdf4" : "#fef2f2",
                            border: rowIsCorrect
                              ? "1px solid #bbf7d0"
                              : "1px solid #fecaca",
                            color: rowIsCorrect ? "#166534" : "#991b1b",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rowIsCorrect ? "Correct" : "Incorrect"}
                        </div>
                      ) : (
                        <div style={{ width: 1 }} />
                      )}

                      <div style={{ gridColumn: "1 / -1", paddingTop: 2 }}>
                        <ReportQuestionButton
                          key={`printable-report-${item.question_index}-${displayIndex}`}
                          subject={getReportSubjectFromCategory(
                            parsedConfig.mainCategory ?? attempt.main_category,
                          )}
                          category={getReportCategoryForItem(item, snapshot)}
                          testId={getReportTestIdForSnapshot(snapshot)}
                          questionId={getReportQuestionIdForItem(
                            item,
                            snapshot,
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, displayIndex) => {
                const snapshot = parseQuestionSnapshot(item.question_snapshot);

                return (
                  <div
                    key={`${item.question_index}-${displayIndex}`}
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
                        Question {displayIndex + 1}
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
                        <strong>Topic:</strong>{" "}
                        {formatTopicLabel(
                          item.topic_key,
                          parsedConfig.mainCategory,
                        )}
                      </div>

                      <div>
                        <strong>Subtopic:</strong>{" "}
                        {formatTopicLabel(item.subtopic_key)}
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
                      <div
                        style={{ display: "grid", gap: 10, marginBottom: 12 }}
                      >
                        {snapshot.options.map((option) => {
                          const correctAnswer =
                            item.correct_answer ??
                            snapshot.correctAnswer ??
                            null;
                          const isSelected =
                            item.selected_answer === option.key;
                          const isCorrect = correctAnswer === option.key;

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
                                  marginBottom:
                                    option.text || option.imageUrl ? 6 : 0,
                                }}
                              >
                                {option.key}
                                {isCorrect ? " — Correct answer" : ""}
                                {!isCorrect && isSelected
                                  ? " — Your answer"
                                  : ""}
                              </div>

                              {option.text ? (
                                <div
                                  style={{ color: "#374151", lineHeight: 1.6 }}
                                >
                                  {getOptionText(option)}
                                </div>
                              ) : null}

                              {option.imageUrl ? (
                                <img
                                  src={option.imageUrl}
                                  alt={`Option ${option.key}`}
                                  style={{
                                    display: "block",
                                    maxWidth: "100%",
                                    maxHeight: 180,
                                    objectFit: "contain",
                                    marginTop: 8,
                                  }}
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div style={{ color: "#111827", fontWeight: 600 }}>
                      Your answer: {item.selected_answer ?? "No answer"}
                    </div>

                    <div
                      style={{
                        color: "#111827",
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      Correct answer:{" "}
                      {item.correct_answer ?? snapshot.correctAnswer ?? "—"}
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
                );
              })}
            </div>
          )}
        </section>

        {canEnterPrintableResults ? (
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
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
                  {printableResultSaved
                    ? "Update saved results?"
                    : "Ready to save results?"}
                </h2>
                <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.5 }}>
                  Answers entered: {answeredCount} / {items.length}
                  {unansweredCount > 0
                    ? ` — ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}`
                    : " — all questions answered"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmitPrintableResults}
                disabled={submitting || items.length === 0}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "1px solid #2563eb",
                  background: submitting ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? "Saving..."
                  : printableResultSaved
                    ? "Update Results"
                    : "Save Results"}
              </button>
            </div>

            {submitErrorMessage ? (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                }}
              >
                {submitErrorMessage}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
