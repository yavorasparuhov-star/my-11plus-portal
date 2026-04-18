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
        description: "Questions from english_questions where main_category = comprehension.",
        enabled: true,
      },
      {
        key: "grammar",
        label: "Grammar",
        mainCategory: "english",
        sourceKind: "english_questions",
        description: "Questions from english_questions where main_category = grammar.",
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
        description: "Questions from english_questions where main_category = punctuation.",
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
    enabled: false,
    topics: [],
  },

  vr: {
    key: "vr",
    label: "VR",
    enabled: false,
    topics: [],
  },

  nvr: {
    key: "nvr",
    label: "NVR",
    enabled: false,
    topics: [],
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