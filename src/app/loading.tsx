import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center animate-pulse">
            <Heart className="h-6 w-6 text-violet-600" fill="currentColor" />
          </div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-violet-200 rounded-full animate-spin border-t-violet-600" />
        </div>
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}
