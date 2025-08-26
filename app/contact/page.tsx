import React from "react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/10 px-4 py-12">
      <div className="max-w-xl w-full bg-white dark:bg-background rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Contact Us</h1>
        <p className="text-muted-foreground mb-6">Have questions or need help? Reach out to the MediBot team using the form below or contact us directly:</p>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Phone:</span>
            <a href="tel:9346491221" className="text-primary underline">9346491221</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Email:</span>
            <a href="mailto:sujayss149@gmail.com" className="text-primary underline">sujayss149@gmail.com</a>
          </div>
        </div>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Name</label>
            <input type="text" id="name" name="name" className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
            <input type="email" id="email" name="email" className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground">Message</label>
            <textarea id="message" name="message" rows={4} className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary focus:border-primary" required></textarea>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition">Send Message</button>
        </form>
      </div>
    </div>
  );
}
