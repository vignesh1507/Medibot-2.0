"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function TermsPage() {
  const primaryColor = "bg-[#e0f7fa]"
  const primaryText = "text-[#00796b]"
  const secondaryColor = "bg-[#e3f2fd]"
  const secondaryText = "text-[#1565c0]"

  const buttonClasses = `h-10 px-6 ${primaryColor} ${primaryText} border border-[#80deea] rounded-full text-base font-medium shadow-none hover:bg-[#b2ebf2] hover:border-[#4dd0e1] hover:text-[#00796b]`

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#e8f5e9] to-[#e3f2fd] text-[#263238] flex flex-col items-center justify-start pt-24 pb-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto text-center mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${secondaryColor}`}>
            <Shield className="h-8 w-8 text-[#1565c0]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#263238] mb-4">
          Terms and <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">Conditions</span>
        </h1>
        <p className="text-lg text-[#546e7a]">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="visible" className="w-full max-w-4xl mx-auto space-y-6">

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">1. Agreement & Access</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                By accessing or using the Platform (https://medibot-ai.com), you agree to be bound by these Terms of Use. If you transact on the Platform, you are subject to the policies applicable at that time.
              </p>
              <p className="mt-2">
                You must provide accurate information and will be responsible for any actions taken via your account.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">2. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                The use of our services and platform is at your own risk. We are not liable for inaccuracies or performance failures. Unauthorized use may result in legal action.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">3. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                All content, design, and graphics on the Platform are proprietary and owned or licensed by us. You may not claim any rights or copy/reproduce it without permission.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">4. Prohibited Usage</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                You agree not to use the Platform for any unlawful or forbidden activities under Indian law or local regulations.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">5. Third-party Links</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                Our Platform may include links to external websites. Your access to such sites is governed by their respective policies and terms.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">6. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                You agree to indemnify and hold harmless our company and affiliates from any losses, liabilities, or legal claims arising from your use or misuse of the Platform.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">7. Governing Law & Disputes</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a]">
              <p>
                These Terms are governed by the laws of India. All disputes are subject to the exclusive jurisdiction of the courts in New Delhi.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Refund Policy Section */}
        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">8. Refund & Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a] space-y-3">
              <ul className="space-y-2">
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Cancellation requests must be made within 1 day of placing the order.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />No cancellations for perishable items like flowers or food.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Refunds/replacements are applicable for damaged or defective products reported within 1 day.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Refunds are processed within 2 days once approved by Asvix.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact & Navigation */}
        <motion.div variants={item} className="pt-6 text-center">
          <p className="text-[#546e7a] mb-6">
            For any queries related to these terms, please reach out via our Contact page.
          </p>
          <Link href="/privacy">
            <Button className={`${buttonClasses} mr-4`}>View Privacy Policy</Button>
          </Link>
          <Link href="/">
            <Button className={buttonClasses}>Back to Home</Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
