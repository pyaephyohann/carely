import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: Request) {
  // Rate limit: 10 login attempts per minute per IP
  const rlKey = getRateLimitKey(request, "login");
  const rl = rateLimit(rlKey, { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return apiError("Too many login attempts. Please try again later.", "RATE_LIMITED", 429);
  }

  try {
    const dbCheck = requireDatabase();
    if (dbCheck) return dbCheck;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid request body", "INVALID_BODY", 400);
    }
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid input", "VALIDATION_ERROR", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password, rememberMe } = parsed.data;

    // Find user with profile (prisma is guaranteed non-null after requireDatabase check)
    const user = await prisma!.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        patient: true,
        doctor: true,
        admin: true,
      },
    });

    if (!user || user.deletedAt) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    if (user.status === "SUSPENDED") {
      return apiError("Your account has been suspended", "ACCOUNT_SUSPENDED", 403);
    }

    if (user.status === "INACTIVE") {
      return apiError("Your account is inactive", "ACCOUNT_INACTIVE", 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    // Update last login timestamp
    await prisma!.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(user.id);

    // Build user profile for response
    const profile =
      user.role === "PATIENT"
        ? user.patient
        : user.role === "DOCTOR"
          ? user.doctor
          : user.admin;

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        profile: profile
          ? { ...profile, createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt.toISOString() }
          : null,
      },
    });

    // Set cookies
    const cookieHeader = response.headers.get("set-cookie") || "";
    const newCookies = setAuthCookies(cookieHeader, accessToken, refreshToken, rememberMe);
    response.headers.set("set-cookie", newCookies);

    return response;
  } catch (error) {
    logError("Login error", error);
    return apiError("An unexpected error occurred");
  }
}
