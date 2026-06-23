"use client";

import {
  Eye,
  Star,
  Pill,
  Stethoscope,
  Download,
  MessageCircle,
  Clock,
  Calendar,
  Heart,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Shield,
  Activity,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])
  // Updated color scheme to match chat page - blue/violet theme
  const primaryColor = "bg-teal-600";
  const primaryHover = "hover:bg-teal-700";
  const primaryBorder = "border-teal-600";
  const primaryText = "text-teal-600";

  const secondaryColor = "bg-[#F8FAFC]";
  const secondaryHover = "hover:bg-[#F1F5F9]";
  const secondaryBorder = "border-[#E2E8F0]";
  const secondaryText = "text-[#475569]";

  const accentColor = "bg-teal-500";
  const accentHover = "hover:bg-teal-700";
  const accentBorder = "border-teal-500";
  const accentText = "text-teal-500";

  const buttonClasses = `h-10 px-6 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white border border-transparent rounded-lg text-base font-medium shadow-none hover:text-white`;
  const secondaryButtonClasses = `h-10 px-6 ${secondaryColor} ${secondaryText} border ${secondaryBorder} rounded-lg text-base font-medium shadow-none ${secondaryHover} hover:border-[#CBD5E1] hover:text-[#475569]`;
  const accentButtonClasses = `h-10 px-6 ${accentColor} text-white border ${accentBorder} rounded-lg text-base font-medium shadow-none ${accentHover} hover:border-teal-700 hover:text-white`;

  // Animation controls
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // State for user count, download count, and loading
  const [userCount, setUserCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }

    // Fetch user count and download count from API route (using Admin SDK)
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch stats from API route which uses Admin SDK
        console.log("Fetching app statistics from API...");
        const response = await fetch('/api/stats');
        const result = await response.json();
        
        if (result.success) {
          const { userCount, downloadCount } = result.data;
          console.log(`📈 Fetched ${userCount} users and ${downloadCount} downloads`);
          
          if (userCount !== 23) {
            console.warn(
              `Expected 23 users, but found ${userCount}. Verify collection data or rules.`
            );
          }
          
          setUserCount(userCount);
          setDownloadCount(downloadCount);
        } else {
          console.error("API error:", result.error);
          setUserCount(0);
          setDownloadCount(0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setUserCount(0);
        setDownloadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [controls, inView]);

  // Handle download click and record via API
  const handleDownload = async () => {
    try {
      setDownloadError(null);
      console.log("Recording download via API...");
      
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid || "anonymous"
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log("Download recorded successfully:", result.downloadId);
        // Optimistically update download count
        setDownloadCount((prev) => prev + 1);
      } else {
        console.error("API error:", result.error);
        setDownloadError("Failed to record download. Please try again.");
      }
    } catch (error) {
      console.error("Error recording download:", error);
      setDownloadError("Failed to record download. Please try again.");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <>
      <Head>
        <title>Medibot </title>
        <meta name="description" content="Medibot helps manage your prescriptions, schedule medications, and receive personalized AI-powered health insights anytime."/>
        <meta name="keywords" content="Medibot, AI health, prescription manager, health assistant, medication tracker"/>
        <meta name="author" content="Asvix - Sujay Babu Thota" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://medibot.vercel.app/" />
        <meta property="og:title" content="Medibot - AI-Powered Health Assistant & Medication Management" />
        <meta property="og:description" content="Transform your healthcare with Medibot - Your AI-powered health companion for medication management, prescription analysis, and personalized health insights." />
        <meta property="og:image" content="https://medibot.vercel.app/main.png" />
        <meta property="og:site_name" content="Medibot" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://medibot.vercel.app/" />
        <meta property="twitter:title" content="Medibot - AI-Powered Health Assistant & Medication Management" />
        <meta property="twitter:description" content="Transform your healthcare with Medibot - Your AI-powered health companion for medication management, prescription analysis, and personalized health insights." />
        <meta property="twitter:image" content="https://medibot.vercel.app/main.png" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://medibot.vercel.app/" />
        
        {/* Favicon */}
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Medibot",
            "alternateName": "Asvix Medibot",
            "url": "https://medibot.vercel.app",
            "logo": "https://medibot.vercel.app/logo.png",
            "description": "AI-powered health assistant for medication management and personalized health insights",
            "founder": {
              "@type": "Person",
              "name": "Sujay Babu Thota"
            },
            "foundingDate": "2024",
            "sameAs": [
              "https://twitter.com/medibot",
              "https://facebook.com/medibot"
            ]
          })}
        </script>
        
        {/* Structured Data - SoftwareApplication */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Medibot",
            "operatingSystem": "Android, iOS, Web",
            "applicationCategory": "HealthApplication",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "23"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "description": "AI-powered health assistant for medication management, prescription analysis, and personalized health insights",
            "downloadUrl": "https://medibot.vercel.app/medibot.apk",
            "screenshot": "https://medibot.vercel.app/main.png"
          })}
        </script>

        {/* FAQ Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Medibot?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Medibot is an AI-powered health assistant that helps you manage medications, track health vitals, schedule appointments, and provides personalized health insights through intelligent conversation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does Medibot help with medication management?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Medibot provides medication reminders, tracks your dosage schedule, analyzes prescriptions, checks for drug interactions, and sends SMS notifications to ensure you never miss a dose."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is Medibot free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, Medibot offers core features for free including basic medication reminders, health tracking, and AI chat. Premium features may be available for advanced analytics and additional services."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is my health data secure with Medibot?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. Medibot uses enterprise-grade encryption and follows HIPAA compliance standards to protect your personal health information. Your data is never shared with third parties without your explicit consent."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can Medibot replace my doctor?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, Medibot is designed to complement, not replace, professional medical care. It provides health management tools and general information, but you should always consult with healthcare professionals for medical advice and treatment."
                  }
                }
              ]
            })
          }}
        />

        {/* Medical Service Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              "name": "Medibot - AI Health Assistant",
              "description": "AI-powered health management platform offering medication reminders, prescription analysis, and personalized health insights",
              "url": "https://medibot.vercel.app",
              "medicalAudience": {
                "@type": "Patient"
              },
              "about": {
                "@type": "MedicalCondition",
                "name": "General Health Management"
              },
              "mainContentOfPage": {
                "@type": "WebPageElement",
                "cssSelector": "main"
              },
              "specialty": {
                "@type": "MedicalSpecialty",
                "name": "Digital Health"
              }
            })
          }}
        />
      </Head>
      
      <div
        className={`min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E6FAF8] text-[#475569] flex flex-col items-center justify-start overflow-x-hidden`}
      >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#CFFAFE]/50 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#CCFBF1]/50 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#A5F3FC]/50 rounded-full blur-2xl animate-float-fast"></div>
      </div>

      {/* Header Section */}
      <header
        className={`fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-[#E0F2FE] shadow-sm`}
        role="banner"
      >
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between" role="navigation" aria-label="Main navigation">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 relative"
            >
              <Image
                src="/logo.png"
                alt="Medibot Logo - AI Health Assistant"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </motion.div>
            <motion.h1
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl font-bold text-[#0E7490]"
            >
              Medibot
            </motion.h1>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-4"
          >
            <Link href="/auth/signin" className="w-full sm:w-auto">
              <Button className="h-10 px-6 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white border border-transparent rounded-lg text-base font-medium shadow-none w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
           
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <main role="main" aria-label="Main content">
        <section 
          id="hero"
          className="relative py-12 md:pt-36 lg:pb-24 overflow-hidden"
          role="banner"
          aria-labelledby="hero-heading"
        >
        <div className="absolute inset-0">
          <svg
            className="absolute top-0 left-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1440 800"
          >
            <path
              d="M0,0 C300,100 600,50 900,150 C1200,250 1440,200 1440,400 V800 H0 Z"
              fill="url(#gradient)"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#CFFAFE", stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: "#CCFBF1", stopOpacity: 0.3 }} />
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
              className="text-4xl font-extrabold tracking-tight text-[#475569] sm:text-5xl md:text-6xl"
              id="hero-heading"
            >
              Transform Your Health with{" "}
              <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
                Medibot
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 max-w-2xl mx-auto text-xl text-[#64748B]"
              aria-describedby="hero-heading"
            >
              Your AI-powered health companion that simplifies medication management,
              provides personalized insights, and ensures you never miss a dose.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button
                asChild
                className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600`}
              >
                <Link href="/auth/signup">Get Started Free</Link>
              </Button>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <motion.section
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={container}
        className="w-full max-w-7xl mx-auto px-6 py-20 relative"
        id="features"
        aria-labelledby="features-heading"
        role="region"
      >
        <div className="absolute -top-20 left-0 w-full h-20 pointer-events-none" />

        <motion.div variants={item} className="text-center mb-16">
          <span
            className={`inline-block px-4 py-2 bg-[#E6FAF8] text-teal-600 rounded-lg text-sm font-medium mb-4`}
          >
            Powerful Features
          </span>
          <h2 id="features-heading" className="text-4xl md:text-5xl font-bold text-[#475569]">
            Take Control of Your{" "}
            <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Health
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#64748B] max-w-2xl mx-auto">
            Medibot combines cutting-edge technology with intuitive design to
            revolutionize your health management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Pill className="h-6 w-6 text-teal-600" />,
              title: "Smart Medication Tracking",
              description:
                "Easily log and track your medications with our intuitive interface. Set up schedules, view history, and get insights into your adherence.",
              image: "/healthtrack.png",
            },
            {
              icon: <MessageCircle className="h-6 w-6 text-teal-600" />,
              title: "AI-Powered Health Chat",
              description:
                "Ask Medibot anything about your health or prescriptions. Our AI provides accurate, personalized advice to support your wellness journey.",
              image: "/chat.png",
            },
            {
              icon: <Clock className="h-6 w-6 text-teal-600" />,
              title: "Timely Reminders",
              description:
                "Receive customized reminders via email, WhatsApp, or push notifications to stay on top of your medication schedule.",
              image: "/medication.png",
            },
            {
              icon: <Calendar className="h-6 w-6 text-teal-600" />,
              title: "Medicine Info",
              description:
                "Type a medicine name or snap a photo of the strip — instantly understand what it is, what it's used for, and its common side effects.",
              image: "/summarize.webp",
            },
            {
              icon: <Activity className="h-6 w-6 text-teal-600" />,
              title: "Prescription Analysis",
              description:
                "Get tailored health tips and analytics based on your medication adherence and health data to optimize your well-being.",
              image: "/prescription.webp",
            },
            {
              icon: <Shield className="h-6 w-6 text-teal-600" />,
              title: "Secure & Private",
              description:
                "Your data is protected with state-of-the-art encryption, ensuring your health information remains private and secure.",
              image: "/secure.jpeg",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`group bg-white rounded-xl border border-gray-200 shadow-lg shadow-[#CFFAFE]/30 hover:shadow-[#CFFAFE]/50 transition-all h-full overflow-hidden`}
              >
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
                  <CardTitle className="flex items-center space-x-3 text-[#0F766E] text-xl font-semibold">
                    <div className={`p-2 bg-[#CFFAFE] rounded-lg`}>{feature.icon}</div>
                    <span>{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#0F766E] text-base">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Image + Text Section (Alternating) */}
      <section className="w-full py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* First Row - Image Left (Mobile View) */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              {/* On-brand mobile preview (CSS-built, no outdated screenshot) */}
              <div className="relative rounded-3xl bg-gradient-to-br from-teal-50 via-white to-teal-100/60 border border-teal-100 shadow-xl p-8 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-200/40 blur-3xl"></div>
                <div className="relative mx-auto max-w-[260px] bg-white rounded-[2rem] border-4 border-gray-900/90 shadow-2xl p-4">
                  {/* phone notch */}
                  <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-gray-300"></div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">M</div>
                    <span className="font-bold text-gray-900">Medibot</span>
                  </div>
                  {[
                    { label: "AI Health Chat", color: "bg-teal-500" },
                    { label: "Lab Report Analysis", color: "bg-blue-500" },
                    { label: "Health Memory", color: "bg-teal-600" },
                    { label: "Medicine Info", color: "bg-cyan-500" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 mb-2">
                      <div className={`w-6 h-6 rounded-lg ${row.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{row.label}</span>
                    </div>
                  ))}
                  <div className="mt-3 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-center text-sm font-semibold py-2.5">
                    Ask Medibot anything
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <span
                className={`inline-block px-4 py-2 bg-[#E0F2FE] text-[#0E7490] rounded-lg text-sm font-medium mb-4`}
              >
                Mobile Friendly
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#475569] mb-6">
                Health Management{" "}
                <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
                  On The Go
                </span>
              </h2>
              <p className="text-lg text-[#64748B] mb-6">
                Access your medication schedules, health insights, and AI assistant from
                anywhere with our beautifully designed mobile interface. Join{" "}
                {isLoading ? "many" : `${downloadCount.toLocaleString()}+`} users who
                have downloaded the app!
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Real-time medication tracking",
                  "Instant health notifications",
                  "Offline access to your data",
                  "Biometric authentication",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#0E7490] mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-[#0F766E]">{item}</span>
                  </li>
                ))}
              </ul>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <Button asChild className={buttonClasses}>
                  <a
                    href="/medibot.apk"
                    download="medibot.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownload}
                  >
                    Download Mobile App
                  </a>
                </Button>
               
              </motion.div>
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
                  alt="Medibot AI Assistant"
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
              <span
                className={`inline-block px-4 py-2 bg-[#E6FAF8] text-teal-600 rounded-lg text-sm font-medium mb-4`}
              >
                AI Assistant
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#475569] mb-6">
                Your Personal{" "}
                <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
                  Health Companion
                </span>
              </h2>
              <p className="text-lg text-[#64748B] mb-6">
                Medibot's AI assistant learns your health patterns and provides
                personalized recommendations to optimize your medication routine.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "24/7 health questions answered",
                  "Personalized medication advice",
                  "Interaction warnings",
                  "Dosage optimization",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#0D9488] mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-[#0F766E]">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/chat">
                <Button className={buttonClasses}>Try AI Assistant</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className={`w-full py-20 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E6FAF8]`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center"
          >
            {[
              {
                number: isLoading ? "Loading..." : `${userCount.toLocaleString()}`,
                label: "Users Count",
                icon: <Eye className="h-6 w-6 text-[#0E7490]" />,
              },
              {
                number: "92%",
                label: "Satisfaction Rate",
                icon: <Star className="h-6 w-6 text-[#0E7490]" />,
              },
              {
                number: "100+",
                label: "Tokens per day",
                icon: <Pill className="h-6 w-6 text-[#0D9488]" />,
              },
              {
                number: "24/7",
                label: "Support Available",
                icon: <Stethoscope className="h-6 w-6 text-[#0E7490]" />,
              },
              {
                number: isLoading ? "Loading..." : `${downloadCount.toLocaleString()}`,
                label: "Total Downloads",
                icon: <Download className="h-6 w-6 text-[#0D9488]" />,
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md"
              >
                <div className="flex justify-center mb-3">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-[#64748B] text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex justify-center"
          >
            
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
          <span
            className={`inline-block px-4 py-2 bg-[#CFFAFE] text-[#0E7490] rounded-lg text-sm font-medium mb-4`}
          >
            Pricing Plans
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#475569]">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Plan
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#64748B] max-w-2xl mx-auto">
            Select the perfect plan to suit your health management needs with Medibot's
            flexible pricing options.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              title: "Free",
              price: "₹0",
              period: "forever",
              features: [
                "Medibot Care AI health chat",
                "3 lab report + 3 photo analyses / month",
                "Health Memory timeline",
                "Medication tracker & reminders",
                "8 languages",
              ],
              cta: "Get Started Free",
              link: "/auth/signup",
              highlighted: false,
            },
            {
              title: "Premium",
              price: "₹99",
              period: "month",
              features: [
                "Unlimited report & photo analysis",
                "Medicine Info — drug lookup by name or photo",
                "Medibot Specialist AI + health trend charts",
                "Doctor Visit PDF & full data export",
                "25+ languages + native-language voice",
              ],
              cta: "Upgrade to Premium",
              link: "/pricing",
              highlighted: true,
            },
          ].map((plan, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`group bg-white rounded-xl border ${
                  plan.highlighted
                    ? "border-[#0D9488] shadow-[#0D9488]/50"
                    : "border-gray-200 shadow-[#CFFAFE]/30"
                } shadow-lg hover:shadow-[#CFFAFE]/50 transition-all h-full overflow-hidden`}
              >
                <CardHeader>
                  <CardTitle className="text-[#0F766E] text-xl font-semibold">
                    {plan.title}
                  </CardTitle>
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#0E7490] to-[#0D9488] bg-clip-text text-transparent">
                    {plan.price}
                    {plan.period && (
                      <span className="text-base text-[#0F766E] ml-2">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-[#0D9488] mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-[#0F766E]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`${
                      plan.highlighted
                        ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700"
                        : buttonClasses
                    } w-full`}
                  >
                    <Link href={plan.link}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Collaboration Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span
            className={`inline-block px-4 py-2 bg-[#E6FAF8] text-teal-600 rounded-lg text-sm font-medium mb-4`}
          >
            Partnerships
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#475569]">
            Trusted{" "}
            <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Collaborations
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#64748B] max-w-2xl mx-auto">
            We collaborate with distinguished healthcare professionals and researchers like Dr. Saikat Gochhait to advance evidence-based digital health innovation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: <Stethoscope className="h-8 w-8 text-teal-500" />,
              title: "Healthcare Experts",
              description: "Collaborating with distinguished healthcare professionals like Dr. Saikat Gochhait (Honoris Causa) to integrate evidence-based practices.",
              count: "1"
            },
            {
              icon: <Shield className="h-8 w-8 text-teal-600" />,
              title: "Active Partnerships",
              description: "Strategic collaborations focused on clinical decision support and AI-powered health management systems.",
              count: "1"
            },
            {
              icon: <Activity className="h-8 w-8 text-teal-600" />,
              title: "Patients Reached",
              description: "Healthcare professionals and patients benefiting from our collaborative research and development initiatives.",
              count: isLoading ? "Loading..." : `${userCount.toLocaleString()}+`
            }
          ].map((collab, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="bg-white rounded-xl border border-gray-200 shadow-lg shadow-[#E6FAF8]/30 hover:shadow-[#E6FAF8]/50 transition-all h-full p-6 text-center">
                <div className={`inline-flex p-4 bg-[#E6FAF8] rounded-lg mb-4`}>
                  {collab.icon}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent mb-2">
                  {collab.count}
                </div>
                <h3 className="text-xl font-semibold text-[#475569] mb-3">
                  {collab.title}
                </h3>
                <p className="text-[#64748B] text-base">
                  {collab.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span
            className={`inline-block px-4 py-2 bg-[#E6FAF8] text-teal-600 rounded-lg text-sm font-medium mb-4`}
          >
            Need Help?
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#475569]">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              question: "How does Medibot ensure my medical data is secure?",
              answer:
                "We use HIPAA-compliant end-to-end encryption and comply with all healthcare data protection regulations. Your information is never shared without your explicit consent.",
            },
            {
              question: "Can Medibot integrate with my electronic health records?",
              answer:
                "Yes, Medibot offers seamless integration with major EHR systems through our secure API connections.",
            },
            {
              question: "Is Medibot suitable for elderly patients?",
              answer:
                "Absolutely! We designed Medibot with accessibility in mind, featuring large text options, simple navigation, and voice commands.",
            },
            {
              question: "How accurate are the medication interaction warnings?",
              answer:
                "Our database is continuously updated with the latest medical research, providing 99.9% accurate interaction warnings verified by healthcare professionals.",
            },
            {
              question: "Can healthcare providers monitor patient compliance?",
              answer:
                "Yes, our professional tier allows providers to monitor patient adherence (with consent) and receive alerts for missed medications.",
            },
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
                  className={`bg-white rounded-xl border border-gray-200 hover:border-[#0D9488]/50 transition-all ${
                    isOpen ? "shadow-md" : ""
                  }`}
                >
                  <CardHeader
                    className="group cursor-pointer"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <CardTitle className="flex justify-between items-center">
                      <span className="text-lg font-medium text-[#0F766E]">
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-[#0D9488] transition-transform" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-[#0F766E] group-hover:text-[#0D9488] transition-transform" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0 pb-6">
                        <p className="text-[#0F766E]">{faq.answer}</p>
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
        className={`w-full py-32 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E6FAF8] relative overflow-hidden`}
      >
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="inline-block p-4 bg-[#E6FAF8] rounded-lg mb-6"
          >
            <Heart className="h-8 w-8 text-teal-600" />
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#475569] mb-6">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-teal-700 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Healthcare
            </span>
            ?
          </h2>
          <p className="text-[#64748B] text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join {isLoading ? "many" : `${userCount.toLocaleString()}+`} patients and
            healthcare professionals who trust Medibot for better health outcomes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/auth/signup">
              <Button
                className={`${buttonClasses} w-60 h-14 text-lg bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white`}
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>
      </main>

      {/* Footer */}
      <footer 
        className={`w-full bg-white py-12 border-t border-gray-200 shadow-sm`}
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 relative">
                <Image
                  src="/logo.png"
                  alt="Medibot Logo"
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-[#0E7490]">Medibot</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-[#0F766E] font-semibold mb-4">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="#features"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#pricing"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-[#0F766E] font-semibold mb-4">Features</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/chat"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      AI Chatbot
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/medications"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Medication Reminders
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/medicine"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Medicine Info
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/chat"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Prescription Analysis
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-[#0F766E] font-semibold mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cookies"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/refund"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                     Refund Policy
                    </Link>
                  </li>
                   <li>
                    <Link
                      href="/creators"
                      className="text-[#0F766E] hover:text-[#0E7490] transition-colors"
                    >
                     Developers
                    </Link>
                  </li>
                  
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#0F766E] mb-4 md:mb-0">
              © {new Date().getFullYear()} Medibot by Asvix. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-[#0F766E] hover:text-[#0E7490] transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-[#0F766E] hover:text-[#0E7490] transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-[#0F766E] hover:text-[#0E7490] transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}