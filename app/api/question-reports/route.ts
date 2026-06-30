import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendQuestionReportEmail } from "../../../lib/sendQuestionReportEmail"

type ReportSubject = "english" | "math" | "vr" | "nvr"

const validSubjects: ReportSubject[] = ["english", "math", "vr", "nvr"]

const DUPLICATE_REPORT_WINDOW_HOURS = 24

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

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed ? trimmed : null
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

    const category = toNullableString(body.category)
    const testId = toNullableNumber(body.testId)
    const questionId = toNullableNumber(body.questionId)
    const reason = toNullableString(body.reason) || "Other issue"
    const message = toNullableString(body.message)
    const pageUrl = toNullableString(body.pageUrl)

    const reportPayload = {
      user_id: user.id,
      subject,
      category,
      test_id: testId,
      question_id: questionId,
      reason,
      message,
      page_url: pageUrl,
      status: "open",
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const duplicateWindowStart = new Date(
      Date.now() - DUPLICATE_REPORT_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString()

    let duplicateQuery = adminSupabase
      .from("question_reports")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("subject", subject)
      .gte("created_at", duplicateWindowStart)
      .order("created_at", { ascending: false })
      .limit(1)

    if (category === null) {
      duplicateQuery = duplicateQuery.is("category", null)
    } else {
      duplicateQuery = duplicateQuery.eq("category", category)
    }

    if (testId === null) {
      duplicateQuery = duplicateQuery.is("test_id", null)
    } else {
      duplicateQuery = duplicateQuery.eq("test_id", testId)
    }

    if (questionId === null) {
      duplicateQuery = duplicateQuery.is("question_id", null)
    } else {
      duplicateQuery = duplicateQuery.eq("question_id", questionId)
    }

    const { data: existingReports, error: duplicateCheckError } =
      await duplicateQuery

    if (duplicateCheckError) {
      console.error("Question report duplicate check error:", duplicateCheckError)
    }

    if (existingReports && existingReports.length > 0) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          adminEmailSent: false,
          message:
            "Thank you. You have already reported this question and the YanBo Practice Portal support team will review it.",
        },
        { status: 200 }
      )
    }

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
      const emailErrorMessage =
        emailError instanceof Error
          ? emailError.message
          : "Unknown email notification error"

      console.error("Question report email error:", emailErrorMessage)

      await adminSupabase
        .from("question_reports")
        .update({
          admin_notification_error: emailErrorMessage,
        })
        .eq("id", report.id)
    }

    return NextResponse.json(
      {
        success: true,
        duplicate: false,
        adminEmailSent,
        message:
          "Thank you for your feedback. The YanBo Practice Portal support team will review this question as soon as possible.",
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