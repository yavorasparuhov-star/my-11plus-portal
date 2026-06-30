import { Resend } from "resend"

type QuestionReportEmailInput = {
  id?: string | number | null
  subject?: string | null
  category?: string | null
  test_id?: string | number | null
  question_id?: string | number | null
  reason?: string | null
  message?: string | null
  user_id?: string | null
  page_url?: string | null
  created_at?: string | null
  status?: string | null
}

function safeValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided"
  }

  return String(value)
}

export async function sendQuestionReportEmail(report: QuestionReportEmailInput) {
  const resendApiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.REPORT_ADMIN_EMAIL
  const fromEmail =
    process.env.REPORT_FROM_EMAIL || "YanBo Practice Portal <onboarding@resend.dev>"

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY")
  }

  if (!adminEmail) {
    throw new Error("Missing REPORT_ADMIN_EMAIL")
  }

  const resend = new Resend(resendApiKey)

  const subjectLabel = report.subject || "Unknown subject"
  const emailSubject = `New question report: ${subjectLabel}`

  const text = `
New question report received

Report ID: ${safeValue(report.id)}
Subject: ${safeValue(report.subject)}
Category: ${safeValue(report.category)}
Test ID: ${safeValue(report.test_id)}
Question ID: ${safeValue(report.question_id)}

Reason:
${safeValue(report.reason)}

Student message:
${safeValue(report.message)}

Reported by user ID:
${safeValue(report.user_id)}

Page URL:
${safeValue(report.page_url)}

Created at:
${safeValue(report.created_at)}

Status:
${safeValue(report.status)}
`.trim()

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [adminEmail],
    subject: emailSubject,
    text,
  })

  if (error) {
    throw new Error(error.message || "Failed to send question report email")
  }

  return data
}