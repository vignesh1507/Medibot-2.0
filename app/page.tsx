
"use client"

import { Eye } from "lucide-react";
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pill, MessageCircle, Clock, Star, Calendar, Heart, CheckCircle, ChevronRight, ChevronDown, Play, Shield, Activity, Stethoscope } from "lucide-react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { sendMedicationReminder } from '../lib/firestore';

export default function HomePage() {
  // Light medical-themed color variables
  const primaryColor = "bg-[#e0f7fa]"
  const primaryHover = "hover:bg-[#b2ebf2]"
  const primaryBorder = "border-[#80deea]"
  const primaryText = "text-[#00796b]"
  
  const secondaryColor = "bg-[#e3f2fd]"
  const secondaryHover = "hover:bg-[#bbdefb]"
  const secondaryBorder = "border-[#90caf9]"
  const secondaryText = "text-[#1565c0]"
  
  const accentColor = "bg-[#e8f5e9]"
  const accentHover = "hover:bg-[#c8e6c9]"
  const accentBorder = "border-[#a5d6a7]"
  const accentText = "text-[#2e7d32]"
  
  const successColor = "bg-[#e8f5e9]"
  const successHover = "hover:bg-[#c8e6c9]"
  
  const buttonClasses = `h-10 px-6 ${primaryColor} ${primaryText} border ${primaryBorder} rounded-full text-base font-medium shadow-none ${primaryHover} hover:border-[#4dd0e1] hover:text-[#00796b]`
  const secondaryButtonClasses = `h-10 px-6 ${secondaryColor} ${secondaryText} border ${secondaryBorder} rounded-full text-base font-medium shadow-none ${secondaryHover} hover:border-[#64b5f6] hover:text-[#1565c0]`
  const accentButtonClasses = `h-10 px-6 ${accentColor} ${accentText} border ${accentBorder} rounded-full text-base font-medium shadow-none ${accentHover} hover:border-[#81c784] hover:text-[#2e7d32]`

  // Animation controls
  const controls = useAnimation()
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // State for user count and loading
  const [userCount, setUserCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }

    // Fetch user count from Firebase
    const fetchUserCount = async () => {
      try {
        setIsLoading(true)
        const usersCollection = collection(db, "users")
        console.log("Querying collection:", usersCollection.path)
        const usersSnapshot = await getDocs(usersCollection)
        const count = usersSnapshot.size
        console.log(`Fetched ${count} users. Document IDs:`, usersSnapshot.docs.map(doc => doc.id))
        if (count !== 23) {
          console.warn(`Expected 23 users, but found ${count}. Verify collection data or rules.`)
        }
        setUserCount(count)
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching user count:", error.message)
        } else {
          console.error("Error fetching user count:", error)
        }
        if (error instanceof Error && error.message.includes("permission-denied")) {
          console.error("Check Firestore rules: Read access may be restricted.")
        }
        setUserCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserCount()
  }, [controls, inView])

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
    <div className={`min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#e8f5e9] to-[#e3f2fd] text-[#263238] flex flex-col items-center justify-start overflow-x-hidden`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#b2ebf2]/50 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#bbdefb]/50 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#c8e6c9]/50 rounded-full blur-2xl animate-float-fast"></div>
      </div>

      {/* Header Section */}
      <header className={`fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 relative"
            >
              <Image src="/logo.png" alt="MediBot Logo" width={40} height={40} className="rounded-full object-cover" />
            </motion.div>
            <motion.h1 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl font-bold text-[#00796b]"
            >
              MediBot
            </motion.h1>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center space-x-4"
          >
            <Link href="/auth/signin">
              <Button className={`${buttonClasses}`}>
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className={`${buttonClasses} bg-gradient-to-r from-[#80deea] to-[#90caf9] hover:from-[#4dd0e1] hover:to-[#64b5f6]`}>
                Sign Up
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:pt-36 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800">
            <path d="M0,0 C300,100 600,50 900,150 C1200,250 1440,200 1440,400 V800 H0 Z" fill="url(#gradient)" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#b2ebf2', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#c8e6c9', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="relative max-w-7xl mt-20 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-extrabold tracking-tight text-[#263238] sm:text-5xl md:text-6xl"
            >
              Transform Your Health with <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">MediBot</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 max-w-2xl mx-auto text-xl text-[#546e7a]"
            >
              Your AI-powered health companion that simplifies medication management, provides personalized insights, and ensures you never miss a dose.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button
                asChild
                className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-[#00acc1] to-[#42a5f5] hover:from-[#00838f] hover:to-[#1e88e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4dd0e1]`}
              >
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
            </motion.div>
          </div>
          
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 relative"
          >
            <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-gray-200 shadow-2xl shadow-[#b2ebf2]/50">
              <Image
                src="/main.png"
                alt="MediBot App Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
            </div>
            
            {/* Floating elements around the hero image */}
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#b2ebf2]/50 blur-xl animate-pulse-slow"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#bbdefb]/50 blur-xl animate-pulse-medium"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={container}
        className="w-full max-w-7xl mx-auto px-6 py-20 relative"
      >
        <div className="absolute -top-20 left-0 w-full h-20 pointer-events-none" id="features" />
        
        <motion.div variants={item} className="text-center mb-16">
          <span className={`inline-block px-4 py-2 bg-[#e0f7fa] text-[#00796b] rounded-full text-sm font-medium mb-4`}>
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238]">
            Take Control of Your <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">Health</span>
          </h2>
          <p className="mt-4 text-lg text-[#546e7a] max-w-2xl mx-auto">
            MediBot combines cutting-edge technology with intuitive design to revolutionize your health management.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Pill className="h-6 w-6 text-[#00acc1]" />,
              title: "Smart Medication Tracking",
              description: "Easily log and track your medications with our intuitive interface. Set up schedules, view history, and get insights into your adherence.",
              image: "/healthtrack.png"
            },
            {
              icon: <MessageCircle className="h-6 w-6 text-[#00acc1]" />,
              title: "AI-Powered Health Chat",
              description: "Ask MediBot anything about your health or prescriptions. Our AI provides accurate, personalized advice to support your wellness journey.",
              image: "/chat.png"
            },
            {
              icon: <Clock className="h-6 w-6 text-[#00acc1]" />,
              title: "Timely Reminders",
              description: "Receive customized reminders via email, WhatsApp, or push notifications to stay on top of your medication schedule.",
              image: "/medication.png"
            },
            {
              icon: <Calendar className="h-6 w-6 text-[#00acc1]" />,
              title: "Medical Information Summarizer",
              description: "Visualize your medication and appointment schedules in a sleek, interactive calendar to plan your health routine effectively.",
              image: "/summarize.webp"
            },
            {
              icon: <Activity className="h-6 w-6 text-[#00acc1]" />,
              title: "Prescription Analysis",
              description: "Get tailored health tips and analytics based on your medication adherence and health data to optimize your well-being.",
              image: "/prescription.webp"
            },
            {
              icon: <Shield className="h-6 w-6 text-[#00acc1]" />,
              title: "Secure & Private",
              description: "Your data is protected with state-of-the-art encryption, ensuring your health information remains private and secure.",
              image: "/secure.jpeg"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`group bg-white rounded-xl border border-gray-200 shadow-lg shadow-[#b2ebf2]/30 hover:shadow-[#b2ebf2]/50 transition-all h-full overflow-hidden`}>
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent"></div>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 text-[#263238] text-xl font-semibold">
                    <div className={`p-2 bg-[#e0f7fa] rounded-lg`}>
                      {feature.icon}
                    </div>
                    <span>{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#546e7a] text-base">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Image + Text Section (Alternating) */}
      <section className="w-full py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* First Row - Image Left */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
                <Image
                  src="/mobileview.png"
                  alt="MediBot Mobile App"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none"></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <span className={`inline-block px-4 py-2 bg-[#e3f2fd] text-[#1565c0] rounded-full text-sm font-medium mb-4`}>
                Mobile Friendly
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#263238] mb-6">
                Health Management <span className="bg-gradient-to-r from-[#42a5f5] to-[#4dd0e1] bg-clip-text text-transparent">On The Go</span>
              </h2>
              <p className="text-lg text-[#546e7a] mb-6">
                Access your medication schedules, health insights, and AI assistant from anywhere with our beautifully designed mobile interface.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Real-time medication tracking",
                  "Instant health notifications",
                  "Offline access to your data",
                  "Biometric authentication"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#42a5f5] mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-[#546e7a]">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className={buttonClasses}>
                <a href="/mediBot.apk" download="mediBot.apk" target="_blank" rel="noopener noreferrer">
                  Download Mobile App
                </a>
              </Button>
            </motion.div>
          </div>
          
          {/* Second Row - Image Right */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
                <Image
                  src="/chatroom.png"
                  alt="MediBot AI Assistant"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none"></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <span className={`inline-block px-4 py-2 bg-[#e0f7fa] text-[#00796b] rounded-full text-sm font-medium mb-4`}>
                AI Assistant
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#263238] mb-6">
                Your Personal <span className="bg-gradient-to-r from-[#4dd0e1] to-[#42a5f5] bg-clip-text text-transparent">Health Companion</span>
              </h2>
              <p className="text-lg text-[#546e7a] mb-6">
                MediBot's AI assistant learns your health patterns and provides personalized recommendations to optimize your medication routine.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "24/7 health questions answered",
                  "Personalized medication advice",
                  "Interaction warnings",
                  "Dosage optimization"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-[#546e7a]">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/chat">
                <Button className={buttonClasses}>
                  Try AI Assistant
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`w-full py-20 bg-gradient-to-br from-[#e0f7fa] via-[#e8f5e9] to-[#e3f2fd]`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { 
                number: isLoading ? "Loading..." : `${userCount.toLocaleString()}`, 
                label: "Users Count", 
                icon: <Eye className="h-6 w-6 text-[#e91e63]" /> 
              },
              { 
                number: "92%", 
                label: "Satisfaction Rate", 
                icon: <Star className="h-6 w-6 text-[#ff9800]" /> 
              },
              { 
                number: "100+", 
                label: "Tokens per day", 
                icon: <Pill className="h-6 w-6 text-[#4caf50]" /> 
              },
              { 
                number: "24/7", 
                label: "Support Available", 
                icon: <Stethoscope className="h-6 w-6 text-[#2196f3]" /> 
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md"
              >
                <div className="flex justify-center mb-3">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-[#546e7a] text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <motion.section
        initial="hidden"
        animate={controls}
        variants={container}
        className="w-full max-w-7xl mx-auto px-6 py-20 relative"
      >
        <div className="absolute -top-20 left-0 w-full h-20 pointer-events-none" id="pricing" />
        
        <motion.div variants={item} className="text-center mb-16">
          <span className={`inline-block px-4 py-2 bg-[#e0f7fa] text-[#00796b] rounded-full text-sm font-medium mb-4`}>
            Pricing Plans
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238]">
            Choose Your <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">Plan</span>
          </h2>
          <p className="mt-4 text-lg text-[#546e7a] max-w-2xl mx-auto">
            Select the perfect plan to suit your health management needs with MediBot's flexible pricing options.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Free",
              price: "$0",
              period: "month",
              features: [
                "Basic Medication Tracking",
                "Limited AI Health Chat",
                "Email Reminders",
                "Basic Security"
              ],
              cta: "Get Started Free",
              link: "/auth/signup",
              highlighted: false
            },
            {
              title: "Premium",
              price: "$2",
              period: "month",
              features: [
                "Advanced Medication Tracking",
                "Unlimited AI Health Chat",
                "Multi-Channel Reminders",
                "Medical Summarizer",
                "Enhanced Security"
              ],
              cta: "Contact Sales",
              link: "/contact",
              highlighted: true
            },
            {
              title: "Enterprise",
              price: "$49",
              period: "",
              features: [
                "Full Medication Management",
                "Priority AI Support",
                "Custom Integrations",
                "Advanced Analytics",
                "HIPAA-Compliant Security",
                "Provider Monitoring",
                "Lifetime Access"
              ],
              cta: "Contact Sales",
              link: "/contact",
              highlighted: false
            }
          ].map((plan, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`group bg-white rounded-xl border ${plan.highlighted ? 'border-[#4dd0e1] shadow-[#4dd0e1]/50' : 'border-gray-200 shadow-[#b2ebf2]/30'} shadow-lg hover:shadow-[#b2ebf2]/50 transition-all h-full overflow-hidden`}>
                <CardHeader>
                  <CardTitle className="text-[#263238] text-xl font-semibold">
                    {plan.title}
                  </CardTitle>
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">
                    {plan.price}
                    {plan.period && <span className="text-base text-[#546e7a] ml-2">/{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-[#4dd0e1] mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-[#546e7a]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className={`${plan.highlighted ? 'bg-gradient-to-r from-[#00acc1] to-[#42a5f5] text-white hover:from-[#00838f] hover:to-[#1e88e5]' : buttonClasses} w-full`}>
                    <Link href={plan.link}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className={`inline-block px-4 py-2 bg-[#e3f2fd] text-[#1565c0] rounded-full text-sm font-medium mb-4`}>
            Need Help?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238]">
            Frequently Asked <span className="bg-gradient-to-r from-[#42a5f5] to-[#4dd0e1] bg-clip-text text-transparent">Questions</span>
          </h2>
        </div>
        
        <div className="space-y-4">
          {[
            {
              question: "How does MediBot ensure my medical data is secure?",
              answer: "We use HIPAA-compliant end-to-end encryption and comply with all healthcare data protection regulations. Your information is never shared without your explicit consent."
            },
            {
              question: "Can MediBot integrate with my electronic health records?",
              answer: "Yes, MediBot offers seamless integration with major EHR systems through our secure API connections."
            },
            {
              question: "Is MediBot suitable for elderly patients?",
              answer: "Absolutely! We designed MediBot with accessibility in mind, featuring large text options, simple navigation, and voice commands."
            },
            {
              question: "How accurate are the medication interaction warnings?",
              answer: "Our database is continuously updated with the latest medical research, providing 99.9% accurate interaction warnings verified by healthcare professionals."
            },
            {
              question: "Can healthcare providers monitor patient compliance?",
              answer: "Yes, our professional tier allows providers to monitor patient adherence (with consent) and receive alerts for missed medications."
            }
          ].map((faq, index) => {
            const [isOpen, setIsOpen] = useState(false);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  className={`bg-white rounded-xl border border-gray-200 hover:border-[#4dd0e1]/50 transition-all ${isOpen ? 'shadow-md' : ''}`}
                >
                  <CardHeader 
                    className="group cursor-pointer" 
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <CardTitle className="flex justify-between items-center">
                      <span className="text-lg font-medium text-[#263238]">{faq.question}</span>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-[#4dd0e1] transition-transform" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-[#78909c] group-hover:text-[#4dd0e1] transition-transform" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0 pb-6">
                        <p className="text-[#546e7a]">{faq.answer}</p>
                      </CardContent>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={`w-full py-32 bg-gradient-to-br from-[#e0f7fa] via-[#e8f5e9] to-[#e3f2fd] relative overflow-hidden`}
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="#263238" strokeWidth="0.5" strokeDasharray="5,5" />
            </svg>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="inline-block p-4 bg-[#e0f7fa] rounded-full mb-6"
          >
            <Heart className="h-8 w-8 text-[#00796b]" />
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-[#263238] mb-6">
            Ready to Transform Your <span className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] bg-clip-text text-transparent">Healthcare</span>?
          </h2>
          <p className="text-[#546e7a] text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join {isLoading ? "many" : `${userCount.toLocaleString()}+`} patients and healthcare professionals who trust MediBot for better health outcomes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/auth/signup">
              <Button className={`${buttonClasses} w-60 h-14 text-lg bg-gradient-to-r from-[#00acc1] to-[#42a5f5] hover:from-[#00838f] hover:to-[#1e88e5] text-white`}>
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className={`w-full bg-white py-12 border-t border-gray-200 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 relative">
                <Image src="/logo.png" alt="MediBot Logo" width={48} height={48} className="rounded-full object-cover" />
              </div>
              <h1 className="text-2xl font-bold text-[#00796b]">MediBot</h1>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-[#263238] font-semibold mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><Link href="#features" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-[#263238] font-semibold mb-4">Features</h3>
                <ul className="space-y-3">
                  <li><Link href="/chat" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">AI Chatbot</Link></li>
                  <li><Link href="/medications" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Medication Reminders</Link></li>
                  <li><Link href="/summarizer" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Medical Summarizer</Link></li>
                  <li><Link href="/chat" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Prescription Analysis</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-[#263238] font-semibold mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><Link href="/privacy" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">Terms of Service</Link></li>
                  <li><Link href="/hipaa" className="text-[#546e7a] hover:text-[#00acc1] transition-colors">HIPAA Compliance</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#78909c] mb-4 md:mb-0">
              © {new Date().getFullYear()} MediBot. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-[#78909c] hover:text-[#00acc1] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-[#78909c] hover:text-[#00acc1] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-[#78909c] hover:text-[#00acc1] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
