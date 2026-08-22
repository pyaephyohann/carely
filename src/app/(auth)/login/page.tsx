"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Note: metadata must be defined in a server component or layout
// This is a client component for form interactivity

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement login API call
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">Welcome back</h2>
      <p className="text-zinc-600 mb-8">
        Sign in to your account to continue
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-600">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-violet-600 hover:text-violet-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
