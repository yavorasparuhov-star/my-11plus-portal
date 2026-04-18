import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type {
  GeneratedCustomTest,
  MainCategory,
  OptionKey,
} from "../../../../lib/custom-tests/types"

type SubmitCustomTestRequest = {
  generatedTest: GeneratedCustomTest
  answers: Record<string, OptionKey | null | undefined>
  timeTakenSeconds: number
}

type SubmitCustomTestResponse =
  | {
      ok: true
      attemptId: string
    }
  | {
      ok: false
      error: string
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

function validateBody(
  body: unknown
): { ok: true; data: SubmitCustomTestRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const request = body as Partial<SubmitCustomTestRequest>

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

    const body = await request.json()
    const validated = validateBody(body)

    if (!validated.ok) {
      return jsonError(validated.error, 400)
    }

    const { generatedTest, answers, timeTakenSeconds } = validated.data

    if (generatedTest.config.mainCategory !== "english") {
      return jsonError("Only English custom tests are enabled in this first MVP.", 400)
    }

    if (!generatedTest.questions.length) {
      return jsonError("Generated test does not contain any questions.", 400)
    }

    const supabase = getSupabaseClient(authHeader)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return jsonError("Could not verify the logged-in user.", 401)
    }

    const safeAnswers: Record<string, OptionKey> = {}

    for (const [runnerId, answer] of Object.entries(answers)) {
      if (isOptionKey(answer)) {
        safeAnswers[runnerId] = answer
      }
    }

    const questionCount = generatedTest.questions.length
    const correctAnswers = generatedTest.questions.reduce((total, question) => {
      return total + (safeAnswers[question.runnerId] === question.correctAnswer ? 1 : 0)
    }, 0)

    const scorePercent =
      questionCount > 0
        ? Number(((correctAnswers / questionCount) * 100).toFixed(2))
        : 0

    const timeLimitSeconds = generatedTest.config.totalTimeMinutes * 60
    const completedAt = new Date().toISOString()

    const { data: attempt, error: attemptError } = await supabase
      .from("custom_test_attempts")
      .insert({
        user_id: user.id,
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
        user_id: user.id,
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
      await supabase
        .from("custom_test_attempts")
        .delete()
        .eq("id", attempt.id)

      return jsonError(
        itemsError.message ?? "Could not save custom test attempt items.",
        500
      )
    }

    return NextResponse.json<SubmitCustomTestResponse>({
      ok: true,
      attemptId: attempt.id,
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