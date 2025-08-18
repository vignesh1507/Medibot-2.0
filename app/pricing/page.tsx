import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    features: [
      'Basic AI chat',
      'Limited history',
      'Standard support',
      'Community access',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '₹99/month',
    features: [
      'Unlimited AI chat',
      'Full chat history',
      'Priority support',
      'Early access to new features',
      'Advanced AI models',
    ],
    cta: 'Upgrade',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '₹799/month',
    features: [
      'Everything in Premium',
      'Team collaboration',
      'Custom integrations',
      'Dedicated onboarding',
      '24/7 support',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-blue-700 dark:text-blue-300">Upgrade to Premium</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Unlock advanced features and get the most out of MediBot. Choose the plan that fits you best.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'flex-1 bg-white dark:bg-gray-950 rounded-2xl shadow-lg p-8 flex flex-col items-center border-2',
              plan.highlight ? 'border-blue-500 scale-105 z-10' : 'border-gray-200 dark:border-gray-800'
            )}
          >
            <h2 className="text-2xl font-semibold mb-2 text-blue-700 dark:text-blue-300">{plan.name}</h2>
            <div className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-200">{plan.price}</div>
            <ul className="mb-6 space-y-3 text-gray-700 dark:text-gray-300 text-left w-full max-w-xs mx-auto">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>
            {plan.cta === 'Current Plan' ? (
              <button className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg cursor-default" disabled>
                {plan.cta}
              </button>
            ) : plan.cta === 'Upgrade' ? (
              <Link href="/premium">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow">
                  {plan.cta}
                </button>
              </Link>
            ) : (
              <Link href="/contact">
                <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow">
                  {plan.cta}
                </button>
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="max-w-2xl mx-auto mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>* All prices are inclusive of taxes. Cancel anytime. For teams and custom solutions, contact sales.</p>
      </div>
    </div>
  );
}
