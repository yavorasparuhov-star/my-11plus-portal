"use client"

import { useState } from "react"
import { supabase } from "../lib/supabaseClient"

type ReportQuestionButtonProps = {
  subject: "english" | "math" | "vr" | "nvr"
  category?: string | null
  testId?: number | null
  questionId?: number | null
}

const reportReasons = [
  "Wrong answer",
  "Unclear wording",
  "Image problem",
  "Duplicate options",
  "Typo or spelling mistake",
  "Other issue",
]

export default function ReportQuestionButton({
  subject,
  category = null,
  testId = null,
  questionId = null,
}: ReportQuestionButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(reportReasons[0])
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitReport() {
    setError(null)
    setSuccess(false)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError("Please log in to report a question.")
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from("question_reports").insert({
      user_id: user.id,
      subject,
      category,
      test_id: testId,
      question_id: questionId,
      reason,
      message: message.trim() || null,
      page_url: typeof window !== "undefined" ? window.location.href : null,
      status: "open",
    })

    setSubmitting(false)

    if (insertError) {
      setError("Sorry, the report could not be sent. Please try again.")
      return
    }

    setSuccess(true)
    setMessage("")
    setReason(reportReasons[0])
  }

  return (
    <div style={{ marginTop: 16 }}>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            setSuccess(false)
            setError(null)
          }}
          style={{
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            color: "#9a3412",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ⚠️ Report this question
        </button>
      ) : (
        <div
          style={{
            border: "1px solid #fed7aa",
            background: "#fff7ed",
            borderRadius: 16,
            padding: 16,
            color: "#7c2d12",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 900,
                color: "#9a3412",
              }}
            >
              Report this question
            </h3>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setError(null)
                setSuccess(false)
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#9a3412",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 18,
              }}
              aria-label="Close report form"
            >
              ×
            </button>
          </div>

          <label
            style={{
              display: "block",
              fontWeight: 800,
              marginBottom: 6,
              fontSize: 14,
            }}
          >
            What is the problem?
          </label>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #fdba74",
              marginBottom: 12,
              background: "#ffffff",
              color: "#7c2d12",
              fontWeight: 700,
              boxSizing: "border-box",
            }}
          >
            {reportReasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "block",
              fontWeight: 800,
              marginBottom: 6,
              fontSize: 14,
            }}
          >
            Extra details optional
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="For example: option B and C both look correct, or the image is too small."
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #fdba74",
              resize: "vertical",
              marginBottom: 12,
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />

          {error && (
            <p
              style={{
                color: "#dc2626",
                fontWeight: 700,
                margin: "0 0 10px",
                fontSize: 14,
              }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              style={{
                color: "#166534",
                fontWeight: 800,
                margin: "0 0 10px",
                fontSize: 14,
              }}
            >
              Thank you. Your report has been sent.
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={submitReport}
              disabled={submitting}
              style={{
                border: "none",
                background: "#ea580c",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 900,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Sending..." : "Send report"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setError(null)
                setSuccess(false)
              }}
              style={{
                border: "1px solid #fdba74",
                background: "#ffffff",
                color: "#9a3412",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}