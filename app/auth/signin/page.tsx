"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('medibot_remember') === 'true'
    } catch {
      return false
    }
  })
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user just verified their email
  useEffect(() => {
    const verified = searchParams?.get('verified')
    if (verified === 'true') {
      setShowVerifiedMessage(true)
      toast.success("Email verified successfully! You can now sign in.", {
        position: "top-center",
        duration: 5000,
        style: {
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #1e293b'
        }
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
  await signIn(email, password, rememberMe)
  // persist remember choice
  try { localStorage.setItem('medibot_remember', rememberMe ? 'true' : 'false') } catch {}
      toast.success("Signed in successfully!", {
        position: "top-center",
        style: {
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #1e293b'
        }
      })
      router.push("/dashboard")
    } catch (error: any) {
      // Check if it's an email verification error
      if (error.message.includes("verify your email")) {
        toast.error(error.message, {
          position: "top-center",
          duration: 6000,
          style: {
            background: '#dc2626',
            color: '#ffffff',
            border: '1px solid #991b1b'
          },
          action: {
            label: 'Verify Email',
            onClick: () => router.push('/verify-email')
          }
        })
      } else {
        toast.error(error.message || "Failed to sign in", {
          position: "top-center",
          style: {
            background: '#0f172a',
            color: '#ffffff',
            border: '1px solid #1e293b'
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success("Signed in with Google successfully!", {
        position: "top-center",
        style: {
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #1e293b'
        }
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google", {
        position: "top-center",
        style: {
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #1e293b'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(/loginbg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-white/30"></div>
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60 p-8 sm:p-10 relative z-10">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                 <ArrowLeft className="h-5 w-5" />
                                <p>Back</p>
              </Button>
            </Link>
           
          </div>

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-5">
                  {/* Remember Me Checkbox */}
                  <div className="flex items-center mt-2">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="accent-teal-600 h-4 w-4 rounded border-gray-400 focus:ring-teal-500"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-gray-700 text-sm select-none cursor-pointer">Remember Me</label>
                  </div>
              <div className="w-14 h-14 relative">
                <Image 
                  src="/logo.png" 
                  alt="Medibot Logo" 
                  width={56} 
                  height={56} 
                  className="rounded-full border-2 border-gray-200 shadow-sm"
                />
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-500 font-bold text-2xl tracking-tight">
                Medibot
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to access your dashboard</p>
          </div>

          {/* Email Verification Success Message */}
          {showVerifiedMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-600 font-medium">Email Verified Successfully!</p>
                  <p className="text-green-700">You can now sign in to your account.</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-gray-700 font-medium text-sm">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-gray-50 border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-gray-900 h-11 rounded-lg text-sm placeholder-gray-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-gray-700 font-medium text-sm">Password</label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-teal-600 hover:text-teal-700 text-xs hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-gray-50 border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-gray-900 h-11 rounded-lg pr-12 text-sm placeholder-gray-400"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg shadow-md transition-all duration-200 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white/95 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="h-11 bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-900 rounded-lg text-sm transition-all"
              >
                <svg className="mr-2 h-4 w-4 flex-shrink-0" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" transform="translate(12 12) scale(1)"/>
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Google
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-teal-600 hover:text-teal-700 hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}