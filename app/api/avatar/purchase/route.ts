import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const itemKey = body?.itemKey

    if (!itemKey || typeof itemKey !== "string") {
      return NextResponse.json(
        { error: "Missing avatar item key" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

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

    const { data, error } = await supabase.rpc("purchase_avatar_item", {
      p_user_id: user.id,
      p_item_key: itemKey,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data?.success) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || "Could not purchase item",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      itemKey: data.item_key,
      price: data.price,
      newBalance: data.new_balance,
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