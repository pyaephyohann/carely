import Link from "next/link";
import { Heart } from "lucide-react";

const footerLinks = {
  Product: [
    { href: "/patient/doctors", label: "Find Doctors" },
    { href: "/#specializations", label: "Specializations" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/features", label: "Features" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  Account: [
    { href: "/login", label: "Log In" },
    { href: "/register", label: "Get Started" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-zinc-50 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand — takes 1 col on lg */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg">
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-zinc-900">Carely</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Your trusted healthcare platform. Connect with doctors, manage
              appointments, and access quality care.
            </p>
          </div>

          {/* Link Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-zinc-200">
          <p className="text-center text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Carely. All rights reserved. Not a
            substitute for professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
