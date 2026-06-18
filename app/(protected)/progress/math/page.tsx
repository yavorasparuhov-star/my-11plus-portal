"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { MathsIcon } from "../../../../components/icons/PortalIcons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

type MathCategory =
  | "number_place_value"
  | "four_operations"
  | "fractions_decimals_percentages"
  | "shape_space"
  | "measurement"
  | "data_handling"
  | "algebra_reasoning";

type MathProgressDbRow = {
  id: number;
  user_id: string;
  test_id: number | null;
  category: string;
  correct_answers: number;
  total_questions: number;
  success_rate: number;
  created_at: string;
  difficulty?: number | null;
};

type MathTestLookupRow = {
  id: number;
  difficulty: number | null;
};

type CustomAttemptRow = {
  id: string;
  user_id: string;
  main_category: string | null;
  status: string | null;
  config: unknown;
  question_count: number | null;
  correct_answers: number | null;
  score_percent: number | null;
  completed_at: string | null;
  created_at: string | null;
};

type CustomAttemptItemRow = {
  attempt_id: string;
  question_index: number;
  main_category: string | null;
  source_type: string | null;
  source_id: string | number | null;
  topic_key: string | null;
  subtopic_key: string | null;
  selected_answer: string | null;
  correct_answer: string | null;
  is_correct: boolean | null;
  question_snapshot: unknown;
};

type MathQuestionLookupRow = {
  id: number;
  difficulty: number | null;
};

type ProgressSource = "normal" | "custom";

type MathProgressRow = {
  id: string;
  user_id: string;
  test_id: number | null;
  custom_attempt_id?: string;
  source: ProgressSource;
  category: MathCategory;
  correct_answers: number;
  total_questions: number;
  success_rate: number;
  created_at: string;
  difficulty: number | null;
};

type TimeFilter = "7d" | "30d" | "90d" | "all";
type DifficultyFilter = "all" | "1" | "2" | "3";
type CategoryFilter = "all" | MathCategory;

const CATEGORY_LABELS: Record<MathCategory, string> = {
  number_place_value: "Number & Place Value",
  four_operations: "Four Operations",
  fractions_decimals_percentages: "Fractions, Decimals & Percentages",
  shape_space: "Shape & Space",
  measurement: "Measurement",
  data_handling: "Data Handling",
  algebra_reasoning: "Algebra & Reasoning",
};

const CATEGORY_ORDER: MathCategory[] = [
  "number_place_value",
  "four_operations",
  "fractions_decimals_percentages",
  "shape_space",
  "measurement",
  "data_handling",
  "algebra_reasoning",
];

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "number_place_value", label: "Number & Place Value" },
  { value: "four_operations", label: "Four Operations" },
  {
    value: "fractions_decimals_percentages",
    label: "Fractions, Decimals & Percentages",
  },
  { value: "shape_space", label: "Shape & Space" },
  { value: "measurement", label: "Measurement" },
  { value: "data_handling", label: "Data Handling" },
  { value: "algebra_reasoning", label: "Algebra & Reasoning" },
];

const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "1", label: "Easy" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Hard" },
];

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

function getCutoffDate(filter: TimeFilter) {
  if (filter === "all") return null;

  const now = new Date();

  const daysMap: Record<Exclude<TimeFilter, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  now.setDate(now.getDate() - daysMap[filter]);
  return now;
}

function normaliseMathCategory(
  value: string | null | undefined,
): MathCategory | null {
  if (!value) return null;

  const normalised = value
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll("/", " ")
    .replaceAll("-", "_")
    .replaceAll("–", "_")
    .replaceAll("—", "_")
    .replace(/[^a-z0-9_ ]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalised === "number_place_value") return "number_place_value";
  if (normalised === "number_and_place_value") return "number_place_value";
  if (normalised === "four_operations") return "four_operations";
  if (normalised === "fractions_decimals_percentages") {
    return "fractions_decimals_percentages";
  }
  if (normalised === "fractions_decimals_and_percentages") {
    return "fractions_decimals_percentages";
  }
  if (normalised === "fractions_and_decimals") {
    return "fractions_decimals_percentages";
  }
  if (normalised === "percentages") return "fractions_decimals_percentages";
  if (normalised === "shape_space") return "shape_space";
  if (normalised === "shape_and_space") return "shape_space";
  if (normalised === "measurement") return "measurement";
  if (normalised === "data_handling") return "data_handling";
  if (normalised === "algebra_reasoning") return "algebra_reasoning";
  if (normalised === "algebra_and_reasoning") return "algebra_reasoning";

  return null;
}

