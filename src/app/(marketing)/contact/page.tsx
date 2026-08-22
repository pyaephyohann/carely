import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Carely team.",
};

export default function ContactPage() {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Contact Us</h1>
        <p className="text-lg text-zinc-600">
          Have questions? We&apos;d love to hear from you.
        </p>
      </div>
    </div>
  );
}
