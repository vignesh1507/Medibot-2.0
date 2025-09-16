# MediBot - AI-Powered Health Assistant 🏥🤖

<p align="center">
  <img src="assets/medibot-banner.png" alt="MediBot Banner" width="100%"/>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-13+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-06B6D4)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-success)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/github/license/yourusername/medibot)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/yourusername/medibot)](https://github.com/yourusername/medibot/graphs/contributors)
[![Deploy](https://img.shields.io/badge/Vercel-Deployed-success)](https://medibot.vercel.app)

---

## 🌟 Overview

MediBot is an **AI-powered healthcare assistant** designed to revolutionize digital healthcare.  
It helps users validate medical queries, track health metrics, manage medications, and connect with nearby healthcare services through an intelligent conversational interface.  

<p align="center">
  <img src="assets/overview.png" alt="MediBot Overview" width="800"/>
</p>

---

## 🎥 Demo Preview

<p align="center">
  <img src="assets/demo-chatbot.gif" alt="MediBot Demo Chatbot" width="600"/>
</p>

<p align="center">
  <img src="assets/dashboard-preview.png" alt="Health Dashboard Preview" width="600"/>
</p>

---

## 🎯 Key Features

### 🤖 **AI Medical Chatbot**
- Advanced Ollama + RAG models for **real-time, accurate responses**
- Natural language health conversations  
- Evidence-based medical information  

### 🎤 **Voice Interaction**
- OpenAI Whisper for **speech-to-text**
- Multi-language voice support  
- Accessibility-focused voice interface  

### 💊 **Smart Medication Management**
- Automated reminders & scheduling  
- Prescription OCR & analysis  
- Drug interaction warnings  

### 📍 **Healthcare Location Services**
- Google Maps API integration  
- Nearby hospitals, clinics, pharmacies  
- Emergency locator  

### 📅 **Appointment Management**
- Schedule/manage appointments  
- Calendar sync & reminders  

### 📊 **Health Dashboard**
- Monitor BP, Heart Rate, BMI, Cholesterol, Sugar  
- Export reports as **PDF**  
- Historical trends  

<p align="center">
  <img src="assets/health-dashboard.png" alt="Health Dashboard" width="700"/>
</p>

---

## 🔮 Upcoming Features
- **Telemedicine Integration** (Doctor consultations)  
- **AI Health Predictions** (Predictive analytics)  
- **Wearable Device Sync** (Smartwatch, Fitbit, etc.)  
- **Medicine Database Lookup**  

---

## 🏗️ Architecture

<p align="center">
  <img src="assets/architecture.png" alt="System Architecture" width="700"/>
</p>

---

## 🚀 Technology Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,typescript,tailwind,react,firebase,vercel" />
</p>

- **Frontend**: React 18+, Next.js 13+, Tailwind, Framer Motion  
- **Backend**: Firebase (Firestore + Auth)  
- **AI/ML**: Ollama, RAG, OpenAI Whisper  
- **APIs**: Google Maps API  
- **Mobile**: Progressive Web App (PWA)  

---

## 📱 Installation & Quick Start

### Prerequisites
- Node.js 18+  
- npm or yarn  
- Firebase account  
- Google Maps API Key  

### Setup Instructions
```bash
# Clone the repo
git clone https://github.com/yourusername/medibot.git
cd medibot

# Install dependencies
npm install

# Configure env
cp .env.example .env.local

# Start dev server
npm run dev