function formatCategory(category: MathCategory | string) {
  const safeCategory = normaliseMathCategory(category);
  return safeCategory ? CATEGORY_LABELS[safeCategory] : category;
}

function getLevelLabel(level: number | null | undefined) {
  if (level === 1) return "Easy";
  if (level === 2) return "Medium";
  if (level === 3) return "Hard";
  return "Not set";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function toNumericValue(value: ValueType | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (Array.isArray(value)) return Number(value[0]);
  return 0;
}

function successTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined,
): [string, string] {
  const numericValue = toNumericValue(value);
  return [`${numericValue}%`, "Success"];
}

function averageSuccessTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined,
): [string, string] {
  const numericValue = toNumericValue(value);
  return [`${numericValue}%`, "Average Success"];
}

function attemptsTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined,
): [string, string] {
  const numericValue = toNumericValue(value);
  return [`${numericValue}`, "Attempts"];
}

function isOptionKey(value: unknown) {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function parsePositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function getSnapshotString(snapshot: unknown, keys: string[]) {
  if (!snapshot || typeof snapshot !== "object") return null;

  const raw = snapshot as Record<string, unknown>;

  for (const key of keys) {
    const value = raw[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getSnapshotNumber(snapshot: unknown, keys: string[]) {
  if (!snapshot || typeof snapshot !== "object") return null;

  const raw = snapshot as Record<string, unknown>;

  for (const key of keys) {
    const value = raw[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function extractDifficulty(config: unknown) {
  if (!config || typeof config !== "object") return null;

  const raw = config as Record<string, unknown>;
  const value = raw.selectedDifficulty;

  if (value === 1 || value === 2 || value === 3) return value;
  if (value === "1" || value === "2" || value === "3") return Number(value);

  return null;
}

function getItemMathQuestionId(item: CustomAttemptItemRow) {
  const sourceId = parsePositiveInteger(item.source_id);
  const snapshotId = getSnapshotNumber(item.question_snapshot, [
    "sourceId",
    "source_id",
    "id",
    "questionId",
    "question_id",
  ]);

  return sourceId ?? parsePositiveInteger(snapshotId);
}

function getCustomProgressRowId(attemptId: string, category: string) {
  return `custom-${attemptId}-${category}`;
}

function getChartSourceLabel(row: MathProgressRow) {
  return row.source === "custom" ? "Custom test" : "Normal test";
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div style={statCardStyle}>
      <div style={statTitleStyle}>{title}</div>
      <div
        style={{
          ...statValueStyle,
          fontSize: value.length > 18 ? "22px" : "34px",
        }}
      >
        {value}
      </div>
      {subtitle ? <div style={statSubtitleStyle}>{subtitle}</div> : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={sectionCardStyle}>
      <div style={{ marginBottom: "18px" }}>
        <h2 style={sectionTitleStyle}>{title}</h2>
        {subtitle ? <p style={sectionSubtitleStyle}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ChartBox({
  children,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 340 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(0, Math.floor(rect.width));
      const height = Math.max(0, Math.floor(rect.height));
      setSize({ width, height });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={chartContainerStyle}>
      {size.width > 0 && size.height > 0 ? (
        children(size)
      ) : (
        <div style={emptyStateStyle}>Loading chart...</div>
      )}
    </div>
  );
}

export default function MathProgressPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [rows, setRows] = useState<MathProgressRow[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          router.push("/login");
          return;
        }

        setLoadingUser(false);

        const { data: progressData, error: progressError } = await supabase
          .from("math_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (progressError) {
          console.error("Error loading math progress:", progressError);
        }

        const progressRows = (progressData ?? []) as MathProgressDbRow[];

        const testIds = Array.from(
          new Set(
            progressRows
              .map((row) => row.test_id)
              .filter((id): id is number => typeof id === "number"),
          ),
        );

        let testDifficultyMap = new Map<number, number | null>();

        if (testIds.length > 0) {
          const { data: testsData, error: testsError } = await supabase
            .from("math_tests")
            .select("id, difficulty")
            .in("id", testIds);

          if (testsError) {
            console.error("Error loading math test difficulties:", testsError);
          } else {
            testDifficultyMap = new Map(
              ((testsData ?? []) as MathTestLookupRow[]).map((test) => [
                test.id,
                test.difficulty ?? null,
              ]),
            );
          }
        }

        const normalRows = progressRows.reduce<MathProgressRow[]>((acc, row) => {
          const category = normaliseMathCategory(row.category);
          if (!category) return acc;

          const testId = typeof row.test_id === "number" ? row.test_id : null;

          acc.push({
            id: `normal-${row.id}`,
            user_id: row.user_id,
            test_id: testId,
            source: "normal",
            category,
            correct_answers: row.correct_answers,
            total_questions: row.total_questions,
            success_rate: Number(row.success_rate),
            created_at: row.created_at,
            difficulty:
              row.difficulty ??
              (testId !== null ? testDifficultyMap.get(testId) : null) ??
              null,
          });

          return acc;
        }, []);

        const { data: attemptData, error: attemptError } = await supabase
          .from("custom_test_attempts")
          .select(
            `
            id,
            user_id,
            main_category,
            status,
            config,
            question_count,
            correct_answers,
            score_percent,
            completed_at,
            created_at
            `,
          )
          .eq("user_id", user.id)
          .eq("main_category", "math")
          .order("created_at", { ascending: false });

        if (attemptError) {
          console.error("Error loading custom maths attempts:", attemptError);
        }

        const customAttempts = (attemptData ?? []) as CustomAttemptRow[];
        const attemptIds = customAttempts.map((attempt) => attempt.id);
        let customRows: MathProgressRow[] = [];

        if (attemptIds.length > 0) {
          const { data: itemData, error: itemError } = await supabase
            .from("custom_test_attempt_items")
            .select(
              `
              attempt_id,
              question_index,
              main_category,
              source_type,
              source_id,
              topic_key,
              subtopic_key,
              selected_answer,
              correct_answer,
              is_correct,
              question_snapshot
              `,
            )
            .eq("user_id", user.id)
            .in("attempt_id", attemptIds)
            .order("question_index", { ascending: true });

          if (itemError) {
            console.error(
              "Error loading custom maths attempt items:",
              itemError,
            );
          } else {
            const customItems = (itemData ?? []) as CustomAttemptItemRow[];
            const questionIds = Array.from(
              new Set(
                customItems
                  .map((item) => getItemMathQuestionId(item))
                  .filter((id): id is number => id !== null),
              ),
            );

            let questionMap = new Map<number, MathQuestionLookupRow>();

            if (questionIds.length > 0) {
              const { data: questionData, error: questionError } =
                await supabase
                  .from("math_questions")
                  .select("id, difficulty")
                  .in("id", questionIds);

              if (questionError) {
                console.error(
                  "Error loading custom maths question metadata:",
                  questionError,
                );
              } else {
                questionMap = new Map(
                  ((questionData ?? []) as MathQuestionLookupRow[]).map(
                    (question) => [question.id, question],
                  ),
                );
              }
            }

            const itemsByAttempt = new Map<string, CustomAttemptItemRow[]>();

            for (const item of customItems) {
              const current = itemsByAttempt.get(item.attempt_id) ?? [];
              current.push(item);
              itemsByAttempt.set(item.attempt_id, current);
            }

            for (const attempt of customAttempts) {
              const items = itemsByAttempt.get(attempt.id) ?? [];
              const hasAtLeastOneEnteredAnswer = items.some((item) =>
                isOptionKey(item.selected_answer),
              );

              if (!hasAtLeastOneEnteredAnswer) continue;

              const attemptDifficulty = extractDifficulty(attempt.config);
              const grouped = new Map<
                MathCategory,
                {
                  totalQuestions: number;
                  correctAnswers: number;
                  difficulty: number | null;
                }
              >();

              for (const item of items) {
                const questionId = getItemMathQuestionId(item);
                const question = questionId
                  ? questionMap.get(questionId)
                  : null;
                const category =
                  normaliseMathCategory(item.topic_key) ??
                  normaliseMathCategory(item.subtopic_key) ??
                  normaliseMathCategory(
                    getSnapshotString(item.question_snapshot, [
                      "topicKey",
                      "topic_key",
                      "category",
                    ]),
                  );

                if (!category) continue;

                const selectedAnswer = isOptionKey(item.selected_answer)
                  ? item.selected_answer
                  : null;
                const correctAnswer = isOptionKey(item.correct_answer)
                  ? item.correct_answer
                  : null;
                const isCorrect =
                  item.is_correct === true ||
                  (selectedAnswer !== null &&
                    correctAnswer !== null &&
                    selectedAnswer === correctAnswer);
                const difficulty =
                  attemptDifficulty ??
                  question?.difficulty ??
                  getSnapshotNumber(item.question_snapshot, ["difficulty"]) ??
                  null;

                const current = grouped.get(category) ?? {
                  totalQuestions: 0,
                  correctAnswers: 0,
                  difficulty,
                };

                current.totalQuestions += 1;
                current.correctAnswers += isCorrect ? 1 : 0;

                if (current.difficulty === null && difficulty !== null) {
                  current.difficulty = difficulty;
                }

                grouped.set(category, current);
              }

              const createdAt =
                attempt.completed_at ??
                attempt.created_at ??
                new Date().toISOString();

              customRows = customRows.concat(
                Array.from(grouped.entries()).map(([category, data]) => ({
                  id: getCustomProgressRowId(attempt.id, category),
                  user_id: user.id,
                  test_id: null,
                  custom_attempt_id: attempt.id,
                  source: "custom" as const,
                  category,
                  correct_answers: data.correctAnswers,
                  total_questions: data.totalQuestions,
                  success_rate:
                    data.totalQuestions > 0
                      ? Math.round(
                          (data.correctAnswers / data.totalQuestions) * 100,
                        )
                      : 0,
                  created_at: createdAt,
                  difficulty: data.difficulty,
                })),
              );
            }
          }
        }

        if (!mounted) return;

        setRows([...normalRows, ...customRows]);
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredRows = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter);

    return rows.filter((row) => {
      const matchesTime = cutoff ? new Date(row.created_at) >= cutoff : true;

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(row.difficulty ?? "") === difficultyFilter;

      const matchesCategory =
        categoryFilter === "all" || row.category === categoryFilter;

      return matchesTime && matchesDifficulty && matchesCategory;
    });
  }, [rows, timeFilter, difficultyFilter, categoryFilter]);

  const overallStats = useMemo(() => {
    const attemptsCompleted = filteredRows.length;

    const questionsPractised = filteredRows.reduce(
      (sum, row) => sum + row.total_questions,
      0,
    );

    const totalCorrect = filteredRows.reduce(
      (sum, row) => sum + row.correct_answers,
      0,
    );

    const averageSuccess =
      attemptsCompleted > 0
        ? filteredRows.reduce((sum, row) => sum + Number(row.success_rate), 0) /
          attemptsCompleted
        : 0;

    const bestScore =
      attemptsCompleted > 0
        ? Math.max(...filteredRows.map((row) => Number(row.success_rate)))
        : 0;

    const byCategory = Object.entries(
      filteredRows.reduce(
        (acc, row) => {
          if (!acc[row.category]) {
            acc[row.category] = { attempts: 0, totalSuccess: 0 };
          }

          acc[row.category].attempts += 1;
          acc[row.category].totalSuccess += Number(row.success_rate);

          return acc;
        },
        {} as Record<string, { attempts: number; totalSuccess: number }>,
      ),
    ).map(([category, data]) => ({
      category,
      avgSuccess: data.attempts ? data.totalSuccess / data.attempts : 0,
    }));

    const strongestCategory =
      byCategory.length > 0
        ? byCategory.reduce((best, current) =>
            current.avgSuccess > best.avgSuccess ? current : best,
          )
        : null;

    const weakestCategory =
      byCategory.length > 0
        ? byCategory.reduce((worst, current) =>
            current.avgSuccess < worst.avgSuccess ? current : worst,
          )
        : null;

    const customAttempts = filteredRows.filter(
      (row) => row.source === "custom",
    ).length;

    return {
      attemptsCompleted,
      questionsPractised,
      totalCorrect,
      averageSuccess,
      bestScore,
      strongestCategory,
      weakestCategory,
      customAttempts,
    };
  }, [filteredRows]);

  const performanceTrendData = useMemo(() => {
    const sorted = [...filteredRows].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    return sorted.map((row, index) => ({
      attempt: index + 1,
      date: formatShortDate(row.created_at),
      success: Number(row.success_rate),
      scoreLabel: `${row.correct_answers}/${row.total_questions}`,
      difficulty: getLevelLabel(row.difficulty),
      category: formatCategory(row.category),
      source: getChartSourceLabel(row),
    }));
  }, [filteredRows]);

  const successByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce(
      (acc, row) => {
        if (!acc[row.category]) {
          acc[row.category] = {
            category: row.category,
            attempts: 0,
            totalSuccess: 0,
          };
        }

        acc[row.category].attempts += 1;
        acc[row.category].totalSuccess += Number(row.success_rate);

        return acc;
      },
      {} as Record<
        MathCategory,
        { category: MathCategory; attempts: number; totalSuccess: number }
      >,
    );

    return CATEGORY_ORDER.filter((category) => grouped[category]).map(
      (category) => ({
        category: formatCategory(category),
        avgSuccess: Number(
          (grouped[category].totalSuccess / grouped[category].attempts).toFixed(
            1,
          ),
        ),
      }),
    );
  }, [filteredRows]);

  const attemptsByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce(
      (acc, row) => {
        if (!acc[row.category]) {
          acc[row.category] = {
            category: row.category,
            attempts: 0,
            questions: 0,
          };
        }

        acc[row.category].attempts += 1;
        acc[row.category].questions += row.total_questions;

        return acc;
      },
      {} as Record<
        MathCategory,
        { category: MathCategory; attempts: number; questions: number }
      >,
    );

    return CATEGORY_ORDER.filter((category) => grouped[category]).map(
      (category) => ({
        category: formatCategory(category),
        attempts: grouped[category].attempts,
        questions: grouped[category].questions,
      }),
    );
  }, [filteredRows]);

  const recentAttempts = useMemo(() => {
    return [...filteredRows]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 12);
  }, [filteredRows]);

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No maths progress data yet for the selected filters.";
    }

    const strongest = overallStats.strongestCategory
      ? `${formatCategory(
          overallStats.strongestCategory.category,
        )} (${overallStats.strongestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A";

    const weakest = overallStats.weakestCategory
      ? `${formatCategory(
          overallStats.weakestCategory.category,
        )} (${overallStats.weakestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A";

    const customText = overallStats.customAttempts
      ? ` This includes ${overallStats.customAttempts} custom test progress row${
          overallStats.customAttempts === 1 ? "" : "s"
        }.`
      : "";

    return `You answered ${overallStats.totalCorrect} maths questions correctly across ${overallStats.attemptsCompleted} completed progress rows. Your strongest category is ${strongest}, while your weakest category is ${weakest}.${customText}`;
  }, [filteredRows, overallStats]);

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading maths progress...
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <main style={mainStyle}>
        <section style={heroStyle}>
          <div style={heroIconWrapStyle}>
            <MathsIcon size={56} />
          </div>

          <div>
            <p style={eyebrowStyle}>YanBo Learning</p>
            <h1 style={titleStyle}>Maths Progress</h1>
            <p style={heroSubtitleStyle}>
              Track normal Maths tests and marked Maths custom tests in one
              place. Downloaded tests only appear here after answers have been
              entered.
            </p>
          </div>
        </section>

        <section style={filterBarStyle}>
          <label style={filterLabelStyle}>
            Time period
            <select
              value={timeFilter}
              onChange={(event) =>
                setTimeFilter(event.target.value as TimeFilter)
              }
              style={selectStyle}
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={filterLabelStyle}>
            Difficulty
            <select
              value={difficultyFilter}
              onChange={(event) =>
                setDifficultyFilter(event.target.value as DifficultyFilter)
              }
              style={selectStyle}
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={filterLabelStyle}>
            Category
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as CategoryFilter)
              }
              style={selectStyle}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section style={statsGridStyle}>
          <StatCard
            title="Progress rows"
            value={String(overallStats.attemptsCompleted)}
            subtitle="Normal tests plus marked custom test categories."
          />
          <StatCard
            title="Questions practised"
            value={String(overallStats.questionsPractised)}
            subtitle="Only tests with entered answers are included."
          />
          <StatCard
            title="Average success"
            value={`${overallStats.averageSuccess.toFixed(1)}%`}
            subtitle="Average of visible progress rows."
          />
          <StatCard
            title="Best score"
            value={`${overallStats.bestScore.toFixed(0)}%`}
            subtitle="Highest visible result."
          />
        </section>

        <SectionCard title="Summary" subtitle={summaryText}>
          <div style={noticeStyle}>
            Printable custom tests stay out of progress until at least one
            answer has been entered. This prevents unfinished papers from
            damaging the student&apos;s progress data.
          </div>
        </SectionCard>

        <section style={twoColumnGridStyle}>
          <SectionCard
            title="Performance trend"
            subtitle="Success rate over time for the selected filters."
          >
            {performanceTrendData.length ? (
              <ChartBox>
                {({ width, height }) => (
                  <LineChart
                    width={width}
                    height={height}
                    data={performanceTrendData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="attempt" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={successTooltipFormatter} />
                    <Line
                      type="monotone"
                      dataKey="success"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ChartBox>
            ) : (
              <div style={emptyStateStyle}>No data for this filter.</div>
            )}
          </SectionCard>

          <SectionCard
            title="Average by category"
            subtitle="Average success rate for each Maths topic."
          >
            {successByCategoryData.length ? (
              <ChartBox>
                {({ width, height }) => (
                  <BarChart
                    width={width}
                    height={height}
                    data={successByCategoryData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={averageSuccessTooltipFormatter} />
                    <Bar dataKey="avgSuccess" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}
              </ChartBox>
            ) : (
              <div style={emptyStateStyle}>No category data yet.</div>
            )}
          </SectionCard>
        </section>

        <SectionCard
          title="Attempts by category"
          subtitle="How many visible progress rows and questions are recorded per topic."
        >
          {attemptsByCategoryData.length ? (
            <ChartBox>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={attemptsByCategoryData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={attemptsTooltipFormatter} />
                  <Bar dataKey="attempts" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ChartBox>
          ) : (
            <div style={emptyStateStyle}>No attempt data yet.</div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent progress"
          subtitle="Latest normal Maths and marked custom Maths results."
        >
          {recentAttempts.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Difficulty</th>
                    <th style={thStyle}>Score</th>
                    <th style={thStyle}>Success</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{formatDateTime(row.created_at)}</td>
                      <td style={tdStyle}>{getChartSourceLabel(row)}</td>
                      <td style={tdStyle}>{formatCategory(row.category)}</td>
                      <td style={tdStyle}>{getLevelLabel(row.difficulty)}</td>
                      <td style={tdStyle}>
                        {row.correct_answers}/{row.total_questions}
                      </td>
                      <td style={tdStyle}>
                        {Number(row.success_rate).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateStyle}>
              No recent progress for this filter.
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(34,197,94,0.14) 0%, rgba(255,255,255,1) 34%), linear-gradient(180deg, #f7fff8 0%, #ecfdf5 100%)",
  padding: "28px 14px 50px",
  boxSizing: "border-box",
};

const mainStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "grid",
  gap: "20px",
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  gap: "18px",
  alignItems: "center",
  background: "linear-gradient(135deg, #ffffff 0%, #ecfccb 100%)",
  border: "1px solid #bbf7d0",
  borderRadius: "30px",
  padding: "24px",
  boxShadow: "0 18px 42px rgba(15, 23, 42, 0.08)",
};

const heroIconWrapStyle: React.CSSProperties = {
  width: "76px",
  height: "76px",
  borderRadius: "24px",
  background: "#ffffff",
  border: "1px solid #dcfce7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 6px 0",
  color: "#16a34a",
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontSize: "13px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "38px",
  lineHeight: 1.1,
  color: "#0f172a",
  fontWeight: 900,
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: "10px 0 0 0",
  color: "#475569",
  lineHeight: 1.6,
  maxWidth: "760px",
};

const filterBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  background: "#ffffff",
  border: "1px solid #dcfce7",
  borderRadius: "24px",
  padding: "18px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
};

const filterLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  fontSize: "13px",
  color: "#475569",
  fontWeight: 800,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  padding: "11px 12px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "15px",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "16px",
};

const statCardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
  border: "1px solid #d9f99d",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  minHeight: "132px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const statTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#64748b",
  fontWeight: 600,
  marginBottom: "10px",
};

const statValueStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.15,
  overflowWrap: "break-word",
  whiteSpace: "normal",
  maxWidth: "100%",
};

const statSubtitleStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  marginTop: "8px",
  lineHeight: 1.45,
  overflowWrap: "break-word",
};

const sectionCardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
  border: "1px solid #dcfce7",
  borderRadius: "28px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: "#0f172a",
  overflowWrap: "break-word",
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "8px 0 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
  overflowWrap: "break-word",
};

const twoColumnGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px",
};

const chartContainerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  height: "340px",
  minWidth: 0,
  overflow: "hidden",
};

const emptyStateStyle: React.CSSProperties = {
  minHeight: "160px",
  borderRadius: "20px",
  border: "1px dashed #bbf7d0",
  background: "#f8fafc",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  textAlign: "center",
};

const noticeStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#166534",
  padding: "14px 16px",
  lineHeight: 1.55,
  fontWeight: 600,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "760px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #dcfce7",
  color: "#475569",
  fontSize: "13px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #ecfdf5",
  color: "#0f172a",
  fontSize: "14px",
};
