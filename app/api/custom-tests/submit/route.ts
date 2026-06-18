import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  GeneratedCustomTest,
  MainCategory,
  OptionKey,
} from "../../../../lib/custom-tests/types";

type OnlineSubmitCustomTestRequest = {
  generatedTest: GeneratedCustomTest;
  answers: Record<string, OptionKey | null | undefined>;
  timeTakenSeconds: number;
};

type PrintableSubmitCustomTestRequest = {
  attemptId: string;
  answers: Record<string, OptionKey | null | undefined>;
  timeTakenSeconds?: number | null;
};

type SubmitCustomTestResponse =
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

type ExistingAttemptRow = {
  id: string;
  main_category: MainCategory | null;
  status: string | null;
  config: unknown;
  question_count: number | null;
  time_limit_seconds: number | null;
  correct_answers: number | null;
  score_percent: number | null;
  completed_at: string | null;
};

type ExistingAttemptItemRow = {
  question_index: number;
  main_category: MainCategory | null;
  source_type: string | null;
  source_id: string | number | null;
  topic_key: string | null;
  subtopic_key: string | null;
  selected_answer: OptionKey | null;
  correct_answer: OptionKey | null;
  is_correct: boolean | null;
  question_snapshot: unknown;
};

type MathCategory =
  | "number_place_value"
  | "four_operations"
  | "fractions_decimals_percentages"
  | "shape_space"
  | "measurement"
  | "data_handling"
  | "algebra_reasoning";

type MathQuestionLookupRow = {
  id: number;
  test_id: number | null;
  question_text: string | null;
  correct_answer: string | null;
  difficulty: number | null;
};

type EnglishProgressCategory =
  | "vocabulary"
  | "spelling"
  | "comprehension"
  | "primary_word_classes"
  | "sentence_structure_syntax"
  | "advanced_punctuation"
  | "apostrophes"
  | "comma"
  | "direct_speech_punctuation"
  | "sentence_punctuation";

type EnglishQuestionLookupRow = {
  id: number;
  test_id: number | null;
  question_text: string | null;
  correct_answer: string | null;
  difficulty: number | null;
};

type WordLookupRow = {
  id: number;
  word: string | null;
  difficulty: number | null;
};

function isMainCategory(value: unknown): value is MainCategory {
  return (
    value === "english" || value === "math" || value === "vr" || value === "nvr"
  );
}

