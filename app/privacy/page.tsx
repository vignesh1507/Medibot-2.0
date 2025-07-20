"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Shield,CheckCircle, Database, Mail } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function PrivacyPage() {
  // Reuse the color variables from the homepage
  const primaryColor = "bg-[#e0f7fa]"
  const primaryText = "text-[#00796b]"
  const secondaryColor = "bg-[#e3f2fd]"
  const secondaryText = "text-[#1565c0]"
  const accentColor = "bg-[#e8f5e9]"
  const accentText = "text-[#2e7d32]"

  const buttonClasses = `h-10 px-6 ${primaryColor} ${primaryText} border border-[#80deea] rounded-full text-base font-medium shadow-none hover:bg-[#b2ebf2] hover:border-[#4dd0e1] hover:text-[#00796b]`

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#e8f5e9] to-[#e3f2fd] text-[#263238] flex flex-col items-center justify-start pt-24 pb-12 px-4`}>
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto text-center mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${primaryColor}`}>
            <Lock className="h-8 w-8 text-[#00796b]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#263238] mb-4">
          Privacy <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">Policy</span>
        </h1>
        <p className="text-lg text-[#546e7a]">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Privacy Content */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto space-y-6"
      >
        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#263238]">
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start mb-4">
                <Database className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-[#546e7a]">
                  We collect personal information you provide when you register, including your name, email address, and medication information.
                </p>
              </div>
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-[#546e7a]">
                  Health-related data is stored securely and used only to provide the Service's core functionality.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#263238]">
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-[#546e7a]">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                  <span>To provide and maintain our Service</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                  <span>To send medication reminders and notifications</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                  <span>To improve and personalize your experience</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                  <span>To monitor usage of the Service</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#263238]">
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#546e7a] mb-4">
                We implement industry-standard security measures to protect your personal information, including encryption and secure servers.
              </p>
              <p className="text-[#546e7a]">
                However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#263238]">
                Third-Party Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#546e7a]">
                We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), provide the Service on our behalf, or assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#263238]">
                HIPAA Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#546e7a]">
                For users in the United States, MediBot complies with the Health Insurance Portability and Accountability Act (HIPAA) regarding the protection of personal health information.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-[#263238]">
                Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#546e7a]">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="pt-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Mail className="h-5 w-5 text-[#4dd0e1] mr-2" />
            <p className="text-[#546e7a]">
              If you have any questions about this Privacy Policy, please contact us at privacy@medibot.com
            </p>
          </div>
          <Link href="/terms">
            <Button className={`${buttonClasses} mr-4`}>
              View Terms
            </Button>
          </Link>
          <Link href="/">
            <Button className={buttonClasses}>
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}