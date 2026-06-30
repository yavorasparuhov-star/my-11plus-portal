import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMainCategoryCatalog } from "../../../../lib/custom-tests/catalog";
import type {
  DifficultyFilter,
  GenerateCustomTestRequest,
  GenerateCustomTestResponse,
  MainCategory,
  NormalizedOption,
  NormalizedQuestion,
  OptionKey,
  QuestionSourceType,
} from "../../../../lib/custom-tests/types";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];
const MAX_QUESTION_COUNT = 60;
const MIN_QUESTION_COUNT = 5;
const MAX_TIME_MINUTES = 120;
const MIN_TIME_MINUTES = 1;

type NonEnglishMainCategory = Exclude<MainCategory, "english">;
type AdaptiveDifficultyFilter = DifficultyFilter | "adaptive";
type AdaptiveDifficultyLevel = 1 | 2 | 3;
type AdaptivePoolKey = "easy" | "medium" | "hard";
type AdaptiveQuestionPools = Record<AdaptivePoolKey, NormalizedQuestion[]>;

type AdaptiveGenerateCustomTestRequest = Omit<
  GenerateCustomTestRequest,
  "selectedDifficulty"
> & {
  selectedDifficulty: AdaptiveDifficultyFilter;
};

type WordRow = {
  id: number;
  word: string | null;
  definition: string | null;
  difficulty: number | string | null;
  wrong_words: unknown;
};

type EnglishQuestionRow = {
  id: number;
  test_id: number | null;
  main_category: string | null;
  subcategory: string | null;
  question_text: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  explanation: string | null;
  difficulty: number | string | null;
  question_order: number | null;
};

type EnglishTestRow = {
  id: number;
  passage: string | null;
  difficulty?: number | string | null;
};

type EnglishComprehensionTestLookupRow = {
  id: number;
  title?: string | null;
  main_category: string | null;
  subcategory: string | null;
  difficulty: number | string | null;
};

type EnglishTopicTestLookupRow = {
  id: number;
  title?: string | null;
  main_category: string | null;
  subcategory: string | null;
  difficulty: number | string | null;
};

type StandardTestRow = {
  id: number;
  title: string | null;
  category: string | null;
  difficulty: number | string | null;
};

type StandardQuestionRow = {
  id: number;
  test_id: number | null;
  question_text: string | null;
  image_url?: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_a_image_url?: string | null;
  option_b_image_url?: string | null;
  option_c_image_url?: string | null;
  option_d_image_url?: string | null;
  correct_answer: string | null;
  explanation: string | null;
  question_order: number | null;
};

type TopicPool = {
  topicKey: string;
  questions: NormalizedQuestion[];
};

type PreviousCustomTestItemRow = {
  source_type: string | null;
  source_id: number | null;
};

type StandardTableConfig = {
  testsTable: string;
  questionsTable: string;
  questionSelect: string;
  sourceType: QuestionSourceType;
};

const STANDARD_TABLE_CONFIG: Record<
  NonEnglishMainCategory,
  StandardTableConfig
> = {
  math: {
    testsTable: "math_tests",
    questionsTable: "math_questions",
    questionSelect: `
    id,
    test_id,
    question_text,
    image_url,
    option_a,
    option_b,
    option_c,
    option_d,
    option_a_image_url,
    option_b_image_url,
    option_c_image_url,
    option_d_image_url,
    correct_answer,
    explanation,
    question_order
  `,
    sourceType: "math_question",
  },
  vr: {
    testsTable: "vr_tests",
    questionsTable: "vr_questions",
    questionSelect: `
      id,
      test_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      question_order
    `,
    sourceType: "vr_question",
  },
  nvr: {
    testsTable: "nvr_tests",
    questionsTable: "nvr_questions",
    questionSelect: `
      id,
      test_id,
      question_text,
      image_url,
      option_a,
      option_b,
      option_c,
      option_d,
      option_a_image_url,
      option_b_image_url,
      option_c_image_url,
      option_d_image_url,
      correct_answer,
      explanation,
      question_order
    `,
    sourceType: "nvr_question",
  },
};

function isMainCategory(value: unknown): value is MainCategory {
  return (
    value === "english" || value === "math" || value === "vr" || value === "nvr"
  );
}

function isOptionKey(value: unknown): value is OptionKey {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function toOptionKey(value: unknown): OptionKey | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (isOptionKey(normalized)) {
    return normalized;
  }

  const compactMatch = normalized.match(
    /^(?:CORRECT\s*)?(?:ANSWER\s*)?(?:OPTION\s*)?[\(\[]?([ABCD])[\)\].:\-]?$/,
  );

  if (compactMatch && isOptionKey(compactMatch[1])) {
    return compactMatch[1];
  }

  return null;
}

function normalizeAnswerTextForComparison(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^option\s+[a-d]\s*[:.)-]?\s*/i, "")
    .replace(/^[a-d]\s*[:.)-]\s*/i, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ");
}

function resolveCorrectAnswerKey(
  correctAnswerValue: string | null,
  options: NormalizedOption[],
): OptionKey | null {
  const directKey = toOptionKey(correctAnswerValue);

  if (directKey) {
    return directKey;
  }

  const normalizedCorrectAnswer = normalizeAnswerTextForComparison(
    correctAnswerValue,
  );

  if (!normalizedCorrectAnswer) {
    return null;
  }

  const matchingOption = options.find(
    (option) =>
      typeof option.text === "string" &&
      normalizeAnswerTextForComparison(option.text) === normalizedCorrectAnswer,
  );

  return matchingOption?.key ?? null;
}

function jsonError(error: string, status = 400) {
  return NextResponse.json<GenerateCustomTestResponse>(
    { ok: false, error },
    { status },
  );
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value.map((item) => (typeof item === "string" ? item : null)),
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return uniqueStrings(
            parsed.map((item) => (typeof item === "string" ? item : null)),
          );
        }
      } catch {
        // fall through
      }
    }

    return uniqueStrings([trimmed]);
  }

  return [];
}

