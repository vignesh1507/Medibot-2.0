"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      setSent(true)
      toast.success("Password reset email sent!")
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/auth/signin">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="text-gray-900 font-medium">Back</span>
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 relative">
              <Image src="/logo.png" alt="Medibot Logo" width={64} height={64} className="rounded-full" />
            </div>
            <span className="text-teal-400 font-semibold text-2xl">Medibot</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Reset Password</h1>
          <p className="text-gray-500">
            {sent
              ? "Check your email for password reset instructions"
              : "Enter your email address and we'll send you a link to reset your password"}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-gray-900" />
            </div>
            <div>
              <p className="text-gray-900 mb-2">Email sent successfully!</p>
              <p className="text-gray-500 text-sm">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/auth/signin" className="block">
                <Button className="w-full h-12 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-gray-900 rounded-xl shadow-lg">
                  Back to Sign In
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false)
                  setEmail("")
                }}
                className="w-full h-12 bg-slate-800 border-gray-300 text-gray-900 hover:bg-slate-700 rounded-xl"
              >
                Send Another Email
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-900 font-medium mb-3">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="bg-slate-800 border-gray-300 text-gray-900 h-12 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-gray-900 rounded-xl shadow-lg"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <span className="text-gray-500">Remember your password? </span>
              <Link href="/auth/signin" className="text-green-600 hover:underline">
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
