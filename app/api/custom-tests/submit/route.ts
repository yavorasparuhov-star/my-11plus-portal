import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type {
  GeneratedCustomTest,
  MainCategory,
  OptionKey,
} from "../../../../lib/custom-tests/types"

type OnlineSubmitCustomTestRequest = {
  generatedTest: GeneratedCustomTest
  answers: Record<string, OptionKey | null | undefined>
  timeTakenSeconds: number
}

type PrintableSubmitCustomTestRequest = {
  attemptId: string
  answers: Record<string, OptionKey | null | undefined>
  timeTakenSeconds?: number | null
}

type SubmitCustomTestResponse =
  | {
      ok: true
      attemptId: string
      coinsAwarded: number
    }
  | {
      ok: false
      error: string
    }

type ExistingAttemptRow = {
  id: string
  main_category: MainCategory | null
  status: string | null
  question_count: number | null
  time_limit_seconds: number | null
  correct_answers: number | null
  score_percent: number | null
  completed_at: string | null
}

type ExistingAttemptItemRow = {
  question_index: number
  correct_answer: OptionKey | null
}

function isMainCategory(value: unknown): value is MainCategory {
  return (
    value === "english" ||
    value === "math" ||
    value === "vr" ||
    value === "nvr"
  )
}

function isOptionKey(value: unknown): value is OptionKey {
  return value === "A" || value === "B" || value === "C" || value === "D"
}

function calculateCustomTestCoins(scorePercent: number) {
  if (scorePercent >= 90) return 3
  if (scorePercent >= 75) return 2
  if (scorePercent >= 50) return 1
  return 0
}

function jsonError(error: string, status = 400) {
  return NextResponse.json<SubmitCustomTestResponse>(
    { ok: false, error },
    { status }
  )
}

function getSupabaseClient(authHeader: string) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })
}

function isDownloadedAttemptStatus(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase()

  return normalized.includes("download") || normalized.includes("print")
}

function isAlreadyMarkedAttempt(attempt: ExistingAttemptRow) {
  const normalized = (attempt.status ?? "").toLowerCase()

  return (
    normalized.includes("marked") ||
    normalized === "completed" ||
    Boolean(attempt.completed_at)
  )
}

function validateOnlineBody(
  body: unknown
):
  | { ok: true; data: OnlineSubmitCustomTestRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const request = body as Partial<OnlineSubmitCustomTestRequest>

  if (
    !request.generatedTest ||
    typeof request.generatedTest !== "object" ||
    !request.generatedTest.config ||
    !isMainCategory(request.generatedTest.config.mainCategory) ||
    !Array.isArray(request.generatedTest.questions)
  ) {
    return { ok: false, error: "Invalid generated test payload." }
  }

  if (!request.answers || typeof request.answers !== "object") {
    return { ok: false, error: "Invalid answers payload." }
  }

  if (
    typeof request.timeTakenSeconds !== "number" ||
    request.timeTakenSeconds < 0
  ) {
    return { ok: false, error: "Invalid time taken value." }
  }

  return {
    ok: true,
    data: {
      generatedTest: request.generatedTest,
      answers: request.answers,
      timeTakenSeconds: request.timeTakenSeconds,
    },
  }
}

function validatePrintableBody(
  body: unknown
):
  | { ok: true; data: PrintableSubmitCustomTestRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const request = body as Partial<PrintableSubmitCustomTestRequest>

  if (typeof request.attemptId !== "string" || !request.attemptId.trim()) {
    return { ok: false, error: "Invalid custom test attempt id." }
  }

  if (!request.answers || typeof request.answers !== "object") {
    return { ok: false, error: "Invalid answers payload." }
  }

  if (
    request.timeTakenSeconds !== undefined &&
    request.timeTakenSeconds !== null &&
    (typeof request.timeTakenSeconds !== "number" || request.timeTakenSeconds < 0)
  ) {
    return { ok: false, error: "Invalid time taken value." }
  }

  return {
    ok: true,
    data: {
      attemptId: request.attemptId.trim(),
      answers: request.answers,
      timeTakenSeconds: request.timeTakenSeconds ?? null,
    },
  }
}

