import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description: "Discover all the features Carely offers to improve your healthcare experience.",
};

export default function FeaturesPage() {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Features</h1>
        <p className="text-lg text-zinc-600">
          Explore what Carely has to offer.
        </p>
      </div>
    </div>
  );
}
