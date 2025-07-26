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
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    setLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.name)
      toast.success("Account created successfully!")
      router.push("/profile-setup")
    } catch (error: any) {
      toast.error(error.message || "Failed to create account")
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

  const handleFacebookSignUp = async () => {
    setLoading(true)
    try {
      await signInWithFacebook()
      toast.success("Account created with Facebook successfully!")
      router.push("/profile-setup")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with Facebook")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
        {/* Left side - Image and Description */}
        <div className="lg:w-1/2 bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-8 sm:p-12 lg:p-16 hidden lg:flex flex-col justify-between relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
          </div>
          
          {/* Back button for mobile */}
          <div className="lg:hidden flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 relative">
                <Image 
                  src="/logo.png" 
                  alt="Medibot Logo" 
                  width={48} 
                  height={48} 
                  className="rounded-full border-2 border-white/20"
                />
              </div>
              <span className="text-white font-semibold text-xl">Medibot</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Your Personal Health Assistant</h1>
            <p className="text-white/80 text-lg mb-8">
              Join thousands of users who are taking control of their health with AI-powered medical assistance.
            </p>
          </div>

          {/* Features list */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <h3 className="text-white font-medium mb-2">24/7 Medical Support</h3>
              <p className="text-white/70 text-sm">Get answers to your health questions anytime, anywhere.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <h3 className="text-white font-medium mb-2">Personalized Insights</h3>
              <p className="text-white/70 text-sm">Tailored health recommendations based on your profile.</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="relative z-10 mt-12">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <p className="text-white/80 italic mb-4">
                "Medibot helped me identify symptoms I didn't even know were connected. It's like having a doctor in my pocket."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 mr-3"></div>
                <div>
                  <p className="text-white font-medium">Sarah Johnson</p>
                  <p className="text-white/60 text-sm">User since 2022</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header for desktop */}
            <div className="items-center mb-6 hidden lg:flex">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white mr-3">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <span className="text-white font-medium">Back</span>
            </div>

            {/* Logo and Title for mobile */}
            <div className="text-center mb-6 lg:hidden">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 relative">
                  <Image src="/logo.png" alt="Medibot Logo" width={48} height={48} className="rounded-full" />
                </div>
                <span className="text-purple-400 font-semibold text-xl">Medibot</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Full Name</label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-11 rounded-lg focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-11 rounded-lg focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white h-11 rounded-lg pr-12 focus:ring-2 focus:ring-purple-500/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2 text-sm">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white h-11 rounded-lg pr-12 focus:ring-2 focus:ring-purple-500/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2 py-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  className="mt-1 border-2 border-purple-500 rounded text-white data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-700 focus-visible:ring-2 focus-visible:ring-purple-500"
                />
                <label htmlFor="terms" className="text-xs text-slate-300 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-purple-400 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-purple-400 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-lg font-medium transition-all duration-200"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-400">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  variant="outline"
                  className="h-11 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 rounded-lg"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  onClick={handleFacebookSignUp}
                  disabled={loading}
                  variant="outline"
                  className="h-11 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 rounded-lg"
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="text-center pt-2">
                <span className="text-slate-400 text-sm">Already have an account? </span>
                <Link href="/auth/signin" className="text-green-400 hover:underline text-sm">
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}