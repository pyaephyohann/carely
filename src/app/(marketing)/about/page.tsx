import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Carely and our mission to make healthcare accessible.",
};

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">About Carely</h1>
        <p className="text-lg text-zinc-600">
          Our mission is to make healthcare simple, accessible, and trustworthy for everyone.
        </p>
      </div>
    </div>
  );
}
