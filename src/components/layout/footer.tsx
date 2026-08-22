import Link from "next/link";
import { Heart } from "lucide-react";

const footerLinks = {
  Product: [
    { href: "/features", label: "Features" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  Support: [
    { href: "/help", label: "Help Center" },
    { href: "/contact", label: "Contact Support" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-zinc-50 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg">
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-zinc-900">Carely</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs">
              Your trusted healthcare platform. Connect with doctors, manage appointments, and access quality healthcare.
            </p>
          </div>

          {/* Link Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
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

        <div className="mt-8 pt-8 border-t border-zinc-200">
          <p className="text-center text-sm text-zinc-500">
            © {new Date().getFullYear()} Carely. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
