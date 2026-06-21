import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendQuestionReportEmail } from "../../../lib/sendQuestionReportEmail"

type ReportSubject = "english" | "math" | "vr" | "nvr"

const validSubjects: ReportSubject[] = ["english", "math", "vr", "nvr"]

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")

    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Please log in to report a question." },
        { status: 401 }
      )
    }

    const accessToken = authHeader.replace("Bearer ", "").trim()

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Please log in to report a question." },
        { status: 401 }
      )
    }

    const body = await request.json()

    const subject = body.subject as ReportSubject

    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        { success: false, error: "Invalid subject." },
        { status: 400 }
      )
    }

    const reportPayload = {
      user_id: user.id,
      subject,
      category: body.category || null,
      test_id: toNullableNumber(body.testId),
      question_id: toNullableNumber(body.questionId),
      reason: body.reason || "Other issue",
      message:
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : null,
      page_url: body.pageUrl || null,
      status: "open",
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: report, error: insertError } = await adminSupabase
      .from("question_reports")
      .insert(reportPayload)
      .select("*")
      .single()

    if (insertError || !report) {
      console.error("Question report insert error:", insertError)

      return NextResponse.json(
        {
          success: false,
          error: "Sorry, the report could not be sent. Please try again.",
        },
        { status: 500 }
      )
    }

    let adminEmailSent = false

    try {
      await sendQuestionReportEmail(report)

      adminEmailSent = true

      await adminSupabase
        .from("question_reports")
        .update({
          admin_notified_at: new Date().toISOString(),
          admin_notification_error: null,
        })
        .eq("id", report.id)
    } catch (emailError) {
      const message =
        emailError instanceof Error
          ? emailError.message
          : "Unknown email notification error"

      console.error("Question report email error:", message)

      await adminSupabase
        .from("question_reports")
        .update({
          admin_notification_error: message,
        })
        .eq("id", report.id)
    }

    return NextResponse.json(
      {
        success: true,
        adminEmailSent,
        message:
          "Thank you for your feedback. The YanBo Learning support team will review this question as soon as possible.",
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown question report error"

    console.error("Question report route error:", message)

    return NextResponse.json(
      {
        success: false,
        error: "Sorry, the report could not be sent. Please try again.",
      },
      { status: 500 }
    )
  }
}