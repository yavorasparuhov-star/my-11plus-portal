"use client"

import { useEffect, useRef, useState } from "react"
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

const THANK_YOU_MESSAGE =
  "Thank you for your feedback. The YanBo Learning support team will review this question as soon as possible."

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
  const [alreadySent, setAlreadySent] = useState(false)
  const [successMessage, setSuccessMessage] = useState(THANK_YOU_MESSAGE)
  const [error, setError] = useState<string | null>(null)

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setOpen(false)
    setReason(reportReasons[0])
    setMessage("")
    setSubmitting(false)
    setSuccess(false)
    setAlreadySent(false)
    setSuccessMessage(THANK_YOU_MESSAGE)
    setError(null)

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [subject, category, testId, questionId])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  function closeReportForm() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    setOpen(false)
    setError(null)
    setSuccess(false)
  }

  async function submitReport() {
    if (submitting || alreadySent) {
      return
    }

    setError(null)
    setSuccess(false)
    setSuccessMessage(THANK_YOU_MESSAGE)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      setError("Please log in to report a question.")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/question-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          category,
          testId,
          questionId,
          reason,
          message: message.trim() || null,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        setError(
          result?.error ||
            "Sorry, the report could not be sent. Please try again."
        )
        return
      }

      setSuccess(true)
      setAlreadySent(true)
      setSuccessMessage(result?.message || THANK_YOU_MESSAGE)
      setMessage("")
      setReason(reportReasons[0])

      closeTimerRef.current = setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        closeTimerRef.current = null
      }, 1500)
    } catch (submitError) {
      console.error("Question report submit error:", submitError)
      setError("Sorry, the report could not be sent. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        marginTop: open ? 12 : 0,
        flexBasis: open ? "100%" : "auto",
        maxWidth: open ? 560 : "none",
        textAlign: "left",
      }}
    >
      {!open ? (
        <button
          type="button"
          onClick={() => {
            if (alreadySent) {
              return
            }

            setOpen(true)
            setSuccess(false)
            setError(null)
          }}
          disabled={alreadySent}
          style={{
            border: "none",
            background: "transparent",
            color: alreadySent ? "#9ca3af" : "#6b7280",
            padding: 0,
            fontWeight: 600,
            cursor: alreadySent ? "default" : "pointer",
            fontSize: 13,
            textDecoration: alreadySent ? "none" : "underline",
            textUnderlineOffset: 3,
          }}
        >
          {alreadySent ? "Report sent" : "Report question"}
        </button>
      ) : (
        <div
          style={{
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            borderRadius: 16,
            padding: 16,
            color: "#374151",
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
                color: "#374151",
              }}
            >
              Report this question
            </h3>

            <button
              type="button"
              onClick={closeReportForm}
              style={{
                border: "none",
                background: "transparent",
                color: "#6b7280",
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
            disabled={submitting || alreadySent}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              marginBottom: 12,
              background: "#ffffff",
              color: "#374151",
              fontWeight: 700,
              boxSizing: "border-box",
              opacity: submitting || alreadySent ? 0.7 : 1,
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
            disabled={submitting || alreadySent}
            placeholder="For example: option B and C both look correct, or the image is too small."
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              resize: "vertical",
              marginBottom: 12,
              boxSizing: "border-box",
              fontFamily: "inherit",
              opacity: submitting || alreadySent ? 0.7 : 1,
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
              {successMessage}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={submitReport}
              disabled={submitting || alreadySent}
              style={{
                border: "none",
                background: "#d4f5d0",
                color: "#065f46",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 900,
                cursor: submitting || alreadySent ? "not-allowed" : "pointer",
                opacity: submitting || alreadySent ? 0.7 : 1,
              }}
            >
              {submitting
                ? "Sending..."
                : alreadySent
                  ? "Report sent"
                  : "Send report"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}