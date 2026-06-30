import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import CookieConsent from "../components/CookieConsent"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "YanBo Practice Portal | 11+ Practice for English, Maths, VR & NVR",
  description:
    "Affordable 11+ practice for English, Maths, Verbal Reasoning and Non-Verbal Reasoning. Topic tests, instant feedback, progress tracking, review practice and Build a Test features.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}