function distributeCounts(total: number, bucketCount: number): number[] {
  if (bucketCount <= 0) return [];

  const base = Math.floor(total / bucketCount);
  const remainder = total % bucketCount;

  return Array.from(
    { length: bucketCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function normalizeDifficultyValue(
  difficulty: number | string | null | undefined,
): 1 | 2 | 3 | null {
  if (typeof difficulty === "number" && Number.isFinite(difficulty)) {
    const rounded = Math.round(difficulty);

    return rounded === 1 || rounded === 2 || rounded === 3 ? rounded : null;
  }

  if (typeof difficulty === "string") {
    const normalized = difficulty.trim().toLowerCase();

    if (normalized === "1" || normalized === "easy") return 1;
    if (normalized === "2" || normalized === "medium") return 2;
    if (normalized === "3" || normalized === "hard") return 3;
  }

  return null;
}

function matchesDifficulty(
  difficulty: number | string | null | undefined,
  selectedDifficulty: DifficultyFilter,
) {
  if (selectedDifficulty === "all") {
    return true;
  }

  return normalizeDifficultyValue(difficulty) === selectedDifficulty;
}

function selectComprehensionRowsByPassage(
  rows: EnglishQuestionRow[],
  requestedCount: number,
): EnglishQuestionRow[] {
  const grouped = new Map<number, EnglishQuestionRow[]>();

  for (const row of rows) {
    const groupKey = typeof row.test_id === "number" ? row.test_id : -row.id;

    const existing = grouped.get(groupKey) ?? [];
    existing.push(row);
    grouped.set(groupKey, existing);
  }

  const groupedEntries = shuffleArray([...grouped.entries()]);
  const selected: EnglishQuestionRow[] = [];

  for (const [, groupRows] of groupedEntries) {
    if (selected.length >= requestedCount) break;

    const remaining = requestedCount - selected.length;
    const shuffledGroupRows = shuffleArray(groupRows);
    const takeCount = Math.min(10, remaining, shuffledGroupRows.length);

    selected.push(...shuffledGroupRows.slice(0, takeCount));
  }

  return selected;
}

function getEnglishQuestionRowGuardKey(row: EnglishQuestionRow): string {
  return `english_question:${row.id}`;
}

function sortEnglishRowsByQuestionOrder(rows: EnglishQuestionRow[]) {
  return [...rows].sort((a, b) => {
    const aOrder =
      typeof a.question_order === "number"
        ? a.question_order
        : Number.MAX_SAFE_INTEGER;

    const bOrder =
      typeof b.question_order === "number"
        ? b.question_order
        : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.id - b.id;
  });
}

function selectComprehensionRowsByFullPassage(
  rows: EnglishQuestionRow[],
  requestedCount: number,
  previouslyUsedGuardKeys: Set<string>,
): EnglishQuestionRow[] {
  const grouped = new Map<number, EnglishQuestionRow[]>();

  for (const row of rows) {
    if (typeof row.test_id !== "number") {
      continue;
    }

    const existing = grouped.get(row.test_id) ?? [];
    existing.push(row);
    grouped.set(row.test_id, existing);
  }

  const validBlocks = Array.from(grouped.entries())
    .map(([testId, groupRows]) => {
      const sortedRows = sortEnglishRowsByQuestionOrder(groupRows);
      const firstTenRows = sortedRows.slice(0, 10);

      return {
        testId,
        rows: firstTenRows,
        freshCount: firstTenRows.filter(
          (row) =>
            !previouslyUsedGuardKeys.has(getEnglishQuestionRowGuardKey(row)),
        ).length,
      };
    })
    .filter((block) => block.rows.length >= 10);

  const freshBlocks = shuffleArray(
    validBlocks.filter((block) => block.freshCount === 10),
  );

  const partlyFreshBlocks = shuffleArray(
    validBlocks.filter(
      (block) => block.freshCount > 0 && block.freshCount < 10,
    ),
  ).sort((a, b) => b.freshCount - a.freshCount);

  const reusedBlocks = shuffleArray(
    validBlocks.filter((block) => block.freshCount === 0),
  );

  const orderedBlocks = [...freshBlocks, ...partlyFreshBlocks, ...reusedBlocks];
  const blocksNeeded = Math.floor(requestedCount / 10);

  return orderedBlocks.slice(0, blocksNeeded).flatMap((block) => block.rows);
}

function getQuestionGuardKey(question: NormalizedQuestion): string {
  if (
    question.sourceType === "words_vocabulary" ||
    question.sourceType === "words_spelling"
  ) {
    return `word:${String(question.sourceId)}`;
  }

  return `${question.sourceType}:${String(question.sourceId)}`;
}

function getPreviousItemGuardKey(
  sourceType: string | null,
  sourceId: number | null,
): string | null {
  if (!sourceType || typeof sourceId !== "number") {
    return null;
  }

  if (sourceType === "words_vocabulary" || sourceType === "words_spelling") {
    return `word:${String(sourceId)}`;
  }

  return `${sourceType}:${String(sourceId)}`;
}

function isQuestionPreviouslyUsed(
  question: NormalizedQuestion,
  previouslyUsedGuardKeys: Set<string>,
): boolean {
  return previouslyUsedGuardKeys.has(getQuestionGuardKey(question));
}

function splitQuestionsFreshFirst(
  questions: NormalizedQuestion[],
  previouslyUsedGuardKeys: Set<string>,
): NormalizedQuestion[] {
  const uniqueByGuardKey = new Map<string, NormalizedQuestion>();

  for (const question of questions) {
    const guardKey = getQuestionGuardKey(question);

    if (!uniqueByGuardKey.has(guardKey)) {
      uniqueByGuardKey.set(guardKey, question);
    }
  }

  const uniqueQuestions = Array.from(uniqueByGuardKey.values());
  const freshQuestions = uniqueQuestions.filter(
    (question) => !isQuestionPreviouslyUsed(question, previouslyUsedGuardKeys),
  );
  const reusedQuestions = uniqueQuestions.filter((question) =>
    isQuestionPreviouslyUsed(question, previouslyUsedGuardKeys),
  );

  return [...shuffleArray(freshQuestions), ...shuffleArray(reusedQuestions)];
}

function buildShuffledTextOptions(
  correctText: string,
  distractors: string[],
): { options: NormalizedOption[]; correctAnswer: OptionKey } | null {
  const cleanedCorrect = correctText.trim();
  if (!cleanedCorrect) return null;

  const cleanedDistractors = uniqueStrings(distractors).filter(
    (item) => item.toLowerCase() !== cleanedCorrect.toLowerCase(),
  );

  if (cleanedDistractors.length < 3) {
    return null;
  }

  const chosenDistractors = shuffleArray(cleanedDistractors).slice(0, 3);
  const optionTexts = shuffleArray([
    cleanedCorrect,
    ...chosenDistractors,
  ]).slice(0, 4);

  const options: NormalizedOption[] = optionTexts.map((text, index) => ({
    key: OPTION_KEYS[index],
    text,
    imageUrl: null,
  }));

  const correctOption = options.find(
    (option) => option.text?.toLowerCase() === cleanedCorrect.toLowerCase(),
  );

  if (!correctOption) return null;

  return {
    options,
    correctAnswer: correctOption.key,
  };
}

function normalizeVocabularyQuestions(words: WordRow[]): NormalizedQuestion[] {
  const usableWords = words.filter(
    (row) =>
      typeof row.word === "string" &&
      row.word.trim() &&
      typeof row.definition === "string" &&
      row.definition.trim(),
  );

  return usableWords.flatMap((row) => {
    const word = row.word!.trim();
    const definition = row.definition!.trim();

    const distractorDefinitions = usableWords
      .filter((candidate) => candidate.id !== row.id)
      .map((candidate) => candidate.definition);

    const builtOptions = buildShuffledTextOptions(
      definition,
      uniqueStrings(distractorDefinitions),
    );

    if (!builtOptions) return [];

    const question: NormalizedQuestion = {
      runnerId: `words_vocabulary:${row.id}`,
      sourceType: "words_vocabulary",
      sourceId: row.id,
      mainCategory: "english",
      topicKey: "vocabulary",
      subtopicKey: null,
      prompt: "Choose the correct definition for the word.",
      questionText: word,
      passageText: null,
      imageUrl: null,
      options: builtOptions.options,
      correctAnswer: builtOptions.correctAnswer,
      explanation: null,
      difficulty: normalizeDifficultyValue(row.difficulty),
      meta: {
        word,
      },
    };

    return [question];
  });
}

function normalizeSpellingQuestions(words: WordRow[]): NormalizedQuestion[] {
  const usableWords = words.filter(
    (row) =>
      typeof row.word === "string" &&
      row.word.trim() &&
      toStringArray(row.wrong_words).length >= 3,
  );

  return usableWords.flatMap((row) => {
    const word = row.word!.trim();

    const rowWrongWords = toStringArray(row.wrong_words).filter(
      (item) => item.toLowerCase() !== word.toLowerCase(),
    );

    const uniqueWrongWords = uniqueStrings(rowWrongWords).filter(
      (item) => item.toLowerCase() !== word.toLowerCase(),
    );

    if (uniqueWrongWords.length < 3) {
      return [];
    }

    const builtOptions = buildShuffledTextOptions(word, uniqueWrongWords);

    if (!builtOptions) return [];

    const question: NormalizedQuestion = {
      runnerId: `words_spelling:${row.id}`,
      sourceType: "words_spelling",
      sourceId: row.id,
      mainCategory: "english",
      topicKey: "spelling",
      subtopicKey: null,
      prompt: "Choose the correct spelling.",
      questionText: null,
      passageText: null,
      imageUrl: null,
      options: builtOptions.options,
      correctAnswer: builtOptions.correctAnswer,
      explanation: null,
      difficulty: normalizeDifficultyValue(row.difficulty),
      meta: {
        word,
        wrongWords: uniqueWrongWords,
      },
    };

    return [question];
  });
}

function normalizeEnglishQuestions(
  rows: EnglishQuestionRow[],
  topicKey: string,
  passagesByTestId: Map<number, string>,
): NormalizedQuestion[] {
  return rows.flatMap((row) => {
    const options: NormalizedOption[] = [
      { key: "A", text: row.option_a, imageUrl: null },
      { key: "B", text: row.option_b, imageUrl: null },
      { key: "C", text: row.option_c, imageUrl: null },
      { key: "D", text: row.option_d, imageUrl: null },
    ];

    const correctAnswer = resolveCorrectAnswerKey(row.correct_answer, options);

    if (!correctAnswer) {
      return [];
    }

    const hasAnyOptionContent = options.some(
      (option) => typeof option.text === "string" && option.text.trim(),
    );

    if (!hasAnyOptionContent) {
      return [];
    }

    const passageText =
      topicKey === "comprehension" && typeof row.test_id === "number"
        ? (passagesByTestId.get(row.test_id) ?? null)
        : null;

    const question: NormalizedQuestion = {
      runnerId: `english_question:${row.id}`,
      sourceType: "english_question",
      sourceId: row.id,
      mainCategory: "english",
      topicKey,
      subtopicKey: row.subcategory,
      prompt:
        topicKey === "comprehension"
          ? "Read the passage and choose the correct answer."
          : "Choose the correct answer.",
      questionText: row.question_text,
      passageText,
      imageUrl: null,
      options,
      correctAnswer,
      explanation: row.explanation,
      difficulty: normalizeDifficultyValue(row.difficulty),
      meta: {
        main_category: row.main_category,
        subcategory: row.subcategory,
        test_id: row.test_id,
      },
    };

    return [question];
  });
}

function normalizeCategoryValue(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function getStandardTopicCategoryCandidates(
  mainCategory: NonEnglishMainCategory,
  topicKey: string,
): string[] {
  const baseCandidates = [
    topicKey,
    topicKey.replace(/-/g, "_"),
    topicKey.replace(/-/g, " "),
  ];

  let extraCandidates: string[] = [];

  if (mainCategory === "math") {
    switch (topicKey) {
      case "arithmetic":
        extraCandidates = [];
        break;
      case "fractions-decimals-percentages":
        extraCandidates = [
          "fractions",
          "decimals",
          "percentages",
          "fractions_decimals_percentages",
        ];
        break;
      case "algebra-reasoning":
        extraCandidates = ["algebra", "algebra_reasoning"];
        break;
      case "geometry-measurement":
        extraCandidates = ["geometry", "measurement", "geometry_measurement"];
        break;
      case "ratio-proportion":
        extraCandidates = [
          "ratio",
          "proportion",
          "ratios-proportions",
          "ratios_proportions",
          "ratio_proportion",
        ];
        break;
      case "word-problems":
        extraCandidates = [
          "problem-solving",
          "problem_solving",
          "word problems",
          "problem solving",
        ];
        break;
    }
  }

  if (mainCategory === "vr") {
    switch (topicKey) {
      case "word-relationships":
        extraCandidates = [
          "word_relationships",
          "word relationship",
          "word_relationship",
        ];
        break;
      case "codes-logic":
        extraCandidates = ["codes_logic", "codes logic"];
        break;
      case "sequence-pattern":
        extraCandidates = ["sequence_pattern", "sequence pattern"];
        break;
    }
  }

  if (mainCategory === "nvr") {
    switch (topicKey) {
      case "shape-patterns":
        extraCandidates = ["shape-pattern", "shape_patterns", "shape_pattern"];
        break;
      case "rotations-reflections":
        extraCandidates = [
          "rotation-reflection",
          "rotation_reflection",
          "rotations_reflections",
        ];
        break;
      case "codes-spatial-logic":
        extraCandidates = [
          "code-spatial-logic",
          "code_spatial_logic",
          "spatial-logic",
          "spatial_logic",
          "codes_spatial_logic",
        ];
        break;
    }
  }

  return uniqueStrings([...baseCandidates, ...extraCandidates]).map(
    normalizeCategoryValue,
  );
}

function getStandardTableConfig(
  mainCategory: NonEnglishMainCategory,
): StandardTableConfig {
  return STANDARD_TABLE_CONFIG[mainCategory];
}

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function getAuthenticatedSupabaseClient(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return {
      supabase: null,
      error: "Please sign in to use Build a Test.",
    };
  }

  return {
    supabase: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    }),
    error: null,
  };
}

async function fetchWords(supabase: ReturnType<typeof getSupabaseClient>) {
  const { data, error } = await supabase
    .from("words")
    .select("id, word, definition, difficulty, wrong_words")
    .range(0, 9999);

  if (error) {
    throw new Error(`Could not load words: ${error.message}`);
  }

  return (data ?? []) as WordRow[];
}

async function fetchEnglishQuestions(
  supabase: ReturnType<typeof getSupabaseClient>,
  topicKey: string,
  selectedSubtopics: string[],
) {
  let query = supabase
    .from("english_questions")
    .select(
      `
      id,
      test_id,
      main_category,
      subcategory,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      difficulty,
      question_order
      `,
    )
    .range(0, 9999)
    .order("test_id", { ascending: true })
    .order("question_order", { ascending: true })
    .order("id", { ascending: true });

  if (topicKey === "comprehension") {
    query = query.or(
      "main_category.eq.comprehension,subcategory.eq.comprehension",
    );
  } else {
    query = query.eq("main_category", topicKey);
  }

  const expandedSelectedSubtopics = getEnglishSubtopicCandidates(
    topicKey,
    selectedSubtopics,
  );

  if (
    (topicKey === "grammar" || topicKey === "punctuation") &&
    expandedSelectedSubtopics.length > 0
  ) {
    query = query.in("subcategory", expandedSelectedSubtopics);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Could not load english_questions for ${topicKey}: ${error.message}`,
    );
  }

  return (data ?? []) as EnglishQuestionRow[];
}

async function fetchComprehensionQuestionRowsForDifficulty(
  supabase: ReturnType<typeof getSupabaseClient>,
  selectedDifficulty: DifficultyFilter,
): Promise<EnglishQuestionRow[]> {
  const { data: testData, error: testError } = await supabase
    .from("english_tests")
    .select("id, title, main_category, subcategory, difficulty")
    .or("main_category.eq.comprehension,subcategory.eq.comprehension")
    .range(0, 9999);

  if (testError) {
    throw new Error(
      `Could not load comprehension english_tests: ${testError.message}`,
    );
  }

  const comprehensionTests = (testData ??
    []) as EnglishComprehensionTestLookupRow[];

  const matchingTestIds = comprehensionTests
    .filter((test) => matchesDifficulty(test.difficulty, selectedDifficulty))
    .map((test) => test.id)
    .filter((id): id is number => typeof id === "number");

  if (matchingTestIds.length === 0) {
    return [];
  }

  const { data: questionData, error: questionError } = await supabase
    .from("english_questions")
    .select(
      `
      id,
      test_id,
      main_category,
      subcategory,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      difficulty,
      question_order
      `,
    )
    .in("test_id", matchingTestIds)
    .range(0, 9999)
    .order("test_id", { ascending: true })
    .order("question_order", { ascending: true })
    .order("id", { ascending: true });

  if (questionError) {
    throw new Error(
      `Could not load comprehension questions by test_id: ${questionError.message}`,
    );
  }

  return (questionData ?? []) as EnglishQuestionRow[];
}

async function fetchEnglishQuestionRowsByTestIds(
  supabase: ReturnType<typeof getSupabaseClient>,
  testIds: number[],
): Promise<EnglishQuestionRow[]> {
  if (testIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("english_questions")
    .select(
      `
      id,
      test_id,
      main_category,
      subcategory,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      difficulty,
      question_order
      `,
    )
    .in("test_id", testIds)
    .range(0, 9999)
    .order("test_id", { ascending: true })
    .order("question_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(
      `Could not load english questions by test_id: ${error.message}`,
    );
  }

  return (data ?? []) as EnglishQuestionRow[];
}

function normalizedValueSet(values: string[]) {
  return new Set(
    values
      .map((value) => normalizeCategoryValue(value))
      .filter((value) => value.length > 0),
  );
}

function getEnglishSubtopicCandidates(
  topicKey: string,
  selectedSubtopics: string[],
): string[] {
  if (
    selectedSubtopics.length === 0 ||
    (topicKey !== "grammar" && topicKey !== "punctuation")
  ) {
    return selectedSubtopics;
  }

  const candidates: string[] = [];

  for (const subtopic of selectedSubtopics) {
    const normalized = normalizeCategoryValue(subtopic);

    candidates.push(
      subtopic,
      normalized,
      normalized.replace(/-/g, "_"),
      normalized.replace(/-/g, " "),
    );

    switch (normalized) {
      case "direct-speech-punctuation":
      case "direct-speech":
        candidates.push(
          "direct-speech-punctuation",
          "direct_speech_punctuation",
          "direct speech punctuation",
          "direct-speech",
          "direct_speech",
          "direct speech",
          "speech-punctuation",
          "speech_punctuation",
          "speech punctuation",
        );
        break;
      case "sentence-punctuation":
      case "sentence":
        candidates.push(
          "sentence-punctuation",
          "sentence_punctuation",
          "sentence punctuation",
          "sentence",
          "sentences",
        );
        break;
      case "advanced-punctuation":
      case "advanced":
        candidates.push(
          "advanced-punctuation",
          "advanced_punctuation",
          "advanced punctuation",
          "advanced",
        );
        break;
      case "comma":
      case "commas":
        candidates.push(
          "comma",
          "commas",
          "comma-punctuation",
          "comma_punctuation",
          "comma punctuation",
        );
        break;
      case "apostrophes":
      case "apostrophe":
        candidates.push(
          "apostrophes",
          "apostrophe",
          "apostrophe-punctuation",
          "apostrophe_punctuation",
          "apostrophe punctuation",
        );
        break;
      case "primary-word-classes":
        candidates.push(
          "primary-word-classes",
          "primary_word_classes",
          "primary word classes",
          "word-classes",
          "word_classes",
          "word classes",
        );
        break;
      case "sentence-structure-syntax":
        candidates.push(
          "sentence-structure-syntax",
          "sentence_structure_syntax",
          "sentence structure syntax",
          "sentence-structure",
          "sentence_structure",
          "sentence structure",
          "syntax",
        );
        break;
    }
  }

  return uniqueStrings(candidates);
}


async function fetchEnglishQuestionRowsByCategoryAndDifficulty(
  supabase: ReturnType<typeof getSupabaseClient>,
  topicKey: string,
  selectedSubtopics: string[],
  selectedDifficulty: DifficultyFilter,
): Promise<EnglishQuestionRow[]> {
  let query = supabase
    .from("english_questions")
    .select(
      `
      id,
      test_id,
      main_category,
      subcategory,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      difficulty,
      question_order
      `,
    )
    .range(0, 9999)
    .order("test_id", { ascending: true })
    .order("question_order", { ascending: true })
    .order("id", { ascending: true });

  if (topicKey === "comprehension") {
    query = query.or(
      "main_category.eq.comprehension,subcategory.eq.comprehension",
    );
  } else {
    query = query.eq("main_category", topicKey);
  }

  const expandedSelectedSubtopics = getEnglishSubtopicCandidates(
    topicKey,
    selectedSubtopics,
  );

  if (
    (topicKey === "grammar" || topicKey === "punctuation") &&
    expandedSelectedSubtopics.length > 0
  ) {
    query = query.in("subcategory", expandedSelectedSubtopics);
  }

  if (selectedDifficulty !== "all") {
    query = query.eq("difficulty", selectedDifficulty);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Could not directly load english_questions for ${topicKey}: ${error.message}`,
    );
  }

  return (data ?? []) as EnglishQuestionRow[];
}

