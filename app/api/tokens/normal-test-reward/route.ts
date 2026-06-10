import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type RewardRequestBody = {
  subject?: string
  category?: string
  testId?: number
}

function calculateCoins(scorePercent: number) {
  if (scorePercent >= 90) return 3
  if (scorePercent >= 75) return 2
  if (scorePercent >= 50) return 1
  return 0
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header." },
        { status: 401 }
      )
    }

    const accessToken = authHeader.replace("Bearer ", "").trim()

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token." }, { status: 401 })
    }

    const body = (await request.json()) as RewardRequestBody

    if (
      body.subject !== "math" ||
      !body.category ||
      typeof body.category !== "string" ||
      typeof body.testId !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid normal test reward request." },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient(authHeader)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json(
        { error: "Could not verify the logged-in user." },
        { status: 401 }
      )
    }

    const { data: latestResult, error: latestResultError } = await supabase
      .from("latest_test_results")
      .select("success_rate")
      .eq("user_id", user.id)
      .eq("subject", body.subject)
      .eq("category", body.category)
      .eq("test_id", body.testId)
      .maybeSingle()

    if (latestResultError) {
      return NextResponse.json(
        { error: latestResultError.message },
        { status: 500 }
      )
    }

    if (!latestResult) {
      return NextResponse.json(
        { error: "Could not find a saved result for this test." },
        { status: 404 }
      )
    }

    const scorePercent =
      typeof latestResult.success_rate === "number"
        ? latestResult.success_rate
        : 0

    const coinsAwarded = calculateCoins(scorePercent)

    if (coinsAwarded <= 0) {
      return NextResponse.json({
        awarded: false,
        coinsAwarded: 0,
        scorePercent,
      })
    }

    const today = new Date().toISOString().slice(0, 10)
    const sourceId = `${body.subject}:${body.category}:${body.testId}:${today}`

    const { data: awarded, error: coinsError } = await supabase.rpc(
      "award_yanbo_tokens",
      {
        p_user_id: user.id,
        p_amount: coinsAwarded,
        p_reason: "normal_test_score_reward",
        p_source_type: "normal_test_daily",
        p_source_id: sourceId,
      }
    )

    if (coinsError) {
      return NextResponse.json({ error: coinsError.message }, { status: 500 })
    }

    return NextResponse.json({
      awarded: awarded === true,
      coinsAwarded,
      scorePercent,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while awarding YanBo Coins.",
      },
      { status: 500 }
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
