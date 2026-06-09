import { NextResponse } from "next/server"
import { supabase } from "../../../../lib/supabaseClient"

export async function POST() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase.rpc("award_yanbo_tokens", {
      p_user_id: user.id,
      p_amount: 3,
      p_reason: "daily_login",
      p_source_type: "daily_login",
      p_source_id: today,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      awarded: data === true,
      amount: data === true ? 3 : 0,
      reason: "daily_login",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      },
      { status: 500 }
    )
  }
}