function sanitizeAnswersByRunnerId(answers: Record<string, unknown>) {
  const safeAnswers: Record<string, OptionKey> = {}

  for (const [runnerId, answer] of Object.entries(answers)) {
    if (isOptionKey(answer)) {
      safeAnswers[runnerId] = answer
    }
  }

  return safeAnswers
}

function sanitizeAnswersByQuestionIndex(answers: Record<string, unknown>) {
  const safeAnswers: Record<number, OptionKey | null> = {}

  for (const [questionIndex, answer] of Object.entries(answers)) {
    const parsedQuestionIndex = Number(questionIndex)

    if (!Number.isInteger(parsedQuestionIndex) || parsedQuestionIndex < 0) {
      continue
    }

    safeAnswers[parsedQuestionIndex] = isOptionKey(answer) ? answer : null
  }

  return safeAnswers
}

async function awardCustomTestCoins({
  supabase,
  userId,
  amount,
  attemptId,
}: {
  supabase: ReturnType<typeof getSupabaseClient>
  userId: string
  amount: number
  attemptId: string
}) {
  if (amount <= 0) return

  const { error: coinsError } = await supabase.rpc("award_yanbo_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: "custom_test_score_reward",
    p_source_type: "custom_test_attempt",
    p_source_id: attemptId,
  })

  if (coinsError) {
    console.error("Could not award YanBo Coins:", coinsError.message)
  }
}

async function submitOnlineCustomTest({
  supabase,
  userId,
  data,
}: {
  supabase: ReturnType<typeof getSupabaseClient>
  userId: string
  data: OnlineSubmitCustomTestRequest
}) {
  const { generatedTest, answers, timeTakenSeconds } = data

  if (!generatedTest.questions.length) {
    return jsonError("Generated test does not contain any questions.", 400)
  }

  const safeAnswers = sanitizeAnswersByRunnerId(answers)
  const questionCount = generatedTest.questions.length

  const correctAnswers = generatedTest.questions.reduce((total, question) => {
    return (
      total +
      (safeAnswers[question.runnerId] === question.correctAnswer ? 1 : 0)
    )
  }, 0)

  const scorePercent =
    questionCount > 0
      ? Number(((correctAnswers / questionCount) * 100).toFixed(2))
      : 0

  const coinsAwarded = calculateCustomTestCoins(scorePercent)

  const timeLimitSeconds = generatedTest.config.totalTimeMinutes * 60
  const completedAt = new Date().toISOString()

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
    .single()

  if (attemptError || !attempt) {
    return jsonError(
      attemptError?.message ?? "Could not save custom test attempt.",
      500
    )
  }

  const itemRows = generatedTest.questions.map((question, index) => {
    const selectedAnswer = safeAnswers[question.runnerId] ?? null

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
    }
  })

  const { error: itemsError } = await supabase
    .from("custom_test_attempt_items")
    .insert(itemRows)

  if (itemsError) {
    await supabase.from("custom_test_attempts").delete().eq("id", attempt.id)

    return jsonError(
      itemsError.message ?? "Could not save custom test attempt items.",
      500
    )
  }

  await awardCustomTestCoins({
    supabase,
    userId,
    amount: coinsAwarded,
    attemptId: attempt.id,
  })

  return NextResponse.json<SubmitCustomTestResponse>({
    ok: true,
    attemptId: attempt.id,
    coinsAwarded,
  })
}

