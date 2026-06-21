'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';

const plans = [
  {
    name: 'Base (Free)',
    price: '₹0',
    period: 'forever',
    description: 'Everything you need to start managing your health with AI',
    features: [
      'Medibot Care AI — fast, friendly health chat',
      'Lab report analysis — 3 reports / month',
      'Symptom photo analysis — 3 photos / month',
      'Health Memory — your personal health timeline',
      'Auto-logged symptoms & findings from chat',
      'Medication tracker & reminders',
      '8 languages (English, Hindi, Tamil, Telugu & more)',
      'Emergency detection & trusted source links',
    ],
    limitations: [
      'No unlimited report / photo analysis',
      'No Medicine Info (drug lookup by name or photo)',
      'No Medibot Specialist (deep-analysis AI)',
      'No health trend charts',
      'No Doctor Visit PDF export',
      'No full health-data export',
      'No regional-language voice (25+ languages)',
    ],
    cta: 'Current Plan',
    highlight: false,
    popular: false,
  },
  {
    name: 'Premium (PRO)',
    price: '₹99',
    period: 'month',
    description: 'Your complete AI health companion — unlimited and personalized',
    features: [
      'Everything in Free, plus:',
      'Unlimited lab report & symptom photo analysis',
      'Medicine Info — drug lookup by name or photo',
      'Medibot Specialist — deeper, more capable AI',
      'Health Trend charts (HbA1c, cholesterol & more over time)',
      'Doctor Visit PDF — doctor-ready summary export',
      'Export your full health data (JSON)',
      '25+ languages + voice in your native language',
      'Smart medication reminders',
      'Priority responses',
    ],
    limitations: [],
    cta: 'Upgrade to PRO',
    highlight: true,
    popular: true,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);

  // Check for payment status in URL params
  useEffect(() => {
    if (!searchParams) return;
    
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');
    const message = searchParams.get('message');

    if (status === 'success') {
      setPaymentStatus('success');
      toast.success(`Payment successful! Transaction ID: ${transactionId}`);
    } else if (status === 'failed') {
      setPaymentStatus('failed');
      toast.error(`Payment failed: ${message || 'Unknown error'}`);
    }
  }, [searchParams]);

  const handlePhonePePayment = async (planName: string, amount: number) => {
    if (!user) {
      toast.error('Please login to upgrade your plan');
      return;
    }

    setLoading(planName);

    try {
      const response = await fetch('/api/phonepe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          userId: user.uid,
          planName: planName,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.redirectUrl) {
        // Store transaction ID in localStorage for potential status checking
        if (result.data.merchantTransactionId) {
          localStorage.setItem('pendingPayment', JSON.stringify({
            transactionId: result.data.merchantTransactionId,
            planName: planName,
            amount: amount,
            timestamp: Date.now()
          }));
        }
        
        // Redirect to PhonePe payment page
        window.location.href = result.data.redirectUrl;
      } else {
        console.error('Payment initiation failed:', result);
        toast.error(result.message || 'Failed to initiate payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please check your connection and try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E6FAF8] py-12 px-4">
      {/* Payment Status Banner */}
      {paymentStatus === 'success' && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Payment Successful!</p>
              <p className="text-green-600 text-sm">Your Premium plan has been activated.</p>
            </div>
          </div>
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Payment Failed</p>
              <p className="text-red-600 text-sm">Please try again or contact support if the issue persists.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-teal-700">Choose Your Medibot Plan</h1>
        <p className="text-lg text-gray-600 mb-6">Get the healthcare assistance you need with transparent pricing and clear feature comparison.</p>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm text-teal-800">
          <strong>Simple pricing.</strong> Start free with 3 report &amp; 3 photo analyses a month — upgrade anytime for unlimited analysis, trend charts, and your doctor-visit PDF.
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col border-2 transition-all duration-300 max-w-md mx-auto lg:mx-0 relative',
              plan.highlight ? 'border-teal-500 scale-105 z-10 shadow-teal-200' : 'border-gray-200'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-teal-600 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            )}
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2 text-teal-700">{plan.name}</h2>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-4xl font-bold text-teal-600">{plan.price}</span>
                {plan.period && <span className="text-gray-500">/{plan.period}</span>}
              </div>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>

            <div className="flex-grow">
              <div className="mb-6">
                <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  What's Included
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.limitations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Not Included
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-2">
                        <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4">
              {plan.cta === 'Current Plan' ? (
                <button className="w-full h-12 bg-gray-300 text-gray-700 px-6 rounded-lg cursor-default flex items-center justify-center gap-2 font-semibold" disabled>
                  <CheckCircle className="h-4 w-4" />
                  {plan.cta}
                </button>
              ) : plan.cta === 'Upgrade to PRO' ? (
                <button
                  onClick={() => handlePhonePePayment('Premium', 99)}
                  disabled={loading === 'Premium'}
                  className="w-full h-12 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === 'Premium' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {plan.cta}
                    </>
                  )}
                </button>
              ) : plan.cta === 'Contact Sales' ? (
                <button
                  onClick={() => handlePhonePePayment('Enterprise', 799)}
                  disabled={loading === 'Enterprise'}
                  className="w-full h-12 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === 'Enterprise' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Subscribe Now
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      
      <div className="max-w-2xl mx-auto mt-12 text-center text-gray-500 text-sm">
        <p>* All prices are inclusive of taxes. Cancel anytime. For teams and custom solutions, contact sales.</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <CreditCard className="h-4 w-4" />
          <span>Secure payments powered by PhonePe</span>
        </div>
      </div>
    </div>
  );
}
