import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-6">
          <Heart className="h-8 w-8 text-violet-600" />
        </div>
        <h1 className="text-6xl font-bold text-zinc-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-700 mb-2">Page Not Found</h2>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