async function submitPrintableCustomTestResults({
  supabase,
  userId,
  data,
}: {
  supabase: ReturnType<typeof getSupabaseClient>
  userId: string
  data: PrintableSubmitCustomTestRequest
}) {
  const { attemptId, answers, timeTakenSeconds } = data

  const { data: attemptData, error: attemptError } = await supabase
    .from("custom_test_attempts")
    .select(
      `
      id,
      main_category,
      status,
      question_count,
      time_limit_seconds,
      correct_answers,
      score_percent,
      completed_at
      `
    )
    .eq("id", attemptId)
    .single()

  if (attemptError || !attemptData) {
    return jsonError(
      attemptError?.message ?? "Could not load the downloaded custom test.",
      404
    )
  }

  const attempt = attemptData as ExistingAttemptRow

  if (!isDownloadedAttemptStatus(attempt.status)) {
    return jsonError(
      "Only downloaded printable custom tests can be marked with this option.",
      400
    )
  }

  if (isAlreadyMarkedAttempt(attempt)) {
    return jsonError("This printable custom test has already been marked.", 409)
  }

  const { data: itemData, error: itemError } = await supabase
    .from("custom_test_attempt_items")
    .select(
      `
      question_index,
      correct_answer
      `
    )
    .eq("attempt_id", attemptId)
    .order("question_index", { ascending: true })

  if (itemError) {
    return jsonError(
      itemError.message ?? "Could not load printable custom test questions.",
      500
    )
  }

  const items = (itemData ?? []) as ExistingAttemptItemRow[]

  if (!items.length) {
    return jsonError("This printable custom test does not contain any questions.", 400)
  }

  const safeAnswers = sanitizeAnswersByQuestionIndex(answers)
  const questionCount = items.length

  let correctAnswers = 0

  for (const item of items) {
    const selectedAnswer = safeAnswers[item.question_index] ?? null
    const isCorrect =
      isOptionKey(selectedAnswer) && selectedAnswer === item.correct_answer

    if (isCorrect) {
      correctAnswers += 1
    }

    const { error: updateItemError } = await supabase
      .from("custom_test_attempt_items")
      .update({
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      })
      .eq("attempt_id", attemptId)
      .eq("question_index", item.question_index)

    if (updateItemError) {
      return jsonError(
        updateItemError.message ?? "Could not save printable answer results.",
        500
      )
    }
  }

  const scorePercent = Number(((correctAnswers / questionCount) * 100).toFixed(2))
  const coinsAwarded = calculateCustomTestCoins(scorePercent)
  const completedAt = new Date().toISOString()

  const updatePayload: Record<string, unknown> = {
    question_count: attempt.question_count ?? questionCount,
    correct_answers: correctAnswers,
    score_percent: scorePercent,
    completed_at: completedAt,
  }

  if (typeof timeTakenSeconds === "number") {
    updatePayload.time_taken_seconds =
      typeof attempt.time_limit_seconds === "number"
        ? Math.min(timeTakenSeconds, attempt.time_limit_seconds)
        : timeTakenSeconds
  }

  const { error: updateAttemptError } = await supabase
    .from("custom_test_attempts")
    .update(updatePayload)
    .eq("id", attemptId)

  if (updateAttemptError) {
    return jsonError(
      updateAttemptError.message ?? "Could not update printable custom test result.",
      500
    )
  }

  await awardCustomTestCoins({
    supabase,
    userId,
    amount: coinsAwarded,
    attemptId,
  })

  return NextResponse.json<SubmitCustomTestResponse>({
    ok: true,
    attemptId,
    coinsAwarded,
  })
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError("Missing or invalid authorization header.", 401)
    }

    const accessToken = authHeader.replace("Bearer ", "").trim()

    if (!accessToken) {
      return jsonError("Missing access token.", 401)
    }

    const supabase = getSupabaseClient(authHeader)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return jsonError("Could not verify the logged-in user.", 401)
    }

    const { data: hasPaidAccess, error: accessError } =
      await supabase.rpc("has_paid_access")

    if (accessError) {
      return jsonError("Could not check your membership access.", 500)
    }

    if (!hasPaidAccess) {
      return jsonError(
        "Custom tests are available for monthly and annual members only.",
        403
      )
    }

    const body = await request.json()

    if (body && typeof body === "object" && "attemptId" in body) {
      const validatedPrintable = validatePrintableBody(body)

      if (!validatedPrintable.ok) {
        return jsonError(validatedPrintable.error, 400)
      }

      return submitPrintableCustomTestResults({
        supabase,
        userId: user.id,
        data: validatedPrintable.data,
      })
    }

    const validatedOnline = validateOnlineBody(body)

    if (!validatedOnline.ok) {
      return jsonError(validatedOnline.error, 400)
    }

    return submitOnlineCustomTest({
      supabase,
      userId: user.id,
      data: validatedOnline.data,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Unexpected error while saving custom test.",
      500
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  )
}
