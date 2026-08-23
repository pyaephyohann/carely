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

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    role: z.enum(["PATIENT", "DOCTOR"]),
    // Doctor-specific (optional during basic registration)
    licenseNumber: z.string().optional(),
    specializationId: z.string().optional(),
    consultationFee: z.number().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  // Rate limit: 5 registration attempts per minute per IP
  const rlKey = getRateLimitKey(request, "register");
  const rl = rateLimit(rlKey, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return apiError("Too many registration attempts. Please try again later.", "RATE_LIMITED", 429);
  }

  try {
    const dbCheck = requireDatabase();
    if (dbCheck) return dbCheck;

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid input", "VALIDATION_ERROR", 400, parsed.error.flatten().fieldErrors);
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      licenseNumber,
      specializationId,
      consultationFee,
    } = parsed.data;

    // Check for existing user
    const existingUser = await prisma!.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return apiError("An account with this email already exists", "EMAIL_EXISTS", 409);
    }

    // Hash password (bcrypt with salt rounds 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with profile in a transaction
    const result = await prisma!.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role,
          status: "ACTIVE",
          emailVerified: false,
        },
      });

      let profile;

      if (role === "PATIENT") {
        profile = await tx.patient.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
          },
        });
      } else if (role === "DOCTOR") {
        // Doctors need a license number
        if (!licenseNumber) {
          throw new Error("DOCTOR_LICENSE_REQUIRED");
        }

        // Check for duplicate license
        const existingDoctor = await tx.doctor.findUnique({
          where: { licenseNumber },
        });
        if (existingDoctor) {
          throw new Error("LICENSE_EXISTS");
        }

        profile = await tx.doctor.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            licenseNumber,
            consultationFee: consultationFee ?? 0,
            specializationId: specializationId || undefined,
            verified: false,
          },
        });
      }

      return { user, profile };
    });

    // Generate tokens
    const accessToken = await signAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });
    const refreshToken = await signRefreshToken(result.user.id);

    // Build response
    const response = apiSuccess(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
          profile: result.profile
            ? { ...result.profile, createdAt: result.profile.createdAt.toISOString(), updatedAt: result.profile.updatedAt.toISOString() }
            : null,
        },
      },
      201
    );

    // Set cookies
    const cookieHeader = response.headers.get("set-cookie") || "";
    const newCookies = setAuthCookies(cookieHeader, accessToken, refreshToken);
    response.headers.set("set-cookie", newCookies);

    return response;
  } catch (error) {
    // Handle known transaction errors
    if (error instanceof Error) {
      if (error.message === "DOCTOR_LICENSE_REQUIRED") {
        return apiError("License number is required for doctors", "VALIDATION_ERROR", 400);
      }
      if (error.message === "LICENSE_EXISTS") {
        return apiError("A doctor with this license number already exists", "LICENSE_EXISTS", 409);
      }
    }
    logError("Registration error", error);
    return apiError("An unexpected error occurred");
  }
}