function isOptionKey(value: unknown): value is OptionKey {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function calculateCustomTestCoins(scorePercent: number) {
  if (scorePercent >= 90) return 3;
  if (scorePercent >= 75) return 2;
  if (scorePercent >= 50) return 1;
  return 0;
}

function jsonError(error: string, status = 400) {
  return NextResponse.json<SubmitCustomTestResponse>(
    { ok: false, error },
    { status },
  );
}

function getSupabaseClient(authHeader: string) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

function isDownloadedAttemptStatus(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();

  return normalized.includes("download") || normalized.includes("print");
}

function extractCorrectAnswerFromSnapshot(snapshot: unknown): OptionKey | null {
  if (!snapshot || typeof snapshot !== "object") return null;

  const raw = snapshot as Record<string, unknown>;
  const value = raw.correctAnswer ?? raw.correct_answer;

  return isOptionKey(value) ? value : null;
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

function normaliseMathCategory(
  value: string | null | undefined,
): MathCategory | null {
  if (!value) return null;

  const clean = value.trim();

  const normalised = clean
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

function extractAttemptDifficulty(config: unknown) {
  if (!config || typeof config !== "object") return null;

  const raw = config as Record<string, unknown>;
  const value = raw.selectedDifficulty;

  if (value === 1 || value === 2 || value === 3) return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed;
    }
  }

  return null;
}

function getItemMathQuestionId(item: ExistingAttemptItemRow) {
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

function normaliseEnglishCategory(
  value: string | null | undefined,
): EnglishProgressCategory | null {
  if (!value) return null;

  const clean = value.trim();

  const normalised = clean
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

  if (normalised === "vocabulary") return "vocabulary";
  if (normalised === "spelling") return "spelling";
  if (normalised === "comprehension") return "comprehension";

  if (normalised === "primary_word_classes") return "primary_word_classes";
  if (normalised === "word_classes") return "primary_word_classes";
  if (normalised === "sentence_structure_syntax") {
    return "sentence_structure_syntax";
  }
  if (normalised === "sentence_structure_and_syntax") {
    return "sentence_structure_syntax";
  }
  if (normalised === "syntax") return "sentence_structure_syntax";

  if (normalised === "advanced_punctuation") return "advanced_punctuation";
  if (normalised === "apostrophes") return "apostrophes";
  if (normalised === "apostrophe") return "apostrophes";
  if (normalised === "comma") return "comma";
  if (normalised === "commas") return "comma";
  if (normalised === "direct_speech_punctuation") {
    return "direct_speech_punctuation";
  }
  if (normalised === "direct_speech") return "direct_speech_punctuation";
  if (normalised === "sentence_punctuation") return "sentence_punctuation";
  if (normalised === "punctuation_sentence") return "sentence_punctuation";
  if (normalised === "sentence") return "sentence_punctuation";

  return null;
}

function getItemEnglishCategory(
  item: ExistingAttemptItemRow,
): EnglishProgressCategory | null {
  return (
    normaliseEnglishCategory(item.subtopic_key) ??
    normaliseEnglishCategory(
      getSnapshotString(item.question_snapshot, [
        "subtopicKey",
        "subtopic_key",
        "subcategory",
        "subCategory",
      ]),
    ) ??
    normaliseEnglishCategory(item.topic_key) ??
    normaliseEnglishCategory(
      getSnapshotString(item.question_snapshot, [
        "topicKey",
        "topic_key",
        "category",
        "mainCategory",
        "main_category",
      ]),
    )
  );
}

function getEnglishSharedReviewMeta(category: EnglishProgressCategory) {
  if (category === "comprehension") {
    return { main_category: "comprehension", subcategory: "comprehension" };
  }

  if (category === "primary_word_classes") {
    return { main_category: "grammar", subcategory: "primary_word_classes" };
  }

  if (category === "sentence_structure_syntax") {
    return {
      main_category: "grammar",
      subcategory: "sentence_structure_syntax",
    };
  }

  if (category === "advanced_punctuation") {
    return {
      main_category: "punctuation",
      subcategory: "advanced_punctuation",
    };
  }

  if (category === "apostrophes") {
    return { main_category: "punctuation", subcategory: "apostrophes" };
  }

  if (category === "comma") {
    return { main_category: "punctuation", subcategory: "comma" };
  }

  if (category === "direct_speech_punctuation") {
    return {
      main_category: "punctuation",
      subcategory: "direct_speech_punctuation",
    };
  }

  if (category === "sentence_punctuation") {
    return {
      main_category: "punctuation",
      subcategory: "sentence_punctuation",
    };
  }

  return null;
}

function getItemEnglishSourceId(item: ExistingAttemptItemRow) {
  const sourceId = parsePositiveInteger(item.source_id);
  const snapshotId = getSnapshotNumber(item.question_snapshot, [
    "sourceId",
    "source_id",
    "id",
    "questionId",
    "question_id",
    "wordId",
    "word_id",
  ]);

  return sourceId ?? parsePositiveInteger(snapshotId);
}

async function syncMathCustomTestProgressAndReview({
  supabase,
  userId,
  attemptId,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  userId: string;
  attemptId: string;
}) {
  const { data: attemptData, error: attemptError } = await supabase
    .from("custom_test_attempts")
    .select("id, main_category, config")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attemptData) {
    console.error(
      "Could not load custom attempt for Maths sync:",
      attemptError,
    );
    return;
  }

  const attempt = attemptData as {
    id: string;
    main_category: MainCategory | null;
    config: unknown;
  };

  if (attempt.main_category !== "math") return;

  const { data: itemData, error: itemError } = await supabase
    .from("custom_test_attempt_items")
    .select(
      `
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
    .eq("attempt_id", attemptId)
    .order("question_index", { ascending: true });

  if (itemError) {
    console.error(
      "Could not load custom attempt items for Maths sync:",
      itemError,
    );
    return;
  }

  const items = (itemData ?? []) as ExistingAttemptItemRow[];

  if (!items.length) return;

  const hasAtLeastOneEnteredAnswer = items.some((item) =>
    isOptionKey(item.selected_answer),
  );

  if (!hasAtLeastOneEnteredAnswer) {
    return;
  }

  const questionIds = Array.from(
    new Set(
      items
        .map((item) => getItemMathQuestionId(item))
        .filter((id): id is number => id !== null),
    ),
  );

  let questionMap = new Map<number, MathQuestionLookupRow>();

  if (questionIds.length > 0) {
    const { data: questionData, error: questionError } = await supabase
      .from("math_questions")
      .select("id, test_id, question_text, correct_answer, difficulty")
      .in("id", questionIds);

    if (questionError) {
      console.error("Could not load Maths question details for custom sync:", {
        message: questionError.message,
        details: questionError.details,
        hint: questionError.hint,
        code: questionError.code,
      });
    } else {
      questionMap = new Map(
        ((questionData ?? []) as MathQuestionLookupRow[]).map((question) => [
          question.id,
          question,
        ]),
      );
    }
  }

  const nowIso = new Date().toISOString();
  const attemptDifficulty = extractAttemptDifficulty(attempt.config);
  const correctQuestionIds: number[] = [];
  const wrongAnswersForReview: Array<Record<string, unknown>> = [];

  for (const item of items) {
    const questionId = getItemMathQuestionId(item);
    const question = questionId !== null ? questionMap.get(questionId) : null;

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
    const questionCorrectAnswer = question?.correct_answer ?? null;
    const correctAnswer =
      item.correct_answer ??
      (isOptionKey(questionCorrectAnswer) ? questionCorrectAnswer : null) ??
      extractCorrectAnswerFromSnapshot(item.question_snapshot);
    const isCorrect =
      selectedAnswer !== null &&
      correctAnswer !== null &&
      selectedAnswer === correctAnswer;
    const difficulty =
      attemptDifficulty ??
      question?.difficulty ??
      getSnapshotNumber(item.question_snapshot, ["difficulty"]) ??
      null;

    if (questionId === null) continue;

    if (isCorrect) {
      correctQuestionIds.push(questionId);
      continue;
    }

    wrongAnswersForReview.push({
      user_id: userId,
      test_id: question?.test_id ?? null,
      question_id: questionId,
      category,
      question_text:
        question?.question_text ??
        getSnapshotString(item.question_snapshot, [
          "questionText",
          "question_text",
          "prompt",
        ]) ??
        "Question text unavailable.",
      user_answer: selectedAnswer,
      correct_answer: correctAnswer,
      difficulty,
      updated_at: nowIso,
      last_attempted_at: nowIso,
    });
  }

  if (correctQuestionIds.length > 0) {
    const { error: removeReviewError } = await supabase
      .from("math_review")
      .delete()
      .eq("user_id", userId)
      .in("question_id", Array.from(new Set(correctQuestionIds)));

    if (removeReviewError) {
      console.error("Could not remove corrected custom Maths review items:", {
        message: removeReviewError.message,
        details: removeReviewError.details,
        hint: removeReviewError.hint,
        code: removeReviewError.code,
      });
    }
  }

  if (wrongAnswersForReview.length > 0) {
    const { error: reviewError } = await supabase
      .from("math_review")
      .upsert(wrongAnswersForReview, {
        onConflict: "user_id,question_id",
      });

    if (reviewError) {
      console.error("Could not save custom Maths review items:", {
        message: reviewError.message,
        details: reviewError.details,
        hint: reviewError.hint,
        code: reviewError.code,
      });
    }
  }
}


async function syncEnglishCustomTestProgressAndReview({
  supabase,
  userId,
  attemptId,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  userId: string;
  attemptId: string;
}) {
  const { data: attemptData, error: attemptError } = await supabase
    .from("custom_test_attempts")
    .select("id, main_category, config")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attemptData) {
    console.error(
      "Could not load custom attempt for English sync:",
      attemptError,
    );
    return;
  }

  const attempt = attemptData as {
    id: string;
    main_category: MainCategory | null;
    config: unknown;
  };

  if (attempt.main_category !== "english") return;

  const { data: itemData, error: itemError } = await supabase
    .from("custom_test_attempt_items")
    .select(
      `
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
    .eq("attempt_id", attemptId)
    .order("question_index", { ascending: true });

  if (itemError) {
    console.error(
      "Could not load custom attempt items for English sync:",
      itemError,
    );
    return;
  }

  const items = (itemData ?? []) as ExistingAttemptItemRow[];

  if (!items.length) return;

  const hasAtLeastOneEnteredAnswer = items.some((item) =>
    isOptionKey(item.selected_answer),
  );

  if (!hasAtLeastOneEnteredAnswer) {
    return;
  }

  const wordSourceIds = Array.from(
    new Set(
      items
        .filter((item) => {
          const category = getItemEnglishCategory(item);
          return category === "vocabulary" || category === "spelling";
        })
        .map((item) => getItemEnglishSourceId(item))
        .filter((id): id is number => id !== null),
    ),
  );

  const questionSourceIds = Array.from(
    new Set(
      items
        .filter((item) => {
          const category = getItemEnglishCategory(item);
          return (
            category !== null &&
            category !== "vocabulary" &&
            category !== "spelling"
          );
        })
        .map((item) => getItemEnglishSourceId(item))
        .filter((id): id is number => id !== null),
    ),
  );

  let wordMap = new Map<number, WordLookupRow>();
  let questionMap = new Map<number, EnglishQuestionLookupRow>();

  if (wordSourceIds.length > 0) {
    const { data: wordData, error: wordError } = await supabase
      .from("words")
      .select("id, word, difficulty")
      .in("id", wordSourceIds);

    if (wordError) {
      console.error("Could not load English word details for custom sync:", {
        message: wordError.message,
        details: wordError.details,
        hint: wordError.hint,
        code: wordError.code,
      });
    } else {
      wordMap = new Map(
        ((wordData ?? []) as WordLookupRow[]).map((word) => [word.id, word]),
      );
    }
  }

  if (questionSourceIds.length > 0) {
    const { data: questionData, error: questionError } = await supabase
      .from("english_questions")
      .select("id, test_id, question_text, correct_answer, difficulty")
      .in("id", questionSourceIds);

    if (questionError) {
      console.error("Could not load English question details for custom sync:", {
        message: questionError.message,
        details: questionError.details,
        hint: questionError.hint,
        code: questionError.code,
      });
    } else {
      questionMap = new Map(
        ((questionData ?? []) as EnglishQuestionLookupRow[]).map((question) => [
          question.id,
          question,
        ]),
      );
    }
  }

  const nowIso = new Date().toISOString();
  const attemptDifficulty = extractAttemptDifficulty(attempt.config);

  const vocabularyWordIdsToClear: number[] = [];
  const spellingWordIdsToClear: number[] = [];
  const englishQuestionIdsToClear: number[] = [];

  const vocabularyRowsForReview: Array<Record<string, unknown>> = [];
  const spellingRowsForReview: Array<Record<string, unknown>> = [];
  const englishRowsForReview: Array<Record<string, unknown>> = [];

  for (const item of items) {
    const category = getItemEnglishCategory(item);
    if (!category) continue;

    const selectedAnswer = isOptionKey(item.selected_answer)
      ? item.selected_answer
      : null;
    const sourceId = getItemEnglishSourceId(item);

    const correctAnswer =
      item.correct_answer ?? extractCorrectAnswerFromSnapshot(item.question_snapshot);
    const isCorrect =
      selectedAnswer !== null &&
      correctAnswer !== null &&
      selectedAnswer === correctAnswer;

    if (category === "vocabulary" || category === "spelling") {
      if (sourceId === null) continue;

      const word = wordMap.get(sourceId);
      const wordText =
        word?.word ??
        getSnapshotString(item.question_snapshot, [
          "word",
          "answer",
          "correctAnswerText",
          "correct_answer_text",
          "questionText",
          "question_text",
        ]) ??
        "Word unavailable";
      const difficulty =
        attemptDifficulty ??
        word?.difficulty ??
        getSnapshotNumber(item.question_snapshot, ["difficulty"]) ??
        null;

      if (category === "vocabulary") {
        vocabularyWordIdsToClear.push(sourceId);

        if (!isCorrect) {
          vocabularyRowsForReview.push({
            user_id: userId,
            word_id: sourceId,
            word: wordText,
            knew_it: false,
            difficulty,
            updated_at: nowIso,
            last_attempted_at: nowIso,
          });
        }
      } else {
        spellingWordIdsToClear.push(sourceId);

        if (!isCorrect) {
          spellingRowsForReview.push({
            user_id: userId,
            word_id: sourceId,
            word: wordText,
            knew_it: false,
            difficulty,
            updated_at: nowIso,
            last_attempted_at: nowIso,
          });
        }
      }

      continue;
    }

    if (sourceId === null) continue;

    const question = questionMap.get(sourceId);
    const questionCorrectAnswer =
      question?.correct_answer && isOptionKey(question.correct_answer)
        ? question.correct_answer
        : null;
    const finalCorrectAnswer = correctAnswer ?? questionCorrectAnswer;

    if (!finalCorrectAnswer) continue;

    englishQuestionIdsToClear.push(sourceId);

    if (isCorrect) {
      continue;
    }

    const reviewMeta = getEnglishSharedReviewMeta(category);
    if (!reviewMeta) continue;

    englishRowsForReview.push({
      user_id: userId,
      test_id: question?.test_id ?? null,
      question_id: sourceId,
      main_category: reviewMeta.main_category,
      subcategory: reviewMeta.subcategory,
      question_text:
        question?.question_text ??
        getSnapshotString(item.question_snapshot, [
          "questionText",
          "question_text",
          "prompt",
          "text",
        ]) ??
        "Question text unavailable.",
      user_answer: selectedAnswer,
      correct_answer: finalCorrectAnswer,
      difficulty:
        attemptDifficulty ??
        question?.difficulty ??
        getSnapshotNumber(item.question_snapshot, ["difficulty"]) ??
        null,
      updated_at: nowIso,
      last_attempted_at: nowIso,
    });
  }

  const uniqueVocabularyWordIds = Array.from(new Set(vocabularyWordIdsToClear));
  const uniqueSpellingWordIds = Array.from(new Set(spellingWordIdsToClear));
  const uniqueEnglishQuestionIds = Array.from(new Set(englishQuestionIdsToClear));

  if (uniqueVocabularyWordIds.length > 0) {
    const { error } = await supabase
      .from("vocabulary_review")
      .delete()
      .eq("user_id", userId)
      .in("word_id", uniqueVocabularyWordIds);

    if (error) {
      console.error("Could not clear custom Vocabulary review items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  }

  if (uniqueSpellingWordIds.length > 0) {
    const { error } = await supabase
      .from("spelling_review")
      .delete()
      .eq("user_id", userId)
      .in("word_id", uniqueSpellingWordIds);

    if (error) {
      console.error("Could not clear custom Spelling review items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  }

  if (uniqueEnglishQuestionIds.length > 0) {
    const { error } = await supabase
      .from("english_review")
      .delete()
      .eq("user_id", userId)
      .in("question_id", uniqueEnglishQuestionIds);

    if (error) {
      console.error("Could not clear custom English review items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  }

  if (vocabularyRowsForReview.length > 0) {
    const { error } = await supabase
      .from("vocabulary_review")
      .insert(vocabularyRowsForReview);

    if (error) {
      console.error("Could not save custom Vocabulary review items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  }

  if (spellingRowsForReview.length > 0) {
    const { error } = await supabase
      .from("spelling_review")
      .insert(spellingRowsForReview);

    if (error) {
      console.error("Could not save custom Spelling review items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  }

  if (englishRowsForReview.length > 0) {
    const { error } = await supabase
      .from("english_review")
      .insert(englishRowsForReview);

    if (error) {
      console.error("Could not save custom English review items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  }
}

async function syncCustomTestProgressAndReview({
  supabase,
  userId,
  attemptId,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  userId: string;
  attemptId: string;
}) {
  await syncMathCustomTestProgressAndReview({ supabase, userId, attemptId });
  await syncEnglishCustomTestProgressAndReview({ supabase, userId, attemptId });
}

function validateOnlineBody(
  body: unknown,
):
  | { ok: true; data: OnlineSubmitCustomTestRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const request = body as Partial<OnlineSubmitCustomTestRequest>;

  if (
    !request.generatedTest ||
    typeof request.generatedTest !== "object" ||
    !request.generatedTest.config ||
    !isMainCategory(request.generatedTest.config.mainCategory) ||
    !Array.isArray(request.generatedTest.questions)
  ) {
    return { ok: false, error: "Invalid generated test payload." };
  }

  if (!request.answers || typeof request.answers !== "object") {
    return { ok: false, error: "Invalid answers payload." };
  }

  if (
    typeof request.timeTakenSeconds !== "number" ||
    request.timeTakenSeconds < 0
  ) {
    return { ok: false, error: "Invalid time taken value." };
  }

  return {
    ok: true,
    data: {
      generatedTest: request.generatedTest,
      answers: request.answers,
      timeTakenSeconds: request.timeTakenSeconds,
    },
  };
}

function validatePrintableBody(
  body: unknown,
):
  | { ok: true; data: PrintableSubmitCustomTestRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const request = body as Partial<PrintableSubmitCustomTestRequest>;

  if (typeof request.attemptId !== "string" || !request.attemptId.trim()) {
    return { ok: false, error: "Invalid custom test attempt id." };
  }

  if (!request.answers || typeof request.answers !== "object") {
    return { ok: false, error: "Invalid answers payload." };
  }

  if (
    request.timeTakenSeconds !== undefined &&
    request.timeTakenSeconds !== null &&
    (typeof request.timeTakenSeconds !== "number" ||
      request.timeTakenSeconds < 0)
  ) {
    return { ok: false, error: "Invalid time taken value." };
  }

  return {
    ok: true,
    data: {
      attemptId: request.attemptId.trim(),
      answers: request.answers,
      timeTakenSeconds: request.timeTakenSeconds ?? null,
    },
  };
}

function sanitizeAnswersByRunnerId(answers: Record<string, unknown>) {
  const safeAnswers: Record<string, OptionKey> = {};

  for (const [runnerId, answer] of Object.entries(answers)) {
    if (isOptionKey(answer)) {
      safeAnswers[runnerId] = answer;
    }
  }

  return safeAnswers;
}

function sanitizeAnswersByQuestionIndex(answers: Record<string, unknown>) {
  const safeAnswers: Record<number, OptionKey | null> = {};

  for (const [questionIndex, answer] of Object.entries(answers)) {
    const parsedQuestionIndex = Number(questionIndex);

    if (!Number.isInteger(parsedQuestionIndex) || parsedQuestionIndex < 0) {
      continue;
    }

    safeAnswers[parsedQuestionIndex] = isOptionKey(answer) ? answer : null;
  }

  return safeAnswers;
}

async function awardCustomTestCoins({
  supabase,
  userId,
  amount,
  attemptId,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  userId: string;
  amount: number;
  attemptId: string;
}) {
  if (amount <= 0) return;

  const { error: coinsError } = await supabase.rpc("award_yanbo_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: "custom_test_score_reward",
    p_source_type: "custom_test_attempt",
    p_source_id: attemptId,
  });

  if (coinsError) {
    console.error("Could not award YanBo Coins:", coinsError.message);
  }
}

async function submitOnlineCustomTest({
  supabase,
  userId,
  data,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  userId: string;
  data: OnlineSubmitCustomTestRequest;
}) {
  const { generatedTest, answers, timeTakenSeconds } = data;

  if (!generatedTest.questions.length) {
    return jsonError("Generated test does not contain any questions.", 400);
  }

  const safeAnswers = sanitizeAnswersByRunnerId(answers);
  const questionCount = generatedTest.questions.length;

  const correctAnswers = generatedTest.questions.reduce((total, question) => {
    return (
      total +
      (safeAnswers[question.runnerId] === question.correctAnswer ? 1 : 0)
    );
  }, 0);

  const scorePercent =
    questionCount > 0
      ? Number(((correctAnswers / questionCount) * 100).toFixed(2))
      : 0;

  const coinsAwarded = calculateCustomTestCoins(scorePercent);

  const timeLimitSeconds = generatedTest.config.totalTimeMinutes * 60;
  const completedAt = new Date().toISOString();

  const { data: attempt, error: attemptError } = await supabase
    .from("custom_test_attempts")
    .insert({
      user_id: userId,
      main_category: generatedTest.config.mainCategory,
      status: "completed",
      config: generatedTest.config,
      question_count: questionCount,
      time_limit_seconds: timeLimitSeconds,
      time_taken_seconds: Math.min(timeTakenSeconds, timeLimitSeconds),
      correct_answers: correctAnswers,
      score_percent: scorePercent,
      started_at: generatedTest.createdAt,
      completed_at: completedAt,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return jsonError(
      attemptError?.message ?? "Could not save custom test attempt.",
      500,
    );
  }

  const itemRows = generatedTest.questions.map((question, index) => {
    const selectedAnswer = safeAnswers[question.runnerId] ?? null;

    return {
      attempt_id: attempt.id,
      user_id: userId,
      question_index: index,
      main_category: generatedTest.config.mainCategory,
      source_type: question.sourceType,
      source_id: String(question.sourceId),
      topic_key: question.topicKey,
      subtopic_key: question.subtopicKey ?? null,
      question_snapshot: question,
      selected_answer: selectedAnswer,
      correct_answer: question.correctAnswer,
      is_correct: selectedAnswer === question.correctAnswer,
    };
  });

  const { error: itemsError } = await supabase
    .from("custom_test_attempt_items")
    .insert(itemRows);

  if (itemsError) {
    await supabase.from("custom_test_attempts").delete().eq("id", attempt.id);

    return jsonError(
      itemsError.message ?? "Could not save custom test attempt items.",
      500,
    );
  }

  await syncCustomTestProgressAndReview({
    supabase,
    userId,
    attemptId: attempt.id,
  });

  await awardCustomTestCoins({
    supabase,
    userId,
    amount: coinsAwarded,
    attemptId: attempt.id,
  });

  return NextResponse.json<SubmitCustomTestResponse>({
    ok: true,
    attemptId: attempt.id,
    coinsAwarded,
    correctAnswers,
    questionCount,
    scorePercent,
  });
}

async function submitPrintableCustomTestResults({
  supabase,
  userId,
  data,
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  userId: string;
  data: PrintableSubmitCustomTestRequest;
}) {
  const { attemptId, answers, timeTakenSeconds } = data;

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
      correct_answers,
      score_percent,
      completed_at
      `,
    )
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attemptData) {
    return jsonError(
      attemptError?.message ?? "Could not load the downloaded custom test.",
      404,
    );
  }

  const attempt = attemptData as ExistingAttemptRow;

  if (!isDownloadedAttemptStatus(attempt.status)) {
    return jsonError(
      "Only downloaded printable custom tests can be marked with this option.",
      400,
    );
  }

  const { data: itemData, error: itemError } = await supabase
    .from("custom_test_attempt_items")
    .select(
      `
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
    .eq("attempt_id", attemptId)
    .order("question_index", { ascending: true });

  if (itemError) {
    return jsonError(
      itemError.message ?? "Could not load printable custom test questions.",
      500,
    );
  }

  const items = (itemData ?? []) as ExistingAttemptItemRow[];

  if (!items.length) {
    return jsonError(
      "This printable custom test does not contain any questions.",
      400,
    );
  }

  const safeAnswers = sanitizeAnswersByQuestionIndex(answers);
  const questionCount = items.length;

  let correctAnswers = 0;

  for (const item of items) {
    const selectedAnswer = safeAnswers[item.question_index] ?? null;
    const correctAnswer =
      item.correct_answer ??
      extractCorrectAnswerFromSnapshot(item.question_snapshot);

    const isCorrect =
      isOptionKey(selectedAnswer) &&
      isOptionKey(correctAnswer) &&
      selectedAnswer === correctAnswer;

    if (isCorrect) {
      correctAnswers += 1;
    }

    const { error: updateItemError } = await supabase
      .from("custom_test_attempt_items")
      .update({
        selected_answer: selectedAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
      })
      .eq("attempt_id", attemptId)
      .eq("question_index", item.question_index);

    if (updateItemError) {
      return jsonError(
        updateItemError.message ?? "Could not save printable answer results.",
        500,
      );
    }
  }

  const scorePercent = Number(
    ((correctAnswers / questionCount) * 100).toFixed(2),
  );
  const coinsAwarded = calculateCustomTestCoins(scorePercent);
  const completedAt = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    question_count: attempt.question_count ?? questionCount,
    correct_answers: correctAnswers,
    score_percent: scorePercent,
    completed_at: completedAt,
  };

  if (typeof timeTakenSeconds === "number") {
    updatePayload.time_taken_seconds =
      typeof attempt.time_limit_seconds === "number"
        ? Math.min(timeTakenSeconds, attempt.time_limit_seconds)
        : timeTakenSeconds;
  }

  const { error: updateAttemptError } = await supabase
    .from("custom_test_attempts")
    .update(updatePayload)
    .eq("id", attemptId)
    .eq("user_id", userId);

  if (updateAttemptError) {
    return jsonError(
      updateAttemptError.message ??
        "Could not update printable custom test result.",
      500,
    );
  }

  await syncCustomTestProgressAndReview({
    supabase,
    userId,
    attemptId,
  });

  await awardCustomTestCoins({
    supabase,
    userId,
    amount: coinsAwarded,
    attemptId,
  });

  return NextResponse.json<SubmitCustomTestResponse>({
    ok: true,
    attemptId,
    coinsAwarded,
    correctAnswers,
    questionCount,
    scorePercent,
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError("Missing or invalid authorization header.", 401);
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return jsonError("Missing access token.", 401);
    }

    const supabase = getSupabaseClient(authHeader);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonError("Could not verify the logged-in user.", 401);
    }

    const { data: hasPaidAccess, error: accessError } =
      await supabase.rpc("has_paid_access");

    if (accessError) {
      return jsonError("Could not check your membership access.", 500);
    }

    if (!hasPaidAccess) {
      return jsonError(
        "Custom tests are available for monthly and annual members only.",
        403,
      );
    }

    const body = await request.json();

    if (body && typeof body === "object" && "attemptId" in body) {
      const validatedPrintable = validatePrintableBody(body);

      if (!validatedPrintable.ok) {
        return jsonError(validatedPrintable.error, 400);
      }

      return submitPrintableCustomTestResults({
        supabase,
        userId: user.id,
        data: validatedPrintable.data,
      });
    }

    const validatedOnline = validateOnlineBody(body);

    if (!validatedOnline.ok) {
      return jsonError(validatedOnline.error, 400);
    }

    return submitOnlineCustomTest({
      supabase,
      userId: user.id,
      data: validatedOnline.data,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Unexpected error while saving custom test.",
      500,
    );
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
