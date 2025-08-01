"use client";

import {
  ArrowLeft,
  Building2,
  Stethoscope,
  Shield,
  Activity,
  Users,
  Globe,
  Award,
  Heart,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";

export default function CollaborationsPage() {
  const [activeTab, setActiveTab] = useState("healthcare");

  const collaborationCategories = {
    healthcare: {
      title: "Healthcare Partnership",
      icon: <Stethoscope className="h-6 w-6" />,
      description: "Our flagship collaboration with a leading healthcare institution",
      partners: [
        {
          name: "Asvix Healthcare Solutions",
          type: "Healthcare Technology Partner",
          location: "India",
          description: "Strategic partnership to integrate MediBot's AI-powered health management system into clinical workflows and patient care processes.",
          impact: "1000+ patients onboarded",
          status: "Active",
          logo: "/logo.png",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video URL
          website: "https://asvix.com",
          established: "2024"
        }
      ]
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#e8f5e9] to-[#e3f2fd] text-[#263238]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="MediBot Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <h1 className="text-xl font-bold text-[#00796b]">MediBot Collaborations</h1>
            </div>
          </div>
          <Link href="/auth/signin">
            <Button className="bg-gradient-to-r from-[#00acc1] to-[#42a5f5] text-white hover:from-[#00838f] hover:to-[#1e88e5] rounded-full">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-4 bg-[#e8f5e9] rounded-full mb-6">
            <Users className="h-8 w-8 text-[#4caf50]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-[#263238] mb-6">
            Our Global{" "}
            <span className="bg-gradient-to-r from-[#4caf50] to-[#00acc1] bg-clip-text text-transparent">
              Partnerships
            </span>
          </h1>
          <p className="text-xl text-[#546e7a] max-w-3xl mx-auto mb-8">
            We collaborate with leading healthcare providers, technology companies, and research institutions 
            worldwide to advance digital health innovation and improve patient outcomes.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              { number: "1", label: "Active Partner", icon: <Building2 className="h-6 w-6" /> },
              { number: "1", label: "Country", icon: <Globe className="h-6 w-6" /> },
              { number: "1000+", label: "Users Reached", icon: <Heart className="h-6 w-6" /> },
              { number: "1", label: "Pilot Project", icon: <Award className="h-6 w-6" /> },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex justify-center mb-3 text-[#4caf50]">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#4caf50] to-[#00acc1] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-[#546e7a] text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tab Navigation - Removed since we have only one category */}
        
        {/* Single Collaboration Showcase */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#263238] mb-4">
              Our Strategic Partnership
            </h2>
            <p className="text-lg text-[#546e7a] max-w-2xl mx-auto">
              Building the future of digital healthcare together
            </p>
          </div>

          {/* Featured Partnership Card with Video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <Card className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
              {/* Video Section */}
              <div className="relative h-64 md:h-96 bg-gradient-to-r from-[#4caf50] to-[#00acc1] flex items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src={collaborationCategories.healthcare.partners[0].videoUrl}
                  title="Partnership Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              {/* Content Section */}
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start justify-between mb-8">
                  <div className="flex items-center space-x-6 mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#4caf50] to-[#00acc1] rounded-full flex items-center justify-center">
                      <Image
                        src={collaborationCategories.healthcare.partners[0].logo}
                        alt={`${collaborationCategories.healthcare.partners[0].name} logo`}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-[#263238] mb-2">
                        {collaborationCategories.healthcare.partners[0].name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-green-100 text-green-800">
                          {collaborationCategories.healthcare.partners[0].status}
                        </Badge>
                        <Badge variant="secondary">
                          {collaborationCategories.healthcare.partners[0].type}
                        </Badge>
                        <span className="text-[#546e7a] flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          {collaborationCategories.healthcare.partners[0].location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-[#546e7a] mb-1">Established</div>
                    <div className="text-lg font-semibold text-[#4caf50]">
                      {collaborationCategories.healthcare.partners[0].established}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-[#263238] mb-4">Partnership Overview</h4>
                    <p className="text-[#546e7a] text-base leading-relaxed mb-6">
                      {collaborationCategories.healthcare.partners[0].description}
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-[#4caf50]" />
                      <span className="text-sm font-medium text-[#4caf50]">
                        {collaborationCategories.healthcare.partners[0].impact}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-[#263238] mb-4">Key Achievements</h4>
                    <ul className="space-y-3">
                      {[
                        "Successful pilot program completion",
                        "1000+ patients successfully onboarded",
                        "Advanced AI health management integration",
                        "Real-time medication tracking implementation",
                        "24/7 patient support system deployment"
                      ].map((achievement, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-[#4caf50] mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-[#546e7a] text-sm">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-8 border-t border-gray-200">
                  <div className="text-[#546e7a] text-sm mb-4 sm:mb-0">
                    Partnership since {collaborationCategories.healthcare.partners[0].established}
                  </div>
                  <div className="flex space-x-4">
                    <Button variant="outline" className="text-[#4caf50] border-[#4caf50] hover:bg-[#4caf50] hover:text-white">
                      View Case Study
                    </Button>
                    <Button className="bg-gradient-to-r from-[#4caf50] to-[#00acc1] text-white hover:from-[#2e7d32] hover:to-[#00838f]">
                      Learn More
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.section>

        {/* Partnership Benefits */}
        <section className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#263238] mb-4">
              Why Partner with{" "}
              <span className="bg-gradient-to-r from-[#4caf50] to-[#00acc1] bg-clip-text text-transparent">
                MediBot?
              </span>
            </h2>
            <p className="text-lg text-[#546e7a] max-w-2xl mx-auto">
              Join our ecosystem of innovation and make a meaningful impact on global healthcare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Activity className="h-8 w-8 text-[#4caf50]" />,
                title: "Innovation Leadership",
                description: "Be at the forefront of digital health transformation with cutting-edge AI technology"
              },
              {
                icon: <Users className="h-8 w-8 text-[#00acc1]" />,
                title: "Patient Impact",
                description: "Improve patient outcomes and medication adherence through proven digital solutions"
              },
              {
                icon: <Globe className="h-8 w-8 text-[#42a5f5]" />,
                title: "Global Reach",
                description: "Access our worldwide network of healthcare providers and technology partners"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center p-4 bg-[#e8f5e9] rounded-full mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#263238] mb-3">{benefit.title}</h3>
                <p className="text-[#546e7a]">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#4caf50] to-[#00acc1] rounded-2xl p-8 md:p-12 text-center text-white"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Partner with Us?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join our mission to transform healthcare through technology. Let's create better health outcomes together.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-[#4caf50] hover:bg-gray-100 px-8 py-3 text-lg font-medium">
              Become a Partner
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg font-medium">
              Learn More
            </Button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image
              src="/logo.png"
              alt="MediBot Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-[#00796b]">MediBot</span>
          </div>
          <p className="text-[#546e7a]">
            © {new Date().getFullYear()} MediBot by Asvix. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
