"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { sendSignInLinkToEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    agreeToTerms: false,
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle } = useAuth()
  const router = useRouter()

  const actionCodeSettings = {
    url: (typeof window !== 'undefined' ? `${window.location.origin}/auth/complete-signup?email=${encodeURIComponent(formData.email)}` : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/complete-signup`),
    handleCodeInApp: true,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    if (!formData.email) {
      toast.error('Please provide your email')
      return
    }

    setLoading(true)
    try {
      // send email sign-in link; account will be created when the user clicks the link
      await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings)
      // store ephemeral signup data to complete signup after verification
      sessionStorage.setItem('signup_email', formData.email)
      sessionStorage.setItem('signup_name', formData.name || '')
  // store remember preference so completion can apply persistence
  sessionStorage.setItem('signup_remember', formData.rememberMe ? 'true' : 'false')

      toast.success('Verification link sent. Check your inbox to complete signup.')
      router.push('/verify-email')
    } catch (error: any) {
      console.error('sendSignInLinkToEmail error', error)
      toast.error(error.message || 'Failed to send verification link')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success("Account created with Google successfully!")
      router.push("/profile-setup")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with Google")
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
        
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60 p-6 sm:p-7 relative z-10">
          {/* Header */}
          <div className="flex items-center mb-6">
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
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 relative">
                <Image 
                  src="/logo.png" 
                  alt="Medibot Logo" 
                  width={48} 
                  height={48} 
                  className="rounded-full border-2 border-gray-200"
                />
              </div>
              <span className="text-gray-900 font-bold text-xl">Medibot</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-500 text-sm">Join thousands improving their health with AI</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-gray-900 font-medium mb-1 text-sm">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-50 border-gray-300 text-gray-900 h-10 rounded-lg focus:ring-2 focus:ring-teal-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium mb-1 text-sm">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-50 border-gray-300 text-gray-900 h-10 rounded-lg focus:ring-2 focus:ring-teal-500/50"
                required
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center mb-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={e => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="accent-teal-600 h-4 w-4 rounded border-gray-400 focus:ring-teal-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-700 text-sm select-none cursor-pointer">Remember Me</label>
            </div>
            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2 py-1">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                className="mt-1 border-2 border-teal-500 rounded text-gray-900 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
              />
              <label htmlFor="terms" className="text-xs text-gray-700 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-teal-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-teal-400 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg shadow-lg font-medium transition-all duration-200"
            >
              {loading ? "Sending Verification..." : "Send Verification Link"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white/95 text-gray-500">
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                variant="outline"
                className="h-9 bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100 rounded-lg transition-all text-sm"
              >
                <svg className="mr-2 h-4 w-4 flex-shrink-0" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Google
              </Button>
            </div>

            <div className="text-center pt-1">
              <span className="text-gray-500 text-sm">Already have an account? </span>
              <Link href="/auth/signin" className="text-green-600 hover:underline text-sm font-medium">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  )
}