async function fetchEnglishTopicQuestionRowsForDifficulty(
  supabase: ReturnType<typeof getSupabaseClient>,
  topicKey: string,
  selectedSubtopics: string[],
  selectedDifficulty: DifficultyFilter,
): Promise<EnglishQuestionRow[]> {
  const { data: testData, error: testError } = await supabase
    .from("english_tests")
    .select("id, title, main_category, subcategory, difficulty")
    .range(0, 9999);

  if (testError) {
    throw new Error(`Could not load english_tests: ${testError.message}`);
  }

  const tests = (testData ?? []) as EnglishTopicTestLookupRow[];
  const normalizedTopicKey = normalizeCategoryValue(topicKey);
  const selectedSubtopicSet = normalizedValueSet(
    getEnglishSubtopicCandidates(topicKey, selectedSubtopics),
  );

  const matchingTestIds = tests
    .filter((test) => {
      if (!matchesDifficulty(test.difficulty, selectedDifficulty)) {
        return false;
      }

      const normalizedMainCategory = normalizeCategoryValue(test.main_category);
      const normalizedSubcategory = normalizeCategoryValue(test.subcategory);
      const normalizedTitle = normalizeCategoryValue(test.title ?? null);

      const matchesTopic =
        normalizedMainCategory === normalizedTopicKey ||
        normalizedSubcategory === normalizedTopicKey ||
        normalizedTitle.includes(normalizedTopicKey);

      if (selectedSubtopicSet.size === 0) {
        return matchesTopic;
      }

      return (
        selectedSubtopicSet.has(normalizedSubcategory) ||
        selectedSubtopicSet.has(normalizedMainCategory) ||
        Array.from(selectedSubtopicSet).some((subtopic) =>
          normalizedTitle.includes(subtopic),
        )
      );
    })
    .map((test) => test.id)
    .filter((id): id is number => typeof id === "number");

  const rowsFromTests = await fetchEnglishQuestionRowsByTestIds(
    supabase,
    matchingTestIds,
  );

  if (rowsFromTests.length > 0) {
    return rowsFromTests;
  }

  // Some migrated English rows are easier to find from english_questions than
  // from english_tests. This keeps Hard Direct Speech Punctuation available
  // even if the parent-test lookup misses it for any reason.
  const directRows = await fetchEnglishQuestionRowsByCategoryAndDifficulty(
    supabase,
    topicKey,
    selectedSubtopics,
    selectedDifficulty,
  );

  if (directRows.length > 0) {
    return directRows;
  }

  // Fallback for any older rows/tests that are not consistently linked through
  // english_tests. This preserves the previous Easy/Medium behaviour while the
  // test-first path fixes Hard rows where difficulty lives on english_tests.
  const fetchedRows = await fetchEnglishQuestions(
    supabase,
    topicKey,
    selectedSubtopics,
  );

  return filterEnglishRowsByQuestionOrTestDifficulty(
    supabase,
    fetchedRows,
    selectedDifficulty,
  );
}

