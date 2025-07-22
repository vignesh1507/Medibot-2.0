"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function RefundPolicyPage() {
  const primaryColor = "bg-[#e0f7fa]"
  const primaryText = "text-[#00796b]"
  const secondaryColor = "bg-[#e3f2fd]"

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
            <CheckCircle className="h-8 w-8 text-[#00796b]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#263238] mb-4">
          Refund & <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">Cancellation Policy</span>
        </h1>
        <p className="text-lg text-[#546e7a]">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="visible" className="w-full max-w-4xl mx-auto space-y-6">

        <motion.div variants={item}>
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Refund & Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-[#546e7a] space-y-3">
              <ul className="space-y-2">
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Cancellations must be requested within 1 day of placing the order.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />No cancellations for perishable items like flowers or eatables.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Damaged/defective items must be reported within 1 day for replacement/refund.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Refunds (if approved) are processed within 2 working days.</li>
                <li><CheckCircle className="inline mr-2 text-[#4dd0e1]" />Complaints for items with manufacturer warranty should be directed to them.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="pt-6 text-center">
          <p className="text-[#546e7a] mb-6">
            For refund-related concerns, please contact our customer support.
          </p>
          <Link href="/">
            <Button className={buttonClasses}>Back to Home</Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
