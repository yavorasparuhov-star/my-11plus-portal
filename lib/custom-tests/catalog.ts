import type { MainCategoryCatalog } from "./types"

export const CUSTOM_TEST_CATALOG: Record<
  "english" | "math" | "vr" | "nvr",
  MainCategoryCatalog
> = {
  english: {
    key: "english",
    label: "English",
    enabled: true,
    topics: [
      {
        key: "vocabulary",
        label: "Vocabulary",
        mainCategory: "english",
        sourceKind: "words_vocabulary",
        description: "Build vocabulary multiple-choice questions from words.",
        enabled: true,
      },
      {
        key: "spelling",
        label: "Spelling",
        mainCategory: "english",
        sourceKind: "words_spelling",
        description: "Build spelling multiple-choice questions from words.",
        enabled: true,
      },
      {
        key: "comprehension",
        label: "Comprehension",
        mainCategory: "english",
        sourceKind: "english_questions",
        description:
          "Questions from english_questions where main_category = comprehension.",
        enabled: true,
      },
      {
        key: "grammar",
        label: "Grammar",
        mainCategory: "english",
        sourceKind: "english_questions",
        description:
          "Questions from english_questions where main_category = grammar.",
        enabled: true,
        childSubtopics: [
          {
            key: "primary_word_classes",
            label: "Primary Word Classes",
          },
          {
            key: "sentence_structure_syntax",
            label: "Sentence Structure & Syntax",
          },
        ],
      },
      {
        key: "punctuation",
        label: "Punctuation",
        mainCategory: "english",
        sourceKind: "english_questions",
        description:
          "Questions from english_questions where main_category = punctuation.",
        enabled: true,
        childSubtopics: [
          {
            key: "advanced_punctuation",
            label: "Advanced Punctuation",
          },
          {
            key: "apostrophes",
            label: "Apostrophes",
          },
          {
            key: "comma",
            label: "Comma",
          },
          {
            key: "direct_speech_punctuation",
            label: "Direct Speech Punctuation",
          },
          {
            key: "sentence_punctuation",
            label: "Sentence Punctuation",
          },
        ],
      },
    ],
  },

  math: {
    key: "math",
    label: "Math",
    enabled: true,
    topics: [
      {
        key: "arithmetic",
        label: "Arithmetic",
        mainCategory: "math",
        sourceKind: "math_questions",
        description: "Questions from math_questions for arithmetic topics.",
        enabled: true,
      },
      {
        key: "fractions-decimals-percentages",
        label: "Fractions, Decimals & Percentages",
        mainCategory: "math",
        sourceKind: "math_questions",
        description:
          "Questions from math_questions for fractions, decimals and percentages.",
        enabled: true,
      },
      {
        key: "algebra-reasoning",
        label: "Algebra & Reasoning",
        mainCategory: "math",
        sourceKind: "math_questions",
        description:
          "Questions from math_questions for algebra and reasoning.",
        enabled: true,
      },
      {
        key: "geometry-measurement",
        label: "Geometry & Measurement",
        mainCategory: "math",
        sourceKind: "math_questions",
        description:
          "Questions from math_questions for geometry and measurement.",
        enabled: true,
      },
      {
        key: "ratio-proportion",
        label: "Ratio & Proportion",
        mainCategory: "math",
        sourceKind: "math_questions",
        description:
          "Questions from math_questions for ratio and proportion.",
        enabled: true,
      },
      {
        key: "word-problems",
        label: "Word Problems",
        mainCategory: "math",
        sourceKind: "math_questions",
        description: "Questions from math_questions for mixed word problems.",
        enabled: true,
      },
    ],
  },

  vr: {
    key: "vr",
    label: "VR",
    enabled: true,
    topics: [
      {
        key: "word-relationships",
        label: "Word Relationships",
        mainCategory: "vr",
        sourceKind: "vr_questions",
        description: "Questions from vr_questions for word relationships.",
        enabled: true,
      },
      {
        key: "codes-logic",
        label: "Code & Logic",
        mainCategory: "vr",
        sourceKind: "vr_questions",
        description: "Questions from vr_questions for code and logic.",
        enabled: true,
      },
      {
        key: "sequence-pattern",
        label: "Sequence & Pattern",
        mainCategory: "vr",
        sourceKind: "vr_questions",
        description: "Questions from vr_questions for sequence and pattern.",
        enabled: true,
      },
    ],
  },

  nvr: {
    key: "nvr",
    label: "NVR",
    enabled: true,
    topics: [
      {
        key: "shape-patterns",
        label: "Shape Patterns",
        mainCategory: "nvr",
        sourceKind: "nvr_questions",
        description: "Questions from nvr_questions for shape patterns.",
        enabled: true,
      },
      {
        key: "rotations-reflections",
        label: "Rotations & Reflections",
        mainCategory: "nvr",
        sourceKind: "nvr_questions",
        description:
          "Questions from nvr_questions for rotations and reflections.",
        enabled: true,
      },
      {
        key: "codes-spatial-logic",
        label: "Codes & Spatial Logic",
        mainCategory: "nvr",
        sourceKind: "nvr_questions",
        description:
          "Questions from nvr_questions for codes and spatial logic.",
        enabled: true,
      },
    ],
  },
}

export const CUSTOM_TEST_MAIN_CATEGORIES = Object.values(CUSTOM_TEST_CATALOG)

export function getMainCategoryCatalog(mainCategory: string) {
  if (
    mainCategory !== "english" &&
    mainCategory !== "math" &&
    mainCategory !== "vr" &&
    mainCategory !== "nvr"
  ) {
    return null
  }

  return CUSTOM_TEST_CATALOG[mainCategory]
}

export function getTopicByKey(
  mainCategory: "english" | "math" | "vr" | "nvr",
  topicKey: string
) {
  return CUSTOM_TEST_CATALOG[mainCategory].topics.find(
    (topic) => topic.key === topicKey
  )
}