async function fetchEnglishPassages(
  supabase: ReturnType<typeof getSupabaseClient>,
  testIds: number[],
) {
  if (testIds.length === 0) {
    return new Map<number, string>();
  }

  const { data, error } = await supabase
    .from("english_tests")
    .select("id, passage")
    .in("id", testIds);

  if (error) {
    throw new Error(`Could not load english passages: ${error.message}`);
  }

  const rows = (data ?? []) as EnglishTestRow[];
  const map = new Map<number, string>();

  for (const row of rows) {
    if (
      typeof row.id === "number" &&
      typeof row.passage === "string" &&
      row.passage.trim()
    ) {
      map.set(row.id, row.passage);
    }
  }

  return map;
}

async function fetchEnglishTestDifficultyMap(
  supabase: ReturnType<typeof getSupabaseClient>,
  testIds: number[],
) {
  if (testIds.length === 0) {
    return new Map<number, 1 | 2 | 3 | null>();
  }

  const { data, error } = await supabase
    .from("english_tests")
    .select("id, difficulty")
    .in("id", testIds);

  if (error) {
    throw new Error(
      `Could not load english test difficulties: ${error.message}`,
    );
  }

  const rows = (data ?? []) as EnglishTestRow[];
  const map = new Map<number, 1 | 2 | 3 | null>();

  for (const row of rows) {
    if (typeof row.id === "number") {
      map.set(row.id, normalizeDifficultyValue(row.difficulty));
    }
  }

  return map;
}

