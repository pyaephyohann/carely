import Link from "next/link";
import { Heart, ArrowRight, Shield, Clock, Users, Star } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const features = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Verified Doctors",
    description: "All our doctors are verified professionals with valid licenses and credentials.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Easy Scheduling",
    description: "Book appointments in seconds with real-time availability and instant confirmation.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Patient Portal",
    description: "Access your medical records, prescriptions, and appointment history in one place.",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Quality Care",
    description: "Rate and review doctors to help others find the best healthcare providers.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
              <Heart className="h-4 w-4" fill="currentColor" />
              Your Health, Our Priority
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight mb-6">
              Healthcare Made{" "}
              <span className="text-violet-600">Simple</span> &{" "}
              <span className="text-violet-600">Accessible</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 mb-8">
              Connect with trusted doctors, book appointments instantly, manage your health records,
              and get prescriptions delivered to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Why Choose Carely?
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              We make healthcare accessible, convenient, and trustworthy for everyone.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-zinc-200 hover:border-violet-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust Carely for their healthcare needs.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
