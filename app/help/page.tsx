import React from "react";

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/10 px-4 py-12">
      <div className="max-w-xl w-full bg-white dark:bg-background rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Help Center</h1>
        <p className="text-muted-foreground mb-6">Welcome to the MediBot Help Center. Here you can find answers to common questions, troubleshooting tips, and resources to get the most out of MediBot.</p>
        <ul className="list-disc pl-6 text-foreground mb-6">
          <li>How to use MediBot features</li>
          <li>Account setup and management</li>
          <li>Privacy and security information</li>
          <li>Contacting support</li>
        </ul>
        <div className="mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Phone:</span>
            <a href="tel:9346491221" className="text-primary underline">9346491221</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Email:</span>
            <a href="mailto:sujayss149@gmail.com" className="text-primary underline">sujayss149@gmail.com</a>
          </div>
          <a href="/contact" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition mt-4">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
