import Link from "next/link";
import { Heart } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-violet-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-24">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
              <Heart className="h-6 w-6 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-white">Carely</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Trusted Healthcare Platform
          </h1>
          <p className="text-lg text-violet-100">
            Connect with verified doctors, book appointments, and manage your health journey with ease.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg">
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Carely</span>
            </Link>
            <ThemeSwitcher />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
