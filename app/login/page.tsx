"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    setError(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        alert("Account created! You can now log in.")
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
       router.push("/home")
      }
    }

    setLoading(false)
  }

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "120px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "8px"
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        {isSignUp ? "Create Account" : "Login"}
      </h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      {error && (
        <p style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleAuth}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px"
        }}
      >
        {loading
          ? "Please wait..."
          : isSignUp
          ? "Sign Up"
          : "Login"}
      </button>

      <p style={{ textAlign: "center", marginBottom: "10px" }}>
        {isSignUp
          ? "Already have an account?"
          : "Don't have an account?"}
      </p>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ width: "100%", padding: "8px" }}
      >
        {isSignUp
          ? "Switch to Login"
          : "Switch to Sign Up"}
      </button>
    </div>
  )
}