async function filterComprehensionRowsByTestDifficulty(
  supabase: ReturnType<typeof getSupabaseClient>,
  rows: EnglishQuestionRow[],
  selectedDifficulty: DifficultyFilter,
) {
  if (selectedDifficulty === "all") {
    return rows;
  }

  const testIds = Array.from(
    new Set(
      rows
        .map((row) => row.test_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  const difficultyByTestId = await fetchEnglishTestDifficultyMap(
    supabase,
    testIds,
  );

  return rows.filter((row) => {
    const questionDifficultyMatches = matchesDifficulty(
      row.difficulty,
      selectedDifficulty,
    );

    const testDifficultyMatches =
      typeof row.test_id === "number" && difficultyByTestId.has(row.test_id)
        ? matchesDifficulty(
            difficultyByTestId.get(row.test_id) ?? null,
            selectedDifficulty,
          )
        : false;

    // Comprehension data can carry difficulty on either the parent passage/test
    // row or the individual question row. Keep a question if either source
    // matches so a mismatch in one table does not hide valid passages.
    return questionDifficultyMatches || testDifficultyMatches;
  });
}

async function filterEnglishRowsByQuestionOrTestDifficulty(
  supabase: ReturnType<typeof getSupabaseClient>,
  rows: EnglishQuestionRow[],
  selectedDifficulty: DifficultyFilter,
) {
  if (selectedDifficulty === "all") {
    return rows;
  }

  const testIds = Array.from(
    new Set(
      rows
        .map((row) => row.test_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  const difficultyByTestId = await fetchEnglishTestDifficultyMap(
    supabase,
    testIds,
  );

  return rows.filter((row) => {
    const questionDifficultyMatches = matchesDifficulty(
      row.difficulty,
      selectedDifficulty,
    );

    const testDifficultyMatches =
      typeof row.test_id === "number" && difficultyByTestId.has(row.test_id)
        ? matchesDifficulty(
            difficultyByTestId.get(row.test_id) ?? null,
            selectedDifficulty,
          )
        : false;

    return questionDifficultyMatches || testDifficultyMatches;
  });
}

async function fetchStandardTestsForTopic(
  supabase: ReturnType<typeof getSupabaseClient>,
  mainCategory: NonEnglishMainCategory,
  topicKey: string,
) {
  const config = getStandardTableConfig(mainCategory);
  const allowedCategories = new Set(
    getStandardTopicCategoryCandidates(mainCategory, topicKey),
  );

  const { data, error } = await supabase
    .from(config.testsTable)
    .select("id, title, category, difficulty")
    .range(0, 9999);

  if (error) {
    throw new Error(`Could not load ${mainCategory} tests: ${error.message}`);
  }

  const rows = (data ?? []) as StandardTestRow[];

  return rows.filter((row) =>
    allowedCategories.has(normalizeCategoryValue(row.category)),
  );
}

async function fetchStandardQuestions(
  supabase: ReturnType<typeof getSupabaseClient>,
  mainCategory: NonEnglishMainCategory,
  testIds: number[],
) {
  if (testIds.length === 0) {
    return [] as StandardQuestionRow[];
  }

  const config = getStandardTableConfig(mainCategory);

  const { data, error } = await supabase
    .from(config.questionsTable)
    .select(config.questionSelect)
    .in("test_id", testIds)
    .order("test_id", { ascending: true })
    .order("question_order", { ascending: true });

  if (error) {
    throw new Error(
      `Could not load ${mainCategory} questions: ${error.message}`,
    );
  }

  return (data ?? []) as unknown as StandardQuestionRow[];
}

async function fetchPreviouslyUsedQuestionGuardKeys(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  mainCategory: MainCategory,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("custom_test_attempt_items")
    .select("source_type, source_id")
    .eq("user_id", userId)
    .eq("main_category", mainCategory)
    .range(0, 9999);

  if (error) {
    console.error("Failed to fetch previous custom test questions:", error);
    return new Set<string>();
  }

  const rows = (data ?? []) as PreviousCustomTestItemRow[];
  const guardKeys = rows
    .map((row) => getPreviousItemGuardKey(row.source_type, row.source_id))
    .filter((key): key is string => typeof key === "string" && key.length > 0);

  return new Set(guardKeys);
}

function normalizeStandardQuestions(
  mainCategory: NonEnglishMainCategory,
  topicKey: string,
  rows: StandardQuestionRow[],
  testsById: Map<number, StandardTestRow>,
): NormalizedQuestion[] {
  const config = getStandardTableConfig(mainCategory);

  return rows.flatMap((row) => {
    if (typeof row.test_id !== "number") {
      return [];
    }

    const parentTest = testsById.get(row.test_id);
    const correctAnswer = toOptionKey(row.correct_answer);

    if (!correctAnswer) {
      return [];
    }

    const options: NormalizedOption[] = [
      {
        key: "A",
        text: row.option_a,
        imageUrl: row.option_a_image_url ?? null,
      },
      {
        key: "B",
        text: row.option_b,
        imageUrl: row.option_b_image_url ?? null,
      },
      {
        key: "C",
        text: row.option_c,
        imageUrl: row.option_c_image_url ?? null,
      },
      {
        key: "D",
        text: row.option_d,
        imageUrl: row.option_d_image_url ?? null,
      },
    ];

    const hasAnyOptionContent = options.some(
      (option) =>
        (typeof option.text === "string" && option.text.trim()) ||
        (typeof option.imageUrl === "string" && option.imageUrl.trim()),
    );

    if (!hasAnyOptionContent) {
      return [];
    }

    const hasQuestionImage =
      typeof row.image_url === "string" && row.image_url.trim();

    const hasOptionImages = options.some(
      (option) => typeof option.imageUrl === "string" && option.imageUrl.trim(),
    );

    const question: NormalizedQuestion = {
      runnerId: `${config.sourceType}:${row.id}`,
      sourceType: config.sourceType,
      sourceId: row.id,
      mainCategory,
      topicKey,
      subtopicKey: null,
      prompt:
        hasQuestionImage || hasOptionImages
          ? "Study the image and choose the correct answer."
          : "Choose the correct answer.",
      questionText: row.question_text,
      passageText: null,
      imageUrl: row.image_url ?? null,
      options,
      correctAnswer,
      explanation: row.explanation,
      difficulty: normalizeDifficultyValue(parentTest?.difficulty ?? null),
      meta: {
        test_id: row.test_id,
        test_title: parentTest?.title ?? null,
        category: parentTest?.category ?? null,
        question_order: row.question_order,
      },
    };

    return [question];
  });
}

async function buildStandardTopicQuestions(
  supabase: ReturnType<typeof getSupabaseClient>,
  mainCategory: NonEnglishMainCategory,
  topicKey: string,
  selectedDifficulty: DifficultyFilter,
) {
  const tests = await fetchStandardTestsForTopic(
    supabase,
    mainCategory,
    topicKey,
  );

  const filteredTests = tests.filter((test) =>
    matchesDifficulty(test.difficulty, selectedDifficulty),
  );

  if (filteredTests.length === 0) {
    return [] as NormalizedQuestion[];
  }

  const testsById = new Map<number, StandardTestRow>(
    filteredTests.map((test) => [test.id, test]),
  );

  const questions = await fetchStandardQuestions(
    supabase,
    mainCategory,
    filteredTests.map((test) => test.id),
  );

  return normalizeStandardQuestions(
    mainCategory,
    topicKey,
    questions,
    testsById,
  );
}

function validateRequestBody(
  body: unknown,
):
  | { ok: true; data: AdaptiveGenerateCustomTestRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const request = body as Partial<AdaptiveGenerateCustomTestRequest>;

  if (!isMainCategory(request.mainCategory)) {
    return { ok: false, error: "Invalid main category." };
  }

  if (!Array.isArray(request.topicKeys) || request.topicKeys.length === 0) {
    return { ok: false, error: "Please select at least one topic." };
  }

  if (
    typeof request.questionCount !== "number" ||
    request.questionCount < MIN_QUESTION_COUNT ||
    request.questionCount > MAX_QUESTION_COUNT
  ) {
    return {
      ok: false,
      error: `Question count must be between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT}.`,
    };
  }

  if (
    typeof request.totalTimeMinutes !== "number" ||
    request.totalTimeMinutes < MIN_TIME_MINUTES ||
    request.totalTimeMinutes > MAX_TIME_MINUTES
  ) {
    return {
      ok: false,
      error: `Total time must be between ${MIN_TIME_MINUTES} and ${MAX_TIME_MINUTES} minutes.`,
    };
  }

  const normalizedDifficulty = normalizeDifficultyValue(
    request.selectedDifficulty as number | string | null | undefined,
  );

  const selectedDifficulty: AdaptiveDifficultyFilter =
    request.selectedDifficulty === "adaptive"
      ? "adaptive"
      : normalizedDifficulty === 1 ||
          normalizedDifficulty === 2 ||
          normalizedDifficulty === 3
        ? normalizedDifficulty
        : "all";

  return {
    ok: true,
    data: {
      mainCategory: request.mainCategory,
      topicKeys: request.topicKeys,
      subtopicMap:
        request.subtopicMap && typeof request.subtopicMap === "object"
          ? request.subtopicMap
          : {},
      questionCount: request.questionCount,
      totalTimeMinutes: request.totalTimeMinutes,
      selectedDifficulty,
    },
  };
}

function validateTopicSelection(
  request: AdaptiveGenerateCustomTestRequest,
): { ok: true } | { ok: false; error: string } {
  const catalog = getMainCategoryCatalog(request.mainCategory);

  if (!catalog || !catalog.enabled) {
    return { ok: false, error: "This main category is not enabled." };
  }

  const uniqueTopicKeys = Array.from(new Set(request.topicKeys));

  for (const topicKey of uniqueTopicKeys) {
    const topic = catalog.topics.find((item) => item.key === topicKey);

    if (!topic || topic.enabled === false) {
      return { ok: false, error: `Invalid topic selected: ${topicKey}` };
    }

    const rawSubtopics = request.subtopicMap[topicKey];
    const selectedSubtopics = Array.isArray(rawSubtopics)
      ? rawSubtopics.filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    if (!topic.childSubtopics || topic.childSubtopics.length === 0) {
      if (selectedSubtopics.length > 0) {
        return {
          ok: false,
          error: `Topic "${topic.label}" does not support subtopic filtering.`,
        };
      }

      continue;
    }

    const allowedSubtopicKeys = new Set(
      topic.childSubtopics.map((subtopic) => subtopic.key),
    );

    for (const subtopicKey of selectedSubtopics) {
      if (!allowedSubtopicKeys.has(subtopicKey)) {
        return {
          ok: false,
          error: `Invalid subtopic "${subtopicKey}" for topic "${topic.label}".`,
        };
      }
    }
  }

  return { ok: true };
}

function selectFinalQuestions(
  topicPools: TopicPool[],
  questionCount: number,
  previouslyUsedGuardKeys: Set<string>,
): NormalizedQuestion[] {
  const preparedPools = topicPools.map((pool) => ({
    topicKey: pool.topicKey,
    questions: splitQuestionsFreshFirst(
      pool.questions,
      previouslyUsedGuardKeys,
    ),
  }));

  const perTopicTargets = distributeCounts(questionCount, preparedPools.length);
  const selectedBuckets: NormalizedQuestion[][] = preparedPools.map(() => []);

  const selectedRunnerIds = new Set<string>();
  const selectedGuardKeys = new Set<string>();

  preparedPools.forEach((pool, poolIndex) => {
    const target = perTopicTargets[poolIndex] ?? 0;
    let pickedForThisTopic = 0;

    for (const question of pool.questions) {
      if (pickedForThisTopic >= target) break;

      const guardKey = getQuestionGuardKey(question);

      if (
        selectedRunnerIds.has(question.runnerId) ||
        selectedGuardKeys.has(guardKey)
      ) {
        continue;
      }

      selectedBuckets[poolIndex].push(question);
      selectedRunnerIds.add(question.runnerId);
      selectedGuardKeys.add(guardKey);
      pickedForThisTopic += 1;
    }
  });

  const leftoverItems = preparedPools.flatMap((pool, poolIndex) =>
    pool.questions
      .filter((question) => !selectedRunnerIds.has(question.runnerId))
      .map((question) => ({
        question,
        poolIndex,
      })),
  );

  const leftoverFreshItems = shuffleArray(
    leftoverItems.filter(
      (item) =>
        !isQuestionPreviouslyUsed(item.question, previouslyUsedGuardKeys),
    ),
  );
  const leftoverReusedItems = shuffleArray(
    leftoverItems.filter((item) =>
      isQuestionPreviouslyUsed(item.question, previouslyUsedGuardKeys),
    ),
  );

  const leftovers = [...leftoverFreshItems, ...leftoverReusedItems];

  for (const item of leftovers) {
    if (selectedRunnerIds.size >= questionCount) break;

    const guardKey = getQuestionGuardKey(item.question);

    if (
      selectedRunnerIds.has(item.question.runnerId) ||
      selectedGuardKeys.has(guardKey)
    ) {
      continue;
    }

    selectedBuckets[item.poolIndex].push(item.question);
    selectedRunnerIds.add(item.question.runnerId);
    selectedGuardKeys.add(guardKey);
  }

  return selectedBuckets.flat();
}

function selectFinalEnglishQuestions(
  topicPools: TopicPool[],
  questionCount: number,
  previouslyUsedGuardKeys: Set<string>,
): NormalizedQuestion[] {
  const comprehensionPool = topicPools.find(
    (pool) => pool.topicKey === "comprehension",
  );

  if (!comprehensionPool || comprehensionPool.questions.length === 0) {
    return selectFinalQuestions(
      topicPools,
      questionCount,
      previouslyUsedGuardKeys,
    );
  }

  const nonComprehensionPools = topicPools.filter(
    (pool) => pool.topicKey !== "comprehension",
  );

  const selectedComprehensionQuestions = comprehensionPool.questions.slice(
    0,
    Math.min(10, comprehensionPool.questions.length),
  );

  const remainingQuestionCount = Math.max(
    0,
    questionCount - selectedComprehensionQuestions.length,
  );

  const selectedOtherQuestions = selectFinalQuestions(
    nonComprehensionPools,
    remainingQuestionCount,
    previouslyUsedGuardKeys,
  );

  const combinedQuestions = [
    ...selectedComprehensionQuestions,
    ...selectedOtherQuestions,
  ];

  return combinedQuestions.slice(0, questionCount);
}


function getAdaptivePoolKey(difficulty: AdaptiveDifficultyLevel): AdaptivePoolKey {
  if (difficulty === 1) return "easy";
  if (difficulty === 2) return "medium";
  return "hard";
}

function buildAdaptiveResponse(
  config: AdaptiveGenerateCustomTestRequest,
  pools: AdaptiveQuestionPools,
): GenerateCustomTestResponse {
  const firstQuestion = pools.medium[0] ?? pools.easy[0] ?? pools.hard[0] ?? null;

  if (!firstQuestion) {
    return {
      ok: false,
      error: "No medium questions were found for the selected adaptive custom test setup.",
    } as GenerateCustomTestResponse;
  }

  return {
    ok: true,
    data: {
      testSessionId: crypto.randomUUID(),
      config,
      questions: [firstQuestion],
      createdAt: new Date().toISOString(),
      adaptiveMode: {
        enabled: true,
        startingDifficulty: 2,
        currentDifficulty: 2,
        questionCount: config.questionCount,
        pools,
      },
    },
  } as unknown as GenerateCustomTestResponse;
}

async function buildEnglishAdaptiveTopicPoolsForDifficulty({
  supabase,
  config,
  uniqueTopicKeys,
  difficulty,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  config: AdaptiveGenerateCustomTestRequest;
  uniqueTopicKeys: string[];
  difficulty: AdaptiveDifficultyLevel;
}) {
  const topicPools: TopicPool[] = [];
  const needsWords =
    uniqueTopicKeys.includes("vocabulary") || uniqueTopicKeys.includes("spelling");

  const words = needsWords
    ? (await fetchWords(supabase)).filter((row) =>
        matchesDifficulty(row.difficulty, difficulty),
      )
    : [];

  for (const topicKey of uniqueTopicKeys) {
    if (topicKey === "vocabulary") {
      topicPools.push({
        topicKey,
        questions: normalizeVocabularyQuestions(words),
      });
      continue;
    }

    if (topicKey === "spelling") {
      topicPools.push({
        topicKey,
        questions: normalizeSpellingQuestions(words),
      });
      continue;
    }

    if (topicKey === "grammar" || topicKey === "punctuation") {
      const selectedSubtopics = Array.isArray(config.subtopicMap[topicKey])
        ? config.subtopicMap[topicKey].filter(
            (value): value is string => typeof value === "string",
          )
        : [];

      const rows = await fetchEnglishTopicQuestionRowsForDifficulty(
        supabase,
        topicKey,
        selectedSubtopics,
        difficulty,
      );

      topicPools.push({
        topicKey,
        questions: normalizeEnglishQuestions(
          rows,
          topicKey,
          new Map<number, string>(),
        ),
      });
      continue;
    }

    throw new Error(`Topic "${topicKey}" is not supported for adaptive English tests yet.`);
  }

  return topicPools;
}

async function buildStandardAdaptiveTopicPoolsForDifficulty({
  supabase,
  config,
  uniqueTopicKeys,
  difficulty,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  config: AdaptiveGenerateCustomTestRequest;
  uniqueTopicKeys: string[];
  difficulty: AdaptiveDifficultyLevel;
}) {
  const mainCategory = config.mainCategory as NonEnglishMainCategory;
  const topicPools: TopicPool[] = [];

  for (const topicKey of uniqueTopicKeys) {
    const questions = await buildStandardTopicQuestions(
      supabase,
      mainCategory,
      topicKey,
      difficulty,
    );

    topicPools.push({ topicKey, questions });
  }

  return topicPools;
}

async function buildAdaptiveQuestionPools({
  supabase,
  config,
  uniqueTopicKeys,
  previouslyUsedGuardKeys,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  config: AdaptiveGenerateCustomTestRequest;
  uniqueTopicKeys: string[];
  previouslyUsedGuardKeys: Set<string>;
}): Promise<AdaptiveQuestionPools> {
  const pools: AdaptiveQuestionPools = {
    easy: [],
    medium: [],
    hard: [],
  };

  for (const difficulty of [1, 2, 3] as AdaptiveDifficultyLevel[]) {
    const topicPools =
      config.mainCategory === "english"
        ? await buildEnglishAdaptiveTopicPoolsForDifficulty({
            supabase,
            config,
            uniqueTopicKeys,
            difficulty,
          })
        : await buildStandardAdaptiveTopicPoolsForDifficulty({
            supabase,
            config,
            uniqueTopicKeys,
            difficulty,
          });

    const selectedQuestions =
      config.mainCategory === "english"
        ? selectFinalEnglishQuestions(
            topicPools,
            config.questionCount,
            previouslyUsedGuardKeys,
          )
        : selectFinalQuestions(
            topicPools,
            config.questionCount,
            previouslyUsedGuardKeys,
          );

    pools[getAdaptivePoolKey(difficulty)] = selectedQuestions;
  }

  return pools;
}

function countAdaptivePoolQuestions(pools: AdaptiveQuestionPools) {
  const uniqueRunnerIds = new Set<string>();

  for (const questions of Object.values(pools)) {
    for (const question of questions) {
      uniqueRunnerIds.add(question.runnerId);
    }
  }

  return uniqueRunnerIds.size;
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedClient = getAuthenticatedSupabaseClient(request);

    if (!authenticatedClient.supabase) {
      return jsonError(authenticatedClient.error, 401);
    }

    const supabase = authenticatedClient.supabase;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError("Please sign in to use custom tests.", 401);
    }

    const { data: hasPaidAccess, error: accessError } =
      await supabase.rpc("has_paid_access");

    if (accessError) {
      return jsonError("Could not check your membership access.", 500);
    }

    if (!hasPaidAccess) {
      return jsonError(
        "Build your own test is available for monthly and annual members only.",
        403,
      );
    }

    const body = await request.json();
    const validatedBody = validateRequestBody(body);

    if (!validatedBody.ok) {
      return jsonError(validatedBody.error, 400);
    }

    const config = validatedBody.data;
    const selectionValidation = validateTopicSelection(config);

    if (!selectionValidation.ok) {
      return jsonError(selectionValidation.error, 400);
    }

    const uniqueTopicKeys = Array.from(new Set(config.topicKeys));
    const catalog = getMainCategoryCatalog(config.mainCategory);
    const mainCategoryLabel =
      catalog?.label ?? config.mainCategory.toUpperCase();
    const previouslyUsedGuardKeys = await fetchPreviouslyUsedQuestionGuardKeys(
      supabase,
      user.id,
      config.mainCategory,
    );

    if (config.selectedDifficulty === "adaptive") {
      if (
        config.mainCategory === "english" &&
        uniqueTopicKeys.includes("comprehension")
      ) {
        return jsonError(
          "Adaptive custom tests do not include English comprehension. Please choose vocabulary, spelling, grammar, or punctuation for adaptive English practice.",
          400,
        );
      }

      const adaptivePools = await buildAdaptiveQuestionPools({
        supabase,
        config,
        uniqueTopicKeys,
        previouslyUsedGuardKeys,
      });

      if (adaptivePools.medium.length === 0) {
        return jsonError(
          "No medium questions were found for the selected adaptive custom test setup.",
          400,
        );
      }

      if (countAdaptivePoolQuestions(adaptivePools) < config.questionCount) {
        return jsonError(
          `Only ${countAdaptivePoolQuestions(adaptivePools)} questions are currently available for this adaptive setup. Please reduce the question count or choose more topics.`,
          400,
        );
      }

      return NextResponse.json(buildAdaptiveResponse(config, adaptivePools));
    }

    const normalSelectedDifficulty = config.selectedDifficulty as DifficultyFilter;
    const normalConfig = {
      ...config,
      selectedDifficulty: normalSelectedDifficulty,
    } as GenerateCustomTestRequest;

    if (config.mainCategory === "english") {
      const isComprehensionOnly =
        uniqueTopicKeys.length === 1 && uniqueTopicKeys[0] === "comprehension";

      if (isComprehensionOnly) {
        if (config.questionCount % 10 !== 0) {
          return jsonError(
            "Comprehension custom tests must use question counts in multiples of 10.",
            400,
          );
        }

        const rows = await fetchComprehensionQuestionRowsForDifficulty(
          supabase,
          normalSelectedDifficulty,
        );

        const selectedRows = selectComprehensionRowsByFullPassage(
          rows,
          config.questionCount,
          previouslyUsedGuardKeys,
        );

        if (selectedRows.length < config.questionCount) {
          return jsonError(
            `Only ${selectedRows.length} comprehension questions are currently available as complete passages for this setup. Please reduce the question count or change difficulty.`,
            400,
          );
        }

        const passagesByTestId = await fetchEnglishPassages(
          supabase,
          Array.from(
            new Set(
              selectedRows
                .map((row) => row.test_id)
                .filter((id): id is number => typeof id === "number"),
            ),
          ),
        );

        const finalQuestions = normalizeEnglishQuestions(
          selectedRows,
          "comprehension",
          passagesByTestId,
        );

        const response: GenerateCustomTestResponse = {
          ok: true,
          data: {
            testSessionId: crypto.randomUUID(),
            config: normalConfig,
            questions: finalQuestions,
            createdAt: new Date().toISOString(),
          },
        };

        return NextResponse.json(response);
      }

      const topicTargets = distributeCounts(
        config.questionCount,
        uniqueTopicKeys.length,
      );

      const targetByTopic = new Map<string, number>(
        uniqueTopicKeys.map((topicKey, index) => [
          topicKey,
          topicTargets[index] ?? 0,
        ]),
      );

      const needsWords =
        uniqueTopicKeys.includes("vocabulary") ||
        uniqueTopicKeys.includes("spelling");

      const words = needsWords
        ? (await fetchWords(supabase)).filter((row) =>
            matchesDifficulty(row.difficulty, normalSelectedDifficulty),
          )
        : [];

      const topicPools: TopicPool[] = [];

      for (const topicKey of uniqueTopicKeys) {
        if (topicKey === "vocabulary") {
          const questions = normalizeVocabularyQuestions(words);
          topicPools.push({ topicKey, questions });
          continue;
        }

        if (topicKey === "spelling") {
          const questions = normalizeSpellingQuestions(words);
          topicPools.push({ topicKey, questions });
          continue;
        }

        if (
          topicKey === "comprehension" ||
          topicKey === "grammar" ||
          topicKey === "punctuation"
        ) {
          const selectedSubtopics = Array.isArray(config.subtopicMap[topicKey])
            ? config.subtopicMap[topicKey].filter(
                (value): value is string => typeof value === "string",
              )
            : [];

          if (topicKey === "comprehension") {
            const rows = await fetchComprehensionQuestionRowsForDifficulty(
              supabase,
              normalSelectedDifficulty,
            );

            const requestedForComprehension =
              targetByTopic.get(topicKey) ?? config.questionCount;

            const requestedComprehensionBlockCount =
              requestedForComprehension > 0 ? 10 : 0;

            const selectedRows = selectComprehensionRowsByFullPassage(
              rows,
              requestedComprehensionBlockCount,
              previouslyUsedGuardKeys,
            );

            const passagesByTestId = await fetchEnglishPassages(
              supabase,
              Array.from(
                new Set(
                  selectedRows
                    .map((row) => row.test_id)
                    .filter((id): id is number => typeof id === "number"),
                ),
              ),
            );

            const questions = normalizeEnglishQuestions(
              selectedRows,
              topicKey,
              passagesByTestId,
            );

            topicPools.push({ topicKey, questions });
            continue;
          }

          const rows = await fetchEnglishTopicQuestionRowsForDifficulty(
            supabase,
            topicKey,
            selectedSubtopics,
            normalSelectedDifficulty,
          );

          const questions = normalizeEnglishQuestions(
            rows,
            topicKey,
            new Map<number, string>(),
          );

          topicPools.push({ topicKey, questions });
          continue;
        }

        return jsonError(`Topic "${topicKey}" is not supported yet.`, 400);
      }

      const totalAvailable = topicPools.reduce(
        (sum, pool) => sum + pool.questions.length,
        0,
      );

      if (totalAvailable === 0) {
        return jsonError(
          "No questions were found for the selected English topics.",
          400,
        );
      }

      const finalQuestions = selectFinalEnglishQuestions(
        topicPools,
        config.questionCount,
        previouslyUsedGuardKeys,
      );

      if (finalQuestions.length < config.questionCount) {
        return jsonError(
          `Only ${finalQuestions.length} questions are currently available for this custom test setup. Please reduce the question count, change difficulty, or choose more topics.`,
          400,
        );
      }

      const response: GenerateCustomTestResponse = {
        ok: true,
        data: {
          testSessionId: crypto.randomUUID(),
          config: normalConfig,
          questions: finalQuestions,
          createdAt: new Date().toISOString(),
        },
      };

      return NextResponse.json(response);
    }

    const nonEnglishMainCategory =
      config.mainCategory as NonEnglishMainCategory;
    const topicPools: TopicPool[] = [];

    for (const topicKey of uniqueTopicKeys) {
      const questions = await buildStandardTopicQuestions(
        supabase,
        nonEnglishMainCategory,
        topicKey,
        normalSelectedDifficulty,
      );

      topicPools.push({ topicKey, questions });
    }

    const totalAvailable = topicPools.reduce(
      (sum, pool) => sum + pool.questions.length,
      0,
    );

    if (totalAvailable === 0) {
      return jsonError(
        `No questions were found for the selected ${mainCategoryLabel} topics.`,
        400,
      );
    }

    const finalQuestions = selectFinalQuestions(
      topicPools,
      config.questionCount,
      previouslyUsedGuardKeys,
    );

    if (finalQuestions.length < config.questionCount) {
      return jsonError(
        `Only ${finalQuestions.length} questions are currently available for this custom test setup. Please reduce the question count, change difficulty, or choose more topics.`,
        400,
      );
    }

    const response: GenerateCustomTestResponse = {
      ok: true,
      data: {
        testSessionId: crypto.randomUUID(),
        config: normalConfig,
        questions: finalQuestions,
        createdAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while generating custom test.";

    return jsonError(message, 500);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 },
  );
}
